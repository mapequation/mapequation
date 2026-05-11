import {
  Box,
  Button,
  Container,
  chakra,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import NextLink from "next/link";
import { LuArrowRight, LuMail } from "react-icons/lu";
import { SiGooglescholar, SiLinkedin, SiOrcid } from "react-icons/si";
import EmailLink from "../shared/components/EmailLink";
import { PortalEyebrow } from "../shared/compounds/portal";

interface PersonLinks {
  linkedin?: string;
  scholar?: string;
  orcid?: string;
}

interface PersonEmail {
  user: string;
  domain: string;
}

interface Person {
  id: string;
  name: string;
  role: string;
  email?: PersonEmail;
  image?: string;
  imagePosition?: string;
  imageZoom?: string;
  links?: PersonLinks;
}

const PEOPLE: Person[] = [
  {
    id: "rosvall",
    name: "Martin Rosvall",
    role: "Professor · Principal investigator",
    image: "/people/martin-rosvall.webp",
    imagePosition: "60% center",
    imageZoom: "250%",
    email: { user: "martin.rosvall", domain: "umu.se" },
    links: {
      orcid: "https://orcid.org/0000-0002-7181-9940",
      scholar: "https://scholar.google.com/citations?user=8syggg0AAAAJ",
      linkedin: "https://www.linkedin.com/in/rosvall/",
    },
  },
  {
    id: "edler",
    name: "Daniel Edler",
    role: "Researcher",
    image: "/people/daniel-edler.webp",
    imagePosition: "42% 15%",
    imageZoom: "210%",
    links: {
      orcid: "https://orcid.org/0000-0001-5420-0591",
      scholar: "https://scholar.google.com/citations?user=aGxqaMIAAAAJ",
      linkedin: "https://www.linkedin.com/in/daniel-edler-34692799/",
    },
  },
  {
    id: "smiljanic",
    name: "Jelena Smiljanić",
    role: "Researcher",
    image: "/people/jelena-smiljani.webp",
    imagePosition: "15% center",
    links: {
      orcid: "https://orcid.org/0000-0003-0124-1909",
      scholar: "https://scholar.google.com/citations?user=zz9prK8AAAAJ",
      // TODO: linkedin
    },
  },
  {
    id: "neuman",
    name: "Magnus Neuman",
    role: "Researcher",
    image: "/people/magnus-neuman2.webp",
    links: {
      orcid: "https://orcid.org/0000-0002-3599-9374",
      scholar: "https://scholar.google.com/citations?user=uXcxdcQAAAAJ",
      linkedin: "https://www.linkedin.com/in/magnus-neuman-406b8745/",
    },
  },
  {
    id: "lindstrom",
    name: "Maja Lindström",
    role: "PhD candidate",
    image: "/people/maja-lindstrom.webp",
    imagePosition: "20% 10%",
    imageZoom: "250%",
    links: {
      orcid: "https://orcid.org/0009-0009-9224-4646",
      scholar: "https://scholar.google.com/citations?user=YJpEN54AAAAJ",
      linkedin: "https://www.linkedin.com/in/maja-lindstr%C3%B6m-a58351181/",
    },
  },
];

const ALUMNI: Person[] = [
  {
    id: "holmgren",
    name: "Anton Holmgren",
    role: "PhD",
    image: "/people/anton-holmgren.jpg",
    imagePosition: "50% 40%",
    imageZoom: "100%",
    links: {
      orcid: "https://orcid.org/0000-0001-5859-4073",
      scholar: "https://scholar.google.com/citations?user=IDZlurgAAAAJ",
      linkedin: "https://www.linkedin.com/in/antoneri/",
    },
  },
  {
    id: "christopher",
    name: "Christopher Blöcker",
    role: "PhD",
    image: "/people/christopher-blocker.jpg",
    imagePosition: "50% 40%",
    imageZoom: "170%",
    links: {
      orcid: "https://orcid.org/0000-0001-7881-2496",
      scholar: "https://scholar.google.com/citations?user=4mw83wwAAAAJ",
      linkedin:
        "https://www.linkedin.com/in/christopher-bl%C3%B6cker-561007a0/",
    },
  },
];

const COLLABORATORS = [
  { name: "Carl T. Bergstrom", org: "University of Washington" },
  { name: "Jevin West", org: "University of Washington" },
  { name: "Andrea Lancichinetti", org: "Umeå University" },
  { name: "Renaud Lambiotte", org: "University of Oxford" },
];

const PersonLinkIcons = ({
  links,
  email,
}: {
  links?: PersonLinks;
  email?: PersonEmail;
}) => {
  const items = [
    { href: links?.orcid, label: "ORCID", Icon: SiOrcid },
    { href: links?.scholar, label: "Google Scholar", Icon: SiGooglescholar },
    { href: links?.linkedin, label: "LinkedIn", Icon: SiLinkedin },
  ].filter((it) => it.href);
  if (items.length === 0 && !email) return null;
  return (
    <HStack gap={2}>
      {items.map(({ href, label, Icon }) => (
        <chakra.a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          color="gray.400"
          _hover={{ color: "gray.600" }}
          display="inline-flex"
          alignItems="center"
        >
          <Icon size={14} />
        </chakra.a>
      ))}
      {email && (
        <EmailLink
          user={email.user}
          domain={email.domain}
          aria-label="Email"
          color="gray.400"
          _hover={{ color: "gray.600" }}
          display="inline-flex"
          alignItems="center"
        >
          <LuMail size={14} />
        </EmailLink>
      )}
    </HStack>
  );
};

const Avatar = ({ person }: { person: Person }) => {
  return (
    <Box
      w="80px"
      h="80px"
      borderRadius="md"
      flexShrink={0}
      bg="gray.100"
      style={{
        background: `gray url(${person.image}) no-repeat ${person.imagePosition ?? "center"} / ${person.imageZoom ?? "cover"}`,
      }}
      role="img"
      aria-label={person.name}
    />
  );
};

const AboutPage: NextPage = () => (
  <Container>
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      gap={{ base: 8, lg: 12 }}
      alignItems="start"
      mt={{ base: 8, md: 12 }}
    >
      <Box position={{ lg: "sticky" }} top={{ lg: "5rem" }} alignSelf="start">
        <Box>
          <PortalEyebrow>About</PortalEyebrow>
          <Heading as="h1" size="2xl" mb={4} maxW="14em" lineHeight={1.15}>
            We compress flows to find structure.
          </Heading>
          <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} mb={4}>
            We are a small group at Umeå University working on flow-based
            community detection. Since 2008 we've built Infomap, a family of
            visualizations for inspecting partitions, and methods spanning
            higher-order, multilayer, and Bayesian community detection.
          </Text>
          <Text color="gray.700" fontSize="md" mb={6}>
            Most of the software is open source, all of the papers are freely
            available.
          </Text>
          <Flex gap={3} flexWrap="wrap">
            <Button asChild variant="surface">
              <NextLink href="/publications">
                Publications <LuArrowRight />
              </NextLink>
            </Button>
          </Flex>
        </Box>

        <Box mt="5rem">
          <Heading as="h2" size="xl" mb={4} lineHeight={1.15} id="Terms">
            Terms
          </Heading>
          <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} mb={4}>
            The Infomap software is released under a dual licence. To give
            everyone maximum freedom to make use of Infomap and derivative
            works, we make the code open source under the{" "}
            <chakra.a href="https://www.gnu.org/licenses/agpl-3.0.html">
              GNU Affero General Public License version 3 or any later version
            </chakra.a>
            .
          </Text>
          <Text color="gray.700" fontSize="md" mb={4}>
            As this is a{" "}
            <a href="https://en.wikipedia.org/wiki/Copyleft">copyleft</a>{" "}
            license, each distribution of the software, including modified and
            extended versions, is required to be free in the same sense as well.
            The{" "}
            <chakra.a href="https://www.gnu.org/licenses/agpl-3.0.html">
              AGPLv3
            </chakra.a>{" "}
            license is built on{" "}
            <chakra.a href="https://www.gnu.org/licenses/gpl-3.0.html">
              GPLv3
            </chakra.a>{" "}
            , with the addition that making the product available via a network
            service also counts as distribution. For a non-copyleft license,
            please contact us.
          </Text>
        </Box>
      </Box>

      <Box>
        <Heading as="h2" size="md" mb={4}>
          People
        </Heading>
        <Stack gap={3} mb={8}>
          {PEOPLE.map((p) => (
            <Flex
              key={p.id}
              gap={4}
              align="center"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
            >
              <Avatar person={p} />
              <Box minW={0} flex="1">
                <Text fontSize="md" mb={0}>
                  {p.name}
                </Text>
                <Text
                  color="gray.500"
                  fontFamily="monospace"
                  fontSize="xs"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                  mb={p.links ? 2 : 0}
                >
                  {p.role}
                </Text>
                <PersonLinkIcons links={p.links} email={p.email} />
              </Box>
            </Flex>
          ))}
        </Stack>

        <Heading as="h2" size="md" mb={4}>
          Alumni
        </Heading>
        <Stack gap={3} mb={8}>
          {ALUMNI.map((p) => (
            <Flex
              key={p.id}
              gap={4}
              align="center"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
            >
              <Avatar person={p} />
              <Box minW={0} flex="1">
                <Text fontSize="md" mb={0}>
                  {p.name}
                </Text>
                <Text
                  color="gray.500"
                  fontFamily="monospace"
                  fontSize="xs"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                  mb={p.links ? 2 : 0}
                >
                  {p.role}
                </Text>
                <PersonLinkIcons links={p.links} email={p.email} />
              </Box>
            </Flex>
          ))}
        </Stack>

        <Heading as="h2" size="md" mb={4}>
          Collaborators
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
          {COLLABORATORS.map((c) => (
            <Box
              key={c.name}
              bg="gray.50"
              borderRadius="md"
              px={3}
              py={2}
              fontSize="sm"
            >
              <Text as="strong" fontWeight={600}>
                {c.name}
              </Text>
              <Text as="span" color="gray.500">
                {" "}
                · {c.org}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </SimpleGrid>
  </Container>
);

export default AboutPage;
