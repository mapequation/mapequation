import { Box, chakra, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { CopyButton } from "../components/CopyButton";
import { infomapVersion } from "../infomapVersion";

const currentYear = new Date().getFullYear();

const softwareBibtex = `@misc{mapequation${currentYear}software,
  title        = {{The MapEquation software package}},
  author       = {Daniel Edler and Anton Holmgren and Martin Rosvall},
  howpublished = {\\url{https://mapequation.org}},
  version      = {${infomapVersion}},
  year         = {${currentYear}},
}`;

const paperBibtex = `@article{rosvall2008maps,
  title   = {Maps of random walks on complex networks reveal community structure},
  author  = {Rosvall, Martin and Bergstrom, Carl T.},
  journal = {Proceedings of the National Academy of Sciences},
  volume  = {105},
  number  = {4},
  pages   = {1118--1123},
  year    = {2008},
  doi     = {10.1073/pnas.0706851105},
}`;

type ChipTone = "neutral" | "accent";

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: ChipTone;
  children: string;
}) {
  const styles =
    tone === "accent"
      ? { bg: "green.50", color: "green.800" }
      : { bg: "gray.100", color: "gray.700" };
  return (
    <Box
      as="span"
      display="inline-block"
      px={2.5}
      py={1}
      borderRadius="sm"
      fontFamily="monospace"
      fontSize="xs"
      letterSpacing="0.08em"
      textTransform="uppercase"
      {...styles}
    >
      {children}
    </Box>
  );
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <chakra.a
      href={href}
      target="_blank"
      rel="noreferrer"
      display="inline-flex"
      alignItems="center"
      px={3}
      py={1.5}
      fontSize="sm"
      fontWeight={500}
      color="gray.800"
      bg="white"
      borderWidth="1px"
      borderColor="gray.300"
      borderRadius="md"
      textDecoration="none"
      _hover={{ borderColor: "gray.500", textDecoration: "none" }}
    >
      {children} →
    </chakra.a>
  );
}

function CitationCard({
  id,
  chipLabel,
  chipTone,
  meta,
  title,
  description,
  bibtex,
  links,
}: {
  id: string;
  chipLabel: string;
  chipTone?: ChipTone;
  meta: string;
  title: string;
  description: string;
  bibtex: string;
  links?: { label: string; href: string }[];
}) {
  return (
    <Box
      as="section"
      id={id}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={{ base: 5, md: 6 }}
      mb={5}
      scrollMarginTop="6rem"
    >
      <Flex justify="space-between" align="center" mb={4} gap={4}>
        <Chip tone={chipTone}>{chipLabel}</Chip>
        <Text
          color="gray.500"
          fontFamily="monospace"
          fontSize="xs"
          letterSpacing="0.04em"
          textTransform="uppercase"
          mb={0}
        >
          {meta}
        </Text>
      </Flex>
      <Heading as="h3" fontWeight={700} textStyle="h2" lineHeight={1.2} mb={3}>
        {title}
      </Heading>
      <Text
        color="gray.600"
        fontSize="sm"
        mb={4}
        lineHeight={1.55}
        maxW="48rem"
      >
        {description}
      </Text>
      <Flex gap={2} flexWrap="wrap">
        <CopyButton
          text={bibtex}
          label="Copy BibTeX"
          copiedLabel="Copied"
          size="sm"
          variant="solid"
        />
        {links?.map((l) => (
          <ExternalLink key={l.href} href={l.href}>
            {l.label}
          </ExternalLink>
        ))}
      </Flex>
    </Box>
  );
}

export default function HowToCite() {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={2}>
        How to cite
      </Heading>
      <Text
        color="gray.700"
        fontSize={{ base: "md", md: "lg" }}
        maxW="44rem"
        mb={6}
      >
        Most papers using Infomap cite two things: the software package, which
        identifies the implementation and version, and the map equation paper,
        which credits the method.
      </Text>

      <Stack gap={0}>
        <CitationCard
          id="cite-paper"
          chipLabel="Canonical"
          chipTone="accent"
          meta={`2008 · PNAS`}
          title="Maps of random walks on complex networks reveal community structure"
          description="Rosvall, M., & Bergstrom, C. T. — the original paper. Cite this when you describe the map equation method behind Infomap."
          bibtex={paperBibtex}
          links={[
            { label: "DOI", href: "https://doi.org/10.1073/pnas.0706851105" },
            {
              label: "PDF",
              href: "/publications/Rosvall-Bergstrom-2008-Maps-of-information-flow/0706851105.pdf",
            },
          ]}
        />

        <CitationCard
          id="cite-software"
          chipLabel="Software"
          meta={`${currentYear} · v${infomapVersion}`}
          title="The MapEquation software package"
          description="Edler, D., Holmgren, A., & Rosvall, M. Cite this when your analysis depends on Infomap as software and the release version matters for reproducibility."
          bibtex={softwareBibtex}
          links={[
            {
              label: "Google Scholar",
              href: "https://scholar.google.com/citations?view_op=view_citation&citation_for_view=IDZlurgAAAAJ:ZeXyd9-uunAC",
            },
          ]}
        />
      </Stack>
    </Box>
  );
}
