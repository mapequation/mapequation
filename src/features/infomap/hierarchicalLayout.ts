import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

type FtreeLayoutLink = {
  source: string;
  target: string;
  weight: number;
};

type FtreeLayoutSection = {
  enterFlow: number;
  exitFlow: number;
  links: FtreeLayoutLink[];
  numChildren: number;
  numEdges: number;
  pathKey: string;
};

export type FtreeLayout = {
  directed: boolean;
  linkCount: number;
  sections: Map<string, FtreeLayoutSection>;
};

export type HierarchicalLayoutNode = {
  flow: number;
  id: string;
  path?: number[];
  radius: number;
  x?: number;
  y?: number;
};

export type HierarchicalLayoutGraphLink = {
  flow?: number;
  source: string | { id: string };
  target: string | { id: string };
  weight?: number;
};

type HierarchyModule<T extends HierarchicalLayoutNode> = {
  children: HierarchyItem<T>[];
  childModules: Map<string, HierarchyModule<T>>;
  flow: number;
  key: string;
  leafCount: number;
  localId: string;
  nodes: T[];
  path: string[];
  radius: number;
  x: number;
  y: number;
};

type HierarchyItem<T extends HierarchicalLayoutNode> = {
  flow: number;
  id: string;
  localId: string;
  module?: HierarchyModule<T>;
  node?: T;
  radius: number;
  x: number;
  y: number;
};

type LocalLink = SimulationLinkDatum<HierarchyItem<HierarchicalLayoutNode>> & {
  source: HierarchyItem<HierarchicalLayoutNode>;
  target: HierarchyItem<HierarchicalLayoutNode>;
  weight: number;
};

type AnchorObservation = {
  anchorX: number;
  anchorY: number;
  localX: number;
  localY: number;
  weight: number;
};

type AnchoredTransform = {
  reflectY: boolean;
  rotation: number;
};

export function parseFtreeLayout(text: string | undefined): FtreeLayout | null {
  if (!text?.trim()) return null;

  const sections = new Map<string, FtreeLayoutSection>();
  let current: FtreeLayoutSection | null = null;
  let directed = false;
  let hasDirectionHeader = false;
  let linkCount = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("%")) continue;

    if (line.startsWith("*")) {
      const tokens = line.split(/\s+/);
      if (tokens[0]?.toLowerCase() !== "*links") {
        current = null;
        continue;
      }

      if (tokens.length === 2 && /^(un)?directed$/i.test(tokens[1])) {
        hasDirectionHeader = true;
        directed = tokens[1].toLowerCase() === "directed";
        current = null;
        continue;
      }

      const pathKey = tokens[1] === "root" ? "" : normalizePathKey(tokens[1]);
      const enterFlow = finiteNumber(tokens[2], 0);
      const exitFlow = finiteNumber(tokens[3], 0);
      const numEdges = Math.max(0, Math.round(finiteNumber(tokens[4], 0)));
      const numChildren = Math.max(0, Math.round(finiteNumber(tokens[5], 0)));
      current = {
        enterFlow,
        exitFlow,
        links: [],
        numChildren,
        numEdges,
        pathKey,
      };
      sections.set(pathKey, current);
      continue;
    }

    if (!current) continue;
    const tokens = line.split(/\s+/);
    if (tokens.length < 3) continue;
    const source = normalizeLocalId(tokens[0]);
    const target = normalizeLocalId(tokens[1]);
    if (!source || !target || source === target) continue;
    const weight = finiteNumber(tokens[2], 0);
    if (weight <= 0) continue;
    current.links.push({ source, target, weight });
    linkCount += 1;
  }

  if (!hasDirectionHeader && sections.size === 0) return null;
  return { directed, linkCount, sections };
}

export function runHierarchicalPrelayout<T extends HierarchicalLayoutNode>({
  ftree,
  isCancelled,
  links = [],
  nodes,
  nodePaths,
  onComplete,
  onProgress,
}: {
  ftree: FtreeLayout;
  isCancelled: () => boolean;
  links?: readonly HierarchicalLayoutGraphLink[];
  nodes: T[];
  nodePaths?: Map<string, number[]>;
  onComplete: (positions: Map<string, { x: number; y: number }> | null) => void;
  onProgress: (progress: number) => void;
}) {
  const hierarchy = buildHierarchy(nodes, nodePaths);
  if (!hierarchy || nodes.length === 0) {
    onComplete(null);
    return () => {};
  }

  assignModuleRadii(
    hierarchy.root,
    Math.max(320, Math.sqrt(nodes.length) * 48),
  );
  refreshModuleChildren(hierarchy.root, nodePaths);
  hierarchy.root.x = 0;
  hierarchy.root.y = 0;
  const nodePathById = buildNodePathMap(nodes, nodePaths);

  const queue = hierarchy.breadthFirstModules.filter(
    (module) => module.children.length > 0,
  );
  let cancelled = false;
  let frame = 0;
  let index = 0;

  const step = () => {
    if (cancelled || isCancelled()) return;
    const frameStartedAt = performance.now();
    while (index < queue.length && performance.now() - frameStartedAt < 8) {
      layoutModuleChildren(
        queue[index],
        ftree,
        hierarchy.modules,
        links,
        nodePathById,
      );
      index += 1;
    }
    onProgress(queue.length === 0 ? 1 : index / queue.length);

    if (index >= queue.length) {
      const positions = new Map<string, { x: number; y: number }>();
      for (const node of nodes) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
        positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
      }
      onComplete(positions);
      return;
    }
    frame = window.requestAnimationFrame(step);
  };

  frame = window.requestAnimationFrame(step);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
  };
}

function finiteNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeLocalId(value: string | undefined) {
  if (!value) return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : value;
}

function normalizePathKey(value: string | undefined) {
  if (!value) return "";
  return value.split(":").map(normalizeLocalId).filter(Boolean).join(":");
}

function buildHierarchy<T extends HierarchicalLayoutNode>(
  nodes: T[],
  nodePaths?: Map<string, number[]>,
) {
  const root: HierarchyModule<T> = createModule("", [], "root");
  const modules = new Map<string, HierarchyModule<T>>([["", root]]);

  for (const node of nodes) {
    const path =
      (nodePaths?.get(node.id) ?? node.path)?.map((part) => String(part)) ?? [];
    if (path.length < 2) continue;
    let parent = root;
    const modulePath = path.slice(0, -1);

    for (let depth = 1; depth <= modulePath.length; depth += 1) {
      const childPath = modulePath.slice(0, depth);
      const key = childPath.join(":");
      let module = modules.get(key);
      if (!module) {
        module = createModule(key, childPath, childPath[childPath.length - 1]);
        modules.set(key, module);
        parent.childModules.set(module.localId, module);
      }
      parent = module;
    }

    parent.nodes.push(node);
  }

  if (root.childModules.size === 0) return null;

  for (const module of modules.values()) {
    module.children = [
      ...[...module.childModules.values()].sort(compareModules).map(
        (child): HierarchyItem<T> => ({
          flow: child.flow,
          id: `module:${child.key}`,
          localId: child.localId,
          module: child,
          radius: child.radius,
          x: child.x,
          y: child.y,
        }),
      ),
      ...module.nodes.sort(compareNodes).map(
        (node): HierarchyItem<T> => ({
          flow: Math.max(node.flow, 1e-12),
          id: `node:${node.id}`,
          localId: String(
            (nodePaths?.get(node.id) ?? node.path)?.at(-1) ?? node.id,
          ),
          node,
          radius: node.radius,
          x: node.x ?? 0,
          y: node.y ?? 0,
        }),
      ),
    ];
  }

  accumulateModuleStats(root);

  const breadthFirstModules: HierarchyModule<T>[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const module = queue.shift();
    if (!module) continue;
    breadthFirstModules.push(module);
    queue.push(...module.childModules.values());
  }

  return { breadthFirstModules, modules, root };
}

function createModule<T extends HierarchicalLayoutNode>(
  key: string,
  path: string[],
  localId: string,
): HierarchyModule<T> {
  return {
    childModules: new Map(),
    children: [],
    flow: 0,
    key,
    leafCount: 0,
    localId,
    nodes: [],
    path,
    radius: 0,
    x: 0,
    y: 0,
  };
}

function compareModules<T extends HierarchicalLayoutNode>(
  a: HierarchyModule<T>,
  b: HierarchyModule<T>,
) {
  if (b.flow !== a.flow) return b.flow - a.flow;
  return a.key.localeCompare(b.key, undefined, { numeric: true });
}

function compareNodes(a: HierarchicalLayoutNode, b: HierarchicalLayoutNode) {
  if (b.flow !== a.flow) return b.flow - a.flow;
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

function accumulateModuleStats<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
) {
  let flow = 0;
  let leafCount = module.nodes.length;

  for (const child of module.childModules.values()) {
    accumulateModuleStats(child);
    flow += child.flow;
    leafCount += child.leafCount;
  }
  for (const node of module.nodes) {
    flow += Math.max(node.flow, 1e-12);
  }

  module.flow = Math.max(flow, 1e-12);
  module.leafCount = Math.max(leafCount, 1);
}

function assignModuleRadii<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  radius: number,
) {
  module.radius = radius;
  for (const child of module.childModules.values()) {
    const flowRadius =
      Math.sqrt(child.flow / Math.max(module.flow, 1e-12)) * radius * 0.95;
    const countRadius = 28 + Math.sqrt(child.leafCount) * 12;
    assignModuleRadii(child, Math.max(42, flowRadius, countRadius));
  }
}

function refreshModuleChildren<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  nodePaths?: Map<string, number[]>,
) {
  module.children = [
    ...[...module.childModules.values()].sort(compareModules).map(
      (child): HierarchyItem<T> => ({
        flow: child.flow,
        id: `module:${child.key}`,
        localId: child.localId,
        module: child,
        radius: child.radius,
        x: child.x,
        y: child.y,
      }),
    ),
    ...module.nodes.sort(compareNodes).map(
      (node): HierarchyItem<T> => ({
        flow: Math.max(node.flow, 1e-12),
        id: `node:${node.id}`,
        localId: String(
          (nodePaths?.get(node.id) ?? node.path)?.at(-1) ?? node.id,
        ),
        node,
        radius: node.radius,
        x: node.x ?? 0,
        y: node.y ?? 0,
      }),
    ),
  ];

  for (const child of module.childModules.values()) {
    refreshModuleChildren(child, nodePaths);
  }
}

function layoutModuleChildren<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  ftree: FtreeLayout,
  modules: Map<string, HierarchyModule<T>>,
  graphLinks: readonly HierarchicalLayoutGraphLink[],
  nodePathById: Map<string, string[]>,
) {
  if (module.children.length === 0) return;
  if (module.children.length === 1) {
    placeItem(module.children[0], module.x, module.y);
    return;
  }

  const items = module.children.map((child, index) => ({
    ...child,
    ...initialLocalPosition(index, module.children.length, module.radius),
  }));
  const links = buildLocalLinks(module, items, ftree);
  const compact = items.length > 80;
  const simulation = forceSimulation<HierarchyItem<HierarchicalLayoutNode>>(
    items,
  )
    .force(
      "link",
      forceLink<HierarchyItem<HierarchicalLayoutNode>, LocalLink>(links)
        .id((item) => item.id)
        .distance((link) => {
          const radiusDistance = link.source.radius + link.target.radius;
          return radiusDistance * (compact ? 1.15 : 1.4) + (compact ? 22 : 36);
        })
        .strength((link) => Math.min(0.3, 0.04 + link.weight * 0.22)),
    )
    .force(
      "charge",
      forceManyBody<HierarchyItem<HierarchicalLayoutNode>>().strength(
        (item) =>
          -Math.min(900, Math.max(compact ? 45 : 80, item.radius * 4.5)),
      ),
    )
    .force("center", forceCenter(0, 0))
    .stop();

  simulation.tick(ticksFor(module, items));
  simulation.stop();

  const transform = anchoredTransformFor(
    module,
    items,
    modules,
    graphLinks,
    nodePathById,
  );
  const scale = scaleFor(items, module.radius);
  for (const item of items) {
    const x = (item.x ?? 0) * scale;
    const y = (item.y ?? 0) * scale;
    const rotated = transformPoint(x, y, transform);
    placeItem(item, module.x + rotated.x, module.y + rotated.y);
  }
}

function buildNodePathMap<T extends HierarchicalLayoutNode>(
  nodes: T[],
  nodePaths?: Map<string, number[]>,
) {
  const result = new Map<string, string[]>();
  for (const node of nodes) {
    const path =
      (nodePaths?.get(node.id) ?? node.path)?.map((part) => String(part)) ?? [];
    if (path.length > 0) result.set(node.id, path);
  }
  return result;
}

function anchoredTransformFor<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  items: HierarchyItem<T>[],
  modules: Map<string, HierarchyModule<T>>,
  graphLinks: readonly HierarchicalLayoutGraphLink[],
  nodePathById: Map<string, string[]>,
) {
  const identity = { reflectY: false, rotation: 0 };
  if (module.key === "" || graphLinks.length === 0) return identity;

  const itemsByLocalId = new Map(items.map((item) => [item.localId, item]));
  const observations: AnchorObservation[] = [];

  for (const link of graphLinks) {
    const sourceId = graphLinkNodeId(link.source);
    const targetId = graphLinkNodeId(link.target);
    if (!sourceId || !targetId) continue;

    const sourcePath = nodePathById.get(sourceId);
    const targetPath = nodePathById.get(targetId);
    if (!sourcePath || !targetPath) continue;

    const sourceChild = childLocalIdForModule(sourcePath, module.path);
    const targetChild = childLocalIdForModule(targetPath, module.path);
    if (sourceChild && targetChild) continue;
    if (!sourceChild && !targetChild) continue;

    const childLocalId = sourceChild ?? targetChild;
    if (!childLocalId) continue;
    const item = itemsByLocalId.get(childLocalId);
    if (!item) continue;

    const outsidePath = sourceChild ? targetPath : sourcePath;
    const anchor = anchorPositionForPath(outsidePath, module, modules);
    if (!anchor) continue;

    const localX = item.x ?? 0;
    const localY = item.y ?? 0;
    const anchorX = anchor.x - module.x;
    const anchorY = anchor.y - module.y;
    if (Math.hypot(localX, localY) < 1e-6) continue;
    if (Math.hypot(anchorX, anchorY) < 1e-6) continue;

    observations.push({
      anchorX,
      anchorY,
      localX,
      localY,
      weight: linkWeight(link),
    });
  }

  if (observations.length === 0) return identity;
  const rotated = bestAnchoredTransform(observations, false);
  const reflected = bestAnchoredTransform(observations, true);
  const minReflectImprovement = Math.max(1e-9, rotated.totalWeight * 0.01);
  return reflected.score > rotated.score + minReflectImprovement
    ? reflected.transform
    : rotated.transform;
}

function bestAnchoredTransform(
  observations: AnchorObservation[],
  reflectY: boolean,
) {
  let sinSum = 0;
  let cosSum = 0;
  let totalWeight = 0;

  for (const observation of observations) {
    const localY = reflectY ? -observation.localY : observation.localY;
    const localAngle = Math.atan2(localY, observation.localX);
    const anchorAngle = Math.atan2(observation.anchorY, observation.anchorX);
    const angle = anchorAngle - localAngle;
    sinSum += Math.sin(angle) * observation.weight;
    cosSum += Math.cos(angle) * observation.weight;
    totalWeight += observation.weight;
  }

  const rotation = Math.atan2(sinSum, cosSum);
  const transform = { reflectY, rotation };
  let score = 0;
  for (const observation of observations) {
    const point = transformPoint(
      observation.localX,
      observation.localY,
      transform,
    );
    const localLength = Math.hypot(point.x, point.y);
    const anchorLength = Math.hypot(observation.anchorX, observation.anchorY);
    if (localLength < 1e-9 || anchorLength < 1e-9) continue;
    score +=
      ((point.x * observation.anchorX + point.y * observation.anchorY) /
        (localLength * anchorLength)) *
      observation.weight;
  }

  return { score, totalWeight, transform };
}

function graphLinkNodeId(value: HierarchicalLayoutGraphLink["source"]) {
  return typeof value === "string" ? value : value.id;
}

function childLocalIdForModule(path: string[], modulePath: string[]) {
  if (path.length <= modulePath.length) return null;
  for (let index = 0; index < modulePath.length; index += 1) {
    if (path[index] !== modulePath[index]) return null;
  }
  return path[modulePath.length] ?? null;
}

function anchorPositionForPath<T extends HierarchicalLayoutNode>(
  path: string[],
  currentModule: HierarchyModule<T>,
  modules: Map<string, HierarchyModule<T>>,
) {
  const modulePath = path.slice(0, -1);
  for (let depth = modulePath.length; depth >= 0; depth -= 1) {
    const key = modulePath.slice(0, depth).join(":");
    if (key === currentModule.key) continue;
    if (isDescendantModuleKey(key, currentModule.key)) continue;
    const module = modules.get(key);
    if (module && Number.isFinite(module.x) && Number.isFinite(module.y)) {
      return { x: module.x, y: module.y };
    }
  }
  return null;
}

function isDescendantModuleKey(key: string, parentKey: string) {
  return parentKey !== "" && key.startsWith(`${parentKey}:`);
}

function linkWeight(link: HierarchicalLayoutGraphLink) {
  const flow = Number(link.flow);
  if (Number.isFinite(flow) && flow > 0) return flow;
  const weight = Number(link.weight);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}

function transformPoint(x: number, y: number, transform: AnchoredTransform) {
  const reflectedY = transform.reflectY ? -y : y;
  if (transform.rotation === 0) return { x, y: reflectedY };
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: x * cos - reflectedY * sin,
    y: x * sin + reflectedY * cos,
  };
}

function buildLocalLinks<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  items: HierarchyItem<T>[],
  ftree: FtreeLayout,
) {
  const section = ftree.sections.get(module.key);
  if (!section) return [];
  const itemsByLocalId = new Map(items.map((item) => [item.localId, item]));
  const maxWeight = Math.max(
    ...section.links.map((link) => link.weight),
    1e-12,
  );
  const linksByPair = new Map<string, LocalLink>();

  for (const link of section.links) {
    const source = itemsByLocalId.get(link.source);
    const target = itemsByLocalId.get(link.target);
    if (!source || !target || source.id === target.id) continue;
    const [first, second] =
      source.id < target.id ? [source, target] : [target, source];
    const key = `${first.id}--${second.id}`;
    const existing = linksByPair.get(key);
    const weight = link.weight / maxWeight;
    if (existing) {
      existing.weight += weight;
    } else {
      linksByPair.set(key, {
        source: first as HierarchyItem<HierarchicalLayoutNode>,
        target: second as HierarchyItem<HierarchicalLayoutNode>,
        weight,
      });
    }
  }

  return [...linksByPair.values()];
}

function initialLocalPosition(
  index: number,
  count: number,
  parentRadius: number,
) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = Math.max(32, parentRadius * 0.42 * Math.sqrt(index / count));
  const angle = index * goldenAngle;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  } satisfies SimulationNodeDatum;
}

function ticksFor<T extends HierarchicalLayoutNode>(
  module: HierarchyModule<T>,
  items: HierarchyItem<T>[],
) {
  if (module.key === "") return 300;
  if (items.every((item) => item.node)) return 120;
  return 180;
}

function scaleFor<T extends HierarchicalLayoutNode>(
  items: HierarchyItem<T>[],
  parentRadius: number,
) {
  let extent = 1;
  for (const item of items) {
    extent = Math.max(
      extent,
      Math.hypot(item.x ?? 0, item.y ?? 0) + Math.max(1, item.radius),
    );
  }
  return Math.min(2.4, Math.max(0.75, (parentRadius * 0.76) / extent));
}

function placeItem<T extends HierarchicalLayoutNode>(
  item: HierarchyItem<T>,
  x: number,
  y: number,
) {
  if (item.module) {
    item.module.x = x;
    item.module.y = y;
  }
  if (item.node) {
    item.node.x = x;
    item.node.y = y;
  }
}
