import { Box, Button, HStack, Spinner, Text } from "@chakra-ui/react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { quadtree, type Quadtree } from "d3-quadtree";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuDownload, LuMaximize } from "react-icons/lu";
import {
  hasMatchingModules,
  parseNetworkPreview,
  type ParsedNetwork,
  type PreviewNode,
} from "./networkPreviewParser";

type SimNode = PreviewNode &
  SimulationNodeDatum & {
    radius: number;
  };

type SimLink = SimulationLinkDatum<SimNode> & {
  source: SimNode;
  target: SimNode;
  weight: number;
  directed: boolean;
  width: number;
};

type Graph = {
  nodes: SimNode[];
  links: SimLink[];
};

type HoverState = {
  node: SimNode;
  x: number;
  y: number;
} | null;

type ModuleId = number | string;
type ModuleMap = Map<number, ModuleId>;

const debounceMs = 300;
const palette = [
  "#EBC384",
  "#82A3C9",
  "#C2554A",
  "#ADB580",
  "#A37CB6",
  "#E68C6C",
  "#7DB7AE",
  "#DFDDA2",
  "#C9748A",
  "#5D7FA0",
  "#D4925E",
  "#6A8C5C",
  "#B4CCDF",
  "#ECA770",
  "#8C7363",
  "#B49AD0",
];

const neutralNode = "#D7D9DD";
const unknownNode = "#CBD0D6";
const linkColor = "#55565A";

const linkWidthRange: [number, number] = [2, 10];

function createGraph(parsed: Extract<ParsedNetwork, { status: "ok" }>): Graph {
  const nodeCount = parsed.nodes.length;
  const radiusScale = (degree: number) =>
    Math.max(7, Math.min(20, 7 + Math.sqrt(degree) * 2.8));

  const nodes: SimNode[] = parsed.nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodeCount)) * Math.PI * 2;
    const ring = 140 + (index % 7) * 7;

    return {
      ...node,
      radius: radiusScale(node.degree),
      x: Math.cos(angle) * ring,
      y: Math.sin(angle) * ring,
    };
  });
  nodes.sort((a, b) => b.degree - a.degree);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const rawWeights = parsed.links.map((link) => link.weight);
  const wMin = rawWeights.length ? Math.min(...rawWeights) : 1;
  const wMax = rawWeights.length ? Math.max(...rawWeights) : 1;
  const wRange = wMax - wMin || 1;
  const ratio = wMax / Math.max(1e-9, wMin);
  // 0 when all weights are similar, 1 when they span more than 16x.
  const spread = Math.min(1, Math.max(0, (Math.log2(ratio) - 1) / 3));
  const widthFor = (weight: number) =>
    linkWidthRange[0] +
    ((weight - wMin) / wRange) *
      spread *
      (linkWidthRange[1] - linkWidthRange[0]);
  const links = parsed.links
    .map((link) => {
      const source = nodesById.get(link.source);
      const target = nodesById.get(link.target);
      if (!source || !target) return null;
      return { ...link, source, target, width: widthFor(link.weight) };
    })
    .filter((link): link is SimLink => Boolean(link));
  links.sort((a, b) => b.width - a.width);

  return { nodes, links };
}

function moduleColor(moduleId: ModuleId) {
  if (typeof moduleId === "number") {
    return palette[Math.abs(moduleId) % palette.length];
  }

  let hash = 0;
  for (const char of moduleId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
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
    coloredByModules: boolean;
    transformX: number;
    transformY: number;
    scale: number;
  },
) {
  const { showArrows, modules, coloredByModules, transformX, transformY, scale } = opts;
  const nodeStrokeWorld = 2;

  ctx.save();
  ctx.translate(transformX, transformY);
  ctx.scale(scale, scale);

  type ArrowSpec = {
    tipX: number;
    tipY: number;
    baseX: number;
    baseY: number;
    ux: number;
    uy: number;
    halfWidth: number;
    color: string;
  };
  const arrows: ArrowSpec[] = [];

  for (const link of graph.links) {
    const sourceModule = modules.get(Number(link.source.id));
    const targetModule = modules.get(Number(link.target.id));
    const intraModule =
      coloredByModules &&
      sourceModule !== undefined &&
      sourceModule === targetModule;
    const baseStroke = intraModule
      ? shadeColor(moduleColor(sourceModule), -42)
      : linkColor;
    const fade = intraModule ? 0.42 : 0.26;
    const stroke = fadeToBackground(baseStroke, fade);
    const lineWidth = link.width;
    const directedLink = showArrows || link.directed;

    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    let endX = tx;
    let endY = ty;

    if (directedLink) {
      const dx = tx - sx;
      const dy = ty - sy;
      const length = Math.hypot(dx, dy);
      if (length > 0) {
        const ux = dx / length;
        const uy = dy / length;
        const head = Math.max(2.5, lineWidth * 2.6);
        const tipDistance = link.target.radius + nodeStrokeWorld * 0.5;
        const baseDistance = tipDistance + head;
        const tipX = tx - ux * tipDistance;
        const tipY = ty - uy * tipDistance;
        endX = tx - ux * baseDistance;
        endY = ty - uy * baseDistance;
        arrows.push({
          tipX,
          tipY,
          baseX: endX,
          baseY: endY,
          ux,
          uy,
          halfWidth: head * 0.45,
          color: stroke,
        });
      }
    }

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  for (const node of graph.nodes) {
    const moduleId = modules.get(Number(node.id));
    const fill =
      coloredByModules && moduleId !== undefined
        ? moduleColor(moduleId)
        : coloredByModules
          ? unknownNode
          : neutralNode;

    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = nodeStrokeWorld;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  }

  for (const arrow of arrows) {
    const leftX = arrow.baseX - arrow.uy * arrow.halfWidth;
    const leftY = arrow.baseY + arrow.ux * arrow.halfWidth;
    const rightX = arrow.baseX + arrow.uy * arrow.halfWidth;
    const rightY = arrow.baseY - arrow.ux * arrow.halfWidth;
    ctx.beginPath();
    ctx.moveTo(arrow.tipX, arrow.tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fillStyle = arrow.color;
    ctx.fill();
  }

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  ctx.lineWidth = 4 / scale;
  for (const node of graph.nodes) {
    const fontSize = Math.max(10, node.radius * 0.95);
    const moduleId = modules.get(Number(node.id));
    const labelColor =
      coloredByModules && moduleId !== undefined
        ? shadeColor(moduleColor(moduleId), -70)
        : "#2D3748";
    ctx.font = `${fontSize}px sans-serif`;
    const x = (node.x ?? 0) + node.radius + 3;
    const y = (node.y ?? 0) - node.radius / 3;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = labelColor;
    ctx.strokeText(node.label, x, y);
    ctx.fillText(node.label, x, y);
  }

  ctx.restore();
}

function parsedSignature(parsed: ParsedNetwork) {
  if (parsed.status !== "ok") {
    return `${parsed.status}:${parsed.message}:${parsed.nodes.length}:${parsed.links.length}`;
  }

  return [
    parsed.status,
    parsed.nodes.map((node) => `${node.id}:${node.label}`).join("|"),
    parsed.links
      .map((link) => `${link.source}:${link.target}:${link.weight}`)
      .join("|"),
  ].join("::");
}

export default function NetworkPreview({
  codeLength,
  directed = false,
  levelModules,
  loadingState = null,
  lockedLevelLabel,
  moduleSource = "latest Infomap result",
  network,
  networkName,
  modules,
  numLevels,
  selectedLevel,
}: {
  codeLength?: number | null;
  directed?: boolean;
  levelModules?: Map<number, ModuleMap>;
  loadingState?: "loading" | "running" | null;
  lockedLevelLabel?: string;
  moduleSource?: string;
  network: string;
  networkName?: string;
  modules: ModuleMap;
  numLevels?: number | null;
  selectedLevel?: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const frameRef = useRef(0);
  const draggingRef = useRef<SimNode | null>(null);
  const hoverRef = useRef<HoverState>(null);
  const directedRef = useRef(directed);
  const drawRef = useRef<() => void>(() => {});
  const autoFitActiveRef = useRef(true);
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const quadtreeRef = useRef<Quadtree<SimNode> | null>(null);
  const maxNodeRadiusRef = useRef(0);

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
  const [parsed, setParsed] = useState(() => parseNetworkPreview(network));
  const [hover, setHover] = useState<HoverState>(null);
  const [level, setLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const parsedKey = useMemo(() => parsedSignature(parsed), [parsed]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParsed = parseNetworkPreview(network);
      const nextKey = parsedSignature(nextParsed);
      setParsed((currentParsed) =>
        parsedSignature(currentParsed) === nextKey ? currentParsed : nextParsed,
      );
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [network]);

  const levelLocked = selectedLevel !== null && selectedLevel !== undefined;
  const moduleLevelCount = Math.max(1, (numLevels ?? 1) - 1);
  const hasLevelControl = levelLocked || moduleLevelCount > 1;
  const codeLengthText = formatCodeLength(codeLength);
  const activeLevel =
    levelLocked && selectedLevel === -1
      ? moduleLevelCount
      : levelLocked
        ? selectedLevel
        : level;
  const displayLevel = levelLocked ? selectedLevel : activeLevel;
  const sliderLevel = displayLevel && displayLevel > 0 ? displayLevel : 1;
  const activeModules = levelModules?.get(activeLevel ?? 1) ?? modules;
  const coloredByModules =
    parsed.status === "ok" && hasMatchingModules(parsed.nodes, activeModules);
  const modulesRef = useRef(activeModules);
  const coloredByModulesRef = useRef(coloredByModules);

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
          const labelExtent = node.radius * 0.95 * (node.label.length + 3);
          if (x - node.radius < minX) minX = x - node.radius;
          if (x + node.radius + labelExtent > maxX)
            maxX = x + node.radius + labelExtent;
          if (y - node.radius < minY) minY = y - node.radius;
          if (y + node.radius > maxY) maxY = y + node.radius;
        }
        if (!Number.isFinite(minX)) {
          finish();
          return;
        }

        const padding = 40;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;
        const worldW = maxX - minX;
        const worldH = maxY - minY;

        const targetMax = 8192;
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

  drawRef.current = draw;
  function draw() {
    const canvas = canvasRef.current;
    const graph = graphRef.current;
    if (!canvas || !graph) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height, dpr } = dimensionsRef.current;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(transformRef.current.x, transformRef.current.y);
    context.scale(transformRef.current.k, transformRef.current.k);

    const hovered = hoverRef.current?.node ?? null;
    const hoveredId = hovered?.id;
    const currentModules = modulesRef.current;
    const currentColoredByModules = coloredByModulesRef.current;

    const showArrows = directedRef.current;
    const zoomLevel = transformRef.current.k;
    const nodeStrokeWorld = 2;
    const minVisibleWidthWorld = 0.2 / zoomLevel;

    const viewMarginWorld = 40 / zoomLevel;
    const viewLeft = -transformRef.current.x / zoomLevel - viewMarginWorld;
    const viewTop = -transformRef.current.y / zoomLevel - viewMarginWorld;
    const viewRight = viewLeft + width / zoomLevel + 2 * viewMarginWorld;
    const viewBottom = viewTop + height / zoomLevel + 2 * viewMarginWorld;
    const isOffscreen = (x: number, y: number) =>
      x < viewLeft || x > viewRight || y < viewTop || y > viewBottom;
    type ArrowSpec = {
      tipX: number;
      tipY: number;
      baseX: number;
      baseY: number;
      ux: number;
      uy: number;
      halfWidth: number;
      color: string;
    };
    const arrows: ArrowSpec[] = [];

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
      const sourceModule = currentModules.get(Number(link.source.id));
      const targetModule = currentModules.get(Number(link.target.id));
      const intraModule =
        currentColoredByModules &&
        sourceModule !== undefined &&
        sourceModule === targetModule;
      const directedLink = showArrows || link.directed;
      const baseStroke = intraModule
        ? shadeColor(moduleColor(sourceModule), -42)
        : linkColor;
      const fade = hovered
        ? isConnected
          ? intraModule
            ? 0.62
            : 0.55
          : 0.18
        : intraModule
          ? 0.42
          : 0.26;
      const stroke = fadeToBackground(baseStroke, fade);
      const lineWidth = link.width;

      let endX = tx;
      let endY = ty;
      if (directedLink) {
        const dx = tx - sx;
        const dy = ty - sy;
        const length = Math.hypot(dx, dy);
        if (length > 0) {
          const ux = dx / length;
          const uy = dy / length;
          const head = Math.max(2.5, lineWidth * 2.6);
          const tipDistance = link.target.radius + nodeStrokeWorld * 0.5;
          const baseDistance = tipDistance + head;
          const tipX = tx - ux * tipDistance;
          const tipY = ty - uy * tipDistance;
          endX = tx - ux * baseDistance;
          endY = ty - uy * baseDistance;
          arrows.push({
            tipX,
            tipY,
            baseX: endX,
            baseY: endY,
            ux,
            uy,
            halfWidth: head * 0.45,
            color: stroke,
          });
        }
      }

      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(endX, endY);
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.stroke();
    }

    const minVisibleNodeRadiusWorld = 0.4 / zoomLevel;
    for (const node of graph.nodes) {
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      if (isOffscreen(nx, ny)) continue;
      if (node.radius < minVisibleNodeRadiusWorld) continue;
      const moduleId = currentModules.get(Number(node.id));
      const fill =
        currentColoredByModules && moduleId !== undefined
          ? moduleColor(moduleId)
          : currentColoredByModules
            ? unknownNode
            : neutralNode;
      const isHovered = hoveredId === node.id;

      context.beginPath();
      context.arc(nx, ny, node.radius, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
      context.lineWidth = nodeStrokeWorld;
      context.strokeStyle = isHovered ? "#2D3748" : "#FFFFFF";
      context.stroke();
    }

    for (const arrow of arrows) {
      const leftX = arrow.baseX - arrow.uy * arrow.halfWidth;
      const leftY = arrow.baseY + arrow.ux * arrow.halfWidth;
      const rightX = arrow.baseX + arrow.uy * arrow.halfWidth;
      const rightY = arrow.baseY - arrow.ux * arrow.halfWidth;
      context.beginPath();
      context.moveTo(arrow.tipX, arrow.tipY);
      context.lineTo(leftX, leftY);
      context.lineTo(rightX, rightY);
      context.closePath();
      context.fillStyle = arrow.color;
      context.fill();
    }

    context.textBaseline = "middle";
    context.textAlign = "left";
    context.lineJoin = "round";
    context.lineCap = "butt";
    context.lineWidth = 4 / zoomLevel;
    const skipNumeric = graph.nodes.length > 60;
    const minLabelPixels = 7;

    const renderLabel = (node: SimNode) => {
      const fontSize = Math.max(10, node.radius * 0.95);
      const moduleId = currentModules.get(Number(node.id));
      const labelColor =
        currentColoredByModules && moduleId !== undefined
          ? shadeColor(moduleColor(moduleId), -70)
          : "#2D3748";
      context.font = `${fontSize}px sans-serif`;
      const x = (node.x ?? 0) + node.radius + 3;
      const y = (node.y ?? 0) - node.radius / 3;
      context.strokeStyle = "#ffffff";
      context.fillStyle = labelColor;
      context.strokeText(node.label, x, y);
      context.fillText(node.label, x, y);
    };

    for (const node of graph.nodes) {
      const fontSize = Math.max(10, node.radius * 0.95);
      if (fontSize * zoomLevel < minLabelPixels) break;
      if (node === hovered) continue;
      if (skipNumeric && node.label === node.id) continue;
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      if (isOffscreen(nx, ny)) continue;
      renderLabel(node);
    }

    if (hovered) renderLabel(hovered);

    context.restore();
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
      .scaleExtent([0.01, 8])
      .filter((event) => {
        if (event.type === "dblclick") return false;
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

    select(canvas).call(zoomBehavior).on("dblclick.zoom", null);

    return () => {
      select(canvas).on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    simulationRef.current?.stop();
    simulationRef.current = null;
    graphRef.current = null;
    quadtreeRef.current = null;
    hoverRef.current = null;
    setHover(null);

    if (parsed.status !== "ok") {
      requestDraw();
      return;
    }

    const graph = createGraph(parsed);
    graphRef.current = graph;
    autoFitActiveRef.current = true;
    let tickCount = 0;
    const weights = graph.links.map((link) => link.weight);
    const wMin = weights.length ? Math.min(...weights) : 1;
    const wMax = weights.length ? Math.max(...weights) : 1;
    const wRange = wMax - wMin || 1;
    const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
    const linkScale = (weight: number) => (weight - wMin) / wRange;
    const linkForce = forceLink<SimNode, SimLink>(graph.links)
      .id((node) => node.id)
      .distance((link) => lerp(linkScale(link.weight), 60, 12));
    const baseStrength = linkForce.strength();
    linkForce.strength((link, index, links) => {
      const factor = lerp(linkScale(link.weight), 0.5, 1);
      return baseStrength(link, index, links) * factor;
    });
    const simulation = forceSimulation<SimNode, SimLink>(graph.nodes)
      .force("link", linkForce)
      .force("charge", forceManyBody().strength(-90))
      .force(
        "collide",
        forceCollide<SimNode>().radius((node) => node.radius * 2),
      )
      .force("center", forceCenter(0, 0))
      .alpha(0.95);

    const heavyGraph = graph.nodes.length > 1500;
    const preTickIterations = heavyGraph ? 30 : 100;
    const baseAlphaDecay = simulation.alphaDecay();
    simulation.alphaDecay(1e-3);
    simulation.tick(preTickIterations);
    simulation.alphaDecay(baseAlphaDecay);
    simulation
      .on("tick", () => {
        tickCount += 1;
        if (tickCount % 5 === 0 && autoFitActiveRef.current) fitToGraph();
        if (tickCount % 10 === 0) rebuildQuadtree();
        if (hoverRef.current) positionHoverCard();
        requestDraw();
      })
      .on("end", () => {
        if (autoFitActiveRef.current) fitToGraph();
        autoFitActiveRef.current = false;
        rebuildQuadtree();
      });

    rebuildQuadtree();

    if (heavyGraph) {
      simulation.stop();
      autoFitActiveRef.current = false;
    }

    simulationRef.current = simulation;
    const fitFrame = window.requestAnimationFrame(fitToGraph);

    return () => {
      window.cancelAnimationFrame(fitFrame);
      simulation.stop();
    };
  }, [parsedKey]);

  useEffect(() => {
    modulesRef.current = activeModules;
    coloredByModulesRef.current = coloredByModules;
    requestDraw();
  }, [activeModules, coloredByModules]);

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
      simulationRef.current?.alpha(0.45).alphaTarget(0.18).restart();
      requestDraw();
      return;
    }

    const node = findNearestNode(event.clientX, event.clientY);
    const nextHover = node
      ? { node, x: event.clientX, y: event.clientY }
      : null;
    hoverRef.current = nextHover;
    setHover(nextHover);
    requestDraw();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const node = findNearestNode(event.clientX, event.clientY);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    const point = screenToWorld(event.clientX, event.clientY);
    node.fx = point.x;
    node.fy = point.y;
    node.vx = 0;
    node.vy = 0;
    draggingRef.current = node;
    event.currentTarget.setPointerCapture(event.pointerId);
    simulationRef.current?.alpha(0.45).alphaTarget(0.18).restart();
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
      borderRadius="md"
      flex="1"
      minH={0}
      overflow="hidden"
      position="relative"
    >
      <canvas
        ref={canvasRef}
        aria-label="Network preview canvas"
        onDoubleClick={() => fitToGraph()}
        onPointerDown={onPointerDown}
        onPointerLeave={() => {
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
          touchAction: "none",
          width: "100%",
        }}
      />

      <HStack
        align="center"
        bg="whiteAlpha.900"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow="sm"
        gap={2}
        left={3}
        maxW="calc(100% - 6rem)"
        px={3}
        py={2}
        position="absolute"
        top={3}
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
          pt={1.5}
          pb={0}
          position="absolute"
          right={3}
          fontSize="xs"
        >
          <Text color="fg" fontWeight={600} mb={1} textAlign="center">
            {lockedLevelLabel ?? displayLevel}
          </Text>
          <Box display="flex" justifyContent="center">
            <input
              aria-label="Network preview level"
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
          <Text color="fg.muted" fontSize="2xs" mt={1} textAlign="center">
            Level
          </Text>
          {levelLocked && (
            <Text color="fg.muted" fontSize="2xs" mt={0.5} textAlign="center">
              --clu-level
            </Text>
          )}
        </Box>
      )}

      <HStack position="absolute" right={3} top={3} gap={2}>
        <Button
          aria-label="Download network as PNG"
          onClick={downloadPng}
          size="xs"
          variant="surface"
          loading={isDownloading}
          loadingText="PNG"
        >
          <LuDownload />
          PNG
        </Button>
        <Button
          aria-label="Fit network preview"
          onClick={() => fitToGraph()}
          size="xs"
          variant="surface"
        >
          <LuMaximize />
          Fit
        </Button>
      </HStack>

      {loadingState && (
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
              : "Loading network…"}
          </Text>
        </HStack>
      )}

      {parsed.status !== "ok" && (
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
            Degree {hover.node.degree}
            {moduleId !== undefined && !hoverPath
              ? ` · Module ${moduleId}`
              : ""}
          </Text>
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
