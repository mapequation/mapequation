import { saveAs } from "file-saver";
import JSZip from "jszip";
import { OUTPUT_FORMATS } from "../data/output-formats";
import type { OutputContent, OutputFile, OutputKey } from "./types";

export type OutputState = Record<OutputKey, string> & {
  activeKey: OutputKey;
  codeLength: number | null;
  downloaded: boolean;
  levelModules: Map<number, Map<number, string>>;
  modules: Map<number, number>;
  moduleFlows: ModuleFlowMap;
  numLevels: number | null;
};

export const emptyOutput = (): OutputState => ({
  clu: "",
  tree: "",
  ftree: "",
  net: "",
  newick: "",
  json: "",
  csv: "",
  states_as_physical: "",
  clu_states: "",
  tree_states: "",
  ftree_states: "",
  newick_states: "",
  json_states: "",
  csv_states: "",
  states: "",
  flow: "",
  flow_as_physical: "",
  activeKey: "tree",
  codeLength: null,
  downloaded: false,
  levelModules: new Map(),
  modules: new Map(),
  moduleFlows: new Map(),
  numLevels: null,
});

export function outputCompleted(output: OutputState) {
  return OUTPUT_FORMATS.some(({ key }) => !!output[key]);
}

export function outputFiles(output: OutputState, name: string): OutputFile[] {
  return OUTPUT_FORMATS.filter(({ key }) => output[key]).map((format) => ({
    ...format,
    filename: `${name}${format.suffix}.${format.extension}`,
  }));
}

export function physicalFiles(output: OutputState, name: string) {
  return outputFiles(output, name).filter((file) => !file.isStates);
}

export function stateFiles(output: OutputState, name: string) {
  return outputFiles(output, name).filter((file) => file.isStates);
}

export function parseCluModules(clu: string) {
  if (!clu) return new Map<number, number>();

  const flows = parseCluModuleFlows(clu);
  const modules = new Map<number, number>();
  for (const [id, entries] of flows) {
    let best = entries[0];
    for (const entry of entries) {
      if (entry.flow > best.flow) best = entry;
    }
    modules.set(id, best.module);
  }
  return modules;
}

export type ModuleFlow = { module: number; flow: number };
export type ModuleFlowMap = Map<number, ModuleFlow[]>;

export function parseCluModuleFlows(clu: string): ModuleFlowMap {
  const result: ModuleFlowMap = new Map();
  if (!clu) return result;

  const lines = clu.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("%")) {
      continue;
    }
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) continue;
    const id = Number(tokens[0]);
    const moduleId = Number(tokens[1]);
    const flow = tokens.length >= 3 ? Number(tokens[2]) : 1;
    if (!Number.isFinite(id) || !Number.isFinite(moduleId)) continue;
    let arr = result.get(id);
    if (!arr) {
      arr = [];
      result.set(id, arr);
    }
    arr.push({ module: moduleId, flow: Number.isFinite(flow) ? flow : 1 });
  }
  return result;
}

type JsonOutputNode = {
  id?: unknown;
  flow?: unknown;
  path?: unknown;
};

type ParsedJsonOutput = {
  codelength?: unknown;
  codeLength?: unknown;
  nodes?: unknown;
  numLevels?: unknown;
};

function parseJsonOutput(output: OutputState): ParsedJsonOutput | null {
  const json = output.json_states || output.json;
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object"
      ? (parsed as ParsedJsonOutput)
      : null;
  } catch {
    return null;
  }
}

function jsonNodes(output: OutputState): JsonOutputNode[] {
  const parsed = parseJsonOutput(output);
  return Array.isArray(parsed?.nodes) ? (parsed.nodes as JsonOutputNode[]) : [];
}

function parseJsonModuleFlows(output: OutputState): ModuleFlowMap {
  const result: ModuleFlowMap = new Map();

  for (const node of jsonNodes(output)) {
    const id = Number(node.id);
    const path = Array.isArray(node.path) ? node.path.map(Number) : [];
    const module = path[0];
    const flow = Number(node.flow);
    if (!Number.isFinite(id) || !Number.isFinite(module)) continue;

    const entries = result.get(id) ?? [];
    const existing = entries.find((entry) => entry.module === module);
    const finiteFlow = Number.isFinite(flow) ? flow : 1;
    if (existing) {
      existing.flow += finiteFlow;
    } else {
      entries.push({ module, flow: finiteFlow });
      result.set(id, entries);
    }
  }

  return result;
}

function parseJsonModules(output: OutputState) {
  const modules = new Map<number, number>();

  for (const [id, entries] of parseJsonModuleFlows(output)) {
    let best = entries[0];
    for (const entry of entries) {
      if (entry.flow > best.flow) best = entry;
    }
    modules.set(id, best.module);
  }

  return modules;
}

function parseJsonLevelModules(output: OutputState) {
  const levels = new Map<number, Map<number, string>>();
  const bestByNodeAndLevel = new Map<
    string,
    { flow: number; id: number; level: number; moduleId: string }
  >();

  for (const node of jsonNodes(output)) {
    const id = Number(node.id);
    const path = Array.isArray(node.path) ? node.path.map(Number) : [];
    const flow = Number(node.flow);
    if (!Number.isFinite(id) || path.length < 2) continue;

    const finiteFlow = Number.isFinite(flow) ? flow : 1;
    const moduleDepth = Math.max(1, path.length - 1);
    for (let level = 1; level <= moduleDepth; level += 1) {
      const moduleId = path.slice(0, level).join(":");
      const key = `${id}:${level}`;
      const previous = bestByNodeAndLevel.get(key);
      if (!previous || finiteFlow > previous.flow) {
        bestByNodeAndLevel.set(key, { flow: finiteFlow, id, level, moduleId });
      }
    }
  }

  for (const { id, level, moduleId } of bestByNodeAndLevel.values()) {
    const levelModules = levels.get(level) ?? new Map<number, string>();
    levelModules.set(id, moduleId);
    levels.set(level, levelModules);
  }

  return levels;
}

function parseJsonMetadata(output: OutputState) {
  const content = parseJsonOutput(output);
  const codeLength = Number(content?.codelength ?? content?.codeLength);
  const numLevels = Number(content?.numLevels);
  return {
    codeLength: Number.isFinite(codeLength) ? codeLength : null,
    numLevels: Number.isFinite(numLevels) ? numLevels : null,
  };
}

export function applyOutputContent(
  current: OutputState,
  content: OutputContent,
): OutputState {
  const next = { ...current };

  for (const { key } of OUTPUT_FORMATS) {
    const value = content[key];
    if (!value) continue;
    next[key] =
      key === "json" || key === "json_states"
        ? JSON.stringify(value, null, 2)
        : String(value);
  }

  next.modules = parseJsonModules(next);
  next.moduleFlows = parseJsonModuleFlows(next);
  next.levelModules = parseJsonLevelModules(next);
  const jsonMetadata = parseJsonMetadata(next);
  next.codeLength = jsonMetadata.codeLength;
  next.numLevels = jsonMetadata.numLevels;
  next.activeKey =
    ([
      "clu",
      "tree",
      "ftree",
      "newick",
      "json",
      "csv",
      "net",
      "states",
      "flow",
    ].find((key) => content[key as OutputKey]) as OutputKey | undefined) ||
    "clu";

  return next;
}

export function downloadOutputFile(
  output: OutputState,
  name: string,
  formatKey: OutputKey,
) {
  const file = outputFiles(output, name).find(({ key }) => key === formatKey);
  const content = output[formatKey];
  if (!file) return;

  const mimeType =
    formatKey === "json" || formatKey === "json_states"
      ? "application/json;charset=utf-8"
      : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, file.filename);
}

export async function downloadAllOutput(output: OutputState, name: string) {
  const zip = new JSZip();
  for (const file of outputFiles(output, name)) {
    zip.file(file.filename, output[file.key]);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${name}.zip`);
}
