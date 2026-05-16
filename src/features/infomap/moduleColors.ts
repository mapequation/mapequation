export type ModuleId = string;
export type ModuleMap = Map<number, ModuleId>;

export type ModuleColorModel = {
  colorByModule: Map<ModuleId, string>;
};

type ColorNode = {
  key: string;
  moduleId: ModuleId;
  level: number;
  children: Set<string>;
  l: number;
  c: number;
  h: number;
};

type GraphNodeRef = {
  id: string;
  path?: number[];
};

const fallbackPalette = [
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

export function fallbackModuleColor(moduleId: ModuleId) {
  const index = stableHash(moduleId);
  return fallbackPalette[index % fallbackPalette.length];
}

export function moduleColorFromModel(
  colors: Map<ModuleId, string>,
  moduleId: ModuleId,
) {
  return colors.get(moduleId) ?? fallbackModuleColor(moduleId);
}

export function buildHierarchicalModuleColors({
  activeLevel,
  levelModules,
  modules,
  nodes,
}: {
  activeLevel: number;
  levelModules?: Map<number, ModuleMap>;
  modules: ModuleMap;
  nodes: GraphNodeRef[];
}): ModuleColorModel {
  const colorNodes = new Map<string, ColorNode>();
  const moduleKeys = new Map<ModuleId, Set<string>>();

  const ensureNode = (key: string, moduleId: ModuleId, level: number) => {
    let node = colorNodes.get(key);
    if (!node) {
      node = { key, moduleId, level, children: new Set(), l: 0, c: 0, h: 0 };
      colorNodes.set(key, node);
    }
    let keys = moduleKeys.get(moduleId);
    if (!keys) {
      keys = new Set();
      moduleKeys.set(moduleId, keys);
    }
    keys.add(key);
    return node;
  };

  for (const node of nodes) {
    const nodeId = Number(node.id);
    const explicitPath = modulePathFromNodePath(node.path, activeLevel);
    const pathParts: string[] = explicitPath.map(String);
    let parentKey: string | null = null;

    if (pathParts.length > 0) {
      for (let level = 1; level <= pathParts.length; level++) {
        const moduleId = pathParts[level - 1];
        const key = pathParts.slice(0, level).join("/");
        ensureNode(key, moduleId, level);
        if (parentKey) colorNodes.get(parentKey)?.children.add(key);
        parentKey = key;
      }
      const activeModuleId = modules.get(nodeId);
      if (activeModuleId !== undefined) {
        const key = pathParts.join("/");
        ensureNode(key, activeModuleId, pathParts.length);
      }
      continue;
    }

    let fallbackPathParts: string[] = [];
    for (let level = 1; level <= activeLevel; level++) {
      const moduleId = levelModules?.get(level)?.get(nodeId);
      if (moduleId === undefined) continue;
      fallbackPathParts = modulePathFromModuleId(moduleId).map(String);
    }
    if (fallbackPathParts.length === 0) {
      fallbackPathParts = modulePathFromModuleId(modules.get(nodeId)).map(
        String,
      );
    }

    for (let level = 1; level <= fallbackPathParts.length; level++) {
      const moduleId = fallbackPathParts[level - 1];
      const key = fallbackPathParts.slice(0, level).join("/");
      ensureNode(key, moduleId, level);
      if (parentKey) colorNodes.get(parentKey)?.children.add(key);
      parentKey = key;
    }
    const activeModuleId = modules.get(nodeId);
    if (activeModuleId !== undefined && fallbackPathParts.length > 0) {
      ensureNode(
        fallbackPathParts.join("/"),
        activeModuleId,
        fallbackPathParts.length,
      );
    }
  }

  const roots = [...colorNodes.values()]
    .filter((node) => node.level === 1)
    .sort(compareColorNodes);

  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    root.h = distinctHue(i, roots.length);
    root.l = 0.68;
    root.c = 0.13;
    assignChildColors(root, colorNodes);
  }

  const colorByModule = new Map<ModuleId, string>();
  for (const [moduleId, keys] of moduleKeys) {
    const bestNode = [...keys]
      .map((key) => colorNodes.get(key))
      .filter((node): node is ColorNode => Boolean(node))
      .sort((a, b) => b.level - a.level || compareColorNodes(a, b))[0];
    colorByModule.set(
      moduleId,
      bestNode
        ? oklchToHex(bestNode.l, bestNode.c, bestNode.h)
        : fallbackModuleColor(moduleId),
    );
  }

  return { colorByModule };
}

export function modulePathFromNodePath(
  nodePath: number[] | undefined,
  activeLevel: number,
): ModuleId[] {
  if (!nodePath || nodePath.length < 2) return [];
  return nodePath
    .slice(0, Math.min(activeLevel, nodePath.length - 1))
    .map(String);
}

export function modulePathFromModuleId(
  moduleId: ModuleId | undefined,
): ModuleId[] {
  if (moduleId === undefined) return [];
  if (moduleId.includes(":")) {
    return moduleId.split(":").filter(Boolean);
  }
  return [moduleId];
}

function assignChildColors(
  parent: ColorNode,
  colorNodes: Map<string, ColorNode>,
) {
  const children = [...parent.children]
    .map((key) => colorNodes.get(key))
    .filter((node): node is ColorNode => Boolean(node))
    .sort(compareColorNodes);
  if (children.length === 0) return;

  const spread = parent.level === 1 ? 62 : Math.max(28, 44 - parent.level * 5);
  const offsets = siblingHueOffsets(children.length, spread);
  const lightnessOffsets = siblingLightnessOffsets(children.length);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.h = normalizeHue(parent.h + offsets[i]);
    child.l = clamp(parent.l + lightnessOffsets[i], 0.56, 0.78);
    child.c = clamp(parent.c + (i % 2 === 0 ? 0.026 : -0.01), 0.085, 0.17);
    assignChildColors(child, colorNodes);
  }
}

function siblingHueOffsets(count: number, spread: number) {
  if (count <= 1) return [0];
  const step = spread / Math.max(1, count - 1);
  const linear = Array.from(
    { length: count },
    (_, index) => -spread / 2 + step * index,
  );
  return linear.sort((a, b) => Math.abs(b) - Math.abs(a) || a - b);
}

function siblingLightnessOffsets(count: number) {
  const pattern = [0, -0.085, 0.085, -0.045, 0.045, -0.12, 0.12];
  return Array.from(
    { length: count },
    (_, index) => pattern[index % pattern.length],
  );
}

function distinctHue(index: number, count: number) {
  if (count <= 1) return 210;
  return normalizeHue(25 + (index * 360) / count);
}

function compareColorNodes(a: ColorNode, b: ColorNode) {
  return a.key.localeCompare(b.key, undefined, { numeric: true });
}

function stableHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function normalizeHue(hue: number) {
  return ((hue % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function oklchToHex(l: number, c: number, h: number) {
  const hue = (h * Math.PI) / 180;
  const a = Math.cos(hue) * c;
  const b = Math.sin(hue) * c;

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = lPrime * lPrime * lPrime;
  const m3 = mPrime * mPrime * mPrime;
  const s3 = sPrime * sPrime * sPrime;

  const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return `#${toSrgbByte(red)}${toSrgbByte(green)}${toSrgbByte(blue)}`;
}

function toSrgbByte(linear: number) {
  const value =
    linear <= 0.0031308
      ? 12.92 * linear
      : 1.055 * Math.max(0, linear) ** (1 / 2.4) - 0.055;
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}
