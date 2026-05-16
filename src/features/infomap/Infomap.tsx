import {
  Box,
  Button,
  ButtonGroup,
  Field,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Kbd,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import Infomap from "@mapequation/infomap";
import localforage from "localforage";
import {
  type FC,
  type PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LuCheck,
  LuChevronDown,
  LuDownload,
  LuFiles,
  LuPanelLeftOpen,
  LuPanelRightOpen,
  LuPlay,
  LuX,
} from "react-icons/lu";
import useStore from "../../state";
import { type ModuleFlowMap, parseCluModules } from "../../state/output";
import {
  argsRequestOutputFormat,
  DEFAULT_INFOMAP_ARGS,
  ensurePreviewOutputs,
} from "../../state/parameters";
import type { InputFile, InputName, OutputKey } from "../../state/types";
import ExampleNetworksList from "./ExamplesMenu";
import InputParameters from "./InputParameters";
import InputTextarea from "./InputTextarea";
import LoadButton from "./LoadButton";
import {
  buildHierarchicalModuleColors,
  type ModuleId,
  type ModuleMap,
  moduleColorFromModel,
} from "./moduleColors";
import NetworkPreview from "./NetworkPreview";
import Parameters from "./Parameters";
import {
  errorGraph,
  type PreviewGraph,
  parseInfomapPreviewResult,
} from "./parseInfomapPreview";

localforage.config({ name: "infomap" });

// Chakra v3's Menu compound types omit `children` — runtime accepts it.
const MenuTrigger = Menu.Trigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
>;
const MenuPositioner = Menu.Positioner as FC<PropsWithChildren>;
const MenuContent = Menu.Content as FC<PropsWithChildren>;
const MenuItem = Menu.Item as FC<
  PropsWithChildren<{ onClick?: () => void; value: string }>
>;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const inputTabs = [
  { key: "network", label: "Network" },
  { key: "cluster data", label: "Clusters" },
  { key: "meta data", label: "Metadata" },
] satisfies { key: InputName; label: string }[];

const inputPlaceholders = {
  network: "Paste network data here…",
  "cluster data": "Paste cluster data here…",
  "meta data": "Paste metadata here…",
} satisfies Record<InputName, string>;

type EvaluationMetadata = {
  codeLength: number | null;
  codelengthSavings: number | null;
  numLevels: number | null;
};

type LastRunSummary = {
  args: string;
  completedAt: number;
  elapsedMs: number;
  networkSignature: string;
  status: "complete" | "error";
};

function parseEvaluationMetadata(content: Record<string, unknown>) {
  const json = content.json ?? content.json_states;
  if (!json) {
    return { codeLength: null, codelengthSavings: null, numLevels: null };
  }

  let parsed: unknown = json;
  if (typeof json === "string") {
    try {
      parsed = JSON.parse(json) as Record<string, unknown>;
    } catch {
      return { codeLength: null, codelengthSavings: null, numLevels: null };
    }
  }
  if (!parsed || typeof parsed !== "object") {
    return { codeLength: null, codelengthSavings: null, numLevels: null };
  }

  const source = parsed as {
    codelength?: unknown;
    numLevels?: unknown;
    relativeCodelengthSavings?: unknown;
  };
  const codeLength = Number(source.codelength);
  const codelengthSavings = Number(source.relativeCodelengthSavings);
  const numLevels = Number(source.numLevels);

  return {
    codeLength: Number.isFinite(codeLength) ? codeLength : null,
    codelengthSavings: Number.isFinite(codelengthSavings)
      ? codelengthSavings
      : null,
    numLevels: Number.isFinite(numLevels) ? numLevels : null,
  };
}

function previewNodeIdSet(previewGraph: PreviewGraph) {
  if (previewGraph.status !== "ok") return new Set<string>();
  return new Set(previewGraph.nodes.map((node) => node.id));
}

function modulesMatchPreviewNodes(
  modules: Map<number, unknown>,
  previewNodeIds: Set<string>,
) {
  if (modules.size === 0 || previewNodeIds.size === 0) return false;
  for (const id of modules.keys()) {
    if (previewNodeIds.has(String(id))) return true;
  }
  return false;
}

function textSignature(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `${value.length}:${hash}`;
}

function OutputViewer({
  ariaLabel = "Generated output",
  autoScroll = false,
  content,
  fontSize = "xs",
  isActive = true,
  onCopy,
  placeholder = "",
  variant = "default",
}: {
  ariaLabel?: string;
  autoScroll?: boolean;
  content: string;
  fontSize?: string;
  isActive?: boolean;
  onCopy: () => void;
  placeholder?: string;
  variant?: "default" | "terminal";
}) {
  const scrollContainerRef = useRef<HTMLPreElement | null>(null);
  const isTerminal = variant === "terminal";
  const selectionStyle = isTerminal
    ? { background: "#374151", color: "#f9fafb" }
    : { background: "#1d4ed8", color: "white" };

  useIsomorphicLayoutEffect(() => {
    if (!autoScroll || !isActive) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [autoScroll, content.length, isActive]);

  return (
    <Box
      aria-label={ariaLabel}
      as="pre"
      bg={isTerminal ? "#0b1020" : "gray.50"}
      borderColor={isTerminal ? "#1f2937" : "gray.300"}
      borderRadius="md"
      borderWidth="1px"
      boxShadow={isTerminal ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none"}
      color={isTerminal ? "#d1d5db" : "gray.900"}
      fontFamily="monospace"
      fontSize={fontSize}
      h="100%"
      lineHeight={1.5}
      m={0}
      minH={0}
      onCopy={onCopy}
      overflow="auto"
      p={3}
      ref={scrollContainerRef}
      role="textbox"
      tabIndex={0}
      whiteSpace="pre"
      w="100%"
      css={{
        "& *::selection": selectionStyle,
        "&::selection": selectionStyle,
      }}
    >
      {content || placeholder}
    </Box>
  );
}

function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Box flexShrink={0} mb={3}>
      <Flex align="center" gap={3} justify="space-between">
        <Heading as="h2" size="sm" mb={0}>
          {title}
        </Heading>
        {action}
      </Flex>
      {description && (
        <Text color="gray.500" fontSize="sm" mb={0} mt={1}>
          {description}
        </Text>
      )}
    </Box>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

function formatRunTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

function formatCodeLengthValue(value: number | null) {
  return value === null ? "—" : value.toFixed(3);
}

function parseTrialCount(consoleContent: string) {
  const match = consoleContent.match(/Summary after\s+(\d+)\s+trials/i);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function moduleSegments(modules: ModuleMap, moduleFlows?: ModuleFlowMap) {
  if (moduleFlows && moduleFlows.size > 0) {
    const flows = new Map<ModuleId, number>();
    for (const entries of moduleFlows.values()) {
      for (const { flow, module } of entries) {
        if (flow <= 0) continue;
        flows.set(module, (flows.get(module) ?? 0) + flow);
      }
    }
    if (flows.size > 0) {
      return [...flows].map(([moduleId, flow]) => ({ moduleId, value: flow }));
    }
  }

  const counts = new Map<ModuleId, number>();
  for (const moduleId of modules.values()) {
    counts.set(moduleId, (counts.get(moduleId) ?? 0) + 1);
  }

  return [...counts].map(([moduleId, count]) => ({ moduleId, value: count }));
}

type ModuleStripSegment = {
  isRemainder?: boolean;
  moduleId?: ModuleId;
  value: number;
};

const minColoredModuleStripShare = 0.025;

function moduleStripSegments(
  segments: { moduleId: ModuleId; value: number }[],
): ModuleStripSegment[] {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return [];

  const firstSmallIndex = segments.findIndex(
    (segment) => segment.value / total < minColoredModuleStripShare,
  );
  const coloredCount =
    firstSmallIndex === -1 ? segments.length : firstSmallIndex;
  const coloredSegments = segments.slice(0, coloredCount);
  const remainderValue = segments
    .slice(coloredCount)
    .reduce((sum, segment) => sum + segment.value, 0);

  if (remainderValue <= 0) return coloredSegments;
  return [...coloredSegments, { isRemainder: true, value: remainderValue }];
}

function InputFileInfoCard({
  hasValue,
  disabled,
  name,
  onClear,
  stats,
}: {
  hasValue: boolean;
  disabled?: boolean;
  name: string;
  onClear: () => void;
  stats: string;
}) {
  return (
    <Box
      alignItems="flex-start"
      bg="white"
      borderColor="gray.200"
      borderRadius="md"
      borderWidth="1px"
      display="flex"
      flexShrink={0}
      justifyContent={{ base: "center", md: "flex-start" }}
      mb={3}
      minH="5.875rem"
      px={{ base: 2, md: 3 }}
      py={{ base: 0, md: 3 }}
    >
      <Flex align="flex-start" justify="space-between" minW={0} w="100%">
        <Box minW={0}>
          <Text
            color="gray.500"
            fontSize="0.65rem"
            fontWeight={700}
            letterSpacing="0.08em"
            lineHeight={1}
            mb={1}
            textTransform="uppercase"
          >
            Network
          </Text>
          <HStack align="baseline" gap={1.5} minW={0}>
            <Text
              color={hasValue ? "gray.900" : "gray.500"}
              fontSize="lg"
              fontWeight={700}
              lineHeight={1.2}
              mb={0}
              truncate
            >
              {name}
            </Text>
          </HStack>
          <Text color="gray.500" fontSize="xs" lineClamp={1} mb={0} mt={1}>
            {stats}
          </Text>
          <Box aria-hidden="true" h="0.375rem" mt={1.5} />
        </Box>
        <IconButton
          aria-label="Clear network"
          disabled={disabled || !hasValue}
          flexShrink={0}
          onClick={onClear}
          size="xs"
          variant="ghost"
        >
          <LuX />
        </IconButton>
      </Flex>
    </Box>
  );
}

function InfomapStatsStrip({
  codeLength,
  codelengthSavings,
  consoleContent,
  moduleColors,
  moduleFlows,
  modules,
  nodeCount,
  numLevels,
  trialSetting,
}: {
  codeLength: number | null;
  codelengthSavings: number | null;
  consoleContent: string;
  moduleColors: Map<ModuleId, string>;
  moduleFlows?: ModuleFlowMap;
  modules: ModuleMap;
  nodeCount: number;
  numLevels: number | null;
  trialSetting: string | null;
}) {
  const segments = moduleSegments(modules, moduleFlows).sort(
    (a, b) => b.value - a.value,
  );
  const moduleCount = segments.length;
  const visibleSegments = moduleStripSegments(segments);
  const trialCount = parseTrialCount(consoleContent);

  return (
    <Grid
      borderColor="gray.200"
      borderRadius="md"
      borderWidth="1px"
      flexShrink={0}
      gap={0}
      mb={3}
      minH={{ base: "3rem", lg: "5.875rem" }}
      overflow="hidden"
      templateColumns="repeat(4, minmax(0, 1fr))"
    >
      <ResultStat
        label="Top Modules"
        value={moduleCount > 0 ? String(moduleCount) : "—"}
        unit="modules"
        detail={
          nodeCount > 0
            ? `${nodeCount.toLocaleString()} nodes`
            : "No modules yet"
        }
      >
        <HStack
          aria-hidden="true"
          gap={0.5}
          h="0.375rem"
          mt={1.5}
          visibility={visibleSegments.length > 0 ? "visible" : "hidden"}
          w="100%"
        >
          {visibleSegments.map(({ isRemainder, moduleId, value }, index) => (
            <Box
              bg={
                isRemainder || moduleId === undefined
                  ? "gray.300"
                  : moduleColorFromModel(moduleColors, moduleId)
              }
              borderRadius="full"
              flex={`${value} 1 0`}
              h="100%"
              key={isRemainder ? "remaining-modules" : `${moduleId}-${index}`}
              minW="0.375rem"
            />
          ))}
        </HStack>
      </ResultStat>
      <ResultStat
        label="Hierarchy"
        value={numLevels === null ? "—" : String(numLevels)}
        unit={numLevels === 1 ? "level" : "levels"}
        detail={
          numLevels === null
            ? "Awaiting result"
            : numLevels > 2
              ? "Multi-level"
              : "Two-level"
        }
      />
      <ResultStat
        label="Codelength"
        value={formatCodeLengthValue(codeLength)}
        unit={codeLength === null ? undefined : "bits"}
        detail={
          codelengthSavings === null
            ? "Run Infomap for savings"
            : `${new Intl.NumberFormat(undefined, {
                maximumFractionDigits: 2,
                style: "percent",
              }).format(codelengthSavings)} savings`
        }
      />
      <ResultStat
        label="Trials"
        value={trialCount === null ? (trialSetting ?? "—") : String(trialCount)}
        unit="trials"
        detail={trialCount === null ? "Current setting" : "Latest run"}
      />
    </Grid>
  );
}

function ResultStat({
  children,
  detail,
  label,
  unit,
  value,
}: {
  children?: React.ReactNode;
  detail: string;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <Box
      bg="white"
      borderRightWidth="1px"
      borderBottomWidth={0}
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      h="100%"
      justifyContent={{ base: "center", md: "flex-start" }}
      minW={0}
      px={{ base: 2, md: 3 }}
      py={{ base: 0, md: 3 }}
      _last={{ borderRightWidth: 0, borderBottomWidth: 0 }}
    >
      <HStack
        align="center"
        display={{ base: "flex", md: "none" }}
        gap={1}
        justify="center"
        minH="100%"
        minW={0}
      >
        <Text
          color="gray.900"
          fontSize="sm"
          fontVariantNumeric="tabular-nums"
          fontWeight={700}
          mb={0}
        >
          {value}
        </Text>
        {unit && (
          <Text color="gray.500" fontSize="sm" mb={0}>
            {unit}
          </Text>
        )}
      </HStack>
      <Box display={{ base: "none", md: "block" }}>
        <Text
          color="gray.500"
          fontSize="0.65rem"
          fontWeight={700}
          letterSpacing="0.08em"
          lineHeight={1}
          mb={1}
          textTransform="uppercase"
        >
          {label}
        </Text>
        <HStack align="baseline" gap={1.5} minW={0}>
          <Text
            color="gray.900"
            fontSize="lg"
            fontVariantNumeric="tabular-nums"
            fontWeight={700}
            lineHeight={1.1}
            mb={0}
          >
            {value}
          </Text>
          {unit && (
            <Text color="gray.500" fontSize="xs" mb={0}>
              {unit}
            </Text>
          )}
        </HStack>
        <Text color="gray.500" fontSize="xs" lineClamp={1} mb={0} mt={1}>
          {detail}
        </Text>
        {children}
      </Box>
    </Box>
  );
}

function RunStatus({
  changedSinceRun,
  isRunning,
  lastRun,
}: {
  changedSinceRun: boolean;
  isRunning: boolean;
  lastRun: LastRunSummary | null;
}) {
  const color = isRunning
    ? "gray.500"
    : lastRun?.status === "complete"
      ? "green.700"
      : lastRun?.status === "error"
        ? "red.700"
        : "gray.500";
  const statusText = isRunning
    ? "Running Infomap…"
    : !lastRun
      ? "Not run yet"
      : lastRun.status === "complete"
        ? `Run complete · ${formatDuration(lastRun.elapsedMs)}`
        : `Run failed · ${formatDuration(lastRun.elapsedMs)}`;
  const detailText =
    !isRunning && lastRun
      ? changedSinceRun
        ? "Inputs changed since last run"
        : `Updated ${formatRunTime(lastRun.completedAt)}`
      : "\u00a0";

  return (
    <Stack align="flex-end" gap={0.5} minH="2.25rem" justify="center">
      <Text
        color={color}
        fontSize="xs"
        fontWeight={lastRun && !isRunning ? 600 : 400}
        mb={0}
      >
        {statusText}
      </Text>
      <Text color="gray.500" fontSize="xs" mb={0}>
        {detailText}
      </Text>
    </Stack>
  );
}

export default function InfomapOnline() {
  const store = useStore();
  const [infomapOutput, setInfomapOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isInputLoading, setIsInputLoading] = useState(false);
  const [lastRun, setLastRun] = useState<LastRunSummary | null>(null);
  const outputBufferRef = useRef<string[]>([]);
  const outputFrameRef = useRef<number | null>(null);
  const runStartedAtRef = useRef(0);

  const { activeKey, setActiveKey, physicalFiles, stateFiles } = store.output;
  const { hasArgsError } = store.params;

  const [tab, setTab] = useState<"network" | "console" | "output">("network");
  const [mobilePanel, setMobilePanel] = useState<"input" | "parameters" | null>(
    null,
  );
  const [outputChangedAt, setOutputChangedAt] = useState(0);
  const [clusterChangedAt, setClusterChangedAt] = useState(0);
  const [outputNetworkSignature, setOutputNetworkSignature] = useState("");
  const pendingOutputNetworkSignatureRef = useRef("");
  const drainOutputBuffer = () => {
    const buffered = outputBufferRef.current;
    outputBufferRef.current = [];

    if (outputFrameRef.current !== null) {
      window.cancelAnimationFrame(outputFrameRef.current);
      outputFrameRef.current = null;
    }

    return buffered;
  };
  const flushOutputBuffer = () => {
    outputFrameRef.current = null;
    const buffered = outputBufferRef.current;
    if (buffered.length === 0) return;
    outputBufferRef.current = [];
    setInfomapOutput((output) => [...output, ...buffered]);
  };
  const queueInfomapOutput = (data: unknown) => {
    outputBufferRef.current.push(String(data));
    if (outputFrameRef.current !== null) return;
    outputFrameRef.current = window.requestAnimationFrame(flushOutputBuffer);
  };

  const [previewGraph, setPreviewGraph] = useState<PreviewGraph>(() =>
    errorGraph("Parsing network…"),
  );
  const [isPreviewParsing, setIsPreviewParsing] = useState(false);
  const previewRunIdRef = useRef(0);
  const previewTimeoutRef = useRef<number | null>(null);

  const [infomap] = useState(() =>
    new Infomap()
      .on("data", queueInfomapOutput)
      .on("error", (error) => {
        const infomapError = error.replace(/^Error:\s+/i, "");
        const buffered = drainOutputBuffer();
        setInfomapOutput((output) => [
          ...output,
          ...buffered,
          `Error: ${infomapError}`,
        ]);
        setIsRunning(false);
        setLastRun({
          args: storeRef.current.params.args,
          completedAt: Date.now(),
          elapsedMs: performance.now() - runStartedAtRef.current,
          networkSignature: pendingOutputNetworkSignatureRef.current,
          status: "error",
        });
        console.error(infomapError);
      })
      .on("finished", async (content) => {
        const buffered = drainOutputBuffer();
        if (buffered.length > 0) {
          setInfomapOutput((output) => [...output, ...buffered]);
        }
        setOutputNetworkSignature(pendingOutputNetworkSignatureRef.current);
        store.output.setContent(content, hiddenOutputKeysRef.current);
        setOutputChangedAt(Date.now());
        await localforage.setItem("network", {
          timestamp: Date.now(),
          name: store.network.name,
          input: store.network.value,
          ...content,
        });
        setIsRunning(false);
        setLastRun({
          args: storeRef.current.params.args,
          completedAt: Date.now(),
          elapsedMs: performance.now() - runStartedAtRef.current,
          networkSignature: pendingOutputNetworkSignatureRef.current,
          status: "complete",
        });
      }),
  );
  const hiddenOutputKeysRef = useRef<Set<OutputKey>>(new Set());

  useEffect(() => {
    const args = new URLSearchParams(window.location.search).get("args");
    const setArgs = store.params.setArgs;

    if (args) {
      setArgs(args);
    } else {
      setArgs(DEFAULT_INFOMAP_ARGS);
    }
  }, [store.params.setArgs]);

  const directedActive = Boolean(store.params.getParam("--directed").active);
  const networkValue = store.network.value;
  const networkName = store.network.name;
  useEffect(() => {
    drainOutputBuffer();
    setInfomapOutput([]);
    store.output.resetContent();
    setOutputNetworkSignature("");
    setPreviewGraph(errorGraph("Loading network…"));
    setIsPreviewParsing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkName]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
    }
    const runId = ++previewRunIdRef.current;
    let previewInfomap: Infomap | null = null;
    let previewWorkerId: number | null = null;
    const trimmed = networkValue?.trim() ?? "";
    if (!trimmed) {
      setPreviewGraph(errorGraph("Add a network to preview it here."));
      setIsPreviewParsing(false);
      return;
    }
    previewTimeoutRef.current = window.setTimeout(() => {
      previewInfomap = new Infomap();
      setIsPreviewParsing(true);
      const previewArgs = [
        "--no-infomap",
        "--output",
        "json,flow",
        "--silent",
        directedActive ? "--directed" : "",
      ]
        .filter(Boolean)
        .join(" ");
      previewInfomap
        .on("finished", (result) => {
          if (runId !== previewRunIdRef.current) {
            return;
          }
          setPreviewGraph(parseInfomapPreviewResult(result));
          setIsPreviewParsing(false);
        })
        .on("error", (message) => {
          if (runId !== previewRunIdRef.current) {
            return;
          }
          setPreviewGraph(errorGraph(message));
          setIsPreviewParsing(false);
        });
      previewWorkerId = previewInfomap.run({
        network: networkValue,
        filename: networkName || "network",
        args: previewArgs,
      });
    }, 300);

    return () => {
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewInfomap && previewWorkerId !== null) {
        void previewInfomap.terminate(previewWorkerId, 0);
      }
      if (previewRunIdRef.current === runId) {
        previewRunIdRef.current += 1;
      }
    };
  }, [networkValue, networkName, directedActive]);

  const onInputChange =
    (activeInput: InputName) =>
    ({ name, value }: InputFile) => {
      if (activeInput === "network") {
        store.setNetwork({ name, value });
      } else if (activeInput === "cluster data") {
        const param = store.params.getParam("--cluster-data");
        setClusterChangedAt(Date.now());
        if (!value) return store.params.resetFileParam(param);
        store.params.setFileParam(param, { name, value });
      } else if (activeInput === "meta data") {
        const param = store.params.getParam("--meta-data");
        if (!value) return store.params.resetFileParam(param);
        store.params.setFileParam(param, { name, value });
      }

      store.output.setDownloaded(false);
    };

  const onLoad = (activeInput: InputName) => (files: File[]) => {
    if (files.length < 1) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      onInputChange(activeInput)({ name: file.name, value });
    };

    reader.readAsText(file, "utf-8");
  };

  const canRun = !hasArgsError && !isRunning;
  const canRunRef = useRef(canRun);
  canRunRef.current = canRun;
  const runRef = useRef<() => void>(() => {});
  const storeRef = useRef(store);
  storeRef.current = store;
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
        return true;
      return target.isContentEditable;
    };

    const togglePresetParam = (name: string) => {
      storeRef.current.params.toggle(name);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        if (!canRunRef.current) return;
        event.preventDefault();
        runRef.current();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        (event.key === "k" || event.key === "K")
      ) {
        const input = document.getElementById("parameters-search");
        if (input instanceof HTMLInputElement) {
          event.preventDefault();
          input.focus();
          input.select();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      if (event.key === "2") {
        event.preventDefault();
        togglePresetParam("--two-level");
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        togglePresetParam("--directed");
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setTab("network");
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        setTab("console");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = () => {
    const args = store.params.args;
    hiddenOutputKeysRef.current = argsRequestOutputFormat(args, "ftree")
      ? new Set()
      : new Set<OutputKey>(["ftree", "ftree_states"]);
    store.output.resetContent();
    setOutputNetworkSignature("");

    setIsRunning(true);
    drainOutputBuffer();
    setInfomapOutput([]);

    try {
      pendingOutputNetworkSignatureRef.current = textSignature(
        store.infomapNetwork.content,
      );
      runStartedAtRef.current = performance.now();
      infomap.run({
        network: store.infomapNetwork.content,
        filename: store.infomapNetwork.filename,
        args: ensurePreviewOutputs(args),
        files: store.infomapFiles,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setIsRunning(false);
      drainOutputBuffer();
      setInfomapOutput([`Error: ${message}`]);
      setLastRun({
        args,
        completedAt: Date.now(),
        elapsedMs: performance.now() - runStartedAtRef.current,
        networkSignature: pendingOutputNetworkSignatureRef.current,
        status: "error",
      });
      console.error(e);
      return;
    }
  };
  runRef.current = run;

  const onCopyClusters = () => store.output.setDownloaded(true);

  const { activeInput, network, clusterData, metaData, output, params } = store;
  const [clusterEvaluation, setClusterEvaluation] =
    useState<EvaluationMetadata>({
      codeLength: null,
      codelengthSavings: null,
      numLevels: null,
    });
  const clusterModules = useMemo(
    () => parseCluModules(clusterData.value),
    [clusterData.value],
  );
  const previewNodeIds = useMemo(
    () => previewNodeIdSet(previewGraph),
    [previewGraph],
  );
  const currentNetworkSignature = useMemo(
    () => textSignature(network.value),
    [network.value],
  );
  const outputMatchesPreview =
    outputNetworkSignature === currentNetworkSignature &&
    modulesMatchPreviewNodes(output.modules, previewNodeIds);
  const clusterMatchesPreview = modulesMatchPreviewNodes(
    clusterModules,
    previewNodeIds,
  );
  const emptyPreviewModules = useMemo<ModuleMap>(() => new Map(), []);
  const outputWins =
    outputMatchesPreview &&
    (!clusterMatchesPreview || outputChangedAt >= clusterChangedAt);
  const clusterWins = clusterMatchesPreview && !outputWins;
  const previewModules = outputWins
    ? output.modules
    : clusterWins
      ? clusterModules
      : emptyPreviewModules;
  const previewCodeLength =
    outputWins && output.codeLength !== null
      ? output.codeLength
      : clusterWins && clusterEvaluation.codeLength !== null
        ? clusterEvaluation.codeLength
        : null;
  const previewCodelengthSavings =
    outputWins && output.codelengthSavings !== null
      ? output.codelengthSavings
      : clusterWins && clusterEvaluation.codelengthSavings !== null
        ? clusterEvaluation.codelengthSavings
        : null;
  const previewNumLevels =
    outputWins && output.numLevels !== null
      ? output.numLevels
      : clusterWins && clusterEvaluation.numLevels !== null
        ? clusterEvaluation.numLevels
        : null;
  const previewLevelModules = outputWins ? output.levelModules : undefined;
  const previewModuleFlows = outputWins ? output.moduleFlows : undefined;
  const previewNodePaths = outputWins ? output.nodePaths : undefined;
  const previewFtree = outputWins
    ? output.ftree_states || output.ftree
    : undefined;
  const previewModuleColors = useMemo(() => {
    if (previewGraph.status !== "ok" || previewModules.size === 0) {
      return new Map<ModuleId, string>();
    }
    return buildHierarchicalModuleColors({
      activeLevel: 1,
      levelModules: previewLevelModules,
      modules: previewModules,
      nodes: previewGraph.nodes,
    }).colorByModule;
  }, [previewGraph, previewLevelModules, previewModules]);
  const cluLevelParam = params.getParam("--clu-level");
  const numTrialsParam = params.getParam("--num-trials");
  const previewTrialSetting =
    numTrialsParam.active && numTrialsParam.value
      ? String(numTrialsParam.value)
      : "1";
  const previewSelectedLevel = cluLevelParam.active
    ? Number(cluLevelParam.value)
    : null;

  useEffect(() => {
    setClusterEvaluation({
      codeLength: null,
      codelengthSavings: null,
      numLevels: null,
    });
    if (!clusterData.value || !network.value) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const evaluator = new Infomap()
        .on("finished", (content) => {
          if (cancelled) return;
          setClusterEvaluation(
            parseEvaluationMetadata(content as Record<string, unknown>),
          );
        })
        .on("error", () => {
          if (!cancelled) {
            setClusterEvaluation({
              codeLength: null,
              codelengthSavings: null,
              numLevels: null,
            });
          }
        });

      try {
        const args = params.noInfomapArgs.replace(/-o\s+\S+/g, "-o json");
        evaluator.run({
          network: network.value,
          filename: network.name,
          args,
          files: { [clusterData.name || "clusters.clu"]: clusterData.value },
        });
      } catch {
        setClusterEvaluation({
          codeLength: null,
          codelengthSavings: null,
          numLevels: null,
        });
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    clusterData.name,
    clusterData.value,
    network.name,
    network.value,
    params.noInfomapArgs,
  ]);

  const inputOptions: Record<InputName, InputFile> = {
    network: network,
    "cluster data": clusterData,
    "meta data": metaData,
  };

  const inputAccept: Record<InputName, string[] | undefined> = {
    network: [".net", ".txt", ".edges", ".graph", ".pajek"],
    "cluster data": params.getParam("--cluster-data").accept,
    "meta data": params.getParam("--meta-data").accept,
  };

  const inputValue = inputOptions[activeInput].value;
  const hasActiveInputValue = Boolean(inputValue);
  const inputLineCount = inputValue ? inputValue.split("\n").length : 0;
  const hasNetworkValue = Boolean(network.value);
  const networkCardName = hasNetworkValue
    ? network.name || "Current network"
    : "—";
  const networkCardStats = !hasNetworkValue
    ? "No input"
    : previewGraph.status === "ok"
      ? `${previewGraph.nodes.length.toLocaleString()} nodes · ${previewGraph.links.length.toLocaleString()} links`
      : network.name
        ? "File selected · preview unavailable"
        : "No file · preview unavailable";
  const inputPreviewLineLimit = 500;
  const isLargeInput =
    inputLineCount > inputPreviewLineLimit || inputValue.length > 200_000;
  const displayInputValue = isLargeInput
    ? `${inputValue
        .split("\n")
        .slice(0, inputPreviewLineLimit)
        .join("\n")}\n…\n# ${
        inputLineCount - inputPreviewLineLimit
      } more lines hidden — input is read-only above the size threshold`
    : inputValue;
  const consoleContent = infomapOutput.join("\n");
  const changedSinceRun =
    !!lastRun &&
    (lastRun.networkSignature !== currentNetworkSignature ||
      lastRun.args !== params.args);
  const showJsonOutput = argsRequestOutputFormat(params.args, "json");
  const outputFiles = [...physicalFiles, ...stateFiles].filter(
    (file) => showJsonOutput || !file.key.startsWith("json"),
  );
  const activeOutputFile = outputFiles.find((file) => file.key === activeKey);
  const selectedOutputFile = activeOutputFile ?? outputFiles[0];
  const hasMultipleOutputFiles = outputFiles.length > 1;

  useEffect(() => {
    if (tab === "output" && outputFiles.length === 0) {
      setTab("network");
    }
  }, [outputFiles.length, tab]);

  const runShortcut =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)
      ? "⌘ + Enter"
      : "Ctrl + Enter";
  const runButton = (
    <Button
      bg="#b22222"
      color="white"
      _hover={{ bg: "#971d1d" }}
      _active={{ bg: "#7f1818" }}
      _disabled={{ bg: "gray.300", color: "gray.500" }}
      disabled={hasArgsError || isRunning}
      loading={isRunning}
      onClick={run}
      size="sm"
      title={`Run Infomap (${runShortcut})`}
    >
      <LuPlay />
      Run
    </Button>
  );
  const renderInputPanel = () => (
    <>
      <PanelHeader
        title="Input data"
        description="Paste, load, or choose an example."
      />

      <InputFileInfoCard
        disabled={isInputLoading}
        hasValue={hasNetworkValue}
        name={networkCardName}
        onClear={() => onInputChange("network")({ name: "", value: "" })}
        stats={networkCardStats}
      />

      <Box
        display="flex"
        flex="1"
        flexDirection="column"
        minH={0}
        overflow="hidden"
      >
        <HStack flexShrink={0} mb={1} gap={1} align="center" w="100%">
          <ButtonGroup
            attached
            variant="outline"
            size="sm"
            role="tablist"
            w="100%"
          >
            {inputTabs.map(({ key, label }) => {
              const hasInput = Boolean(inputOptions[key].value);
              const isActive = activeInput === key;

              return (
                <Button
                  key={key}
                  aria-selected={isActive}
                  bg={isActive ? "gray.100" : undefined}
                  borderColor={isActive ? "gray.300" : undefined}
                  color={isActive ? "gray.900" : undefined}
                  role="tab"
                  type="button"
                  flex="1"
                  minW={0}
                  onClick={() => store.setActiveInput(key)}
                  _hover={isActive ? { bg: "gray.100" } : undefined}
                >
                  {hasInput && <LuCheck />}
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        </HStack>

        <InputTextarea
          aria-label={`${activeInput} network input`}
          name={`${activeInput}-network-input`}
          onDrop={onLoad(activeInput)}
          accept={inputAccept[activeInput]}
          onChange={(event) => onInputChange(activeInput)(event.target)}
          value={displayInputValue}
          readOnly={isLargeInput}
          disabled={isInputLoading}
          placeholder={inputPlaceholders[activeInput]}
          spellCheck={false}
          wrap="off"
          overflow="auto"
          resize="none"
          flexShrink={0}
          h={{ base: "11rem", lg: "22rem" }}
          variant="outline"
          bg="gray.50"
          fontSize="sm"
        />
        <HStack flexShrink={0} mt={1} gap={2}>
          <LoadButton
            onDrop={onLoad(activeInput)}
            accept={inputAccept[activeInput]}
            disabled={isInputLoading}
            size="sm"
            variant="outline"
          >
            Load file
          </LoadButton>
          <Button
            disabled={!hasActiveInputValue || isInputLoading}
            onClick={() => onInputChange(activeInput)({ name: "", value: "" })}
            size="sm"
            type="button"
            variant="outline"
          >
            <LuX />
            Clear input
          </Button>
        </HStack>
        <Box flex="1" minH={0} overflowX="hidden" overflowY="auto" pr={1}>
          <ExampleNetworksList
            disabled={isRunning}
            onLoadingChange={setIsInputLoading}
            onSelectNetwork={() => setMobilePanel(null)}
          />
        </Box>
      </Box>
    </>
  );
  const renderParametersPanel = () => (
    <>
      <PanelHeader
        title="Parameters"
        description="Edit arguments passed to Infomap."
      />

      <HStack flexShrink={0} justify="space-between" gap={3} mb={3}>
        {runButton}
        <RunStatus
          changedSinceRun={changedSinceRun}
          isRunning={isRunning}
          lastRun={lastRun}
        />
      </HStack>

      <Box flexShrink={0} mb={5}>
        <InputParameters loading={isRunning} onClick={run} />
      </Box>

      <Box flex="1" minH={0} overflowY="auto" overflowX="hidden" pr={1}>
        <Parameters changedFromArgs={lastRun?.args} />
      </Box>
    </>
  );

  return (
    <Grid
      flex="1"
      minH={0}
      h="100%"
      overflow="hidden"
      gap={4}
      p={4}
      templateAreas={{
        base: "'console'",
        lg: "'console output'",
        xl: "'input console output'",
      }}
      templateColumns={{
        base: "minmax(0, 1fr)",
        lg: "minmax(28rem, 1fr) 30rem",
        xl: "22rem minmax(28rem, 1fr) 30rem",
      }}
      templateRows={{
        base: "minmax(0, 1fr)",
        xl: "minmax(0, 1fr)",
      }}
    >
      <GridItem
        area="input"
        minH={0}
        minW={0}
        display={{ base: "none", xl: "flex" }}
        flexDirection="column"
        overflowY="auto"
        overflowX="hidden"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
      >
        {renderInputPanel()}
      </GridItem>
      <GridItem
        area="console"
        minH={0}
        minW={0}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
      >
        <PanelHeader
          title="Results"
          description="Inspect the network, run log, and output files."
        />

        <InfomapStatsStrip
          codeLength={previewCodeLength}
          codelengthSavings={previewCodelengthSavings}
          consoleContent={consoleContent}
          moduleColors={previewModuleColors}
          moduleFlows={previewModuleFlows}
          modules={previewModules}
          nodeCount={
            previewGraph.status === "ok" ? previewGraph.nodes.length : 0
          }
          numLevels={previewNumLevels}
          trialSetting={previewTrialSetting}
        />

        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={3}
          flexShrink={0}
          mb={1}
        >
          <HStack display={{ base: "flex", xl: "none" }} gap={2}>
            <Button
              onClick={() => setMobilePanel("input")}
              size="sm"
              variant="surface"
            >
              <LuPanelLeftOpen />
              Input
            </Button>
            <Button
              display={{ base: "inline-flex", lg: "none" }}
              onClick={() => setMobilePanel("parameters")}
              size="sm"
              variant="surface"
            >
              <LuPanelRightOpen />
              Parameters
            </Button>
            <Box display={{ base: "block", lg: "none" }}>{runButton}</Box>
          </HStack>
          <Flex
            align="center"
            gap={3}
            justify="space-between"
            minW={0}
            w="100%"
            wrap="wrap"
          >
            <ButtonGroup
              attached
              variant="outline"
              size="sm"
              flexShrink={0}
              role="tablist"
            >
              <Button
                aria-selected={tab === "network"}
                bg={tab === "network" ? "gray.100" : undefined}
                borderColor={tab === "network" ? "gray.300" : undefined}
                color={tab === "network" ? "gray.900" : undefined}
                onClick={() => setTab("network")}
                role="tab"
                title="Show network preview (N)"
                _hover={tab === "network" ? { bg: "gray.100" } : undefined}
              >
                Network
                <Kbd
                  display={{ base: "none", md: "inline-flex" }}
                  fontSize="0.65rem"
                  ml={1}
                >
                  N
                </Kbd>
              </Button>
              <Button
                aria-selected={tab === "console"}
                bg={tab === "console" ? "gray.100" : undefined}
                borderColor={tab === "console" ? "gray.300" : undefined}
                color={tab === "console" ? "gray.900" : undefined}
                onClick={() => setTab("console")}
                role="tab"
                title="Show console output (C)"
                _hover={tab === "console" ? { bg: "gray.100" } : undefined}
              >
                Console
                <Kbd
                  display={{ base: "none", md: "inline-flex" }}
                  fontSize="0.65rem"
                  ml={1}
                >
                  C
                </Kbd>
              </Button>
              {outputFiles.length > 0 &&
                (hasMultipleOutputFiles ? (
                  <Menu.Root>
                    <MenuTrigger asChild>
                      <Button
                        aria-selected={tab === "output"}
                        bg={tab === "output" ? "gray.100" : undefined}
                        borderColor={tab === "output" ? "gray.300" : undefined}
                        color={tab === "output" ? "gray.900" : undefined}
                        maxW={{ base: "7rem", sm: "9rem" }}
                        minW={0}
                        role="tab"
                        type="button"
                        _hover={
                          tab === "output" ? { bg: "gray.100" } : undefined
                        }
                      >
                        <Text
                          as="span"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {tab === "output"
                            ? activeOutputFile?.name || "Output"
                            : "Output"}
                        </Text>
                        <LuChevronDown />
                      </Button>
                    </MenuTrigger>
                    <Portal>
                      <MenuPositioner>
                        <MenuContent>
                          {outputFiles.map((file) => (
                            <MenuItem
                              key={file.key}
                              value={file.key}
                              onClick={() => {
                                setTab("output");
                                setActiveKey(file.key);
                              }}
                            >
                              {file.name}
                            </MenuItem>
                          ))}
                        </MenuContent>
                      </MenuPositioner>
                    </Portal>
                  </Menu.Root>
                ) : (
                  selectedOutputFile && (
                    <Button
                      aria-selected={tab === "output"}
                      bg={tab === "output" ? "gray.100" : undefined}
                      borderColor={tab === "output" ? "gray.300" : undefined}
                      color={tab === "output" ? "gray.900" : undefined}
                      maxW={{ base: "7rem", sm: "9rem" }}
                      minW={0}
                      onClick={() => {
                        setTab("output");
                        setActiveKey(selectedOutputFile.key);
                      }}
                      role="tab"
                      size="sm"
                      variant="outline"
                      _hover={tab === "output" ? { bg: "gray.100" } : undefined}
                    >
                      <Text
                        as="span"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {selectedOutputFile.name}
                      </Text>
                    </Button>
                  )
                ))}
            </ButtonGroup>
          </Flex>
        </Stack>

        <Box display={tab === "network" ? "flex" : "none"} flex="1" minH={0}>
          <NetworkPreview
            directed={Boolean(params.getParam("--directed").active)}
            ftree={previewFtree}
            levelModules={previewLevelModules}
            loadingState={
              isRunning
                ? "running"
                : isInputLoading || isPreviewParsing
                  ? "loading"
                  : null
            }
            previewGraph={previewGraph}
            networkName={network.name}
            modules={previewModules}
            moduleFlows={previewModuleFlows}
            nodePaths={previewNodePaths}
            numLevels={previewNumLevels}
            selectedLevel={previewSelectedLevel}
          />
        </Box>
        <Box display={tab === "console" ? "flex" : "none"} flex="1" minH={0}>
          <OutputViewer
            ariaLabel="Infomap console output"
            autoScroll
            content={consoleContent}
            fontSize="0.6875rem"
            isActive={tab === "console"}
            onCopy={() => {}}
            placeholder="Run Infomap to see the log…"
            variant="terminal"
          />
        </Box>
        <Box display={tab === "output" ? "flex" : "none"} flex="1" minH={0}>
          <Field.Root flex="1" minH={0} position="relative">
            {output.activeContent && (
              <Box position="absolute" right={3} top={3} zIndex={1}>
                <Menu.Root>
                  <MenuTrigger asChild>
                    <Button
                      aria-label="Download output"
                      disabled={isRunning}
                      size="xs"
                      variant="surface"
                    >
                      <LuDownload />
                    </Button>
                  </MenuTrigger>
                  <Portal>
                    <MenuPositioner>
                      <MenuContent>
                        <MenuItem
                          value="download-file"
                          onClick={output.downloadActiveContent}
                        >
                          <LuDownload />
                          Download file
                        </MenuItem>
                        {hasMultipleOutputFiles && (
                          <MenuItem
                            value="download-all"
                            onClick={store.output.downloadAll}
                          >
                            <LuFiles />
                            Download all
                          </MenuItem>
                        )}
                      </MenuContent>
                    </MenuPositioner>
                  </Portal>
                </Menu.Root>
              </Box>
            )}
            <OutputViewer
              content={output.activeContent}
              onCopy={onCopyClusters}
            />
          </Field.Root>
        </Box>
      </GridItem>
      <GridItem
        area="output"
        minH={0}
        minW={0}
        maxH="100%"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        overflow="hidden"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
      >
        {renderParametersPanel()}
      </GridItem>
      {mobilePanel && (
        <Box
          display={{ base: "block", xl: "none" }}
          inset={0}
          position="fixed"
          zIndex={1400}
        >
          <Box
            bg="blackAlpha.500"
            inset={0}
            onClick={() => setMobilePanel(null)}
            position="absolute"
            zIndex={0}
          />
          <Box
            bg="white"
            bottom={0}
            boxShadow="xl"
            display="flex"
            flexDirection="column"
            left={mobilePanel === "input" ? 0 : undefined}
            maxW="min(28rem, calc(100vw - 2rem))"
            minH={0}
            overflow="hidden"
            p={4}
            position="absolute"
            right={mobilePanel === "parameters" ? 0 : undefined}
            top={0}
            w="100%"
            zIndex={1}
          >
            <HStack justify="flex-end" mb={2} flexShrink={0}>
              <Button
                aria-label="Close panel"
                onClick={() => setMobilePanel(null)}
                size="sm"
                variant="ghost"
              >
                <LuX />
              </Button>
            </HStack>
            {mobilePanel === "parameters"
              ? renderParametersPanel()
              : renderInputPanel()}
          </Box>
        </Box>
      )}
    </Grid>
  );
}
