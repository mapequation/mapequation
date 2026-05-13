import { Box, Button, chakra, Flex, Heading, Text } from "@chakra-ui/react";
import { useState } from "react";
import { CopyButton } from "../components/CopyButton";
import { infomapVersion } from "../infomapVersion";

const formats = [
  "BibTeX",
  "RIS",
  "APA",
  "MLA",
  "Plain text",
  "EndNote",
] as const;
type CitationFormat = (typeof formats)[number];
type CitationSet = Record<CitationFormat, string>;

const currentYear = new Date().getFullYear();

const software = {
  title: "The MapEquation software package",
  authors: [
    { first: "Daniel", last: "Edler" },
    { first: "Anton", last: "Holmgren" },
    { first: "Martin", last: "Rosvall" },
  ],
  url: "https://mapequation.org",
  year: currentYear,
  version: infomapVersion,
};

const softwareCitation: CitationSet = {
  BibTeX: `@misc{mapequation${currentYear}software,
  title        = {{${software.title}}},
  author       = {${software.authors.map((a) => `${a.first} ${a.last}`).join(" and ")}},
  howpublished = {\\url{${software.url}}},
  version      = {${software.version}},
  year         = {${software.year}},
}`,
  RIS: `TY  - COMP
TI  - ${software.title}
AU  - ${software.authors[0].last}, ${software.authors[0].first}
AU  - ${software.authors[1].last}, ${software.authors[1].first}
AU  - ${software.authors[2].last}, ${software.authors[2].first}
PY  - ${software.year}
ET  - ${software.version}
UR  - ${software.url}
ER  -`,
  APA: `Edler, D., Holmgren, A., & Rosvall, M. (${software.year}). ${software.title} (Version ${software.version}) [Computer software]. ${software.url}`,
  MLA: `Edler, Daniel, Anton Holmgren, and Martin Rosvall. ${software.title}. Version ${software.version}, ${currentYear}, mapequation.org.`,
  "Plain text": `D. Edler, A. Holmgren and M. Rosvall, ${software.title}, version ${software.version}, available online at mapequation.org, ${currentYear}.`,
  EndNote: `%0 Computer Program
%T ${software.title}
%A ${software.authors[0].last}, ${software.authors[0].first}
%A ${software.authors[1].last}, ${software.authors[1].first}
%A ${software.authors[2].last}, ${software.authors[2].first}
%D ${software.year}
%7 ${software.version}
%U ${software.url}`,
};

const paperCitation: CitationSet = {
  BibTeX: `@article{rosvall2008maps,
  title   = {Maps of random walks on complex networks reveal community structure},
  author  = {Rosvall, Martin and Bergstrom, Carl T.},
  journal = {Proceedings of the National Academy of Sciences},
  volume  = {105},
  number  = {4},
  pages   = {1118--1123},
  year    = {2008},
  doi     = {10.1073/pnas.0706851105},
}`,
  RIS: `TY  - JOUR
TI  - Maps of random walks on complex networks reveal community structure
AU  - Rosvall, Martin
AU  - Bergstrom, Carl T.
JO  - Proceedings of the National Academy of Sciences
VL  - 105
IS  - 4
SP  - 1118
EP  - 1123
PY  - 2008
DO  - 10.1073/pnas.0706851105
ER  -`,
  APA: `Rosvall, M., & Bergstrom, C. T. (2008). Maps of random walks on complex networks reveal community structure. Proceedings of the National Academy of Sciences, 105(4), 1118-1123. https://doi.org/10.1073/pnas.0706851105`,
  MLA: `Rosvall, Martin, and Carl T. Bergstrom. "Maps of Random Walks on Complex Networks Reveal Community Structure." Proceedings of the National Academy of Sciences, vol. 105, no. 4, 2008, pp. 1118-1123, doi:10.1073/pnas.0706851105.`,
  "Plain text": `M. Rosvall and C. T. Bergstrom, "Maps of random walks on complex networks reveal community structure," Proceedings of the National Academy of Sciences, vol. 105, no. 4, pp. 1118-1123, 2008.`,
  EndNote: `%0 Journal Article
%T Maps of random walks on complex networks reveal community structure
%A Rosvall, Martin
%A Bergstrom, Carl T.
%J Proceedings of the National Academy of Sciences
%V 105
%N 4
%P 1118-1123
%D 2008
%R 10.1073/pnas.0706851105`,
};

function FormatPicker({
  value,
  onChange,
}: {
  value: CitationFormat;
  onChange: (format: CitationFormat) => void;
}) {
  return (
    <Flex gap={1.5} flexWrap="wrap" mb={3}>
      {formats.map((format) => (
        <Button
          key={format}
          type="button"
          size="xs"
          variant={value === format ? "solid" : "surface"}
          bg={value === format ? "gray.900" : undefined}
          color={value === format ? "white" : undefined}
          onClick={() => onChange(format)}
        >
          {format}
        </Button>
      ))}
    </Flex>
  );
}

function CitationBlock({ value }: { value: string }) {
  return (
    <Box position="relative">
      <Box
        bg="gray.100"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        overflowX="auto"
      >
        <chakra.pre
          m={0}
          fontFamily="monospace"
          fontSize="sm"
          lineHeight={1.6}
          whiteSpace="pre-wrap"
        >
          {value}
        </chakra.pre>
      </Box>
      <Box position="absolute" top={2} right={2}>
        <CopyButton text={value} />
      </Box>
    </Box>
  );
}

function CitationCard({
  id,
  title,
  text,
  citation,
  showVersion,
}: {
  id: string;
  title: string;
  text: string;
  citation: CitationSet;
  showVersion?: boolean;
}) {
  const [format, setFormat] = useState<CitationFormat>("BibTeX");
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
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "baseline" }}
        direction={{ base: "column", md: "row" }}
        gap={3}
        mb={2}
      >
        <Heading as="h2" size="md">
          {title}
        </Heading>
        {showVersion && (
          <Box
            as="span"
            bg="gray.100"
            color="gray.600"
            borderRadius="sm"
            px={2}
            py={1}
            fontFamily="monospace"
            fontSize="xs"
          >
            v{infomapVersion}
          </Box>
        )}
      </Flex>
      <Text color="gray.600" fontSize="sm" maxW="42rem">
        {text}
      </Text>
      <FormatPicker value={format} onChange={setFormat} />
      <CitationBlock value={citation[format]} />
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
      <CitationCard
        id="cite-software"
        title="Software"
        text="Use this citation when your analysis depends on Infomap as software, especially when the package or release version matters for reproducibility."
        citation={softwareCitation}
        showVersion
      />
      <CitationCard
        id="cite-paper"
        title="Original map equation paper"
        text="Use this citation when you describe the map equation method, random-walk coding, or the community-detection principle behind Infomap."
        citation={paperCitation}
      />
    </Box>
  );
}
