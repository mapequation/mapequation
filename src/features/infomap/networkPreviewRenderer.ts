import type { ZoomTransform } from "d3-zoom";
import type { ModuleId, ModuleMap } from "./moduleColors";
import type {
  Graph,
  HoverState,
  ModuleFlowMap,
  ModuleSlice,
  SimNode,
} from "./networkPreviewTypes";

export type ModuleColorResolver = (moduleId: ModuleId) => string;

export interface NetworkPreviewRenderOptions {
  coloredByModules: boolean;
  graph: Graph;
  height: number;
  hierarchyPaths: Map<string, ModuleId[]>;
  hover: HoverState;
  moduleColorFor: ModuleColorResolver;
  moduleFlows?: ModuleFlowMap;
  modules: ModuleMap;
  showArrows: boolean;
  transform: ZoomTransform;
  width: number;
}

export interface NetworkPreviewExportOptions {
  coloredByModules: boolean;
  graph: Graph;
  moduleColorFor: ModuleColorResolver;
  moduleFlows?: ModuleFlowMap;
  modules: ModuleMap;
  showArrows: boolean;
}

const labelStrokeWidth = 4;
const labelMinFontSize = 9;
const labelMaxFontSize = 16;
const exportLabelStrokePixelWidth = 14;
const exportLabelMinPixelFontSize = 64;
const exportLabelMaxPixelFontSize = 104;
const exportLabelGapPixel = 18;
const exportTargetMaxPixels = 8192;

const neutralNode = "#D7D9DD";
const unknownNode = "#CBD0D6";
const linkColor = "#55565A";

const minRenderedLinkPixels = 0.05;
const minRenderedNodeRadiusPixels = 0.12;

const arrowStride = 7;
let arrowFloats = new Float32Array(0);
let arrowColors: string[] = [];

function ensureArrowBuffers(capacity: number) {
  if (arrowFloats.length / arrowStride < capacity) {
    arrowFloats = new Float32Array(capacity * arrowStride);
    arrowColors = new Array(capacity);
  }
}

const fadeCache = new Map<string, string>();
const shadeCache = new Map<string, string>();

function fadeToBackgroundCached(hex: string, opacity: number) {
  const key = `${hex}|${opacity}`;
  const cached = fadeCache.get(key);
  if (cached) return cached;
  const value = fadeToBackground(hex, opacity);
  fadeCache.set(key, value);
  return value;
}

function shadeColorCached(hex: string, amount: number) {
  const key = `${hex}|${amount}`;
  const cached = shadeCache.get(key);
  if (cached) return cached;
  const value = shadeColor(hex, amount);
  shadeCache.set(key, value);
  return value;
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

function sharedPrefixLength(a: ModuleId[], b: ModuleId[]) {
  const length = Math.min(a.length, b.length);
  let shared = 0;
  while (shared < length && a[shared] === b[shared]) shared += 1;
  return shared;
}

function computeModuleCentroids(
  nodes: { id: string; x?: number; y?: number }[],
  moduleFlows?: ModuleFlowMap,
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

export function sharedModuleFor(
  sourceId: string,
  targetId: string,
  modules: Map<number, ModuleId>,
  moduleFlows?: ModuleFlowMap,
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

export function nodeModuleSlices(
  node: { id: string },
  modules: Map<number, ModuleId>,
  moduleFlows?: ModuleFlowMap,
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

export function selectedHoverModuleIds(
  node: SimNode,
  point: { x: number; y: number },
  nodes: SimNode[],
  modules: Map<number, ModuleId>,
  moduleFlows?: ModuleFlowMap,
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

function drawArrow(context: CanvasRenderingContext2D, index: number) {
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
}

function storeArrow({
  arrowCount,
  color,
  endX,
  endY,
  head,
  lineWidth,
  linkReverseWidth,
  tipX,
  tipY,
  ux,
  uy,
}: {
  arrowCount: number;
  color: string;
  endX: number;
  endY: number;
  head: number;
  lineWidth: number;
  linkReverseWidth: number;
  tipX: number;
  tipY: number;
  ux: number;
  uy: number;
}) {
  const offset = arrowCount * arrowStride;
  arrowFloats[offset] = tipX;
  arrowFloats[offset + 1] = tipY;
  arrowFloats[offset + 2] = endX;
  arrowFloats[offset + 3] = endY;
  arrowFloats[offset + 4] = ux;
  arrowFloats[offset + 5] = uy;
  arrowFloats[offset + 6] = Math.max(
    head * 0.45,
    Math.max(lineWidth, linkReverseWidth) * 0.7,
  );
  arrowColors[arrowCount] = color;
}

function renderNetworkPreviewExport(
  ctx: CanvasRenderingContext2D,
  {
    coloredByModules,
    graph,
    moduleColorFor,
    moduleFlows,
    modules,
    scale,
    showArrows,
    transformX,
    transformY,
  }: NetworkPreviewExportOptions & {
    transformX: number;
    transformY: number;
    scale: number;
  },
) {
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
        ? shadeColorCached(moduleColorFor(sharedModule), -42)
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
        storeArrow({
          arrowCount,
          color: stroke,
          endX,
          endY,
          head,
          lineWidth,
          linkReverseWidth: link.reverseWidth,
          tipX,
          tipY,
          ux,
          uy,
        });
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

  for (let i = 0; i < arrowCount; i++) drawArrow(ctx, i);

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
        ? shadeColorCached(moduleColorFor(slices[0].moduleId), -70)
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

export function createNetworkPreviewExportCanvas(
  opts: NetworkPreviewExportOptions,
) {
  const { graph } = opts;
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
  if (!Number.isFinite(minX)) return null;

  const padding = 40;
  const nodeOnlyWorldW = maxX - minX + padding * 2;
  const nodeOnlyWorldH = maxY - minY + padding * 2;
  const scaleEstimate =
    exportTargetMaxPixels / Math.max(nodeOnlyWorldW, nodeOnlyWorldH);
  const maxLabelExtent = (exportLabelMaxPixelFontSize * 0.65) / scaleEstimate;
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

  const scale = exportTargetMaxPixels / Math.max(worldW, worldH);
  const pixelW = Math.max(1, Math.round(worldW * scale));
  const pixelH = Math.max(1, Math.round(worldH * scale));

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = pixelW;
  exportCanvas.height = pixelH;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pixelW, pixelH);
  renderNetworkPreviewExport(ctx, {
    ...opts,
    transformX: -minX * scale,
    transformY: -minY * scale,
    scale,
  });

  return exportCanvas;
}

export function renderNetworkPreviewFrame(
  context: CanvasRenderingContext2D,
  {
    coloredByModules,
    graph,
    height,
    hierarchyPaths,
    hover,
    moduleColorFor,
    moduleFlows,
    modules,
    showArrows,
    transform,
    width,
  }: NetworkPreviewRenderOptions,
) {
  context.save();
  context.translate(transform.x, transform.y);
  context.scale(transform.k, transform.k);

  const hovered = hover?.node ?? null;
  const hoveredId = hovered?.id;
  const hoveredPath = hovered ? hierarchyPaths.get(hovered.id) : undefined;
  const hoveredModuleIds =
    hover?.moduleIds && hover.moduleIds.length > 0
      ? new Set(hover.moduleIds)
      : hovered && coloredByModules && moduleFlows
        ? new Set(
            nodeModuleSlices(hovered, modules, moduleFlows).map(
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
      const nodeSlices = moduleFlows
        ? nodeModuleSlices(node, modules, moduleFlows)
        : [];
      const nodeModuleId =
        nodeSlices[0]?.moduleId ?? modules.get(Number(node.id));
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

  const zoomLevel = transform.k;
  const nodeStrokeWorld = 2;
  const minVisibleWidthWorld = minRenderedLinkPixels / zoomLevel;

  const viewMarginWorld = 40 / zoomLevel;
  const viewLeft = -transform.x / zoomLevel - viewMarginWorld;
  const viewTop = -transform.y / zoomLevel - viewMarginWorld;
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
    const sharedModule = coloredByModules ? link.sharedModule : undefined;
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
        ? shadeColorCached(moduleColorFor(sharedModule), -42)
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
        storeArrow({
          arrowCount,
          color: stroke,
          endX,
          endY,
          head,
          lineWidth,
          linkReverseWidth: link.reverseWidth,
          tipX,
          tipY,
          ux,
          uy,
        });
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

  for (const link of inactiveLinks) {
    drawLink(link);
    if (link.arrowIndex !== undefined) drawArrow(context, link.arrowIndex);
  }
  for (const link of activeLinks) {
    drawLink(link);
    if (link.arrowIndex !== undefined) drawArrow(context, link.arrowIndex);
  }

  const minVisibleNodeRadiusWorld = minRenderedNodeRadiusPixels / zoomLevel;
  const moduleCentroids =
    coloredByModules && moduleFlows
      ? computeModuleCentroids(graph.nodes, moduleFlows, modules)
      : new Map<ModuleId, { x: number; y: number }>();
  for (const node of graph.nodes) {
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    if (isOffscreen(nx, ny)) continue;
    if (node.radius < minVisibleNodeRadiusWorld) continue;
    const nodeModuleId =
      coloredByModules && !moduleFlows
        ? modules.get(Number(node.id))
        : undefined;
    const slices =
      coloredByModules && moduleFlows
        ? nodeModuleSlices(node, modules, moduleFlows)
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
        isHovered && hover?.moduleIds?.length === 1
          ? hover.moduleIds[0]
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
            : coloredByModules
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
        ? shadeColorCached(moduleColorFor(dominantModuleId), -86)
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
    const sx = transform.x + (node.x ?? 0) * zoomLevel;
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
      coloredByModules && !moduleFlows
        ? modules.get(Number(node.id))
        : undefined;
    const slices =
      coloredByModules && moduleFlows
        ? nodeModuleSlices(node, modules, moduleFlows)
        : [];
    const labelColor =
      hoveredSliceModuleId !== undefined && focusStrengthFor(node) > 0.5
        ? shadeColorCached(moduleColorFor(hoveredSliceModuleId), -70)
        : slices.length > 0
          ? shadeColorCached(moduleColorFor(slices[0].moduleId), -70)
          : nodeModuleId !== undefined
            ? shadeColorCached(moduleColorFor(nodeModuleId), -70)
            : "#2D3748";
    context.font = `500 ${fontSize}px sans-serif`;
    const textWidth = context.measureText(node.label).width;
    const x = labelLeftX(node, textWidth);
    const y = transform.y + (node.y ?? 0) * zoomLevel;
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
    const sx = transform.x + nx * zoomLevel;
    const sy = transform.y + ny * zoomLevel;
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
