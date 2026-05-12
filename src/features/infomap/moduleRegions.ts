// @ts-nocheck
import { Delaunay } from "d3-delaunay";
import {
  intersection as intersectPolygons,
  union as unionPolygons,
  type MultiPolygon,
  type Polygon,
  type Ring,
} from "polygon-clipping";

export type ModuleId = number | string;
export type ModuleMap = Map<number, ModuleId>;
type MapPoint = [number, number];
type ModuleRegionRole = "country" | "admin" | "province";
export type ModuleRegion = {
  moduleId: ModuleId;
  level: number;
  path: ModuleId[];
  role: ModuleRegionRole;
  multipolygon: MultiPolygon;
  bounds: [number, number, number, number];
  fill: string;
  stroke: string;
  strokeWidthMultiplier: number;
  rawPath?: Path2D;
  smoothPath?: Path2D;
};
export type RegionHoverState = {
  level: number;
  moduleId: ModuleId;
  path: ModuleId[];
} | null;
export type ModuleColorResolver = (moduleId: ModuleId) => string;

type RegionNode = {
  id: string;
  x?: number;
  y?: number;
  radius: number;
};

type RegionGraph = {
  nodes: RegionNode[];
};

type VoronoiCell = {
  node: RegionNode;
  polygon: Polygon;
};

export const moduleRegionRebuildThrottleMs = 120;
const moduleRegionGhostPointCount = 36;

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

const moduleColorCache = new Map<ModuleId, string>();
export function moduleColor(moduleId: ModuleId) {
  const cached = moduleColorCache.get(moduleId);
  if (cached) return cached;
  let color: string;
  if (typeof moduleId === "number") {
    color = palette[Math.abs(moduleId) % palette.length];
  } else {
    let hash = 0;
    for (let i = 0; i < moduleId.length; i++) {
      hash = (hash * 31 + moduleId.charCodeAt(i)) | 0;
    }
    color = palette[Math.abs(hash) % palette.length];
  }
  moduleColorCache.set(moduleId, color);
  return color;
}

const shadedModuleColorCache = new Map<ModuleId, string>();
export function shadedModuleColor(moduleId: ModuleId) {
  const cached = shadedModuleColorCache.get(moduleId);
  if (cached) return cached;
  const shaded = shadeColor(moduleColor(moduleId), -42);
  shadedModuleColorCache.set(moduleId, shaded);
  return shaded;
}

export function shadeColor(hex: string, amount: number) {
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

function hexToRgba(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
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
  const t = clamp(weightB, 0, 1);
  const channel = (ca: number, cb: number) =>
    Math.round(ca * (1 - t) + cb * t)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
}

export function hierarchicalModuleColor(
  moduleId: ModuleId,
  rootByModule: Map<ModuleId, ModuleId>,
  activeLevel: number,
) {
  const rootId = rootByModule.get(moduleId);
  if (rootId === undefined || rootId === moduleId || activeLevel <= 1) {
    return moduleColor(moduleId);
  }
  const childTint = activeLevel === 2 ? 0.14 : 0.08;
  return mixHexColors(moduleColor(rootId), moduleColor(moduleId), childTint);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildVoronoiPoints(graph: RegionGraph) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let radiusSum = 0;
  for (const node of graph.nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    radiusSum += node.radius;
  }

  if (graph.nodes.length === 0) {
    return null;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const span = Math.max(width, height);
  const avgRadius = radiusSum / graph.nodes.length;
  const padding = clamp(span * 0.08 + avgRadius * 4, 80, 260);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const radiusX = width / 2 + padding * 2;
  const radiusY = height / 2 + padding * 2;
  const points: MapPoint[] = graph.nodes.map(
    (node) => [node.x ?? 0, node.y ?? 0] satisfies MapPoint,
  );

  for (let i = 0; i < moduleRegionGhostPointCount; i++) {
    const angle = (i / moduleRegionGhostPointCount) * Math.PI * 2;
    points.push([
      centerX + Math.cos(angle) * radiusX,
      centerY + Math.sin(angle) * radiusY,
    ]);
  }

  return {
    points,
    bounds: [
      centerX - radiusX * 1.25,
      centerY - radiusY * 1.25,
      centerX + radiusX * 1.25,
      centerY + radiusY * 1.25,
    ] satisfies [number, number, number, number],
  };
}

function normalizeRing(points: Iterable<[number, number]>): Ring | null {
  const ring: MapPoint[] = [];
  for (const [x, y] of points) {
    if (Number.isFinite(x) && Number.isFinite(y)) ring.push([x, y]);
  }
  if (ring.length > 1) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) ring.pop();
  }

  const unique = new Set(ring.map((point) => `${point[0]},${point[1]}`));
  if (unique.size < 3) return null;

  ring.push([ring[0][0], ring[0][1]]);
  return ring as Ring;
}

function unionModulePolygons(polygons: Polygon[]): MultiPolygon {
  if (polygons.length === 1) return [polygons[0]];

  let merged: MultiPolygon = [polygons[0]];
  for (let i = 1; i < polygons.length; i += 64) {
    merged = unionPolygons(merged, ...polygons.slice(i, i + 64));
  }
  return merged;
}

function multiPolygonBounds(multipolygon: MultiPolygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of multipolygon) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return [minX, minY, maxX, maxY] satisfies [number, number, number, number];
}

function buildVoronoiCells(graph: RegionGraph): VoronoiCell[] {
  const voronoiInput = buildVoronoiPoints(graph);
  if (!voronoiInput) return [];

  const delaunay = Delaunay.from(
    voronoiInput.points,
    (point) => point[0],
    (point) => point[1],
  );
  const voronoi = delaunay.voronoi(voronoiInput.bounds);
  const cells: VoronoiCell[] = [];

  for (let index = 0; index < graph.nodes.length; index++) {
    const cell = voronoi.cellPolygon(index);
    if (!cell) continue;
    const ring = normalizeRing(cell);
    if (!ring) continue;
    cells.push({ node: graph.nodes[index], polygon: [ring] });
  }

  return cells;
}

function groupCellPolygonsByModule(cells: VoronoiCell[], modules: ModuleMap) {
  const polygonsByModule = new Map<ModuleId, Polygon[]>();
  for (const cell of cells) {
    const moduleId = modules.get(Number(cell.node.id));
    if (moduleId === undefined) continue;
    const polygons = polygonsByModule.get(moduleId) ?? [];
    polygons.push(cell.polygon);
    polygonsByModule.set(moduleId, polygons);
  }
  return polygonsByModule;
}

function buildRegionsFromPolygons(
  polygonsByModule: Map<ModuleId, Polygon[]>,
  level: number,
  pathByModule: Map<ModuleId, ModuleId[]>,
  role: ModuleRegionRole,
  styleFor: (moduleId: ModuleId) => {
    fill: string;
    stroke: string;
    strokeWidthMultiplier: number;
  },
) {
  const regions: ModuleRegion[] = [];
  for (const [moduleId, polygons] of polygonsByModule) {
    if (polygons.length === 0) continue;
    let multipolygon: MultiPolygon;
    try {
      multipolygon = unionModulePolygons(polygons);
    } catch {
      multipolygon = polygons;
    }
    const style = styleFor(moduleId);
    regions.push({
      moduleId,
      level,
      path: pathByModule.get(moduleId) ?? [moduleId],
      role,
      multipolygon,
      bounds: multiPolygonBounds(multipolygon),
      ...style,
    });
  }
  return regions;
}

function modulePathsForLevel(
  graph: RegionGraph,
  levelModules: Map<number, ModuleMap> | undefined,
  modules: ModuleMap,
  level: number,
) {
  const pathByModule = new Map<ModuleId, ModuleId[]>();
  for (const node of graph.nodes) {
    const nodeId = Number(node.id);
    const moduleId = modules.get(nodeId);
    if (moduleId === undefined || pathByModule.has(moduleId)) continue;

    const path: ModuleId[] = [];
    for (let currentLevel = 1; currentLevel <= level; currentLevel++) {
      const map =
        currentLevel === level ? modules : levelModules?.get(currentLevel);
      const ancestorId = map?.get(nodeId);
      if (ancestorId !== undefined) path.push(ancestorId);
    }
    pathByModule.set(moduleId, path.length > 0 ? path : [moduleId]);
  }
  return pathByModule;
}

function buildChildParentMap(
  graph: RegionGraph,
  childModules: ModuleMap,
  parentModules: ModuleMap,
) {
  const parentByChild = new Map<ModuleId, ModuleId>();
  for (const node of graph.nodes) {
    const nodeId = Number(node.id);
    const child = childModules.get(nodeId);
    const parent = parentModules.get(nodeId);
    if (child === undefined || parent === undefined) continue;
    parentByChild.set(child, parent);
  }
  return parentByChild;
}

function moduleAncestorMap(
  graph: RegionGraph,
  childModules: ModuleMap,
  ancestorModules: ModuleMap,
) {
  const ancestorByChild = new Map<ModuleId, ModuleId>();
  for (const node of graph.nodes) {
    const nodeId = Number(node.id);
    const child = childModules.get(nodeId);
    const ancestor = ancestorModules.get(nodeId);
    if (child !== undefined && ancestor !== undefined) {
      ancestorByChild.set(child, ancestor);
    }
  }
  return ancestorByChild;
}

export function rootModuleMapForLevel(
  graph: RegionGraph,
  modules: ModuleMap,
  rootModules: ModuleMap | undefined,
  activeLevel: number,
) {
  const rootByModule = new Map<ModuleId, ModuleId>();
  if (!rootModules || activeLevel <= 1) return rootByModule;
  for (const node of graph.nodes) {
    const nodeId = Number(node.id);
    const moduleId = modules.get(nodeId);
    const rootId = rootModules.get(nodeId);
    if (moduleId !== undefined && rootId !== undefined) {
      rootByModule.set(moduleId, rootId);
    }
  }
  return rootByModule;
}

function clippedChildRegions(
  graph: RegionGraph,
  childRegions: ModuleRegion[],
  parentRegions: ModuleRegion[],
  childModules: ModuleMap,
  parentModules: ModuleMap,
) {
  const parentByChild = buildChildParentMap(graph, childModules, parentModules);
  const regionByParent = new Map(
    parentRegions.map((region) => [region.moduleId, region]),
  );

  return childRegions.map((region) => {
    const parentId = parentByChild.get(region.moduleId);
    const parentRegion =
      parentId !== undefined ? regionByParent.get(parentId) : undefined;
    if (!parentRegion) return region;

    try {
      const multipolygon = intersectPolygons(
        region.multipolygon,
        parentRegion.multipolygon,
      );
      return multipolygon.length > 0 ? { ...region, multipolygon } : region;
    } catch {
      return region;
    }
  });
}

function clipRegionsToParent(
  graph: RegionGraph,
  regions: ModuleRegion[],
  childModules: ModuleMap,
  parentModules: ModuleMap,
  parentRegions: ModuleRegion[],
) {
  return clippedChildRegions(
    graph,
    regions,
    parentRegions,
    childModules,
    parentModules,
  );
}

export function buildModuleRegions(
  graph: RegionGraph,
  modules: ModuleMap,
  moduleFlows: Map<number, { module: number; flow: number }[]> | undefined,
  coloredByModules: boolean,
  hierarchy?: {
    levelModules?: Map<number, ModuleMap>;
    activeLevel: number;
  },
): ModuleRegion[] {
  if (!coloredByModules) return [];
  if (moduleFlows) return [];

  const cells = buildVoronoiCells(graph);
  if (cells.length === 0) return [];

  const activeLevel = hierarchy?.activeLevel ?? 1;
  const levelModules = hierarchy?.levelModules;
  const baseActiveRegions = buildRegionsFromPolygons(
    groupCellPolygonsByModule(cells, modules),
    activeLevel,
    modulePathsForLevel(graph, levelModules, modules, activeLevel),
    activeLevel <= 1 ? "country" : "province",
    (moduleId) => {
      const color = moduleColor(moduleId);
      return {
        fill: hexToRgba(color, 0.075),
        stroke: hexToRgba(shadedModuleColor(moduleId), 0.18),
        strokeWidthMultiplier: 1,
      };
    },
  );

  const rootModules = levelModules?.get(1);
  if (!rootModules || activeLevel <= 1 || rootModules === modules) {
    return baseActiveRegions;
  }

  const rootRegions = buildRegionsFromPolygons(
    groupCellPolygonsByModule(cells, rootModules),
    1,
    modulePathsForLevel(graph, levelModules, rootModules, 1),
    "country",
    (moduleId) => {
      const color = moduleColor(moduleId);
      return {
        fill: hexToRgba(color, 0.05),
        stroke: hexToRgba(shadedModuleColor(moduleId), 0.22),
        strokeWidthMultiplier: 1.5,
      };
    },
  );

  const regions: ModuleRegion[] = [...rootRegions];
  let previousLevel = 1;
  let previousModules = rootModules;
  let previousRegions = rootRegions;

  for (let level = 2; level < activeLevel; level++) {
    const currentModules = levelModules?.get(level);
    if (!currentModules) continue;
    const ancestorByModule = moduleAncestorMap(
      graph,
      currentModules,
      rootModules,
    );
    const currentRegions = clipRegionsToParent(
      graph,
      buildRegionsFromPolygons(
        groupCellPolygonsByModule(cells, currentModules),
        level,
        modulePathsForLevel(graph, levelModules, currentModules, level),
        "admin",
        (moduleId) => {
          const rootId = ancestorByModule.get(moduleId) ?? moduleId;
          return {
            fill: hexToRgba(moduleColor(rootId), 0.012),
            stroke: hexToRgba(shadedModuleColor(rootId), 0.11),
            strokeWidthMultiplier: 0.75,
          };
        },
      ),
      currentModules,
      previousModules,
      previousRegions,
    );
    regions.push(...currentRegions);
    previousLevel = level;
    previousModules = currentModules;
    previousRegions = currentRegions;
  }

  const directParentModules =
    levelModules?.get(Math.max(1, activeLevel - 1)) ?? rootModules;
  const directParentRegions =
    previousLevel === activeLevel - 1 ? previousRegions : rootRegions;
  const rootByActiveModule = moduleAncestorMap(graph, modules, rootModules);
  const activeRegions = clipRegionsToParent(
    graph,
    baseActiveRegions,
    modules,
    directParentModules,
    directParentRegions,
  ).map((region) => {
    const rootId = rootByActiveModule.get(region.moduleId);
    const rootColor =
      rootId !== undefined ? moduleColor(rootId) : moduleColor(region.moduleId);
    const childTint = activeLevel === 2 ? 0.14 : 0.08;
    const color = mixHexColors(
      rootColor,
      moduleColor(region.moduleId),
      childTint,
    );
    return {
      ...region,
      fill: hexToRgba(color, activeLevel === 2 ? 0.07 : 0.052),
      stroke: hexToRgba(shadedModuleColor(rootId ?? region.moduleId), 0.16),
      strokeWidthMultiplier: activeLevel === 2 ? 0.75 : 0.58,
    };
  });

  return [...regions, ...activeRegions];
}

function drawSmoothedRing(ctx: CanvasPath, ring: Ring) {
  const points = ring.slice();
  if (points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) points.pop();
  }
  if (points.length < 3) return false;

  const last = points[points.length - 1];
  const first = points[0];
  ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const next = points[(i + 1) % points.length];
    ctx.quadraticCurveTo(
      point[0],
      point[1],
      (point[0] + next[0]) / 2,
      (point[1] + next[1]) / 2,
    );
  }
  ctx.closePath();
  return true;
}

function drawRawRing(ctx: CanvasPath, ring: Ring) {
  const points = ring.slice();
  if (points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) points.pop();
  }
  if (points.length < 3) return false;

  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  return true;
}

function traceRegionPath(
  ctx: CanvasRenderingContext2D,
  region: ModuleRegion,
  smooth: boolean,
) {
  ctx.beginPath();
  let hasPath = false;
  for (const polygon of region.multipolygon) {
    for (const ring of polygon) {
      hasPath =
        (smooth ? drawSmoothedRing(ctx, ring) : drawRawRing(ctx, ring)) ||
        hasPath;
    }
  }
  return hasPath;
}

function getRegionPath(region: ModuleRegion, smooth: boolean) {
  if (typeof Path2D === "undefined") return null;
  const existing = smooth ? region.smoothPath : region.rawPath;
  if (existing) return existing;

  const path = new Path2D();
  let hasPath = false;
  for (const polygon of region.multipolygon) {
    for (const ring of polygon) {
      hasPath =
        (smooth ? drawSmoothedRing(path, ring) : drawRawRing(path, ring)) ||
        hasPath;
    }
  }
  if (!hasPath) return null;

  if (smooth) {
    region.smoothPath = path;
  } else {
    region.rawPath = path;
  }
  return path;
}

function regionKey(level: number, moduleId: ModuleId) {
  return `${level}:${String(moduleId)}`;
}

export function sameRegionHover(a: RegionHoverState, b: RegionHoverState) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.level === b.level && a.moduleId === b.moduleId;
}

export function highlightStrengthsForPath(path: ModuleId[] | undefined) {
  if (!path || path.length === 0) return undefined;
  const strengths = new Map<string, number>();
  const deepestIndex = path.length - 1;
  for (let index = 0; index < path.length; index++) {
    const distance = deepestIndex - index;
    const strength =
      distance === 0
        ? 1
        : distance === 1
          ? 0.72
          : Math.max(0.38, 0.56 - (distance - 2) * 0.12);
    strengths.set(regionKey(index + 1, path[index]), strength);
  }
  return strengths;
}

function pointInRing(x: number, y: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(x: number, y: number, polygon: Polygon) {
  if (polygon.length === 0 || !pointInRing(x, y, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(x, y, polygon[i])) return false;
  }
  return true;
}

export function pointInRegion(x: number, y: number, region: ModuleRegion) {
  const [minX, minY, maxX, maxY] = region.bounds;
  if (x < minX || x > maxX || y < minY || y > maxY) return false;
  return region.multipolygon.some((polygon) => pointInPolygon(x, y, polygon));
}

export function renderModuleRegions(
  ctx: CanvasRenderingContext2D,
  regions: ModuleRegion[],
  strokeWidth: number,
  highlightStrengths?: Map<string, number>,
) {
  if (regions.length === 0) return;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const regionByKey = new Map(
    regions.map((region) => [regionKey(region.level, region.moduleId), region]),
  );
  const parentFor = (region: ModuleRegion) => {
    if (region.level <= 1) return undefined;
    const parentId = region.path[region.level - 2];
    if (parentId === undefined) return undefined;
    return regionByKey.get(regionKey(region.level - 1, parentId));
  };
  const clipToRegion = (region: ModuleRegion) => {
    const path = getRegionPath(region, true);
    if (path) {
      ctx.clip(path, "evenodd");
      return true;
    }
    if (!traceRegionPath(ctx, region, true)) return false;
    ctx.clip("evenodd");
    return true;
  };
  const fillRegion = (region: ModuleRegion, smooth: boolean) => {
    const path = getRegionPath(region, smooth);
    if (path) {
      ctx.fill(path, "evenodd");
      return true;
    }
    if (!traceRegionPath(ctx, region, smooth)) return false;
    ctx.fill("evenodd");
    return true;
  };
  const strokeRegion = (region: ModuleRegion, smooth: boolean) => {
    const path = getRegionPath(region, smooth);
    if (path) {
      ctx.stroke(path);
      return true;
    }
    if (!traceRegionPath(ctx, region, smooth)) return false;
    ctx.stroke();
    return true;
  };
  const renderGroupedByParent = (
    candidates: ModuleRegion[],
    renderRegion: (region: ModuleRegion) => void,
  ) => {
    const rootRegions: ModuleRegion[] = [];
    const groupedChildren = new Map<ModuleRegion, ModuleRegion[]>();
    for (const region of candidates) {
      const parent = parentFor(region);
      if (!parent) {
        rootRegions.push(region);
        continue;
      }
      const group = groupedChildren.get(parent);
      if (group) {
        group.push(region);
      } else {
        groupedChildren.set(parent, [region]);
      }
    }

    for (const region of rootRegions) renderRegion(region);
    for (const [parent, group] of groupedChildren) {
      ctx.save();
      clipToRegion(parent);
      for (const region of group) renderRegion(region);
      ctx.restore();
    }
  };

  renderGroupedByParent(regions, (region) => {
    const strength = highlightStrengths?.get(
      regionKey(region.level, region.moduleId),
    );
    const isDimmed = highlightStrengths && strength === undefined;
    const smooth = region.role !== "province";
    ctx.globalAlpha = isDimmed ? 0.18 : strength ? Math.max(0.42, strength) : 1;
    ctx.fillStyle = region.fill;
    fillRegion(region, smooth);
  });

  renderGroupedByParent(
    regions.filter((region) => region.role !== "province"),
    (region) => {
      const strength = highlightStrengths?.get(
        regionKey(region.level, region.moduleId),
      );
      const isDimmed = highlightStrengths && strength === undefined;
      ctx.globalAlpha = isDimmed
        ? 0.12
        : strength
          ? Math.max(0.5, strength)
          : region.role === "admin"
            ? 0.48
            : 1;
      ctx.lineWidth =
        strokeWidth *
        region.strokeWidthMultiplier *
        (strength ? 1 + strength * 0.85 : isDimmed ? 0.55 : 1);
      ctx.strokeStyle = region.stroke;
      strokeRegion(region, true);
    },
  );

  renderGroupedByParent(
    regions.filter((region) => region.role === "province"),
    (region) => {
      const strength = highlightStrengths?.get(
        regionKey(region.level, region.moduleId),
      );
      const isDimmed = highlightStrengths && strength === undefined;
      ctx.globalAlpha = isDimmed
        ? 0.08
        : strength
          ? Math.max(0.55, strength)
          : 0.42;
      ctx.lineWidth =
        strokeWidth *
        (strength ? 0.9 + strength * 0.45 : isDimmed ? 0.2 : 0.32);
      ctx.strokeStyle = region.stroke;
      strokeRegion(region, false);
    },
  );

  ctx.globalAlpha = 1;
  ctx.restore();
}
