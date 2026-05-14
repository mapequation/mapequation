import {
  Box,
  Button,
  HStack,
  Menu,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import {
  type Force,
  type ForceLink,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { type Quadtree, quadtree } from "d3-quadtree";
import { select } from "d3-selection";
import { type ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import {
  type FC,
  memo,
  type PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LuDownload, LuExpand, LuMaximize, LuMinimize2 } from "react-icons/lu";
import {
  parseFtreeLayout,
  runHierarchicalPrelayout,
} from "./hierarchicalLayout";
import {
  buildHierarchicalModuleColors,
  fallbackModuleColor,
  type ModuleColorModel,
  type ModuleId,
  type ModuleMap,
  modulePathFromModuleId,
  modulePathFromNodePath,
} from "./moduleColors";
import type { PreviewGraph, PreviewNode } from "./parseInfomapPreview";

// Chakra v3's Menu compound types omit `children` — runtime accepts it.
const MenuTrigger = Menu.Trigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
>;
const MenuPositioner = Menu.Positioner as FC<PropsWithChildren>;
const MenuContent = Menu.Content as FC<PropsWithChildren>;
const MenuItem = Menu.Item as FC<
  PropsWithChildren<{ onClick?: () => void; value: string }>
>;

type SimNode = PreviewNode &
  SimulationNodeDatum & {
    radius: number;
  };

type SimLink = SimulationLinkDatum<SimNode> & {
  source: SimNode;
  target: SimNode;
  weight: number;
  flow: number;
  directed: boolean;
  width: number;
  reverseWidth: number;
  sharedModule?: ModuleId;
};

function hasMatchingModules(
  nodes: PreviewNode[],
  modules: Map<number, unknown>,
) {
  return nodes.some((node) => modules.has(Number(node.id)));
}

type ModuleSlice = { moduleId: ModuleId; flow: number };

const labelStrokeWidth = 4;
const labelMinFontSize = 9;
const labelMaxFontSize = 16;
const exportLabelStrokePixelWidth = 14;
const exportLabelMinPixelFontSize = 64;
const exportLabelMaxPixelFontSize = 104;
const exportLabelGapPixel = 18;

function LevelGranularityIcon({ fine }: { fine?: boolean }) {
  return (
    <Box aria-hidden="true" color="fg.muted" lineHeight={0}>
      <svg
        aria-hidden="true"
        focusable="false"
        height="16"
        viewBox="0 0 16 16"
        width="16"
      >
        {fine ? (
          <>
            <circle cx="4" cy="4" fill="currentColor" r="2" />
            <circle cx="12" cy="4" fill="currentColor" r="2" />
            <circle cx="8" cy="8" fill="currentColor" r="2" />
            <circle cx="4" cy="12" fill="currentColor" r="2" />
            <circle cx="12" cy="12" fill="currentColor" r="2" />
          </>
        ) : (
          <circle
            cx="8"
            cy="8"
            fill="none"
            r="5"
            stroke="currentColor"
            strokeWidth="2"
          />
        )}
      </svg>
    </Box>
  );
}

function computeModuleCentroids(
  nodes: { id: string; x?: number; y?: number }[],
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
  modules?: Map<number, ModuleId>,
): Map<ModuleId, { x: number; y: number }> {
  const accum = new Map<ModuleId, { x: number; y: number; w: number }>();
  const add = (key: ModuleId, x: number, y: number, w: number) => {
    const c = accum.get(key) ?? { x: 0, y: 0, w: 0 };
    c.x += x * w;
    c.y += y * w;
    c.w += w;
    accum.set(key, c);
  };
  for (const node of nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const id = Number(node.id);
    const flows = moduleFlows?.get(id);
    if (flows && flows.length > 0) {
      for (const f of flows) add(f.module, x, y, f.flow);
    } else if (modules) {
      const m = modules.get(id);
      if (m !== undefined) add(m, x, y, 1);
    }
  }
  const result = new Map<ModuleId, { x: number; y: number }>();
  for (const [key, c] of accum) {
    if (c.w > 0) result.set(key, { x: c.x / c.w, y: c.y / c.w });
  }
  return result;
}

function sharedModuleFor(
  sourceId: string,
  targetId: string,
  modules: Map<number, ModuleId>,
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
): ModuleId | undefined {
  const sId = Number(sourceId);
  const tId = Number(targetId);
  const srcFlows = moduleFlows?.get(sId);
  const tgtFlows = moduleFlows?.get(tId);
  if (srcFlows && tgtFlows) {
    let bestModule: number | undefined;
    let bestScore = 0;
    for (const a of srcFlows) {
      for (const b of tgtFlows) {
        if (a.module === b.module) {
          const score = a.flow + b.flow;
          if (score > bestScore) {
            bestScore = score;
            bestModule = a.module;
          }
        }
      }
    }
    if (bestModule !== undefined) return bestModule;
  }
  const sm = modules.get(sId);
  const tm = modules.get(tId);
  if (sm !== undefined && sm === tm) return sm;
  return undefined;
}

function nodeModuleSlices(
  node: { id: string },
  modules: Map<number, ModuleId>,
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
): ModuleSlice[] {
  const physicalId = Number(node.id);
  const flows = moduleFlows?.get(physicalId);
  if (flows && flows.length > 0) {
    return flows
      .map(({ module, flow }) => ({ moduleId: module as ModuleId, flow }))
      .sort((a, b) => b.flow - a.flow);
  }
  const moduleId = modules.get(physicalId);
  if (moduleId !== undefined) return [{ moduleId, flow: 1 }];
  return [];
}

function selectedHoverModuleIds(
  node: SimNode,
  point: { x: number; y: number },
  nodes: SimNode[],
  modules: Map<number, ModuleId>,
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
): ModuleId[] | undefined {
  const slices = nodeModuleSlices(node, modules, moduleFlows);
  if (slices.length <= 1) return undefined;

  const nx = node.x ?? 0;
  const ny = node.y ?? 0;
  const dx = point.x - nx;
  const dy = point.y - ny;
  const distance = Math.hypot(dx, dy);
  if (distance > node.radius) return undefined;
  if (distance <= node.radius * 0.5) {
    return slices.map((slice) => slice.moduleId);
  }

  const total = slices.reduce((acc, slice) => acc + slice.flow, 0) || 1;
  const dominant = slices[0];
  const centroid = computeModuleCentroids(nodes, moduleFlows, modules).get(
    dominant.moduleId,
  );
  let targetAngle = -Math.PI / 2;
  if (centroid && (centroid.x !== nx || centroid.y !== ny)) {
    targetAngle = Math.atan2(centroid.y - ny, centroid.x - nx);
  }
  const dominantWidth = (dominant.flow / total) * Math.PI * 2;
  const startAngle = targetAngle - dominantWidth / 2;
  const relativeAngle =
    (((Math.atan2(dy, dx) - startAngle) % (Math.PI * 2)) + Math.PI * 2) %
    (Math.PI * 2);
  let cursor = 0;
  for (const slice of slices) {
    cursor += (slice.flow / total) * Math.PI * 2;
    if (relativeAngle <= cursor) return [slice.moduleId];
  }
  return [slices[slices.length - 1].moduleId];
}

function layoutModuleForNode(
  node: { id: string; path?: number[] },
  modules: Map<number, ModuleId>,
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
  levelModules?: Map<number, ModuleMap>,
): ModuleId | undefined {
  const pathModuleId = finestPathModuleId(node.path);
  const flows = moduleFlows?.get(Number(node.id));
  if (flows && countPositiveModuleFlows(flows) > 1) {
    return nodeModuleSlices(node, modules, moduleFlows)[0]?.moduleId;
  }
  if (pathModuleId !== undefined) return pathModuleId;
  const finestLevelModuleId = finestLevelModuleForNode(node, levelModules);
  if (finestLevelModuleId !== undefined) return finestLevelModuleId;
  return nodeModuleSlices(node, modules, moduleFlows)[0]?.moduleId;
}

function finestPathModuleId(path: number[] | undefined): ModuleId | undefined {
  if (!path || path.length < 2) return undefined;
  return path.slice(0, -1).join(":");
}

function finestLevelModuleForNode(
  node: { id: string },
  levelModules?: Map<number, ModuleMap>,
): ModuleId | undefined {
  if (!levelModules) return undefined;
  const nodeId = Number(node.id);
  const path: ModuleId[] = [];
  const levels = [...levelModules.keys()].sort((a, b) => a - b);
  for (const level of levels) {
    const moduleId = levelModules.get(level)?.get(nodeId);
    if (moduleId !== undefined) path.push(moduleId);
  }
  return path.length > 0 ? path.join(":") : undefined;
}

function countPositiveModuleFlows(flows: { module: number; flow: number }[]) {
  let count = 0;
  for (const flow of flows) {
    if (flow.flow > 0) count += 1;
  }
  return count;
}

function buildLayoutModulesByNode(
  graph: Graph,
  modules: Map<number, ModuleId>,
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
  levelModules?: Map<number, ModuleMap>,
) {
  const result = new Map<string, ModuleId>();
  for (const node of graph.nodes) {
    const moduleId = layoutModuleForNode(
      node,
      modules,
      moduleFlows,
      levelModules,
    );
    if (moduleId !== undefined) result.set(node.id, moduleId);
  }
  return result;
}

function activeModulesForLevel({
  activeLevel,
  levelModules,
  modules,
  nodePaths,
  nodes,
}: {
  activeLevel: number;
  levelModules?: Map<number, ModuleMap>;
  modules: ModuleMap;
  nodePaths?: Map<string, number[]>;
  nodes: { id: string; path?: number[] }[];
}): ModuleMap {
  if (nodes.length === 0) return modules;

  const activeModules = new Map<number, ModuleId>();
  for (const node of nodes) {
    const nodeId = Number(node.id);
    if (!Number.isFinite(nodeId)) continue;

    const path = nodePaths?.get(node.id) ?? node.path;
    if (path && path.length >= 2) {
      activeModules.set(
        nodeId,
        path.slice(0, Math.min(activeLevel, path.length - 1)).join(":"),
      );
      continue;
    }

    let moduleId: ModuleId | undefined;
    for (let level = activeLevel; level >= 1; level -= 1) {
      moduleId = levelModules?.get(level)?.get(nodeId);
      if (moduleId !== undefined) break;
    }
    moduleId ??= modules.get(nodeId);
    if (moduleId !== undefined) activeModules.set(nodeId, moduleId);
  }

  return activeModules.size > 0 ? activeModules : modules;
}

function layoutModulesSignature(
  graph: Graph,
  modulesByNode: Map<string, ModuleId>,
) {
  return graph.nodes
    .map((node) => `${node.id}:${String(modulesByNode.get(node.id) ?? "")}`)
    .join("|");
}

function createModuleAttractionForce(
  modulesByNode: Map<string, ModuleId>,
  strength: number,
): Force<SimNode, SimLink> {
  let nodes: SimNode[] = [];

  const force = (alpha: number) => {
    if (modulesByNode.size === 0 || strength <= 0) return;

    const centroids = new Map<
      ModuleId,
      { x: number; y: number; weight: number }
    >();
    for (const node of nodes) {
      const moduleId = modulesByNode.get(node.id);
      if (moduleId === undefined) continue;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const weight = Math.max(0.25, node.flow);
      const centroid = centroids.get(moduleId) ?? { x: 0, y: 0, weight: 0 };
      centroid.x += x * weight;
      centroid.y += y * weight;
      centroid.weight += weight;
      centroids.set(moduleId, centroid);
    }

    for (const centroid of centroids.values()) {
      if (centroid.weight <= 0) continue;
      centroid.x /= centroid.weight;
      centroid.y /= centroid.weight;
    }

    const pull = strength * alpha;
    for (const node of nodes) {
      const moduleId = modulesByNode.get(node.id);
      if (moduleId === undefined) continue;
      const centroid = centroids.get(moduleId);
      if (!centroid || centroid.weight <= 0) continue;
      node.vx = (node.vx ?? 0) + (centroid.x - (node.x ?? 0)) * pull;
      node.vy = (node.vy ?? 0) + (centroid.y - (node.y ?? 0)) * pull;
    }
  };

  force.initialize = (nextNodes: SimNode[]) => {
    nodes = nextNodes;
  };

  return force;
}

function getLinkLayoutKind(
  link: SimLink,
  modulesByNode: Map<string, ModuleId>,
): LinkLayoutKind {
  const sourceModule = modulesByNode.get(link.source.id);
  const targetModule = modulesByNode.get(link.target.id);
  if (sourceModule === undefined || targetModule === undefined)
    return "neutral";
  return sourceModule === targetModule ? "intra" : "inter";
}

function linkDistance(
  link: SimLink,
  { distanceRange, linkScale, modular, modulesByNode }: LinkLayoutConfig,
) {
  const scale = linkScale(link.weight);
  const baseDistance =
    distanceRange[0] + (distanceRange[1] - distanceRange[0]) * scale;
  if (!modular) return baseDistance;
  const kind = getLinkLayoutKind(link, modulesByNode);
  return baseDistance * modularLinkDistanceMultiplier[kind];
}

function linkStrength(
  link: SimLink,
  index: number,
  links: SimLink[],
  { baseStrength, linkScale, modular, modulesByNode }: LinkStrengthConfig,
) {
  const weightFactor = 0.5 + (1 - 0.5) * linkScale(link.weight);
  const modularFactor = modular
    ? modularLinkStrengthMultiplier[getLinkLayoutKind(link, modulesByNode)]
    : 1;
  return baseStrength(link, index, links) * weightFactor * modularFactor;
}

function hasOverlappingModuleFlows(
  moduleFlows?: Map<number, { module: number; flow: number }[]>,
) {
  if (!moduleFlows) return false;
  for (const flows of moduleFlows.values()) {
    if (countPositiveModuleFlows(flows) > 1) return true;
  }
  return false;
}

type Graph = {
  nodes: SimNode[];
  links: SimLink[];
};

type HoverState = {
  node: SimNode;
  moduleIds?: ModuleId[];
  x: number;
  y: number;
} | null;

type ModuleColorResolver = (moduleId: ModuleId) => string;

type LinkLayoutKind = "intra" | "inter" | "neutral";

type LinkLayoutConfig = {
  distanceRange: readonly [number, number];
  linkScale: (weight: number) => number;
  modular: boolean;
  modulesByNode: Map<string, ModuleId>;
};

type LinkStrengthConfig = LinkLayoutConfig & {
  baseStrength: (link: SimLink, index: number, links: SimLink[]) => number;
};

const neutralNode = "#D7D9DD";
const unknownNode = "#CBD0D6";
const linkColor = "#55565A";

const linkWidthRange: [number, number] = [1, 5];

const radiusBounds: [number, number] = [4, 20];
const radiusBase = 8;
const linkWidthBase = 2;
const minRenderedLinkPixels = 0.05;
const minRenderedNodeRadiusPixels = 0.12;

const moduleAttractionStrength = {
  regular: 0.035,
  large: 0.018,
} as const;

const layoutMode = "hierarchical" as "hierarchical" | "force";
const hierarchicalLayoutNodeLimit = 10_000;
const hierarchicalLayoutLinkLimit = 50_000;
const collisionRadiusMultiplier = 2.2;
const hierarchicalFinalRelaxAlpha = 0.95;

const dragSimulationAlpha = 0.7;
const dragSimulationAlphaTarget = 0.32;

const modularLinkDistanceMultiplier = {
  intra: 0.75,
  inter: 1.2,
  neutral: 1,
} as const;

const modularLinkStrengthMultiplier = {
  intra: 1.15,
  inter: 0.75,
  neutral: 1,
} as const;

function createGraph(parsed: Extract<PreviewGraph, { status: "ok" }>): Graph {
  const nodeCount = parsed.nodes.length;
  const meanNodeFlow = nodeCount > 0 ? 1 / nodeCount : 1;
  const radiusFor = (flow: number) => {
    const ratio = Math.max(0, flow) / meanNodeFlow;
    const r = radiusBase * Math.sqrt(ratio);
    return Math.max(radiusBounds[0], Math.min(radiusBounds[1], r));
  };

  const nodes: SimNode[] = parsed.nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodeCount)) * Math.PI * 2;
    const ring = 140 + (index % 7) * 7;

    return {
      ...node,
      radius: radiusFor(node.flow),
      x: Math.cos(angle) * ring,
      y: Math.sin(angle) * ring,
    };
  });
  nodes.sort((a, b) => b.flow - a.flow);
  for (let i = 0; i < nodes.length; i++) nodes[i].index = i;
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const linkCount = parsed.links.length;
  const meanLinkFlow = linkCount > 0 ? 1 / linkCount : 1;
  const widthFor = (flow: number, weight: number) => {
    const value = flow > 0 ? flow : Math.max(0, weight);
    if (value <= 0) return linkWidthRange[0];
    const reference = flow > 0 ? meanLinkFlow : 1;
    const ratio = value / reference;
    const w = linkWidthBase * Math.sqrt(ratio);
    return Math.max(linkWidthRange[0], Math.min(linkWidthRange[1], w));
  };
  const links = parsed.links
    .map((link) => {
      const source = nodesById.get(link.source);
      const target = nodesById.get(link.target);
      if (!source || !target) return null;
      return {
        ...link,
        source,
        target,
        width: widthFor(link.flow, link.weight),
        reverseWidth: 0,
      };
    })
    .filter((link): link is SimLink => Boolean(link));

  const directedWidths = new Map<string, number>();
  for (const link of links) {
    if (link.directed) {
      directedWidths.set(`${link.source.id}->${link.target.id}`, link.width);
    }
  }
  for (const link of links) {
    if (!link.directed) continue;
    link.reverseWidth =
      directedWidths.get(`${link.target.id}->${link.source.id}`) ?? 0;
  }
  links.sort((a, b) => b.width - a.width);

  return { nodes, links };
}

function shadeColor(hex: string, amount: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const channel = (source: number) =>
    Math.max(0, Math.min(255, Math.round(source + amount)))
      .toString(16)
      .padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function mixHexColors(a: string, b: string, weightB: number) {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ] as const;
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const t = Math.max(0, Math.min(1, weightB));
  const channel = (ca: number, cb: number) =>
    Math.round(ca * (1 - t) + cb * t)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
}

function sharedPrefixLength(a: ModuleId[], b: ModuleId[]) {
  const length = Math.min(a.length, b.length);
  let shared = 0;
  while (shared < length && a[shared] === b[shared]) shared += 1;
  return shared;
}

const arrowStride = 7;
let arrowFloats = new Float32Array(0);
let arrowColors: string[] = [];
let arrowActive: boolean[] = [];
function ensureArrowBuffers(capacity: number) {
  if (arrowFloats.length / arrowStride < capacity) {
    arrowFloats = new Float32Array(capacity * arrowStride);
    arrowColors = new Array(capacity);
    arrowActive = new Array(capacity);
  }
}

const fadeCache = new Map<string, string>();
function fadeToBackgroundCached(hex: string, opacity: number) {
  const key = `${hex}|${opacity}`;
  const cached = fadeCache.get(key);
  if (cached) return cached;
  const value = fadeToBackground(hex, opacity);
  fadeCache.set(key, value);
  return value;
}

function fadeToBackground(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const t = Math.max(0, Math.min(1, opacity));
  const mix = (channel: number) =>
    Math.round(channel * t + 255 * (1 - t))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(red)}${mix(green)}${mix(blue)}`;
}

function formatCodeLength(codeLength: number | null | undefined) {
  if (codeLength === null || codeLength === undefined) return null;
  return `L = ${codeLength.toFixed(3)} bits`;
}

function renderForExport(
  ctx: CanvasRenderingContext2D,
  graph: Graph,
  opts: {
    showArrows: boolean;
    modules: ModuleMap;
    moduleFlows?: Map<number, { module: number; flow: number }[]>;
    moduleColorFor: ModuleColorResolver;
    shadedModuleColorFor: ModuleColorResolver;
    darkenedModuleColorFor: ModuleColorResolver;
    coloredByModules: boolean;
    transformX: number;
    transformY: number;
    scale: number;
  },
) {
  const {
    showArrows,
    modules,
    moduleFlows,
    moduleColorFor,
    shadedModuleColorFor,
    darkenedModuleColorFor,
    coloredByModules,
    transformX,
    transformY,
    scale,
  } = opts;
  const nodeStrokeWorld = 2;

  ctx.save();
  ctx.translate(transformX, transformY);
  ctx.scale(scale, scale);

  ensureArrowBuffers(graph.links.length);
  let arrowCount = 0;

  for (const link of graph.links) {
    const sharedModule = coloredByModules
      ? sharedModuleFor(link.source.id, link.target.id, modules, moduleFlows)
      : undefined;
    const intraModule = sharedModule !== undefined;
    const baseStroke =
      sharedModule !== undefined
        ? shadedModuleColorFor(sharedModule)
        : linkColor;
    const fade = intraModule ? 0.42 : 0.26;
    const stroke = fadeToBackgroundCached(baseStroke, fade);
    const lineWidth = link.width;
    const directedLink = showArrows || link.directed;

    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    let endX = tx;
    let endY = ty;
    let startX = sx;
    let startY = sy;

    if (directedLink) {
      const dx = tx - sx;
      const dy = ty - sy;
      const length = Math.hypot(dx, dy);
      if (length > 0) {
        const ux = dx / length;
        const uy = dy / length;
        const tipDistance = link.target.radius + nodeStrokeWorld * 0.5;
        const reverseTipDistance =
          link.reverseWidth > 0
            ? link.source.radius + nodeStrokeWorld * 0.5
            : 0;
        const availableForHead = length - tipDistance - reverseTipDistance;
        const headCap = Math.min(
          link.target.radius * 1.1,
          link.reverseWidth > 0
            ? Math.max(2, availableForHead * 0.4)
            : length * 0.35,
        );
        const head = Math.max(2, Math.min(headCap, lineWidth * 4));
        const baseDistance = tipDistance + head;
        const tipX = tx - ux * tipDistance;
        const tipY = ty - uy * tipDistance;
        endX = tx - ux * baseDistance;
        endY = ty - uy * baseDistance;
        if (link.reverseWidth > 0) {
          const reverseHeadCap = Math.min(
            link.source.radius * 1.1,
            Math.max(2, availableForHead * 0.4),
          );
          const reverseHead = Math.max(
            2,
            Math.min(reverseHeadCap, link.reverseWidth * 4),
          );
          const startOffset = reverseTipDistance + reverseHead;
          startX = sx + ux * startOffset;
          startY = sy + uy * startOffset;
        }
        const offset = arrowCount * arrowStride;
        arrowFloats[offset] = tipX;
        arrowFloats[offset + 1] = tipY;
        arrowFloats[offset + 2] = endX;
        arrowFloats[offset + 3] = endY;
        arrowFloats[offset + 4] = ux;
        arrowFloats[offset + 5] = uy;
        arrowFloats[offset + 6] = Math.max(
          head * 0.45,
          Math.max(lineWidth, link.reverseWidth) * 0.7,
        );
        arrowColors[arrowCount] = stroke;
        arrowCount += 1;
      }
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  const centroids = computeModuleCentroids(graph.nodes, moduleFlows, modules);
  for (const node of graph.nodes) {
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    const slices = coloredByModules
      ? nodeModuleSlices(node, modules, moduleFlows)
      : [];

    if (slices.length > 1) {
      const total = slices.reduce((acc, s) => acc + s.flow, 0) || 1;
      const dominant = slices[0];
      const centroid = centroids.get(dominant.moduleId);
      let targetAngle = -Math.PI / 2;
      if (centroid && (centroid.x !== nx || centroid.y !== ny)) {
        targetAngle = Math.atan2(centroid.y - ny, centroid.x - nx);
      }
      const dominantWidth = (dominant.flow / total) * Math.PI * 2;
      let startAngle = targetAngle - dominantWidth / 2;
      for (const slice of slices) {
        const angle = (slice.flow / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.arc(nx, ny, node.radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = moduleColorFor(slice.moduleId);
        ctx.fill();
        startAngle = endAngle;
      }
    } else {
      const fill =
        slices.length === 1
          ? moduleColorFor(slices[0].moduleId)
          : coloredByModules
            ? unknownNode
            : neutralNode;
      ctx.beginPath();
      ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
    ctx.lineWidth = nodeStrokeWorld;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  }

  for (let i = 0; i < arrowCount; i++) {
    const offset = i * arrowStride;
    const tipX = arrowFloats[offset];
    const tipY = arrowFloats[offset + 1];
    const baseX = arrowFloats[offset + 2];
    const baseY = arrowFloats[offset + 3];
    const ux = arrowFloats[offset + 4];
    const uy = arrowFloats[offset + 5];
    const halfWidth = arrowFloats[offset + 6];
    const leftX = baseX - uy * halfWidth;
    const leftY = baseY + ux * halfWidth;
    const rightX = baseX + uy * halfWidth;
    const rightY = baseY - ux * halfWidth;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fillStyle = arrowColors[i];
    ctx.fill();
  }

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  ctx.lineWidth = exportLabelStrokePixelWidth / scale;
  const maxFlow = graph.nodes[0]?.flow ?? 1;
  const labelFontSize = (node: SimNode) => {
    const t = Math.sqrt(Math.max(0, node.flow) / Math.max(maxFlow, 1e-9));
    const pixelFontSize =
      exportLabelMinPixelFontSize +
      (exportLabelMaxPixelFontSize - exportLabelMinPixelFontSize) * t;
    return pixelFontSize / scale;
  };
  const labelGap = exportLabelGapPixel / scale;
  for (const node of graph.nodes) {
    const fontSize = labelFontSize(node);
    const slices = coloredByModules
      ? nodeModuleSlices(node, modules, moduleFlows)
      : [];
    const tied = slices.length > 1 && slices[0].flow === slices[1].flow;
    const labelColor =
      slices.length > 0 && !tied
        ? darkenedModuleColorFor(slices[0].moduleId)
        : "#2D3748";
    ctx.font = `500 ${fontSize}px sans-serif`;
    const x = (node.x ?? 0) + node.radius + labelGap;
    const y = node.y ?? 0;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = labelColor;
    ctx.strokeText(node.label, x, y);
    ctx.fillText(node.label, x, y);
  }

  ctx.restore();
}

function previewGraphSignature(graph: PreviewGraph) {
  if (graph.status !== "ok") {
    return `${graph.status}:${graph.message}`;
  }

  return [
    graph.status,
    graph.isStateNetwork ? "states" : "physical",
    graph.nodes.length,
    graph.links.length,
    graph.numLevels,
  ].join("::");
}

function textSignature(value: string | undefined) {
  if (!value) return "";
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `${value.length}:${hash}`;
}

function NetworkPreviewImpl({
  codeLength,
  directed = false,
  ftree,
  levelModules,
  loadingState = null,
  moduleSource = "latest Infomap result",
  networkName,
  modules,
  moduleFlows,
  nodePaths,
  numLevels,
  previewGraph,
  selectedLevel,
}: {
  codeLength?: number | null;
  directed?: boolean;
  ftree?: string;
  levelModules?: Map<number, ModuleMap>;
  loadingState?: "loading" | "running" | null;
  moduleSource?: string;
  networkName?: string;
  modules: ModuleMap;
  moduleFlows?: Map<number, { module: number; flow: number }[]>;
  nodePaths?: Map<number, number[]>;
  numLevels?: number | null;
  previewGraph: PreviewGraph;
  selectedLevel?: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const linkForceRef = useRef<ForceLink<SimNode, SimLink> | null>(null);
  const baseLinkStrengthRef = useRef<
    ((link: SimLink, index: number, links: SimLink[]) => number) | null
  >(null);
  const linkDistanceRangeRef = useRef<readonly [number, number]>([30, 12]);
  const linkScaleRef = useRef<(weight: number) => number>(() => 1);
  const layoutModulesByNodeRef = useRef<Map<string, ModuleId>>(new Map());
  const layoutModulesSignatureRef = useRef("");
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const frameRef = useRef(0);
  const hoverFrameRef = useRef(0);
  const fullscreenFitFrameRef = useRef(0);
  const fullscreenFitAfterMountRef = useRef(false);
  const pendingHoverPointRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const draggingRef = useRef<SimNode | null>(null);
  const hoverRef = useRef<HoverState>(null);
  const directedRef = useRef(directed);
  const drawRef = useRef<() => void>(() => {});
  const autoFitActiveRef = useRef(true);
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const quadtreeRef = useRef<Quadtree<SimNode> | null>(null);
  const maxNodeRadiusRef = useRef(0);
  const levelModulesRef = useRef<typeof levelModules>(undefined);
  const hierarchicalLayoutKeyRef = useRef("");
  const hierarchicalLayoutRunIdRef = useRef(0);
  const hierarchicalLayoutCancelRef = useRef<(() => void) | null>(null);
  const hierarchicalFinalRelaxFrameRef = useRef(0);
  const hierarchicalFinalRelaxBaseAlphaDecayRef = useRef<number | null>(null);
  const activeLevelRef = useRef(1);
  const nodeHierarchyPathsRef = useRef<Map<string, ModuleId[]>>(new Map());
  const moduleColorModelRef = useRef<ModuleColorModel>({
    colorByModule: new Map(),
  });
  const moduleColorCacheRef = useRef<Map<ModuleId, string>>(new Map());
  const shadedModuleColorCacheRef = useRef<Map<ModuleId, string>>(new Map());
  const darkenedModuleColorCacheRef = useRef<Map<ModuleId, string>>(new Map());

  const clearModuleColorCaches = () => {
    moduleColorCacheRef.current.clear();
    shadedModuleColorCacheRef.current.clear();
    darkenedModuleColorCacheRef.current.clear();
  };

  const moduleColorFor: ModuleColorResolver = (moduleId) => {
    const cached = moduleColorCacheRef.current.get(moduleId);
    if (cached) return cached;
    const color =
      moduleColorModelRef.current.colorByModule.get(moduleId) ??
      fallbackModuleColor(moduleId);
    moduleColorCacheRef.current.set(moduleId, color);
    return color;
  };
  const shadedModuleColorFor: ModuleColorResolver = (moduleId) => {
    const cached = shadedModuleColorCacheRef.current.get(moduleId);
    if (cached) return cached;
    const color = shadeColor(moduleColorFor(moduleId), -42);
    shadedModuleColorCacheRef.current.set(moduleId, color);
    return color;
  };
  const darkenedModuleColorFor: ModuleColorResolver = (moduleId) => {
    const cached = darkenedModuleColorCacheRef.current.get(moduleId);
    if (cached) return cached;
    const color = shadeColor(moduleColorFor(moduleId), -70);
    darkenedModuleColorCacheRef.current.set(moduleId, color);
    return color;
  };

  const rebuildNodeHierarchyPaths = () => {
    const graph = graphRef.current;
    if (!graph) {
      nodeHierarchyPathsRef.current = new Map();
      return;
    }
    const paths = new Map<string, ModuleId[]>();
    const levelMaps = levelModulesRef.current;
    const activeLevel = activeLevelRef.current;
    const fallbackModules = modulesRef.current;
    for (const node of graph.nodes) {
      const nodeId = Number(node.id);
      const explicitPath = modulePathFromNodePath(node.path, activeLevel);
      const path: ModuleId[] = explicitPath.length > 0 ? explicitPath : [];
      if (path.length > 0) {
        paths.set(node.id, path);
        continue;
      }
      for (let levelIndex = 1; levelIndex <= activeLevel; levelIndex++) {
        const moduleId = levelMaps?.get(levelIndex)?.get(nodeId);
        if (moduleId !== undefined) {
          path.length = 0;
          path.push(...modulePathFromModuleId(moduleId));
        }
      }
      if (path.length === 0) {
        const moduleId = fallbackModules.get(nodeId);
        if (moduleId !== undefined) {
          path.push(...modulePathFromModuleId(moduleId));
        }
      }
      if (path.length > 0) paths.set(node.id, path);
    }
    nodeHierarchyPathsRef.current = paths;
  };

  const rebuildModuleColors = () => {
    const graph = graphRef.current;
    if (!graph) {
      moduleColorModelRef.current = { colorByModule: new Map() };
      return;
    }
    moduleColorModelRef.current = buildHierarchicalModuleColors({
      activeLevel: activeLevelRef.current,
      levelModules: levelModulesRef.current,
      modules: modulesRef.current,
      nodes: graph.nodes,
    });
    clearModuleColorCaches();
  };

  const refreshModularLayoutForces = (restart = false) => {
    const graph = graphRef.current;
    const simulation = simulationRef.current;
    const linkForce = linkForceRef.current;
    const baseStrength = baseLinkStrengthRef.current;
    if (!graph || !simulation || !linkForce || !baseStrength) return;

    const modular = coloredByModulesRef.current;
    const modulesByNode = modular
      ? buildLayoutModulesByNode(
          graph,
          modulesRef.current,
          moduleFlowsRef.current,
          levelModulesRef.current,
        )
      : new Map<string, ModuleId>();
    const previousSignature = layoutModulesSignatureRef.current;
    const nextSignature = modular
      ? layoutModulesSignature(graph, modulesByNode)
      : "";
    const layoutChanged = previousSignature !== nextSignature;
    if (!layoutChanged) {
      if (restart) simulation.stop();
      return;
    }
    layoutModulesSignatureRef.current = nextSignature;
    layoutModulesByNodeRef.current = modulesByNode;

    linkForce
      .distance((link) =>
        linkDistance(link, {
          distanceRange: linkDistanceRangeRef.current,
          linkScale: linkScaleRef.current,
          modular,
          modulesByNode,
        }),
      )
      .strength((link, index, links) =>
        linkStrength(link, index, links, {
          baseStrength,
          distanceRange: linkDistanceRangeRef.current,
          linkScale: linkScaleRef.current,
          modular,
          modulesByNode,
        }),
      );

    const strength =
      graph.nodes.length > 300
        ? moduleAttractionStrength.large
        : moduleAttractionStrength.regular;
    simulation.force(
      "module",
      modular && modulesByNode.size > 0
        ? createModuleAttractionForce(modulesByNode, strength)
        : null,
    );

    if (restart && layoutChanged && modular && graph.nodes.length <= 1500) {
      simulation.alpha(Math.max(simulation.alpha(), 0.3)).restart();
    }
  };

  const rebuildQuadtree = () => {
    const graph = graphRef.current;
    if (!graph) {
      quadtreeRef.current = null;
      maxNodeRadiusRef.current = 0;
      return;
    }
    let maxR = 0;
    const tree = quadtree<SimNode>()
      .x((node) => node.x ?? 0)
      .y((node) => node.y ?? 0)
      .addAll(graph.nodes);
    for (const node of graph.nodes) {
      if (node.radius > maxR) maxR = node.radius;
    }
    quadtreeRef.current = tree;
    maxNodeRadiusRef.current = maxR;
  };

  const positionHoverCard = () => {
    const card = hoverCardRef.current;
    const canvas = canvasRef.current;
    const node = hoverRef.current?.node;
    if (!card || !canvas || !node) return;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    const offset = node.radius * t.k + 12;
    const vx = rect.left + t.x + nx * t.k + offset;
    const vy = rect.top + t.y + ny * t.k;
    card.style.left = `${Math.max(8, Math.min(vx, rect.right - 200))}px`;
    card.style.top = `${vy}px`;
  };
  const parsed = previewGraph;
  const [hover, setHover] = useState<HoverState>(null);
  const [isSummaryCardActive, setIsSummaryCardActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTop, setFullscreenTop] = useState(0);
  const parsedKey = useMemo(() => previewGraphSignature(parsed), [parsed]);
  const [initialLayoutReadyKey, setInitialLayoutReadyKey] = useState<
    string | null
  >(null);
  const [initialLayoutProgress, setInitialLayoutProgress] = useState(0);
  const [hierarchicalLayoutPhase, setHierarchicalLayoutPhase] = useState<
    "idle" | "layout" | "relax"
  >("idle");
  const [hierarchicalLayoutProgress, setHierarchicalLayoutProgress] =
    useState(0);
  const ftreeLayout = useMemo(() => parseFtreeLayout(ftree), [ftree]);
  const ftreeLayoutKey = useMemo(
    () =>
      ftreeLayout
        ? `${ftreeLayout.sections.size}:${ftreeLayout.linkCount}:${textSignature(
            ftree,
          )}`
        : "",
    [ftree, ftreeLayout],
  );
  const layoutNodePaths = useMemo(() => {
    if (!nodePaths || nodePaths.size === 0) return undefined;
    return new Map(
      [...nodePaths].map(([id, path]) => [String(id), path] as const),
    );
  }, [nodePaths]);

  const levelLocked = selectedLevel !== null && selectedLevel !== undefined;
  const moduleLevelCount = Math.max(1, (numLevels ?? 1) - 1);
  const codeLengthText = formatCodeLength(codeLength);
  const activeLevel =
    levelLocked && selectedLevel === -1
      ? moduleLevelCount
      : levelLocked
        ? selectedLevel
        : level;
  const sliderLevel = activeLevel && activeLevel > 0 ? activeLevel : 1;
  const levelValueLabel = `${sliderLevel}/${moduleLevelCount}`;
  const activeModules = useMemo(
    () =>
      activeModulesForLevel({
        activeLevel: activeLevel ?? 1,
        levelModules,
        modules,
        nodePaths: layoutNodePaths,
        nodes: parsed.status === "ok" ? parsed.nodes : [],
      }),
    [activeLevel, levelModules, layoutNodePaths, modules, parsed],
  );
  const coloredByModules =
    parsed.status === "ok" && hasMatchingModules(parsed.nodes, activeModules);
  const initialLayoutPending =
    parsed.status === "ok" && initialLayoutReadyKey !== parsedKey;
  const hierarchicalLayoutExpected =
    layoutMode === "hierarchical" &&
    parsed.status === "ok" &&
    coloredByModules &&
    initialLayoutReadyKey === parsedKey &&
    ftreeLayout !== null &&
    parsed.nodes.length <= hierarchicalLayoutNodeLimit &&
    ftreeLayout.linkCount <= hierarchicalLayoutLinkLimit &&
    parsed.nodes.some(
      (node) => (layoutNodePaths?.get(node.id) ?? node.path ?? []).length > 1,
    ) &&
    hierarchicalLayoutKeyRef.current !== `${parsedKey}:${ftreeLayoutKey}`;
  const hierarchicalLayoutPending =
    hierarchicalLayoutPhase !== "idle" || hierarchicalLayoutExpected;
  const layoutOverlayPending =
    initialLayoutPending || hierarchicalLayoutPending;
  const hasLevelControl =
    coloredByModules && (levelLocked || moduleLevelCount > 1);
  const hasActiveLevelModules = levelModules?.has(activeLevel ?? 1) ?? false;
  const hasOverlappingFlows = hasOverlappingModuleFlows(moduleFlows);
  const usePieFlows =
    hasOverlappingFlows ||
    (!hasActiveLevelModules &&
      (activeLevel === moduleLevelCount || moduleLevelCount <= 1));
  const modulesRef = useRef(activeModules);
  const coloredByModulesRef = useRef(coloredByModules);
  const moduleFlowsRef = useRef<typeof moduleFlows>(undefined);
  levelModulesRef.current = levelModules;
  activeLevelRef.current = activeLevel ?? 1;
  modulesRef.current = activeModules;
  coloredByModulesRef.current = coloredByModules;
  moduleFlowsRef.current = usePieFlows ? moduleFlows : undefined;

  const moduleLabel = useMemo(() => {
    if (parsed.status !== "ok" || !coloredByModules) return "";
    const uniqueModules = new Set<ModuleId>();
    for (const node of parsed.nodes) {
      const moduleId = activeModules.get(Number(node.id));
      if (moduleId !== undefined) uniqueModules.add(moduleId);
    }
    return `${uniqueModules.size} modules`;
  }, [activeModules, coloredByModules, parsed]);

  useEffect(() => {
    if (level <= moduleLevelCount) return;
    setLevel(moduleLevelCount);
  }, [level, moduleLevelCount]);

  useEffect(() => {
    if (!levelLocked || selectedLevel < 1) return;
    setLevel(selectedLevel);
  }, [levelLocked, selectedLevel]);

  const measureHeaderBottom = () => {
    const header = document.querySelector("header");
    return Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((value) => {
      if (!value) setFullscreenTop(measureHeaderBottom());
      return !value;
    });
  };

  useEffect(() => {
    if (!isFullscreen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const updateFullscreenTop = () => {
      setFullscreenTop(measureHeaderBottom());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    updateFullscreenTop();
    window.addEventListener("resize", updateFullscreenTop);
    window.addEventListener("scroll", updateFullscreenTop, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener("resize", updateFullscreenTop);
      window.removeEventListener("scroll", updateFullscreenTop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const requestDraw = () => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      drawRef.current();
    });
  };

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const transform = transformRef.current;
    return {
      x: (clientX - rect.left - transform.x) / transform.k,
      y: (clientY - rect.top - transform.y) / transform.k,
    };
  };

  const findNearestNode = (clientX: number, clientY: number) => {
    const graph = graphRef.current;
    if (!graph) return null;

    const point = screenToWorld(clientX, clientY);
    const hitRadius = 18 / transformRef.current.k;
    const tree = quadtreeRef.current;

    if (tree) {
      const searchRadius = maxNodeRadiusRef.current + hitRadius;
      const candidate = tree.find(point.x, point.y, searchRadius);
      if (!candidate) return null;
      const dx = (candidate.x ?? 0) - point.x;
      const dy = (candidate.y ?? 0) - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= candidate.radius + hitRadius ? candidate : null;
    }

    let nearest: SimNode | null = null;
    let nearestDistance = Infinity;

    for (const node of graph.nodes) {
      const dx = (node.x ?? 0) - point.x;
      const dy = (node.y ?? 0) - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= node.radius + hitRadius && distance < nearestDistance) {
        nearest = node;
        nearestDistance = distance;
      }
    }

    return nearest;
  };

  const hoverModuleIdsFor = (node: SimNode, point: { x: number; y: number }) =>
    coloredByModules
      ? selectedHoverModuleIds(
          node,
          point,
          graphRef.current?.nodes ?? [],
          activeModules,
          moduleFlowsRef.current,
        )
      : undefined;

  const equalModuleIds = (a?: ModuleId[], b?: ModuleId[]) => {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    return a.every((id, index) => id === b[index]);
  };

  const updateHoverAt = (clientX: number, clientY: number) => {
    const node = findNearestNode(clientX, clientY);
    const previousHover = hoverRef.current;
    if (node) {
      const point = screenToWorld(clientX, clientY);
      const moduleIds = hoverModuleIdsFor(node, point);
      if (
        previousHover?.node === node &&
        equalModuleIds(previousHover.moduleIds, moduleIds)
      ) {
        return;
      }
      const nextHover = { node, moduleIds, x: clientX, y: clientY };
      hoverRef.current = nextHover;
      setHover(nextHover);
      requestDraw();
      return;
    }

    const hoverChanged = previousHover !== null;
    if (!hoverChanged) return;
    hoverRef.current = null;
    setHover(null);
    requestDraw();
  };

  const scheduleHoverUpdate = (clientX: number, clientY: number) => {
    pendingHoverPointRef.current = { clientX, clientY };
    if (hoverFrameRef.current) return;
    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = 0;
      const point = pendingHoverPointRef.current;
      pendingHoverPointRef.current = null;
      if (!point || draggingRef.current) return;
      updateHoverAt(point.clientX, point.clientY);
    });
  };

  const zoomStartsOnNode = (event: Event) => {
    if (event instanceof MouseEvent) {
      return Boolean(findNearestNode(event.clientX, event.clientY));
    }

    if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return Boolean(findNearestNode(touch.clientX, touch.clientY));
    }

    return false;
  };

  const fitToGraph = () => {
    const graph = graphRef.current;
    const canvas = canvasRef.current;
    const { width, height } = dimensionsRef.current;
    if (!graph || !canvas || width <= 0 || height <= 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of graph.nodes) {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) return;
    const graphWidth = Math.max(1, maxX - minX);
    const graphHeight = Math.max(1, maxY - minY);
    const padding = 48;
    const scale = Math.max(
      0.01,
      Math.min(
        3,
        Math.min(
          (width - padding * 2) / graphWidth,
          (height - padding * 2) / graphHeight,
        ),
      ),
    );
    const nextTransform = zoomIdentity
      .translate(
        width / 2 - ((minX + maxX) / 2) * scale,
        height / 2 - ((minY + maxY) / 2) * scale,
      )
      .scale(scale);

    transformRef.current = nextTransform;
    select(canvas).call(
      zoom<HTMLCanvasElement, unknown>().transform,
      nextTransform,
    );
    requestDraw();
  };

  useEffect(() => {
    if (!fullscreenFitAfterMountRef.current) {
      fullscreenFitAfterMountRef.current = true;
      return;
    }

    if (fullscreenFitFrameRef.current) {
      window.cancelAnimationFrame(fullscreenFitFrameRef.current);
      fullscreenFitFrameRef.current = 0;
    }
    fullscreenFitFrameRef.current = window.requestAnimationFrame(() => {
      fullscreenFitFrameRef.current = window.requestAnimationFrame(() => {
        fullscreenFitFrameRef.current = 0;
        fitToGraph();
      });
    });

    return () => {
      if (fullscreenFitFrameRef.current) {
        window.cancelAnimationFrame(fullscreenFitFrameRef.current);
        fullscreenFitFrameRef.current = 0;
      }
    };
  }, [isFullscreen]);

  const downloadPng = () => {
    const graph = graphRef.current;
    if (!graph || graph.nodes.length === 0) return;
    if (isDownloading) return;
    setIsDownloading(true);

    const finish = () => setIsDownloading(false);

    window.requestAnimationFrame(() => {
      try {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const node of graph.nodes) {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          if (x - node.radius < minX) minX = x - node.radius;
          if (x + node.radius > maxX) maxX = x + node.radius;
          if (y - node.radius < minY) minY = y - node.radius;
          if (y + node.radius > maxY) maxY = y + node.radius;
        }
        if (!Number.isFinite(minX)) {
          finish();
          return;
        }

        const padding = 40;
        const nodeOnlyWorldW = maxX - minX + padding * 2;
        const nodeOnlyWorldH = maxY - minY + padding * 2;
        const targetMax = 8192;
        const scaleEstimate =
          targetMax / Math.max(nodeOnlyWorldW, nodeOnlyWorldH);
        const maxLabelExtent =
          (exportLabelMaxPixelFontSize * 0.65) / scaleEstimate;
        const labelGap = exportLabelGapPixel / scaleEstimate;
        for (const node of graph.nodes) {
          const x = node.x ?? 0;
          const labelExtent = node.label.length * maxLabelExtent + labelGap;
          if (x + node.radius + labelExtent > maxX) {
            maxX = x + node.radius + labelExtent;
          }
        }

        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;
        const worldW = maxX - minX;
        const worldH = maxY - minY;

        const scale = targetMax / Math.max(worldW, worldH);
        const pixelW = Math.max(1, Math.round(worldW * scale));
        const pixelH = Math.max(1, Math.round(worldH * scale));

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = pixelW;
        exportCanvas.height = pixelH;
        const ctx = exportCanvas.getContext("2d");
        if (!ctx) {
          finish();
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pixelW, pixelH);

        renderForExport(ctx, graph, {
          showArrows: directedRef.current,
          modules: modulesRef.current,
          moduleFlows: moduleFlowsRef.current,
          moduleColorFor,
          shadedModuleColorFor,
          darkenedModuleColorFor,
          coloredByModules: coloredByModulesRef.current,
          transformX: -minX * scale,
          transformY: -minY * scale,
          scale,
        });

        exportCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${networkName || "network"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          finish();
        }, "image/png");
      } catch (error) {
        console.error("PNG export failed", error);
        finish();
      }
    });
  };

  const restoreHierarchicalFinalRelaxAlphaDecay = () => {
    const baseAlphaDecay = hierarchicalFinalRelaxBaseAlphaDecayRef.current;
    if (baseAlphaDecay === null) return;
    simulationRef.current?.alphaDecay(baseAlphaDecay);
    hierarchicalFinalRelaxBaseAlphaDecayRef.current = null;
  };

  const cancelHierarchicalLayout = () => {
    hierarchicalLayoutRunIdRef.current += 1;
    hierarchicalLayoutCancelRef.current?.();
    hierarchicalLayoutCancelRef.current = null;
    if (hierarchicalFinalRelaxFrameRef.current) {
      window.cancelAnimationFrame(hierarchicalFinalRelaxFrameRef.current);
      hierarchicalFinalRelaxFrameRef.current = 0;
    }
    restoreHierarchicalFinalRelaxAlphaDecay();
    setHierarchicalLayoutPhase("idle");
    setHierarchicalLayoutProgress(0);
  };

  const startHierarchicalFinalRelax = (runId: number) => {
    const graph = graphRef.current;
    const simulation = simulationRef.current;
    if (!simulation || !graph) {
      setHierarchicalLayoutPhase("idle");
      setHierarchicalLayoutProgress(0);
      return;
    }

    const heavyGraph = graph.nodes.length > 1500;
    const finalTickTotal = heavyGraph ? 100 : 300;
    const finalTickChunk = finalTickTotal / 10;
    refreshModularLayoutForces(false);
    restoreHierarchicalFinalRelaxAlphaDecay();
    hierarchicalFinalRelaxBaseAlphaDecayRef.current = simulation.alphaDecay();
    simulation
      .alpha(hierarchicalFinalRelaxAlpha)
      .alphaTarget(0)
      .alphaDecay(1e-3)
      .stop();
    setHierarchicalLayoutPhase("relax");
    setHierarchicalLayoutProgress(0.8);
    let ticks = 0;

    const step = () => {
      if (runId !== hierarchicalLayoutRunIdRef.current) return;
      const nextTicks = Math.min(finalTickTotal, ticks + finalTickChunk);
      simulation.tick(nextTicks - ticks);
      ticks = nextTicks;
      rebuildQuadtree();
      setHierarchicalLayoutProgress(0.8 + (ticks / finalTickTotal) * 0.2);

      if (ticks < finalTickTotal) {
        hierarchicalFinalRelaxFrameRef.current =
          window.requestAnimationFrame(step);
        return;
      }

      hierarchicalFinalRelaxFrameRef.current = 0;
      restoreHierarchicalFinalRelaxAlphaDecay();
      fitToGraph();
      setHierarchicalLayoutPhase("idle");
      setHierarchicalLayoutProgress(1);
      if (heavyGraph) {
        simulation.stop();
        autoFitActiveRef.current = false;
      } else {
        simulation.restart();
      }
      requestDraw();
    };

    hierarchicalFinalRelaxFrameRef.current = window.requestAnimationFrame(step);
  };

  drawRef.current = draw;
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height, dpr } = dimensionsRef.current;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const graph = graphRef.current;
    if (!graph) return;
    context.save();
    context.translate(transformRef.current.x, transformRef.current.y);
    context.scale(transformRef.current.k, transformRef.current.k);

    const hovered = hoverRef.current?.node ?? null;
    const hoveredId = hovered?.id;
    const hierarchyPaths = nodeHierarchyPathsRef.current;
    const hoveredPath = hovered ? hierarchyPaths.get(hovered.id) : undefined;
    const currentModules = modulesRef.current;
    const currentColoredByModules = coloredByModulesRef.current;
    const currentModuleFlows = moduleFlowsRef.current;
    const hoveredModuleIds =
      hoverRef.current?.moduleIds && hoverRef.current.moduleIds.length > 0
        ? new Set(hoverRef.current.moduleIds)
        : hovered && currentColoredByModules && currentModuleFlows
          ? new Set(
              nodeModuleSlices(hovered, currentModules, currentModuleFlows).map(
                (slice) => slice.moduleId,
              ),
            )
          : null;
    const hoveredSliceModuleId =
      hoveredModuleIds && hoveredModuleIds.size === 1
        ? [...hoveredModuleIds][0]
        : undefined;
    const focusStrengthFor = (node: SimNode) => {
      if (!hovered) return 1;
      if (node.id === hovered.id) return 1;
      if (hoveredModuleIds && hoveredModuleIds.size > 0) {
        const nodeSlices = currentModuleFlows
          ? nodeModuleSlices(node, currentModules, currentModuleFlows)
          : [];
        const nodeModuleId =
          nodeSlices[0]?.moduleId ?? currentModules.get(Number(node.id));
        if (nodeSlices.some((slice) => hoveredModuleIds.has(slice.moduleId))) {
          return 0.95;
        }
        if (nodeModuleId !== undefined && hoveredModuleIds.has(nodeModuleId)) {
          return 0.95;
        }
        return 0.15;
      }
      if (!hoveredPath || hoveredPath.length === 0) return 0.15;
      const path = hierarchyPaths.get(node.id);
      if (!path || path.length === 0) return 0.15;
      const shared = sharedPrefixLength(hoveredPath, path);
      if (shared === hoveredPath.length && path.length === hoveredPath.length) {
        return 0.95;
      }
      const relative = shared / Math.max(1, hoveredPath.length);
      return 0.15 + 0.85 * relative ** 1.6;
    };
    const nodeColorWithFocus = (color: string, focus: number) =>
      hovered ? mixHexColors(color, neutralNode, (1 - focus) * 0.72) : color;
    const labelColorWithFocus = (color: string, focus: number) =>
      hovered ? mixHexColors(color, "#A0AEC0", (1 - focus) * 0.85) : color;

    const showArrows = directedRef.current;
    const zoomLevel = transformRef.current.k;
    const nodeStrokeWorld = 2;
    const minVisibleWidthWorld = minRenderedLinkPixels / zoomLevel;

    const viewMarginWorld = 40 / zoomLevel;
    const viewLeft = -transformRef.current.x / zoomLevel - viewMarginWorld;
    const viewTop = -transformRef.current.y / zoomLevel - viewMarginWorld;
    const viewRight = viewLeft + width / zoomLevel + 2 * viewMarginWorld;
    const viewBottom = viewTop + height / zoomLevel + 2 * viewMarginWorld;
    const isOffscreen = (x: number, y: number) =>
      x < viewLeft || x > viewRight || y < viewTop || y > viewBottom;
    ensureArrowBuffers(graph.links.length);
    let arrowCount = 0;
    const inactiveLinks: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      stroke: string;
      width: number;
      arrowIndex?: number;
    }> = [];
    const activeLinks: typeof inactiveLinks = [];
    const drawLink = (link: (typeof inactiveLinks)[number]) => {
      context.beginPath();
      context.moveTo(link.startX, link.startY);
      context.lineTo(link.endX, link.endY);
      context.strokeStyle = link.stroke;
      context.lineWidth = link.width;
      context.stroke();
    };

    for (const link of graph.links) {
      if (link.width < minVisibleWidthWorld) break;

      const sx = link.source.x ?? 0;
      const sy = link.source.y ?? 0;
      const tx = link.target.x ?? 0;
      const ty = link.target.y ?? 0;
      if (isOffscreen(sx, sy) && isOffscreen(tx, ty)) continue;

      const isConnected =
        hovered !== null &&
        (link.source.id === hoveredId || link.target.id === hoveredId);
      const sharedModule = currentColoredByModules
        ? link.sharedModule
        : undefined;
      const intraModule = sharedModule !== undefined;
      const selectedModuleLink =
        hoveredModuleIds &&
        sharedModule !== undefined &&
        hoveredModuleIds.has(sharedModule);
      const activeLink =
        hovered !== null &&
        (hoveredModuleIds ? selectedModuleLink === true : isConnected);
      const directedLink = showArrows || link.directed;
      const baseStroke =
        sharedModule !== undefined
          ? shadedModuleColorFor(sharedModule)
          : linkColor;
      const linkFocus =
        hovered === null
          ? 1
          : hoveredModuleIds
            ? selectedModuleLink
              ? 0.95
              : Math.min(
                  focusStrengthFor(link.source),
                  focusStrengthFor(link.target),
                )
            : isConnected
              ? Math.max(
                  focusStrengthFor(link.source),
                  focusStrengthFor(link.target),
                )
              : Math.min(
                  focusStrengthFor(link.source),
                  focusStrengthFor(link.target),
                );
      const baseOpacity = intraModule ? 0.42 : 0.26;
      const linkOpacity = hovered
        ? hoveredModuleIds
          ? selectedModuleLink
            ? intraModule
              ? 0.62
              : 0.55
            : baseOpacity * (0.25 + 0.55 * linkFocus)
          : isConnected
            ? intraModule
              ? 0.62
              : 0.55
            : baseOpacity * (0.25 + 0.55 * linkFocus)
        : baseOpacity;
      const stroke = fadeToBackgroundCached(baseStroke, linkOpacity);
      const lineWidth = link.width;

      let endX = tx;
      let endY = ty;
      let startX = sx;
      let startY = sy;
      let arrowIndex: number | undefined;
      if (directedLink) {
        const dx = tx - sx;
        const dy = ty - sy;
        const length = Math.hypot(dx, dy);
        if (length > 0) {
          const ux = dx / length;
          const uy = dy / length;
          const tipDistance = link.target.radius + nodeStrokeWorld * 0.5;
          const reverseTipDistance =
            link.reverseWidth > 0
              ? link.source.radius + nodeStrokeWorld * 0.5
              : 0;
          const availableForHead = length - tipDistance - reverseTipDistance;
          const headCap = Math.min(
            link.target.radius * 1.1,
            link.reverseWidth > 0
              ? Math.max(2, availableForHead * 0.4)
              : length * 0.35,
          );
          const head = Math.max(2, Math.min(headCap, lineWidth * 4));
          const baseDistance = tipDistance + head;
          const tipX = tx - ux * tipDistance;
          const tipY = ty - uy * tipDistance;
          endX = tx - ux * baseDistance;
          endY = ty - uy * baseDistance;
          if (link.reverseWidth > 0) {
            const reverseHeadCap = Math.min(
              link.source.radius * 1.1,
              Math.max(2, availableForHead * 0.4),
            );
            const reverseHead = Math.max(
              2,
              Math.min(reverseHeadCap, link.reverseWidth * 4),
            );
            const startOffset = reverseTipDistance + reverseHead;
            startX = sx + ux * startOffset;
            startY = sy + uy * startOffset;
          }
          const offset = arrowCount * arrowStride;
          arrowFloats[offset] = tipX;
          arrowFloats[offset + 1] = tipY;
          arrowFloats[offset + 2] = endX;
          arrowFloats[offset + 3] = endY;
          arrowFloats[offset + 4] = ux;
          arrowFloats[offset + 5] = uy;
          arrowFloats[offset + 6] = Math.max(
            head * 0.45,
            Math.max(lineWidth, link.reverseWidth) * 0.7,
          );
          arrowColors[arrowCount] = stroke;
          arrowActive[arrowCount] = activeLink;
          arrowIndex = arrowCount;
          arrowCount += 1;
        }
      }

      const links = activeLink ? activeLinks : inactiveLinks;
      links.push({
        startX,
        startY,
        endX,
        endY,
        stroke,
        width: lineWidth,
        arrowIndex,
      });
    }

    const drawArrow = (index: number) => {
      const offset = index * arrowStride;
      const tipX = arrowFloats[offset];
      const tipY = arrowFloats[offset + 1];
      const baseX = arrowFloats[offset + 2];
      const baseY = arrowFloats[offset + 3];
      const ux = arrowFloats[offset + 4];
      const uy = arrowFloats[offset + 5];
      const halfWidth = arrowFloats[offset + 6];
      const leftX = baseX - uy * halfWidth;
      const leftY = baseY + ux * halfWidth;
      const rightX = baseX + uy * halfWidth;
      const rightY = baseY - ux * halfWidth;
      context.beginPath();
      context.moveTo(tipX, tipY);
      context.lineTo(leftX, leftY);
      context.lineTo(rightX, rightY);
      context.closePath();
      context.fillStyle = arrowColors[index];
      context.fill();
    };

    for (const link of inactiveLinks) {
      drawLink(link);
      if (link.arrowIndex !== undefined) drawArrow(link.arrowIndex);
    }
    for (const link of activeLinks) {
      drawLink(link);
      if (link.arrowIndex !== undefined) drawArrow(link.arrowIndex);
    }

    const minVisibleNodeRadiusWorld = minRenderedNodeRadiusPixels / zoomLevel;
    const moduleCentroids =
      currentColoredByModules && currentModuleFlows
        ? computeModuleCentroids(
            graph.nodes,
            currentModuleFlows,
            currentModules,
          )
        : new Map<ModuleId, { x: number; y: number }>();
    for (const node of graph.nodes) {
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      if (isOffscreen(nx, ny)) continue;
      if (node.radius < minVisibleNodeRadiusWorld) continue;
      const nodeModuleId =
        currentColoredByModules && !currentModuleFlows
          ? currentModules.get(Number(node.id))
          : undefined;
      const slices =
        currentColoredByModules && currentModuleFlows
          ? nodeModuleSlices(node, currentModules, currentModuleFlows)
          : [];
      const isHovered = hoveredId === node.id;
      const nodeFocus = focusStrengthFor(node);
      const dominantModuleId = slices[0]?.moduleId ?? nodeModuleId;

      if (slices.length > 1) {
        const total = slices.reduce((acc, s) => acc + s.flow, 0) || 1;
        const dominant = slices[0];
        const centroid = moduleCentroids.get(dominant.moduleId);
        let targetAngle = -Math.PI / 2;
        if (centroid && (centroid.x !== nx || centroid.y !== ny)) {
          targetAngle = Math.atan2(centroid.y - ny, centroid.x - nx);
        }
        const dominantWidth = (dominant.flow / total) * Math.PI * 2;
        let startAngle = targetAngle - dominantWidth / 2;
        const selectedSliceModuleId =
          isHovered && hoverRef.current?.moduleIds?.length === 1
            ? hoverRef.current.moduleIds[0]
            : undefined;
        for (const slice of slices) {
          const angle = (slice.flow / total) * Math.PI * 2;
          const endAngle = startAngle + angle;
          const sliceFocus = hoveredModuleIds
            ? hoveredModuleIds.has(slice.moduleId)
              ? 1
              : 0.15
            : nodeFocus;
          const sliceColor = moduleColorFor(slice.moduleId);
          context.beginPath();
          context.moveTo(nx, ny);
          context.arc(nx, ny, node.radius, startAngle, endAngle);
          context.closePath();
          context.fillStyle = nodeColorWithFocus(sliceColor, sliceFocus);
          context.fill();
          if (slice.moduleId === selectedSliceModuleId) {
            context.beginPath();
            context.moveTo(nx, ny);
            context.arc(nx, ny, node.radius * 0.5, startAngle, endAngle);
            context.closePath();
            context.fillStyle = nodeColorWithFocus(sliceColor, 0.15);
            context.fill();
          }
          startAngle = endAngle;
        }
      } else {
        const fill =
          slices.length === 1
            ? moduleColorFor(slices[0].moduleId)
            : nodeModuleId !== undefined
              ? moduleColorFor(nodeModuleId)
              : currentColoredByModules
                ? unknownNode
                : neutralNode;
        context.beginPath();
        context.arc(nx, ny, node.radius, 0, Math.PI * 2);
        context.fillStyle = nodeColorWithFocus(fill, nodeFocus);
        context.fill();
      }
      context.beginPath();
      context.arc(nx, ny, node.radius, 0, Math.PI * 2);
      context.lineWidth = nodeStrokeWorld;
      context.strokeStyle = isHovered
        ? dominantModuleId !== undefined && slices.length <= 1
          ? shadeColor(moduleColorFor(dominantModuleId), -86)
          : "#2D3748"
        : "#FFFFFF";
      context.stroke();
    }

    context.restore();

    context.textBaseline = "middle";
    context.textAlign = "left";
    context.lineJoin = "round";
    context.lineCap = "butt";
    context.lineWidth = labelStrokeWidth;
    const skipNumeric = graph.nodes.length > 60;
    const maxFlow = graph.nodes[0]?.flow ?? 1;
    const labelBudget =
      zoomLevel < 0.18
        ? 24
        : zoomLevel < 0.35
          ? 48
          : zoomLevel < 0.7
            ? 96
            : graph.nodes.length;
    const placedLabels: Array<{
      left: number;
      right: number;
      top: number;
      bottom: number;
    }> = [];
    const labelFontSize = (node: SimNode) => {
      const t = Math.sqrt(Math.max(0, node.flow) / Math.max(maxFlow, 1e-9));
      return labelMinFontSize + (labelMaxFontSize - labelMinFontSize) * t;
    };
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));
    const labelCenterProgress = (node: SimNode, textWidth: number) => {
      const fitRatio = 0.8;
      const padding = 2;
      const fitZoom =
        (textWidth + padding) / Math.max(node.radius * 2 * fitRatio, 1);
      const startZoom = clamp(fitZoom - 1.05, 1.3, 3.4);
      const endZoom = clamp(fitZoom + 0.5, 3.0, 4.0);
      return clamp((zoomLevel - startZoom) / (endZoom - startZoom), 0, 1);
    };
    const labelLeftX = (node: SimNode, textWidth: number) => {
      const sx = transformRef.current.x + (node.x ?? 0) * zoomLevel;
      const outsideX = sx + Math.max(6, node.radius * zoomLevel + 4);
      const centeredX = sx - textWidth / 2;
      const centerProgress = labelCenterProgress(node, textWidth);
      return outsideX + (centeredX - outsideX) * centerProgress;
    };
    const overlapsLabel = (
      left: number,
      right: number,
      top: number,
      bottom: number,
    ) =>
      placedLabels.some(
        (box) =>
          left < box.right &&
          right > box.left &&
          top < box.bottom &&
          bottom > box.top,
      );

    const renderLabel = (node: SimNode) => {
      const fontSize = labelFontSize(node);
      const nodeModuleId =
        currentColoredByModules && !currentModuleFlows
          ? currentModules.get(Number(node.id))
          : undefined;
      const slices =
        currentColoredByModules && currentModuleFlows
          ? nodeModuleSlices(node, currentModules, currentModuleFlows)
          : [];
      const labelColor =
        hoveredSliceModuleId !== undefined && focusStrengthFor(node) > 0.5
          ? darkenedModuleColorFor(hoveredSliceModuleId)
          : slices.length > 0
            ? darkenedModuleColorFor(slices[0].moduleId)
            : nodeModuleId !== undefined
              ? darkenedModuleColorFor(nodeModuleId)
              : "#2D3748";
      context.font = `500 ${fontSize}px sans-serif`;
      const textWidth = context.measureText(node.label).width;
      const x = labelLeftX(node, textWidth);
      const y = transformRef.current.y + (node.y ?? 0) * zoomLevel;
      const labelFocus = focusStrengthFor(node);
      context.strokeStyle = "#ffffff";
      context.fillStyle = labelColorWithFocus(labelColor, labelFocus);
      context.strokeText(node.label, x, y);
      context.fillText(node.label, x, y);
    };

    let labelCount = 0;
    for (const node of graph.nodes) {
      if (node === hovered) continue;
      if (skipNumeric && node.label === node.id) continue;
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      const sx = transformRef.current.x + nx * zoomLevel;
      const sy = transformRef.current.y + ny * zoomLevel;
      if (sx < -60 || sx > width + 60 || sy < -24 || sy > height + 24) {
        continue;
      }
      const fontSize = labelFontSize(node);
      const y = sy;
      context.font = `500 ${fontSize}px sans-serif`;
      const textWidth = context.measureText(node.label).width;
      const x = labelLeftX(node, textWidth);
      const padding = 2;
      const left = x - padding;
      const right = x + textWidth + padding;
      const top = y - fontSize * 0.6 - padding;
      const bottom = y + fontSize * 0.6 + padding;
      if (overlapsLabel(left, right, top, bottom)) continue;
      renderLabel(node);
      placedLabels.push({ left, right, top, bottom });
      labelCount += 1;
      if (labelCount >= labelBudget) break;
    }

    if (hovered) renderLabel(hovered);
  }

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dimensionsRef.current = {
        width: rect.width,
        height: rect.height,
        dpr,
      };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      requestDraw();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.01, 20])
      .filter((event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "wheel" && (event.shiftKey || event.altKey))
          return false;
        if (event.type === "mousedown" || event.type === "touchstart") {
          return !zoomStartsOnNode(event);
        }
        return true;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        if (event.sourceEvent) autoFitActiveRef.current = false;
        positionHoverCard();
        requestDraw();
      });

    const onWheelPan = (event: WheelEvent) => {
      if (!event.shiftKey && !event.altKey) return;
      event.preventDefault();
      const t = transformRef.current;
      const next = t.translate(-event.deltaX / t.k, -event.deltaY / t.k);
      transformRef.current = next;
      select(canvas).call(zoom<HTMLCanvasElement, unknown>().transform, next);
      autoFitActiveRef.current = false;
      positionHoverCard();
      requestDraw();
    };

    select(canvas).call(zoomBehavior).on("dblclick.zoom", null);
    canvas.addEventListener("wheel", onWheelPan, { passive: false });

    return () => {
      select(canvas).on(".zoom", null);
      canvas.removeEventListener("wheel", onWheelPan);
    };
  }, []);

  useEffect(() => {
    cancelHierarchicalLayout();
    hierarchicalLayoutKeyRef.current = "";
    simulationRef.current?.stop();
    simulationRef.current = null;
    linkForceRef.current = null;
    baseLinkStrengthRef.current = null;
    layoutModulesByNodeRef.current = new Map();
    layoutModulesSignatureRef.current = "";
    graphRef.current = null;
    quadtreeRef.current = null;
    clearModuleColorCaches();
    hoverRef.current = null;
    setHover(null);

    if (parsed.status !== "ok") {
      setInitialLayoutReadyKey(null);
      setInitialLayoutProgress(0);
      requestDraw();
      return;
    }

    const graph = createGraph(parsed);
    graphRef.current = graph;
    rebuildNodeHierarchyPaths();
    rebuildModuleColors();
    autoFitActiveRef.current = true;
    let tickCount = 0;
    const weights = graph.links.map((link) => link.weight);
    const wMin = weights.length ? Math.min(...weights) : 1;
    const wMax = weights.length ? Math.max(...weights) : 1;
    const wRange = wMax - wMin || 1;
    const linkScale = (weight: number) => (weight - wMin) / wRange;
    const compactGraph = graph.nodes.length > 300;
    const linkDistanceRange = compactGraph
      ? ([24, 8] as const)
      : ([30, 12] as const);
    linkDistanceRangeRef.current = linkDistanceRange;
    const chargeStrength = compactGraph ? -30 : -55;
    linkScaleRef.current = linkScale;
    const linkForce = forceLink<SimNode, SimLink>(graph.links)
      .id((node) => node.id)
      .distance((link) =>
        linkDistance(link, {
          distanceRange: linkDistanceRange,
          linkScale,
          modular: false,
          modulesByNode: layoutModulesByNodeRef.current,
        }),
      );
    const baseStrength = linkForce.strength();
    baseLinkStrengthRef.current = baseStrength;
    linkForce.strength((link, index, links) => {
      return linkStrength(link, index, links, {
        baseStrength,
        distanceRange: linkDistanceRange,
        linkScale,
        modular: false,
        modulesByNode: layoutModulesByNodeRef.current,
      });
    });
    linkForceRef.current = linkForce;
    const simulation = forceSimulation<SimNode, SimLink>(graph.nodes)
      .force("link", linkForce)
      .force("charge", forceManyBody().strength(chargeStrength))
      .force(
        "collide",
        forceCollide<SimNode>().radius(
          (node) => node.radius * collisionRadiusMultiplier,
        ),
      )
      .force("center", forceCenter(0, 0))
      .alpha(0.95);

    const heavyGraph = graph.nodes.length > 1500;
    const baseAlphaDecay = simulation.alphaDecay();
    simulation.alphaDecay(1e-3);
    simulation.stop();
    simulationRef.current = simulation;
    setInitialLayoutProgress(0);
    let cancelled = false;
    const initialTickTotal = heavyGraph ? 100 : 300;
    const initialTickChunk = initialTickTotal / 10;
    const showInitialLayoutProgress = graph.nodes.length > 250;
    let initialTicks = 0;

    const finishInitialLayout = () => {
      simulation.alphaDecay(baseAlphaDecay);
      refreshModularLayoutForces(false);
      rebuildQuadtree();
      fitToGraph();
      setInitialLayoutReadyKey(parsedKey);
      simulation
        .on("tick", () => {
          tickCount += 1;
          if (tickCount % 10 === 0) rebuildQuadtree();
          if (hoverRef.current) positionHoverCard();
          requestDraw();
        })
        .on("end", () => {
          autoFitActiveRef.current = false;
          rebuildQuadtree();
          requestDraw();
        });

      if (heavyGraph) {
        simulation.stop();
        autoFitActiveRef.current = false;
      } else {
        simulation.restart();
      }
    };

    const runInitialTicks = () => {
      if (cancelled) return;
      const ticks = Math.min(initialTickChunk, initialTickTotal - initialTicks);
      simulation.tick(ticks);
      initialTicks += ticks;
      setInitialLayoutProgress(initialTicks / initialTickTotal);
      if (initialTicks < initialTickTotal) {
        window.requestAnimationFrame(runInitialTicks);
        return;
      }
      finishInitialLayout();
    };

    if (showInitialLayoutProgress) {
      window.requestAnimationFrame(runInitialTicks);
    } else {
      simulation.tick(initialTickTotal);
      setInitialLayoutProgress(1);
      finishInitialLayout();
    }

    return () => {
      cancelled = true;
      cancelHierarchicalLayout();
      simulation.stop();
    };
  }, [parsedKey]);

  useEffect(() => {
    modulesRef.current = activeModules;
    coloredByModulesRef.current = coloredByModules;
    clearModuleColorCaches();
    const graph = graphRef.current;
    if (!coloredByModules) {
      moduleColorModelRef.current = { colorByModule: new Map() };
      rebuildNodeHierarchyPaths();
      if (graph) {
        for (const link of graph.links) link.sharedModule = undefined;
        if (initialLayoutReadyKey === parsedKey) {
          refreshModularLayoutForces(false);
        }
        requestDraw();
      }
      return;
    }

    if (graph) {
      rebuildModuleColors();
      const flows = moduleFlowsRef.current;
      for (const link of graph.links) {
        link.sharedModule = sharedModuleFor(
          link.source.id,
          link.target.id,
          activeModules,
          flows,
        );
      }
    } else {
      moduleColorModelRef.current = { colorByModule: new Map() };
    }
    rebuildNodeHierarchyPaths();
    if (initialLayoutReadyKey === parsedKey) {
      refreshModularLayoutForces(true);
    }
    requestDraw();
  }, [
    activeLevel,
    activeModules,
    coloredByModules,
    initialLayoutReadyKey,
    levelModules,
    moduleFlows,
    parsedKey,
  ]);

  useEffect(() => {
    const graph = graphRef.current;
    const shouldUseHierarchy =
      layoutMode === "hierarchical" &&
      parsed.status === "ok" &&
      coloredByModules &&
      initialLayoutReadyKey === parsedKey &&
      ftreeLayout !== null &&
      graph !== null &&
      graph.nodes.length <= hierarchicalLayoutNodeLimit &&
      ftreeLayout.linkCount <= hierarchicalLayoutLinkLimit &&
      graph.nodes.some(
        (node) => (layoutNodePaths?.get(node.id) ?? node.path ?? []).length > 1,
      );

    if (!shouldUseHierarchy || !graph || !ftreeLayout) {
      if (!coloredByModules) hierarchicalLayoutKeyRef.current = "";
      return;
    }

    const layoutKey = `${parsedKey}:${ftreeLayoutKey}`;
    if (layoutKey === hierarchicalLayoutKeyRef.current) return;

    cancelHierarchicalLayout();
    const runId = hierarchicalLayoutRunIdRef.current + 1;
    hierarchicalLayoutRunIdRef.current = runId;
    hierarchicalLayoutKeyRef.current = layoutKey;
    setHierarchicalLayoutPhase("layout");
    setHierarchicalLayoutProgress(0);
    simulationRef.current?.stop();

    hierarchicalLayoutCancelRef.current = runHierarchicalPrelayout({
      ftree: ftreeLayout,
      isCancelled: () =>
        runId !== hierarchicalLayoutRunIdRef.current ||
        draggingRef.current !== null,
      links: graph.links,
      nodes: graph.nodes,
      nodePaths: layoutNodePaths,
      onComplete: (positions) => {
        if (runId !== hierarchicalLayoutRunIdRef.current) return;
        hierarchicalLayoutCancelRef.current = null;
        if (!positions) {
          setHierarchicalLayoutPhase("idle");
          setHierarchicalLayoutProgress(0);
          return;
        }
        for (const node of graph.nodes) {
          const position = positions.get(node.id);
          if (!position) continue;
          node.x = position.x;
          node.y = position.y;
          node.vx = 0;
          node.vy = 0;
        }
        startHierarchicalFinalRelax(runId);
      },
      onProgress: (progress) => {
        if (runId !== hierarchicalLayoutRunIdRef.current) return;
        setHierarchicalLayoutPhase("layout");
        setHierarchicalLayoutProgress(progress * 0.8);
      },
    });

    return () => {
      if (runId !== hierarchicalLayoutRunIdRef.current) return;
      hierarchicalLayoutCancelRef.current?.();
      hierarchicalLayoutCancelRef.current = null;
    };
  }, [
    coloredByModules,
    ftreeLayout,
    ftreeLayoutKey,
    initialLayoutReadyKey,
    layoutNodePaths,
    parsed.status,
    parsedKey,
  ]);

  useLayoutEffect(() => {
    positionHoverCard();
  }, [hover]);

  useEffect(() => {
    directedRef.current = directed;
    requestDraw();
  }, [directed]);

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const dragged = draggingRef.current;
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
      const point = screenToWorld(event.clientX, event.clientY);
      dragged.fx = point.x;
      dragged.fy = point.y;
      dragged.vx = 0;
      dragged.vy = 0;
      simulationRef.current
        ?.alpha(dragSimulationAlpha)
        .alphaTarget(dragSimulationAlphaTarget)
        .restart();
      requestDraw();
      return;
    }

    scheduleHoverUpdate(event.clientX, event.clientY);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const node = findNearestNode(event.clientX, event.clientY);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    cancelHierarchicalLayout();
    const point = screenToWorld(event.clientX, event.clientY);
    node.fx = point.x;
    node.fy = point.y;
    node.vx = 0;
    node.vy = 0;
    draggingRef.current = node;
    event.currentTarget.setPointerCapture(event.pointerId);
    simulationRef.current
      ?.alpha(dragSimulationAlpha)
      .alphaTarget(dragSimulationAlphaTarget)
      .restart();
    requestDraw();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const dragged = draggingRef.current;
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.fx = null;
    dragged.fy = null;
    draggingRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    simulationRef.current?.alpha(0.35).alphaTarget(0).restart();
    requestDraw();
  };

  const statusText =
    parsed.status === "ok"
      ? coloredByModules
        ? `Colored by ${moduleSource} · ${moduleLabel}`
        : "Previewing network structure"
      : parsed.message;

  const nodeCount = parsed.nodes.length;
  const linkCount = parsed.links.length;
  const moduleId =
    hover && coloredByModules
      ? activeModules.get(Number(hover.node.id))
      : undefined;
  const hoverSlices =
    hover && coloredByModules
      ? nodeModuleSlices(hover.node, activeModules, moduleFlowsRef.current)
      : [];
  const visibleHoverSlices = hoverSlices.slice(0, 7);
  const hiddenHoverSliceCount = Math.max(0, hoverSlices.length - 7);
  const hoverModuleTotal = hoverSlices.reduce((sum, s) => sum + s.flow, 0);
  const activeTooltipModuleId =
    hover?.moduleIds?.length === 1 ? hover.moduleIds[0] : undefined;
  const hoverPath = useMemo(() => {
    if (!hover || !levelModules) return null;
    const id = Number(hover.node.id);
    for (let l = moduleLevelCount; l >= 1; l--) {
      const map = levelModules.get(l);
      if (!map) continue;
      const m = map.get(id);
      if (m !== undefined) {
        const value = String(m);
        return value.includes(":") ? value : null;
      }
    }
    return null;
  }, [hover, levelModules, moduleLevelCount]);

  return (
    <Box
      ref={containerRef}
      aria-label="Interactive network preview"
      bg="gray.50"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius={isFullscreen ? 0 : "md"}
      bottom={isFullscreen ? 0 : undefined}
      flex="1"
      left={isFullscreen ? 0 : undefined}
      minH={0}
      overflow="hidden"
      position={isFullscreen ? "fixed" : "relative"}
      right={isFullscreen ? 0 : undefined}
      top={isFullscreen ? `${fullscreenTop}px` : undefined}
      zIndex={isFullscreen ? 40 : undefined}
    >
      <canvas
        ref={canvasRef}
        aria-label="Network preview canvas"
        onDoubleClick={() => fitToGraph()}
        onPointerDown={onPointerDown}
        onPointerLeave={() => {
          if (hoverFrameRef.current) {
            window.cancelAnimationFrame(hoverFrameRef.current);
            hoverFrameRef.current = 0;
          }
          pendingHoverPointRef.current = null;
          hoverRef.current = null;
          setHover(null);
          requestDraw();
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          cursor: draggingRef.current ? "grabbing" : hover ? "grab" : "move",
          display: "block",
          height: "100%",
          opacity: layoutOverlayPending ? 0 : 1,
          touchAction: "none",
          width: "100%",
        }}
      />

      <HStack
        align="center"
        bg={isSummaryCardActive ? "white" : "whiteAlpha.900"}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow={isSummaryCardActive ? "sm" : "xs"}
        cursor="default"
        gap={2}
        left={3}
        maxW="calc(100% - 6rem)"
        onBlur={() => setIsSummaryCardActive(false)}
        onFocus={() => setIsSummaryCardActive(true)}
        onPointerEnter={() => setIsSummaryCardActive(true)}
        onPointerLeave={() => setIsSummaryCardActive(false)}
        opacity={isSummaryCardActive ? 1 : 0.7}
        px={3}
        py={2}
        position="absolute"
        top={3}
        transition="opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease"
      >
        <Box minW={0}>
          {networkName && (
            <Text
              color="gray.700"
              fontSize="xs"
              fontWeight={700}
              mb={0.5}
              truncate
            >
              {networkName}
            </Text>
          )}
          <Text color="gray.600" fontSize="xs" mb={0}>
            {nodeCount.toLocaleString()} nodes · {linkCount.toLocaleString()}{" "}
            links
          </Text>
          {coloredByModules && (
            <Text color="gray.600" fontSize="xs" mb={0}>
              {moduleLabel}
              {numLevels ? ` · ${numLevels} levels` : ""}
              {codeLengthText ? ` · ${codeLengthText}` : ""}
            </Text>
          )}
          {!coloredByModules && (
            <Text color="gray.500" fontSize="xs" mb={0}>
              {statusText}
            </Text>
          )}
        </Box>
      </HStack>

      {hasLevelControl && (
        <Box
          bg="gray.subtle"
          color="gray.fg"
          borderRadius="l2"
          boxShadow="0 0 0 1px var(--chakra-colors-gray-muted)"
          bottom={3}
          px={1.5}
          py={1.5}
          position="absolute"
          right={3}
          fontSize="xs"
          alignItems="center"
          display="flex"
          flexDirection="column"
          gap={1}
          minW="2.75rem"
        >
          <Text color="fg" fontWeight={600} lineHeight={1} textAlign="center">
            {levelValueLabel}
          </Text>
          <Box mt={-1}>
            <LevelGranularityIcon fine />
          </Box>
          <Box display="flex" justifyContent="center">
            <input
              aria-label={`Module level ${levelValueLabel}`}
              disabled={levelLocked}
              max={moduleLevelCount}
              min={1}
              onChange={(event) => setLevel(Number(event.target.value))}
              step={1}
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                height: "7rem",
                width: "1.25rem",
              }}
              type="range"
              value={sliderLevel}
            />
          </Box>
          <LevelGranularityIcon />
        </Box>
      )}

      <HStack
        align={{ base: "stretch", sm: "center" }}
        flexDirection={{ base: "column", sm: "row" }}
        gap={2}
        position="absolute"
        right={3}
        top={3}
        w={{ base: "4.5rem", sm: "max-content" }}
      >
        <Menu.Root>
          <MenuTrigger asChild>
            <Button
              aria-label="Download network"
              size="xs"
              variant="surface"
              loading={isDownloading}
            >
              <LuDownload />
            </Button>
          </MenuTrigger>
          <Portal>
            <MenuPositioner>
              <MenuContent>
                <MenuItem value="download-png" onClick={downloadPng}>
                  <LuDownload />
                  Download PNG
                </MenuItem>
              </MenuContent>
            </MenuPositioner>
          </Portal>
        </Menu.Root>
        <Button
          aria-label="Fit network preview"
          onClick={() => fitToGraph()}
          size="xs"
          variant="surface"
        >
          <LuMaximize />
          Fit
        </Button>
        <Button
          aria-label={
            isFullscreen
              ? "Exit fullscreen network preview"
              : "Fullscreen network preview"
          }
          onClick={toggleFullscreen}
          size="xs"
          title={
            isFullscreen
              ? "Exit fullscreen network preview"
              : "Fullscreen network preview"
          }
          variant="surface"
        >
          {isFullscreen ? <LuMinimize2 /> : <LuExpand />}
        </Button>
      </HStack>

      {(loadingState || layoutOverlayPending) && (
        <HStack
          bg="whiteAlpha.700"
          color="gray.700"
          inset={0}
          position="absolute"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          zIndex={20}
          pointerEvents="none"
        >
          <Spinner size="sm" />
          <Text fontSize="sm" fontWeight={600} mb={0}>
            {loadingState === "running"
              ? "Running Infomap…"
              : loadingState === "loading"
                ? "Loading network…"
                : hierarchicalLayoutPhase === "layout"
                  ? `Arranging hierarchy ${Math.round(
                      hierarchicalLayoutProgress * 100,
                    )}%`
                  : hierarchicalLayoutPhase === "relax"
                    ? `Relaxing layout ${Math.round(
                        hierarchicalLayoutProgress * 100,
                      )}%`
                    : `Preparing layout ${Math.round(initialLayoutProgress * 100)}%`}
          </Text>
        </HStack>
      )}

      {parsed.status !== "ok" && !loadingState && !layoutOverlayPending && (
        <Box
          bg="whiteAlpha.900"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          color="gray.600"
          left="50%"
          maxW="24rem"
          p={4}
          position="absolute"
          textAlign="center"
          top="50%"
          transform="translate(-50%, -50%)"
        >
          <Text fontSize="sm" fontWeight={700} mb={1}>
            Network preview unavailable
          </Text>
          <Text fontSize="sm" mb={0}>
            {parsed.message}
          </Text>
        </Box>
      )}

      {hover && (
        <Box
          ref={hoverCardRef}
          bg="gray.900"
          borderRadius="sm"
          color="white"
          maxW="12rem"
          pointerEvents="none"
          position="fixed"
          px={2.5}
          py={2}
          transform="translateY(-50%)"
          zIndex={10}
        >
          <Text fontSize="xs" fontWeight={700} mb={1}>
            {hover.node.label}
          </Text>
          {hover.node.label !== hover.node.id && (
            <Text color="whiteAlpha.700" fontSize="xs" mb={0}>
              id {hover.node.id}
            </Text>
          )}
          <Text color="whiteAlpha.800" fontSize="xs" mb={0}>
            Flow {hover.node.flow.toFixed(4)}
            {hover.node.degree > 0 ? ` · Degree ${hover.node.degree}` : ""}
            {hoverSlices.length === 1 && !hoverPath
              ? ` · Module ${hoverSlices[0].moduleId}`
              : moduleId !== undefined && hoverSlices.length === 0 && !hoverPath
                ? ` · Module ${moduleId}`
                : ""}
          </Text>
          {hoverSlices.length > 1 && (
            <Box mt={1}>
              {visibleHoverSlices.map((slice) => {
                const share =
                  hoverModuleTotal > 0
                    ? Math.round((slice.flow / hoverModuleTotal) * 100)
                    : 0;
                return (
                  <Text
                    key={String(slice.moduleId)}
                    color={
                      activeTooltipModuleId === undefined ||
                      activeTooltipModuleId === slice.moduleId
                        ? "whiteAlpha.800"
                        : "whiteAlpha.500"
                    }
                    fontSize="xs"
                    mb={0}
                  >
                    <Box
                      as="span"
                      display="inline-block"
                      w="0.6rem"
                      h="0.6rem"
                      borderRadius="full"
                      mr={1.5}
                      verticalAlign="middle"
                      bg={moduleColorFor(slice.moduleId)}
                    />
                    Module {slice.moduleId} · {share}%
                  </Text>
                );
              })}
              {hiddenHoverSliceCount > 0 && (
                <Text color="whiteAlpha.700" fontSize="xs" mb={0}>
                  and {hiddenHoverSliceCount} more
                </Text>
              )}
            </Box>
          )}
          {hoverPath && (
            <Text color="whiteAlpha.800" fontSize="xs" mb={0}>
              Path {hoverPath}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

const NetworkPreview = memo(NetworkPreviewImpl);
export default NetworkPreview;
