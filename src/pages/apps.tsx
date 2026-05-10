import {
  chakra,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import { Tag } from "../shared/components/Tag";
import AppCard from "../shared/compounds/AppCard";
import { PortalEyebrow, PortalSection } from "../shared/compounds/portal";

interface AppItem {
  id: string;
  title: string;
  href: string;
  image: string;
  imagePosition?: string;
}

const APPS: AppItem[] = [
  {
    id: "navigator",
    title: "Infomap Network Navigator",
    href: "https://www.mapequation.org/navigator",
    image: "/apps/InfomapNetworkNavigator.png",
  },
  {
    id: "bioregions",
    title: "Infomap Bioregions",
    href: "https://www.mapequation.org/bioregions",
    image: "/apps/InfomapBioregions.png",
    imagePosition: "50% 25%",
  },
  {
    id: "alluvial",
    title: "Alluvial Generator",
    href: "https://www.mapequation.org/alluvial",
    image: "/apps/NewAlluvialGenerator.png",
    imagePosition: "bottom left",
  },
  {
    id: "state",
    title: "State Network Visualizer",
    href: "https://www.mapequation.org/state-visualizer",
    image: "/apps/StateVisualizer.png",
  },
];

const NOTEBOOKS = [
  {
    id: "tutorial",
    title: "Infomap tutorial notebooks",
    tool: "Jupyter",
    lines: "Python · 14 notebooks",
    desc: "Numbered walkthrough of the map equation, two-level and multilevel phases, memory and multilayer networks, and the solution landscape.",
    href: "https://github.com/mapequation/infomap-tutorial-notebooks",
  },
  {
    id: "landscape",
    title: "Solution landscape",
    tool: "Jupyter",
    lines: "Python · 1 notebook",
    desc: "Visualize and explore the solution landscape of Infomap based on clusters of network partitions.",
    href: "https://github.com/mapequation/solution-landscape",
  },
];

const SOURCE_TOOLS = [
  {
    id: "partval",
    title: "Partition validation",
    desc: "Identify partition clusters and validate other partitions.",
    href: "https://github.com/mapequation/partition-validation",
  },
  {
    id: "sigclu",
    title: "Significance clustering",
    desc: "Assess the significance of cluster assignments via bootstrap.",
    href: "https://github.com/mapequation/significance-clustering",
  },
  {
    id: "similarity",
    title: "Map equation similarity",
    desc: "Python library for similarity-based link prediction with the map equation.",
    href: "https://github.com/mapequation/map-equation-similarity",
  },
];

const NotebookCard = ({ nb }: { nb: (typeof NOTEBOOKS)[number] }) => (
  <chakra.a
    href={nb.href}
    target="_blank"
    rel="noreferrer"
    role="group"
    display="block"
    bg="white"
    borderWidth="1px"
    borderColor="gray.200"
    borderRadius="md"
    p={5}
    textDecoration="none"
    color="inherit"
    transition="border-color 150ms"
    _hover={{ borderColor: "gray.400", textDecoration: "none" }}
  >
    <Stack gap={2}>
      <Flex gap={2} align="center">
        <Tag>{nb.tool}</Tag>
        <Text color="gray.500" fontFamily="monospace" fontSize="xs" mb={0}>
          {nb.lines}
        </Text>
      </Flex>
      <Heading
        as="h3"
        size="sm"
        mb={0}
        color="#128bc2"
        _groupHover={{ color: "#096992" }}
      >
        {nb.title}{" "}
        <chakra.span aria-hidden="true" fontWeight={400}>
          »
        </chakra.span>
      </Heading>
      <Text color="gray.700" fontSize="sm" mb={0}>
        {nb.desc}
      </Text>
    </Stack>
  </chakra.a>
);

const AppsPage: NextPage = () => (
  <Container>
    <Stack mt={{ base: 8, md: 12 }} gap={4} align="flex-start">
      <PortalEyebrow>Apps &amp; Notebooks</PortalEyebrow>
      <Heading as="h1" size="2xl" maxW="20ch" lineHeight={1.15}>
        Apps and notebooks for the Map Equation framework.
      </Heading>
      <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} maxW="42rem">
        Browser-based visualizations and end-to-end notebooks built around
        Infomap.
      </Text>
    </Stack>

    <PortalSection title="Apps">
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6}>
        {APPS.map((a) => (
          <AppCard
            key={a.id}
            href={a.href}
            title={a.title}
            image={a.image}
            imageAlt={a.title}
            imagePosition={a.imagePosition}
          />
        ))}
      </SimpleGrid>
    </PortalSection>

    <PortalSection title="Notebooks">
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        {NOTEBOOKS.map((n) => (
          <NotebookCard key={n.id} nb={n} />
        ))}
      </SimpleGrid>
    </PortalSection>

    <PortalSection title="Companion tools">
      <Text color="gray.600" fontSize="sm" mb={4} maxW="42rem">
        Open-source tools that build on the Map Equation framework.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        {SOURCE_TOOLS.map((t) => (
          <chakra.a
            key={t.id}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            role="group"
            display="block"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={5}
            textDecoration="none"
            color="inherit"
            transition="border-color 150ms"
            _hover={{ borderColor: "gray.400", textDecoration: "none" }}
          >
            <Heading as="h3" size="sm" mb={2}>
              {t.title}
            </Heading>
            <Text color="gray.700" fontSize="sm" mb={3}>
              {t.desc}
            </Text>
            <Text
              color="#128bc2"
              fontFamily="monospace"
              fontSize="xs"
              mb={0}
              _groupHover={{ color: "#096992" }}
            >
              {t.href.replace("https://", "")} ↗
            </Text>
          </chakra.a>
        ))}
      </SimpleGrid>
    </PortalSection>
  </Container>
);

export default AppsPage;
