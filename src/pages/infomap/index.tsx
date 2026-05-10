import {
  Box,
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
          <Heading as="h1" size="4xl" maxW="13em" lineHeight={1.12}>
            Network community detection using the Map Equation framework.
          </Heading>
          <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} mb={0}>
            Infomap is the reference implementation of the map equation. It
            finds multilevel communities in directed, weighted, multilayer,
            and memory networks — fast, well-tested, with first-party Python
            and R bindings.
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
            title="Install Infomap"
            text="Python, R, and CLI. Works on macOS, Linux and Windows."
            cta="How to install"
          />
          <PillarCard
            href="/infomap/workbench"
            eyebrow="Try it"
            title="Run in your browser"
            text="Upload a network and inspect communities right here, no install needed."
            cta="Open workbench"
          />
          <PillarCard
            href="/publications#how-to-cite"
            eyebrow="Cite"
            title="Reference papers"
            text="The PNAS 2008 paper, the map equation paper, and the software citation."
            cta="How to cite"
          />
        </SimpleGrid>
      </PortalSection>

      <PortalSection
        id="install"
        eyebrow="Install"
        title="Pick your platform"
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
            text="How to format your data and interpret Infomap's output."
            cta="Read the docs"
          />
          <PillarCard
            href="/infomap/how-it-works"
            eyebrow="In depth"
            title="How it works"
            text="Learn the mechanics of the map equation and Infomap."
            cta="Read the docs"
          />
        </SimpleGrid>
      </PortalSection>

      <PortalSection title="Issues & discussions" eyebrow="Got feedback?">
        <Text color="gray.700" fontSize="sm" mb={4} maxW="44rem">
          We read every issue and reply on discussions. Open one if you hit a
          bug or want to ask something about Infomap.
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
