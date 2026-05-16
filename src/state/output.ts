import { saveAs } from "file-saver";
import JSZip from "jszip";
import { OUTPUT_FORMATS } from "../data/output-formats";
import type { ModuleId } from "../features/infomap/moduleColors";
import type { OutputContent, OutputFile, OutputKey } from "./types";

export type OutputState = Record<OutputKey, string> & {
  activeKey: OutputKey;
  codeLength: number | null;
  codelengthSavings: number | null;
  downloaded: boolean;
  hiddenOutputKeys: Set<OutputKey>;
  levelModules: Map<number, Map<number, string>>;
  modules: Map<number, ModuleId>;
  moduleFlows: ModuleFlowMap;
  nodePaths: Map<number, number[]>;
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
  codelengthSavings: null,
  downloaded: false,
  hiddenOutputKeys: new Set(),
  levelModules: new Map(),
  modules: new Map(),
  moduleFlows: new Map(),
  nodePaths: new Map(),
  numLevels: null,
});

export function outputFiles(output: OutputState, name: string): OutputFile[] {
  return OUTPUT_FORMATS.filter(
    ({ key }) => output[key] && !output.hiddenOutputKeys.has(key),
  ).map((format) => ({
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
  if (!clu) return new Map<number, ModuleId>();

  const flows = parseCluModuleFlows(clu);
  const modules = new Map<number, ModuleId>();
  for (const [id, entries] of flows) {
    let best = entries[0];
    for (const entry of entries) {
      if (entry.flow > best.flow) best = entry;
    }
    modules.set(id, best.module);
  }
  return modules;
}

type ModuleFlow = { module: ModuleId; flow: number };
export type ModuleFlowMap = Map<number, ModuleFlow[]>;

function parseCluModuleFlows(clu: string): ModuleFlowMap {
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
    const moduleId = tokens[1];
    const flow = tokens.length >= 3 ? Number(tokens[2]) : 1;
    if (!Number.isFinite(id) || !moduleId) continue;
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
  relativeCodelengthSavings?: unknown;
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
    const moduleId = String(module);
    const flow = Number(node.flow);
    if (!Number.isFinite(id) || !Number.isFinite(module)) continue;

    const entries = result.get(id) ?? [];
    const existing = entries.find((entry) => entry.module === moduleId);
    const finiteFlow = Number.isFinite(flow) ? flow : 1;
    if (existing) {
      existing.flow += finiteFlow;
    } else {
      entries.push({ module: moduleId, flow: finiteFlow });
      result.set(id, entries);
    }
  }

  return result;
}

function parseJsonModules(output: OutputState) {
  const modules = new Map<number, ModuleId>();

  for (const [id, entries] of parseJsonModuleFlows(output)) {
    let best = entries[0];
    for (const entry of entries) {
      if (entry.flow > best.flow) best = entry;
    }
    modules.set(id, best.module);
  }

  return modules;
}

function parseJsonNodePaths(output: OutputState) {
  const bestByNode = new Map<number, { flow: number; path: number[] }>();

  for (const node of jsonNodes(output)) {
    const id = Number(node.id);
    const path = Array.isArray(node.path) ? node.path.map(Number) : [];
    const flow = Number(node.flow);
    if (
      !Number.isFinite(id) ||
      path.length < 2 ||
      path.some((part) => !Number.isFinite(part))
    ) {
      continue;
    }

    const finiteFlow = Number.isFinite(flow) ? flow : 1;
    const previous = bestByNode.get(id);
    if (!previous || finiteFlow > previous.flow) {
      bestByNode.set(id, { flow: finiteFlow, path });
    }
  }

  return new Map([...bestByNode].map(([id, value]) => [id, value.path]));
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
  const codelengthSavings = Number(content?.relativeCodelengthSavings);
  const numLevels = Number(content?.numLevels);
  return {
    codeLength: Number.isFinite(codeLength) ? codeLength : null,
    codelengthSavings: Number.isFinite(codelengthSavings)
      ? codelengthSavings
      : null,
    numLevels: Number.isFinite(numLevels) ? numLevels : null,
  };
}

export function applyOutputContent(
  current: OutputState,
  content: OutputContent,
  hiddenOutputKeys: Set<OutputKey> = new Set(),
): OutputState {
  const next = { ...current, hiddenOutputKeys };

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
  next.nodePaths = parseJsonNodePaths(next);
  next.levelModules = parseJsonLevelModules(next);
  const jsonMetadata = parseJsonMetadata(next);
  next.codeLength = jsonMetadata.codeLength;
  next.codelengthSavings = jsonMetadata.codelengthSavings;
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
    ].find((key) => {
      const outputKey = key as OutputKey;
      return content[outputKey] && !hiddenOutputKeys.has(outputKey);
    }) as OutputKey | undefined) || "clu";

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
