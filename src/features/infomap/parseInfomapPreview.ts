import type { Result } from "@mapequation/infomap";

export const NETWORK_PREVIEW_NODE_LIMIT = 50_000;
export const NETWORK_PREVIEW_LINK_LIMIT = 200_000;

export type PreviewNode = {
  id: string;
  label: string;
  flow: number;
  degree: number;
  path?: number[];
};

export type PreviewLink = {
  source: string;
  target: string;
  flow: number;
  weight: number;
  directed: boolean;
};

export type PreviewGraph =
  | {
      status: "ok";
      nodes: PreviewNode[];
      links: PreviewLink[];
      isStateNetwork: boolean;
      numLevels: number;
    }
  | {
      status: "empty" | "error";
      message: string;
      nodes: PreviewNode[];
      links: PreviewLink[];
      isStateNetwork: boolean;
      numLevels: number;
    };

const emptyGraph: Omit<
  Extract<PreviewGraph, { status: "empty" | "error" }>,
  "status" | "message"
> = {
  nodes: [],
  links: [],
  isStateNetwork: false,
  numLevels: 1,
};

export function parseInfomapPreviewResult(result: Result): PreviewGraph {
  const json = result.json ?? result.json_states;
  const flowText = result.flow_as_physical ?? result.flow;
  const isStateNetwork = Boolean(result.json_states);

  if (!json?.nodes || json.nodes.length === 0) {
    return {
      status: "empty",
      message: "Infomap returned no nodes.",
      ...emptyGraph,
    };
  }

  const nodes: PreviewNode[] = [];
  const byId = new Map<number, PreviewNode>();
  for (const node of json.nodes) {
    const flow = typeof node.flow === "number" ? node.flow : 0;
    const existing = byId.get(node.id);
    if (existing) {
      existing.flow += flow;
      continue;
    }
    const previewNode: PreviewNode = {
      id: String(node.id),
      label: node.name ?? String(node.id),
      flow,
      degree: 0,
      path: node.path,
    };
    byId.set(node.id, previewNode);
    nodes.push(previewNode);
    if (nodes.length > NETWORK_PREVIEW_NODE_LIMIT) break;
  }

  let stateToPhysical: Map<string, string> | undefined;
  if (isStateNetwork && result.json_states) {
    stateToPhysical = new Map();
    for (const node of result.json_states.nodes) {
      const stateNode = node as typeof node & { stateId?: number };
      if (stateNode.stateId !== undefined) {
        stateToPhysical.set(String(stateNode.stateId), String(node.id));
      }
    }
  }
  const links = parseFlowLinks(flowText, stateToPhysical);

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  for (const link of links) {
    const s = nodesById.get(link.source);
    const t = nodesById.get(link.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;
  }

  return {
    status: "ok",
    nodes,
    links,
    isStateNetwork,
    numLevels: typeof json.numLevels === "number" ? json.numLevels : 1,
  };
}

function parseFlowLinks(
  flowText: string | undefined,
  stateToPhysical?: Map<string, string>,
): PreviewLink[] {
  if (!flowText) return [];
  const aggregated = new Map<string, PreviewLink>();
  let directed = false;
  let mode: "none" | "edges" = "none";

  for (const rawLine of flowText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("%"))
      continue;

    if (trimmed.startsWith("*")) {
      const directive = trimmed.split(/\s+/, 1)[0].toLowerCase();
      if (
        directive === "*edges" ||
        directive === "*links" ||
        directive === "*arcs" ||
        directive === "*bipartite"
      ) {
        mode = "edges";
        directed = directive === "*arcs" || directive === "*links";
        continue;
      }
      mode = "none";
      continue;
    }

    if (mode !== "edges") continue;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) continue;

    const sourceToken = tokens[0];
    const targetToken = tokens[1];
    const source = stateToPhysical?.get(sourceToken) ?? sourceToken;
    const target = stateToPhysical?.get(targetToken) ?? targetToken;
    if (source === target) continue;
    const weight = tokens.length >= 3 ? Number(tokens[2]) : 1;
    const flowToken =
      tokens.length >= 4 ? Number(tokens[3]) : Number(tokens[2]);
    const flow = Number.isFinite(flowToken) ? flowToken : 0;
    const finiteWeight = Number.isFinite(weight) ? weight : 1;
    const key = directed
      ? `${source}->${target}`
      : source < target
        ? `${source}-${target}`
        : `${target}-${source}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.flow += flow;
      existing.weight += finiteWeight;
      continue;
    }
    aggregated.set(key, {
      source,
      target,
      weight: finiteWeight,
      flow,
      directed,
    });
    if (aggregated.size > NETWORK_PREVIEW_LINK_LIMIT) break;
  }

  return [...aggregated.values()];
}

export function errorGraph(message: string): PreviewGraph {
  return {
    status: "error",
    message,
    ...emptyGraph,
  };
}
