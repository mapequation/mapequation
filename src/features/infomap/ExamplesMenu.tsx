import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { useState } from "react";
import * as networks from "../../data/networks";
import useStore from "../../state";

type ExampleNetwork = {
  name: string;
  label: string;
  value?: string;
  url?: string;
  args: Record<string, boolean>;
};

const undirected = { "--directed": false, "--two-level": true } as const;
const directed = { "--directed": true, "--two-level": true } as const;

const categories: { label: string; networks: ExampleNetwork[] }[] = [
  {
    label: "Basic",
    networks: [
      {
        name: "twoTriangles",
        label: "Two triangles",
        value: networks.twoTriangles,
        args: undirected,
      },
      {
        name: "barbell",
        label: "Barbell",
        value: networks.barbell,
        args: undirected,
      },
      {
        name: "caveman",
        label: "Caveman",
        value: networks.caveman,
        args: undirected,
      },
      {
        name: "ringOfCliques",
        label: "Ring of cliques",
        value: networks.ringOfCliques,
        args: undirected,
      },
      {
        name: "hubAndSpokes",
        label: "Hub and spokes",
        value: networks.hubAndSpokes,
        args: undirected,
      },
      {
        name: "flow",
        label: "Flow",
        value: networks.flow,
        args: undirected,
      },
      {
        name: "flowD",
        label: "Flow (directed)",
        value: networks.flowD,
        args: directed,
      },
      {
        name: "fourflowDir",
        label: "Four-node flow",
        value: networks.fourflowDir,
        args: directed,
      },
      {
        name: "fournoflowDir",
        label: "Four-node no flow",
        value: networks.fournoflowDir,
        args: directed,
      },
    ],
  },
  {
    label: "Hierarchical",
    networks: [
      {
        name: "nineTriangles",
        label: "Nine triangles",
        value: networks.nineTriangles,
        args: undirected,
      },
    ],
  },
  {
    label: "Weighted",
    networks: [
      {
        name: "modular_w",
        label: "Weighted modular",
        value: networks.modular_w,
        args: undirected,
      },
      {
        name: "weakBridges",
        label: "Weak bridges",
        value: networks.weakBridges,
        args: undirected,
      },
      {
        name: "articleW",
        label: "Article (weighted)",
        value: networks.articleW,
        args: undirected,
      },
    ],
  },
  {
    label: "Directed",
    networks: [
      {
        name: "modular_wd",
        label: "Weighted directed",
        value: networks.modular_wd,
        args: directed,
      },
      {
        name: "directedRingOfTriangles",
        label: "Cycle of triangles",
        value: networks.directedRingOfTriangles,
        args: directed,
      },
      {
        name: "sourceSinkD",
        label: "Source / sink",
        value: networks.sourceSinkD,
        args: directed,
      },
      {
        name: "articleWd",
        label: "Article (directed)",
        value: networks.articleWd,
        args: directed,
      },
    ],
  },
  {
    label: "Real-world",
    networks: [
      {
        name: "karate",
        label: "Karate club",
        value: networks.karate,
        args: undirected,
      },
      {
        name: "karateW",
        label: "Karate (weighted)",
        value: networks.karateW,
        args: undirected,
      },
      {
        name: "florentineFamilies",
        label: "Florentine families",
        value: networks.florentineFamilies,
        args: undirected,
      },
      {
        name: "article",
        label: "Article",
        value: networks.article,
        args: undirected,
      },
      {
        name: "netscicoauthor2010",
        label: "Network science 2010",
        url: "/assets/networks/netscicoauthor2010.net",
        args: { "--directed": false, "--two-level": false },
      },
    ],
  },
  {
    label: "Bipartite",
    networks: [
      {
        name: "bipartite",
        label: "Bipartite",
        value: networks.bipartite,
        args: undirected,
      },
    ],
  },
  {
    label: "Multilayer",
    networks: [
      {
        name: "multilayerIntra",
        label: "Multilayer intra",
        value: networks.multilayerIntra,
        args: undirected,
      },
      {
        name: "multilayerIntraInter",
        label: "Multilayer intra/inter",
        value: networks.multilayerIntraInter,
        args: undirected,
      },
      {
        name: "multilayer",
        label: "Full multilayer",
        value: networks.multilayer,
        args: undirected,
      },
    ],
  },
  {
    label: "Memory",
    networks: [
      {
        name: "states",
        label: "State network",
        value: networks.states,
        args: undirected,
      },
    ],
  },
];

const urlCache = new Map<string, string>();

export default function ExampleNetworksList({
  disabled,
  onLoadingChange,
}: {
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const store = useStore();
  const [loading, setLoading] = useState<string | null>(null);

  const updateLoading = (name: string | null) => {
    setLoading(name);
    onLoadingChange?.(name !== null);
  };

  const onSelect = async (network: ExampleNetwork) => {
    let value = network.value;
    if (value === undefined && network.url) {
      const cached = urlCache.get(network.url);
      if (cached !== undefined) {
        value = cached;
      } else {
        updateLoading(network.name);
        try {
          const res = await fetch(network.url);
          value = await res.text();
          urlCache.set(network.url, value);
        } catch (error) {
          console.error("Failed to load example network", error);
          updateLoading(null);
          return;
        }
        updateLoading(null);
      }
    }
    if (value === undefined) return;

    store.setActiveInput("network");
    store.setNetwork({ name: network.name, value });
    for (const [key, val] of Object.entries(network.args)) {
      const param = store.params.getParam(key);
      if (param.active !== val) {
        store.params.toggle(param);
      }
    }
  };

  return (
    <Flex
      pt={2}
      mt={2}
      gap={3}
      direction="column"
      align="stretch"
      flexShrink={0}
    >
      {categories.map((category) => (
        <Flex key={category.label} direction="column" gap={1.5}>
          <Text
            color="gray.500"
            fontFamily="monospace"
            fontSize="xs"
            letterSpacing="0.1em"
            textTransform="uppercase"
            mb={0}
          >
            {category.label}
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            {category.networks.map((network) => {
              const isLoading = loading === network.name;
              return (
                <Button
                  key={network.name}
                  type="button"
                  size="xs"
                  variant="surface"
                  disabled={disabled || loading !== null}
                  onClick={() => onSelect(network)}
                >
                  {isLoading && <Spinner size="xs" />}
                  {network.label}
                </Button>
              );
            })}
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
}
