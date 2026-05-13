import {
  Container,
  chakra,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import NextLink from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { PrimaryButton } from "../../shared/components/PrimaryButton";
import InstallCard from "../../shared/compounds/InstallCard";
import PillarCard from "../../shared/compounds/PillarCard";
import { PortalEyebrow, PortalSection } from "../../shared/compounds/portal";

const Home: NextPage = () => {
  return (
    <Container>
      <SimpleGrid
        as="section"
        columns={{ base: 1, lg: 2 }}
        gap={{ base: 8, lg: 12 }}
        alignItems="start"
        mt={{ base: 8, md: 12 }}
      >
        <Stack align="flex-start" gap={5}>
          <PortalEyebrow>Software</PortalEyebrow>
          <Heading as="h1" textStyle="h1" maxW="13em">
            Run flow-based community detection with Infomap
          </Heading>
          <Text color="gray.700" textStyle="body" mb={0}>
            Infomap detects communities by asking where flow is retained in a
            network. Use it from Python, R, the command line, or the browser for
            directed, weighted, multilayer, bipartite, and memory networks.
          </Text>

          <Flex gap={3} flexWrap="wrap">
            <PrimaryButton href="/infomap/workbench">
              Try Infomap <LuArrowRight />
            </PrimaryButton>
          </Flex>
        </Stack>

        <NextLink
          href="/infomap/workbench"
          aria-label="Try Infomap"
          style={{
            display: "block",
            textDecoration: "none",
            width: "100%",
          }}
        >
          <chakra.img
            src="/apps/Infomap.png"
            alt="Infomap workbench"
            display="block"
            mx={{ base: "auto", lg: 0 }}
            justifySelf={{ base: "center", lg: "end" }}
            w="100%"
            maxW="520px"
            h="auto"
            transition="opacity 150ms"
            _hover={{ opacity: 0.9 }}
          />
        </NextLink>
      </SimpleGrid>

      {/* Three pillars — using Infomap */}
      <PortalSection title="Use Infomap" eyebrow="Get started">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <PillarCard
            href="/infomap/install"
            eyebrow="Install"
            title="Install for your workflow"
            text="Python, R, CLI, Docker, Homebrew, binaries, and TypeScript packages."
            cta="How to install"
          />
          <PillarCard
            href="/infomap/workbench"
            eyebrow="Try it"
            title="Try a small network first"
            text="Upload or paste a network and inspect the communities before installing."
            cta="Open workbench"
          />
          <PillarCard
            href="/publications#how-to-cite"
            eyebrow="Cite"
            title="Cite the method correctly"
            text="Copy citations for the software version and the map equation paper."
            cta="How to cite"
          />
        </SimpleGrid>
      </PortalSection>

      <PortalSection
        id="install"
        eyebrow="Install"
        title="Choose your research workflow"
        href="/infomap/install"
        linkText="Full install guide"
      >
        <InstallCard />
      </PortalSection>

      <PortalSection title="Documentation" eyebrow="Learn">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <PillarCard
            href="/infomap/formats"
            eyebrow="Reference"
            title="Input & output formats"
            text="Prepare your network data and choose the output your analysis needs."
            cta="Read the docs"
          />
          <PillarCard
            href="/infomap/how-it-works"
            eyebrow="In depth"
            title="How it works"
            text="Connect your research question to the flow model, map equation, and search algorithm."
            cta="Read the docs"
          />
        </SimpleGrid>
      </PortalSection>

      <PortalSection title="Issues & discussions" eyebrow="Got feedback?">
        <Text color="gray.700" fontSize="sm" mb={4} maxW="44rem">
          Open an issue if you find a bug, or start a discussion if you need
          help modeling a network or interpreting an Infomap result.
        </Text>
        <Flex gap={6} flexWrap="wrap">
          {[
            {
              label: "GitHub",
              href: "https://github.com/mapequation/infomap",
            },
            {
              label: "Issues",
              href: "https://github.com/mapequation/infomap/issues",
            },
            {
              label: "Discussions",
              href: "https://github.com/mapequation/infomap/discussions",
            },
            {
              label: "Releases",
              href: "https://github.com/mapequation/infomap/releases",
            },
            {
              label: "Changelog",
              href: "https://github.com/mapequation/infomap/blob/master/CHANGELOG.md",
            },
          ].map((l) => (
            <chakra.a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              fontSize="sm"
              color="#128bc2"
              textDecoration="none"
              _hover={{ color: "#096992", textDecoration: "underline" }}
            >
              {l.label} ↗
            </chakra.a>
          ))}
        </Flex>
      </PortalSection>
    </Container>
  );
};

export default Home;
