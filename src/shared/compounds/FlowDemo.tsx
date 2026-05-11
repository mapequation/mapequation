import { Box, chakra } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type FlowDemoLink,
  flowDemoLinks,
  flowDemoNodes,
  flowDemoScheme,
} from "../../data/flow-demo-data";

type HuffmanItem = { id: number; flow: number };

function huffmanCodes(items: HuffmanItem[]): Map<number, string> {
  if (items.length === 0) return new Map();
  if (items.length === 1) return new Map([[items[0].id, "0"]]);

  type N = {
    item?: HuffmanItem;
    flow: number;
    left?: N;
    right?: N;
  };
  const nodes: N[] = items.map((item) => ({ item, flow: item.flow }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.flow - b.flow);
    const left = nodes.shift() as N;
    const right = nodes.shift() as N;
    nodes.push({ flow: left.flow + right.flow, left, right });
  }

  const codes = new Map<number, string>();
  const visit = (node: N, prefix: string) => {
    if (node.item && !node.left && !node.right) {
      codes.set(node.item.id, prefix);
      return;
    }
    if (node.left) visit(node.left, `${prefix}0`);
    if (node.right) visit(node.right, `${prefix}1`);
  };
  visit(nodes[0], "");
  return codes;
}

const moduleExitMarker = -1;

const tapeScheme = ["#A8753F", "#737B4C", "#4F6F94", "#8A2F25"];

type WalkerNodePos = { px: number; py: number };

const Walker = function Walker({
  target,
  teleported,
  omega,
  zeta,
  maxAccel,
  maxDecel,
  maxSpeed,
  tailScale,
  paused,
}: {
  target: WalkerNodePos;
  teleported: boolean;
  omega: number;
  zeta: number;
  maxAccel: number;
  maxDecel: number;
  maxSpeed: number;
  tailScale: number;
  paused: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const pos = useRef({ x: target.px, y: target.py });
  const vel = useRef({ x: 0, y: 0 });
  const targetRef = useRef(target);

  useLayoutEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let last: number | null = null;
    const stiffness = omega * omega;
    const damping = 2 * zeta * omega;
    const animate = (t: number) => {
      if (last === null) last = t;
      const dt = Math.min((t - last) / 1000, 0.033);
      last = t;

      const tx = targetRef.current.px;
      const ty = targetRef.current.py;
      let ax = stiffness * (tx - pos.current.x) - damping * vel.current.x;
      let ay = stiffness * (ty - pos.current.y) - damping * vel.current.y;
      const accelMag = Math.hypot(ax, ay);
      const speedMag0 = Math.hypot(vel.current.x, vel.current.y);
      const isBraking =
        speedMag0 > 50 && ax * vel.current.x + ay * vel.current.y < 0;
      const cap = isBraking ? maxDecel : maxAccel;
      if (accelMag > cap) {
        const k = cap / accelMag;
        ax *= k;
        ay *= k;
      }
      vel.current.x += ax * dt;
      vel.current.y += ay * dt;
      const speedMag = Math.hypot(vel.current.x, vel.current.y);
      if (speedMag > maxSpeed) {
        const k = maxSpeed / speedMag;
        vel.current.x *= k;
        vel.current.y *= k;
      }
      pos.current.x += vel.current.x * dt;
      pos.current.y += vel.current.y * dt;

      if (pathRef.current) {
        pathRef.current.setAttribute(
          "d",
          springWalkerPath(
            pos.current.x,
            pos.current.y,
            vel.current.x,
            vel.current.y,
            targetRef.current.px,
            targetRef.current.py,
            walkerRadius,
            tailScale,
          ),
        );
      }

      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [paused, omega, zeta, maxAccel, maxDecel, maxSpeed, tailScale]);

  const initialD = springWalkerPath(
    pos.current.x,
    pos.current.y,
    0,
    0,
    target.px,
    target.py,
    walkerRadius,
    tailScale,
  );

  return (
    <path
      ref={pathRef}
      d={initialD}
      fill="#393939"
      opacity={teleported ? 0.28 : 0.86}
      stroke="#FFFFFF"
      strokeWidth={2}
    />
  );
};

type WalkState = {
  currentId: number;
  previousId: number | null;
  teleported: boolean;
};

const viewBox = {
  width: 800,
  height: 800,
  minX: 50,
  maxX: 650,
  minY: 50,
  maxY: 700,
};

const baseWalkerInterval = 400;
const _baseWalkerDuration = 338;
const googleTeleportRate = 0.15;
const pageRankIterations = 100;
const minNodeRadius = 15;
const maxNodeRadius = 36;
const nodeLinkGap = 7;
const walkerRadius = 13;

const scale = (
  value: number,
  domain: [number, number],
  range: [number, number],
) => {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;

  return (
    rangeMin +
    ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin)
  );
};

const chooseWeighted = (links: FlowDemoLink[]) => {
  const totalWeight = links.reduce((total, link) => total + link.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const link of links) {
    threshold -= link.weight;
    if (threshold <= 0) return link;
  }

  return links[links.length - 1];
};

const walkerPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  length: number,
) => {
  const dx = x2 - x1 || 1e-7;
  const dy = y2 - y1 || 1e-7;
  const l = Math.sqrt(dx * dx + dy * dy);
  const dir = { x: dx / l, y: dy / l };
  const xa = x2 + dir.y * r;
  const ya = y2 - dir.x * r;
  const xb = x2 - dir.y * r;
  const yb = y2 + dir.x * r;
  const xDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  const tailLength = r + Math.sin(length) * (l - r);

  return `M ${xa} ${ya}
          A ${r} ${r} 0 0 1 ${xb} ${yb}
          A ${tailLength} ${r} ${xDeg} 0 1 ${xa} ${ya}`;
};

const springWalkerPath = (
  x: number,
  y: number,
  vx: number,
  vy: number,
  tx: number,
  ty: number,
  r: number,
  tailScale: number,
) => {
  const speed = Math.hypot(vx, vy);
  if (speed < 5) {
    return `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  const dx = vx / speed;
  const dy = vy / speed;
  const distToTarget = Math.hypot(tx - x, ty - y);
  const tailLen = Math.max(
    r,
    Math.min(r + tailScale * speed ** 1.3, r * 20, distToTarget * 0.35),
  );
  const fromX = x - dx * tailLen;
  const fromY = y - dy * tailLen;
  return walkerPath(fromX, fromY, x, y, r, Math.PI / 2);
};

const clippedLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sourceClipRadius: number,
  targetClipRadius: number,
) => {
  const dx = x2 - x1 || 1e-7;
  const dy = y2 - y1 || 1e-7;
  const length = Math.sqrt(dx * dx + dy * dy);
  const dir = { x: dx / length, y: dy / length };

  return {
    x1: x1 + dir.x * sourceClipRadius,
    y1: y1 + dir.y * sourceClipRadius,
    x2: x2 - dir.x * targetClipRadius,
    y2: y2 - dir.y * targetClipRadius,
  };
};

export default function FlowDemo({
  showCodes = false,
}: {
  showCodes?: boolean;
} = {}) {
  const walkerInterval = showCodes
    ? baseWalkerInterval
    : baseWalkerInterval * 1.5;
  const omega = showCodes ? 14 : 9;
  const zeta = 0.85;
  const maxAccel = showCodes ? 4000 : 1800;
  const maxDecel = showCodes ? 12000 : 6000;
  const maxSpeed = showCodes ? 1600 : 1100;
  const tailScale = 0.012;
  const focusDelay = showCodes ? 150 : 250;
  const filterTransitionMs = showCodes ? 70 : 100;
  const graph = useMemo(() => {
    const xValues = flowDemoNodes.map((node) => node.x);
    const yValues = flowDemoNodes.map((node) => node.y);
    const xDomain: [number, number] = [
      Math.min(...xValues),
      Math.max(...xValues),
    ];
    const yDomain: [number, number] = [
      Math.min(...yValues),
      Math.max(...yValues),
    ];
    const adjacency = new Map<number, FlowDemoLink[]>();

    for (const link of flowDemoLinks) {
      adjacency.set(link.source, [...(adjacency.get(link.source) ?? []), link]);
      adjacency.set(link.target, [
        ...(adjacency.get(link.target) ?? []),
        { source: link.target, target: link.source, weight: link.weight },
      ]);
    }

    const nodeIds = flowDemoNodes.map((node) => node.id);
    let visitRatesById = new Map(
      nodeIds.map((nodeId) => [nodeId, 1 / nodeIds.length]),
    );

    for (let i = 0; i < pageRankIterations; i++) {
      const nextVisitRatesById = new Map(
        nodeIds.map((nodeId) => [nodeId, googleTeleportRate / nodeIds.length]),
      );

      for (const nodeId of nodeIds) {
        const links = adjacency.get(nodeId) ?? [];
        const linkRate =
          (visitRatesById.get(nodeId) ?? 0) * (1 - googleTeleportRate);

        if (links.length === 0) {
          for (const targetId of nodeIds) {
            nextVisitRatesById.set(
              targetId,
              (nextVisitRatesById.get(targetId) ?? 0) +
                linkRate / nodeIds.length,
            );
          }
          continue;
        }

        const totalWeight = links.reduce(
          (total, link) => total + link.weight,
          0,
        );

        for (const link of links) {
          nextVisitRatesById.set(
            link.target,
            (nextVisitRatesById.get(link.target) ?? 0) +
              linkRate * (link.weight / totalWeight),
          );
        }
      }

      visitRatesById = nextVisitRatesById;
    }

    const visitRates = nodeIds.map((nodeId) => visitRatesById.get(nodeId) ?? 0);
    const rateDomain: [number, number] = [
      Math.min(...visitRates),
      Math.max(...visitRates),
    ];
    const areaRange: [number, number] = [
      minNodeRadius ** 2,
      maxNodeRadius ** 2,
    ];

    const nodes = flowDemoNodes.map((node) => ({
      ...node,
      px: scale(node.x, xDomain, [viewBox.minX, viewBox.maxX]),
      py: scale(node.y, yDomain, [viewBox.minY, viewBox.maxY]),
      radius: Math.sqrt(
        scale(visitRatesById.get(node.id) ?? 0, rateDomain, areaRange),
      ),
    }));
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const links = flowDemoLinks.map((link) => ({
      ...link,
      sourceNode: nodesById.get(link.source),
      targetNode: nodesById.get(link.target),
    }));

    return { nodes, nodesById, links, adjacency, visitRatesById };
  }, []);

  const codes = useMemo(() => {
    const moduleNodes = new Map<number, typeof graph.nodes>();
    for (const node of graph.nodes) {
      const arr = moduleNodes.get(node.module) ?? [];
      arr.push(node);
      moduleNodes.set(node.module, arr);
    }

    const moduleExitFlow = new Map<number, number>();
    for (const [moduleId, nodes] of moduleNodes) {
      let exitFlow = 0;
      for (const node of nodes) {
        const flow = graph.visitRatesById.get(node.id) ?? 0;
        const links = graph.adjacency.get(node.id) ?? [];
        const totalWeight = links.reduce((sum, l) => sum + l.weight, 0);
        if (totalWeight === 0) continue;
        for (const link of links) {
          const targetMod = graph.nodesById.get(link.target)?.module;
          if (targetMod !== undefined && targetMod !== moduleId) {
            exitFlow += flow * (link.weight / totalWeight);
          }
        }
      }
      moduleExitFlow.set(moduleId, exitFlow);
    }

    const nodeCode = new Map<number, string>();
    const exitCode = new Map<number, string>();
    for (const [moduleId, nodes] of moduleNodes) {
      const items: HuffmanItem[] = [
        { id: moduleExitMarker, flow: moduleExitFlow.get(moduleId) ?? 1e-9 },
        ...nodes.map((n) => ({
          id: n.id,
          flow: graph.visitRatesById.get(n.id) ?? 1e-9,
        })),
      ];
      const map = huffmanCodes(items);
      for (const [id, code] of map) {
        if (id === moduleExitMarker) exitCode.set(moduleId, code);
        else nodeCode.set(id, code);
      }
    }

    const enterItems: HuffmanItem[] = [...moduleNodes.keys()].map(
      (moduleId) => ({
        id: moduleId,
        flow: moduleExitFlow.get(moduleId) ?? 1e-9,
      }),
    );
    const enterCode = huffmanCodes(enterItems);

    const oneLevelItems: HuffmanItem[] = graph.nodes.map((node) => ({
      id: node.id,
      flow: graph.visitRatesById.get(node.id) ?? 1e-9,
    }));
    const oneLevelCode = huffmanCodes(oneLevelItems);

    return { nodeCode, exitCode, enterCode, oneLevelCode };
  }, [graph]);

  type CodeSegment = {
    key: string;
    code: string;
    type: "node" | "exit" | "enter";
    module: number;
  };
  const [codeStream, setCodeStream] = useState<CodeSegment[]>([]);
  const [oneLevelStream, setOneLevelStream] = useState<CodeSegment[]>([]);
  const [walk, setWalk] = useState<WalkState>({
    currentId: graph.nodes[0].id,
    previousId: null,
    teleported: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const intervalId = window.setInterval(() => {
      setWalk(({ currentId }) => {
        const links = graph.adjacency.get(currentId) ?? [];
        const shouldTeleport =
          links.length === 0 || Math.random() < googleTeleportRate;

        if (shouldTeleport) {
          const targets = graph.nodes.filter((node) => node.id !== currentId);
          const target = targets[Math.floor(Math.random() * targets.length)];

          return {
            currentId: target.id,
            previousId: currentId,
            teleported: true,
          };
        }

        const nextLink = chooseWeighted(links);

        return {
          currentId: nextLink.target,
          previousId: currentId,
          teleported: false,
        };
      });
    }, walkerInterval);

    return () => window.clearInterval(intervalId);
  }, [graph, isVisible]);

  useEffect(() => {
    if (!showCodes || walk.previousId === null) return;

    const previous = graph.nodesById.get(walk.previousId);
    const current = graph.nodesById.get(walk.currentId);
    if (!previous || !current) return;

    const stamp = `${walk.previousId}->${walk.currentId}-${Date.now()}`;
    const segments: CodeSegment[] = [];
    if (walk.teleported) {
      const enter = codes.enterCode.get(current.module);
      if (enter)
        segments.push({
          key: `${stamp}-tp-enter`,
          code: enter,
          type: "enter",
          module: current.module,
        });
    } else if (previous.module !== current.module) {
      const exit = codes.exitCode.get(previous.module);
      const enter = codes.enterCode.get(current.module);
      if (exit)
        segments.push({
          key: `${stamp}-exit`,
          code: exit,
          type: "exit",
          module: previous.module,
        });
      if (enter)
        segments.push({
          key: `${stamp}-enter`,
          code: enter,
          type: "enter",
          module: current.module,
        });
    }
    const node = codes.nodeCode.get(walk.currentId);
    if (node)
      segments.push({
        key: `${stamp}-node`,
        code: node,
        type: "node",
        module: current.module,
      });
    if (segments.length === 0) return;

    setCodeStream((stream) => [...stream, ...segments].slice(-500));

    const oneLevel = codes.oneLevelCode.get(walk.currentId);
    if (oneLevel) {
      setOneLevelStream((stream) =>
        [
          ...stream,
          {
            key: `${stamp}-1L`,
            code: oneLevel,
            type: "node" as const,
            module: -1,
          },
        ].slice(-500),
      );
    }
  }, [walk, showCodes, codes, graph]);

  const currentNode = graph.nodesById.get(walk.currentId) ?? graph.nodes[0];

  const [visitingNodeId, setVisitingNodeId] = useState(walk.currentId);
  useEffect(() => {
    const id = window.setTimeout(
      () => setVisitingNodeId(walk.currentId),
      focusDelay,
    );
    return () => window.clearTimeout(id);
  }, [walk.currentId, focusDelay]);

  const topPadding = maxNodeRadius + (showCodes ? 32 : 0);
  const sidePadding = maxNodeRadius;
  const bottomPadding = maxNodeRadius;
  const svgWidth = viewBox.maxX - viewBox.minX + 2 * sidePadding;
  const svgHeight = viewBox.maxY - viewBox.minY + topPadding + bottomPadding;
  const svgViewBox = `${viewBox.minX - sidePadding} ${viewBox.minY - topPadding} ${svgWidth} ${svgHeight}`;
  const svgAspect = `${svgWidth} / ${svgHeight}`;

  const linksLayer = useMemo(
    () => (
      <g opacity="0.72">
        {graph.links.map(
          ({ source, target, weight, sourceNode, targetNode }) => {
            if (!sourceNode || !targetNode) return null;
            const line = clippedLine(
              sourceNode.px,
              sourceNode.py,
              targetNode.px,
              targetNode.py,
              sourceNode.radius + nodeLinkGap,
              targetNode.radius + nodeLinkGap,
            );
            return (
              <line
                key={`${source}-${target}`}
                {...line}
                stroke="#6F6A62"
                strokeLinecap="round"
                strokeWidth={1 + weight * 1.5}
              />
            );
          },
        )}
      </g>
    ),
    [graph],
  );

  const circlesByMode = useMemo(() => {
    const make = (mode: "plain" | "modules") =>
      graph.nodes.map((node) => ({
        node,
        baseFill: mode === "modules" ? flowDemoScheme[node.module] : "#D8D6D2",
      }));
    return { plain: make("plain"), modules: make("modules") };
  }, [graph]);

  const codeLayerByMode = useMemo(() => {
    if (!showCodes) return { plain: null, modules: null };
    const make = (mode: "plain" | "modules") => (
      <>
        {graph.nodes.map((node) => {
          const code =
            mode === "modules"
              ? codes.nodeCode.get(node.id)
              : codes.oneLevelCode.get(node.id);
          if (!code) return null;
          return (
            <text
              key={`code-${mode}-${node.id}`}
              x={node.px}
              y={node.py - node.radius - 8}
              fontSize={22}
              fontFamily="monospace"
              textAnchor="middle"
              fill="#3F3F3F"
              fontWeight={700}
              stroke="#FFFFFF"
              strokeWidth={4}
              paintOrder="stroke fill"
              strokeLinejoin="round"
              style={{ pointerEvents: "none" }}
            >
              {code}
            </text>
          );
        })}
      </>
    );
    return { plain: make("plain"), modules: make("modules") };
  }, [graph, codes, showCodes]);

  const renderNetwork = (mode: "plain" | "modules") => (
    <svg
      aria-label="Random walker moving through a network"
      role="img"
      viewBox={svgViewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        aspectRatio: svgAspect,
      }}
    >
      {linksLayer}

      {circlesByMode[mode].map(({ node, baseFill }) => (
        <circle
          key={node.id}
          cx={node.px}
          cy={node.py}
          r={node.radius}
          fill={baseFill}
          stroke="transparent"
          strokeWidth={nodeLinkGap * 2}
          style={{
            filter:
              node.id === visitingNodeId
                ? "brightness(0.86) saturate(0.88)"
                : "brightness(1)",
            transition: `filter ${filterTransitionMs}ms ease-out`,
          }}
        />
      ))}

      {codeLayerByMode[mode]}

      <Walker
        target={{ px: currentNode.px, py: currentNode.py }}
        teleported={walk.teleported}
        omega={omega}
        zeta={zeta}
        maxAccel={maxAccel}
        maxDecel={maxDecel}
        maxSpeed={maxSpeed}
        tailScale={tailScale}
        paused={!isVisible}
      />
    </svg>
  );

  const lastSteps = (stream: CodeSegment[], n: number) => {
    let nodeSeen = 0;
    let cut = 0;
    for (let i = stream.length - 1; i >= 0; i--) {
      if (stream[i].type === "node") {
        nodeSeen++;
        if (nodeSeen === n) {
          cut = i;
          break;
        }
      }
    }
    return stream.slice(cut);
  };

  const renderTapeRow = (
    stream: CodeSegment[],
    colorize: (seg: CodeSegment) => string,
    label: string,
  ) => {
    const visible = lastSteps(stream, 12);
    const visibleBits = visible.reduce((s, seg) => s + seg.code.length, 0);
    const visibleSteps = visible.filter((s) => s.type === "node").length;
    const avg = visibleSteps > 0 ? visibleBits / visibleSteps : 0;
    return (
      <Box
        fontVariantNumeric="tabular-nums"
        display={{ base: "block", md: "grid" }}
        gridTemplateColumns={{ md: "minmax(0, 1fr) auto" }}
        alignItems={{ md: "baseline" }}
        gap={{ md: 4 }}
      >
        <Box
          fontFamily="monospace"
          fontSize={{ base: "xs", md: "sm" }}
          lineHeight={1.7}
          minH="1.8em"
          color="gray.700"
          textAlign="left"
        >
          {visible.length === 0 ? (
            <chakra.span color="gray.400">…</chakra.span>
          ) : (
            (() => {
              let lastStepStart = visible.length - 1;
              while (
                lastStepStart > 0 &&
                visible[lastStepStart - 1].type !== "node"
              ) {
                lastStepStart--;
              }
              return visible.flatMap((seg, i) => {
                const inLastStep = i >= lastStepStart;
                return [
                  <chakra.span
                    key={seg.key}
                    color={colorize(seg)}
                    fontWeight={inLastStep ? 700 : 400}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {seg.code}
                  </chakra.span>,
                  <wbr key={`${seg.key}-wbr`} />,
                ];
              });
            })()
          )}
        </Box>
        <Box
          fontSize="sm"
          color="gray.700"
          fontWeight={600}
          textAlign="right"
          mt={{ base: 1, md: 0 }}
          whiteSpace="nowrap"
        >
          {label} = {avg.toFixed(2)} bits
        </Box>
      </Box>
    );
  };

  if (showCodes) {
    return (
      <Box
        ref={containerRef}
        as="figure"
        m={0}
        role="img"
        aria-label="Compression by modules"
      >
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={{ base: 6, md: 14 }}
          alignItems="start"
        >
          {renderNetwork("plain")}
          {renderNetwork("modules")}
        </Box>
        <Box mt={5}>
          {renderTapeRow(oneLevelStream, () => "gray.700", "L₁")}
          <Box mt={2}>
            {renderTapeRow(
              codeStream,
              (seg) => tapeScheme[seg.module] ?? "gray.700",
              "L",
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      aria-label="Random walker moving through a four-module network"
      as="figure"
      maxW="350px"
      mx="auto"
      role="img"
    >
      {renderNetwork("modules")}
    </Box>
  );
}
