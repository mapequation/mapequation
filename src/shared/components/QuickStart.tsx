import { Box, chakra, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { CopyButton } from "./CopyButton";

const SNIPPET = `import networkx as nx
from infomap import find_communities

G = nx.Graph([(1, 2), (1, 3), (2, 3), (3, 4), (4, 5), (4, 6), (5, 6)])
communities = find_communities(G)`;

const syntax = {
  keyword: "#cf222e",
  name: "#24292f",
  className: "#953800",
  functionName: "#8250df",
  number: "#0550ae",
  comment: "#6a737d",
};

export function QuickStart() {
  return (
    <Box w="100%" maxW="40rem">
      <Box
        position="relative"
        bg="white"
        borderWidth="1px"
        borderColor="#d0d7de"
        borderRadius="md"
        overflow="hidden"
      >
        <Box p={4} overflowX="auto">
          <chakra.pre
            m={0}
            fontFamily="monospace"
            fontSize="sm"
            lineHeight={1.6}
            whiteSpace="pre"
            aria-label="Python quick-start"
            color={syntax.name}
          >
            <chakra.span color={syntax.keyword}>import</chakra.span>{" "}
            <chakra.span color={syntax.name}>networkx</chakra.span>{" "}
            <chakra.span color={syntax.keyword}>as</chakra.span>{" "}
            <chakra.span color={syntax.name}>nx</chakra.span>
            {"\n"}
            <chakra.span color={syntax.keyword}>from</chakra.span>{" "}
            <chakra.span color={syntax.name}>infomap</chakra.span>{" "}
            <chakra.span color={syntax.keyword}>import</chakra.span>{" "}
            <chakra.span color={syntax.functionName}>
              find_communities
            </chakra.span>
            {"\n"}
            {"\n"}
            <chakra.span color={syntax.name}>G</chakra.span>{" "}
            <chakra.span color={syntax.keyword}>=</chakra.span>{" "}
            <chakra.span color={syntax.name}>nx</chakra.span>.
            <chakra.span color={syntax.className}>Graph</chakra.span>([(
            <chakra.span color={syntax.number}>1</chakra.span>,{" "}
            <chakra.span color={syntax.number}>2</chakra.span>), (
            <chakra.span color={syntax.number}>1</chakra.span>,{" "}
            <chakra.span color={syntax.number}>3</chakra.span>), (
            <chakra.span color={syntax.number}>2</chakra.span>,{" "}
            <chakra.span color={syntax.number}>3</chakra.span>), (
            <chakra.span color={syntax.number}>3</chakra.span>,{" "}
            <chakra.span color={syntax.number}>4</chakra.span>), (
            <chakra.span color={syntax.number}>4</chakra.span>,{" "}
            <chakra.span color={syntax.number}>5</chakra.span>), (
            <chakra.span color={syntax.number}>4</chakra.span>,{" "}
            <chakra.span color={syntax.number}>6</chakra.span>), (
            <chakra.span color={syntax.number}>5</chakra.span>,{" "}
            <chakra.span color={syntax.number}>6</chakra.span>)])
            {"\n"}
            <chakra.span color={syntax.name}>communities</chakra.span>{" "}
            <chakra.span color={syntax.keyword}>=</chakra.span>{" "}
            <chakra.span color={syntax.functionName}>
              find_communities
            </chakra.span>
            (<chakra.span color={syntax.name}>G</chakra.span>){"\n"}
            <chakra.span color={syntax.comment}>
              {`# [{1, 2, 3}, {4, 5, 6}]`}
            </chakra.span>
          </chakra.pre>
        </Box>
        <Box position="absolute" top={2} right={2} zIndex={1}>
          <CopyButton text={SNIPPET} />
        </Box>
      </Box>
      <Link asChild fontSize="sm" mt={2}>
        <NextLink href="/infomap/install">More install options →</NextLink>
      </Link>
    </Box>
  );
}
