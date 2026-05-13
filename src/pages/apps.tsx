import {
  Container,
  chakra,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import AppCard from "../shared/compounds/AppCard";
import { PortalEyebrow, PortalSection } from "../shared/compounds/portal";

interface AppItem {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  imagePosition?: string;
}

const APPS: AppItem[] = [
  {
    id: "navigator",
    title: "Infomap Network Navigator",
    description:
      "Browse Infomap results and zoom through the module hierarchy.",
    href: "https://www.mapequation.org/navigator",
    image: "/apps/InfomapNetworkNavigator.png",
  },
  {
    id: "bioregions",
    title: "Infomap Bioregions",
    description:
      "Map species distributions to coherent bioregions and inspect them on a globe.",
    href: "https://www.mapequation.org/bioregions",
    image: "/apps/InfomapBioregions.png",
    imagePosition: "50% 25%",
  },
  {
    id: "alluvial",
    title: "Alluvial Generator",
    description:
      "Compare partitions side by side to see which modules split, merge, or persist.",
    href: "https://www.mapequation.org/alluvial",
    image: "/apps/NewAlluvialGenerator.png",
    imagePosition: "bottom left",
  },
  {
    id: "state",
    title: "State Network Visualizer",
    description:
      "Inspect the higher-order state networks behind memory and context effects.",
    href: "https://www.mapequation.org/state-visualizer",
    image: "/apps/StateVisualizer.png",
  },
];

const SOURCE_TOOLS = [
  {
    id: "tutorial",
    title: "Infomap tutorial notebooks",
    desc: "Walkthrough of the map equation, two-level and multilevel phases, memory and multilayer networks, and the solution landscape.",
    href: "https://github.com/mapequation/infomap-tutorial-notebooks",
    link: "mapequation/infomap-tutorial-notebooks",
  },
  {
    id: "partval",
    title: "Partition validation",
    desc: "Identify partition clusters and validate other partitions.",
    href: "https://github.com/mapequation/partition-validation",
    link: "mapequation/partition-validation",
  },
  {
    id: "sigclu",
    title: "Significance clustering",
    desc: "Assess the significance of cluster assignments via bootstrap.",
    href: "https://github.com/mapequation/significance-clustering",
    link: "mapequation/significance-clustering",
  },
];

const AppsPage: NextPage = () => (
  <Container>
    <Stack mt={{ base: 8, md: 12 }} gap={4} align="flex-start">
      <PortalEyebrow>Apps</PortalEyebrow>
      <Heading as="h1" textStyle="h1" maxW="20ch">
        Tools for inspecting Infomap results
      </Heading>
      <Text color="gray.700" textStyle="body" maxW="42rem">
        Explore module hierarchies, compare partitions, inspect higher-order
        state networks, and visualize bioregions.
      </Text>
    </Stack>

    <PortalSection title="Apps">
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
        {APPS.map((a) => (
          <AppCard
            key={a.id}
            href={a.href}
            title={a.title}
            description={a.description}
            image={a.image}
            imageAlt={a.title}
            imagePosition={a.imagePosition}
          />
        ))}
      </SimpleGrid>
    </PortalSection>

    <PortalSection title="Notebooks and companion methods">
      <Text color="gray.600" fontSize="sm" mb={4} maxW="42rem">
        Tutorials, validation tools, and significance tests for researchers
        working with map equation results.
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
              {t.link} ↗
            </Text>
          </chakra.a>
        ))}
      </SimpleGrid>
    </PortalSection>
  </Container>
);

export default AppsPage;
