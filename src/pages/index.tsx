import {
  Box,
  chakra,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetStaticProps, NextPage } from "next";
import NextLink from "next/link";
import FlowDemo from "../shared/compounds/FlowDemo";
import NewsList from "../shared/compounds/NewsList";
import { PortalSection } from "../shared/compounds/portal";
import { loadNews, type NewsItem } from "../shared/loadNews";

const PORTAL_CARDS = [
  {
    href: "/infomap",
    title: "Infomap",
    description: "Run multilevel community detection on your own networks.",
    image: "/apps/Infomap.png",
    imagePosition: "center top",
  },
  {
    href: "/apps",
    title: "Apps & Notebooks",
    description: "Visualize partitions, hierarchies, and bioregions.",
    image: "/apps/NewAlluvialGenerator.png",
    imagePosition: "bottom left",
  },
  {
    href: "/publications",
    title: "Publications",
    description: "Theory, applications, and the canonical references to cite.",
    image:
      "/publications/Rosvall-Bergstrom-2008-Maps-of-information-flow/science2004.svg",
    imagePosition: "center",
    imageSize: "150%",
  },
];

interface Props {
  recentNews: NewsItem[];
}

const QUOTE = {
  q: "The best maps convey a great deal of information but require minimal bandwidth: the best maps are also good compressions.",
  by: "M. Rosvall and C. T. Bergstrom, PNAS 105, 1118 (2008)",
};

const HomePage: NextPage<Props> = ({ recentNews }) => {
  return (
    <Container>
      {/* Hero — brand level */}
      <SimpleGrid
        as="section"
        columns={{ base: 1, lg: 2 }}
        gap={{ base: 8, lg: 12 }}
        alignItems="center"
        mt={{ base: 8, md: 12 }}
      >
        <Stack align="flex-start" gap={5}>
          <Heading as="h1" size="4xl" lineHeight={1.12}>
            The Map Equation framework.
          </Heading>
          <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} mb={0}>
            A coding-theoretic approach to community detection: good communities
            are the ones that compress the description of a random walk best.
          </Text>
          <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} mb={0}>
            Since 2008, the framework has grown into Infomap (the reference
            algorithm), a family of visualizations, and ongoing research on
            higher-order, multilayer, and Bayesian community detection.
          </Text>
        </Stack>
        <Box
          my={8}
          mx={{ base: "auto", lg: 50 }}
          justifySelf={{ base: "center", lg: "auto" }}
          w="100%"
          maxW="300px"
        >
          <FlowDemo />
        </Box>
      </SimpleGrid>

      {/* Portal cards — three doorways */}
      <PortalSection eyebrow="Start here" title="Explore">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={16}>
          {PORTAL_CARDS.map((card) => (
            <NextLink
              key={card.href}
              href={card.href}
              style={{ textDecoration: "none", display: "block" }}
            >
              <Stack role="group" gap={3} h="100%">
                <Box
                  aspectRatio="16 / 10"
                  borderRadius="md"
                  bg="white"
                  boxShadow="sm"
                  borderWidth="1px"
                  borderColor="blackAlpha.100"
                  transition="all 150ms"
                  _groupHover={{
                    boxShadow: "md",
                    borderColor: "rgba(18, 139, 194, 0.4)",
                  }}
                  style={{
                    background: `white url(${card.image}) no-repeat ${card.imagePosition} / ${card.imageSize ?? "cover"}`,
                  }}
                  role="img"
                  aria-label={card.title}
                />
                <Heading
                  as="h3"
                  size="md"
                  color="#128bc2"
                  _groupHover={{ color: "#096992" }}
                  mb={0}
                >
                  {card.title}{" "}
                  <chakra.span aria-hidden="true" fontWeight={400}>
                    »
                  </chakra.span>
                </Heading>
                <Text color="gray.600" fontSize="sm" mb={0}>
                  {card.description}
                </Text>
              </Stack>
            </NextLink>
          ))}
        </SimpleGrid>
      </PortalSection>

      {/* News */}
      <PortalSection
        eyebrow="News"
        title="Latest releases & papers"
        href="/news"
        linkText="All news"
      >
        <NewsList items={recentNews} />
      </PortalSection>

      {/* Quote */}
      <Box
        as="section"
        textAlign="center"
        my={{ base: 12, md: 16 }}
        maxW="48rem"
        mx="auto"
      >
        <Text
          fontFamily="Philosopher, serif"
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight={400}
          lineHeight={1.4}
          color="gray.800"
        >
          “{QUOTE.q}”
        </Text>
        <Text color="gray.500" fontSize="sm" mt={3}>
          {QUOTE.by}
        </Text>
      </Box>
    </Container>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { recentNews: loadNews().slice(0, 5) },
});

export default HomePage;
