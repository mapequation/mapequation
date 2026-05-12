import {
  Accordion,
  Box,
  Container,
  chakra,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetStaticProps, NextPage } from "next";
import type { FC, PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { FaRegFilePdf } from "react-icons/fa6";
import { SiGooglescholar } from "react-icons/si";
import { Tag } from "../shared/components/Tag";
import HowToCite from "../shared/compounds/HowToCite";
import { PortalEyebrow, PortalSection } from "../shared/compounds/portal";
import { loadPublications, type Publication } from "../shared/loadPublications";

interface Props {
  publications: Publication[];
}

// Chakra v3 Accordion types omit children — runtime accepts them, narrow the FCs.
const AccItem = Accordion.Item as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const AccTrigger = Accordion.ItemTrigger as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const AccContent = Accordion.ItemContent as FC<PropsWithChildren>;
const AccBody = Accordion.ItemBody as FC<
  PropsWithChildren<Record<string, unknown>>
>;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatPubDate(p: Publication): string {
  if (p.date) {
    const [y, m] = p.date.split("-").map(Number);
    if (y && m) return `${MONTHS[m - 1]} ${y}`;
  }
  return String(p.year);
}

const ActionLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <chakra.a
    href={href}
    target="_blank"
    rel="noreferrer"
    fontSize="sm"
    color="#128bc2"
    textDecoration="none"
    _hover={{ color: "#096992", textDecoration: "underline" }}
  >
    {children}
  </chakra.a>
);

const PublicationsAccordion = ({
  publications,
  value,
  onValueChange,
}: {
  publications: Publication[];
  value: string[];
  onValueChange: (next: string[]) => void;
}) => (
  <Accordion.Root
    collapsible
    variant="plain"
    value={value}
    onValueChange={(d) => onValueChange(d.value)}
  >
    {publications.map((p, i) => (
      <AccItem
        key={p.slug}
        value={p.slug}
        id={p.slug}
        scrollMarginTop="5rem"
        borderBottomWidth={i < publications.length - 1 ? "1px" : 0}
        borderBottomColor="gray.100"
      >
        <AccTrigger
          px={6}
          py={5}
          gap={{ base: 2, md: 6 }}
          textAlign="left"
          flexDirection={{ base: "column", md: "row" }}
          alignItems={{ base: "stretch", md: "flex-start" }}
          _hover={{ bg: "gray.50" }}
        >
          <Flex
            gap={3}
            align="center"
            w={{ base: "100%", md: "auto" }}
            flexShrink={0}
          >
            <Text
              color="gray.500"
              fontFamily="monospace"
              fontSize="xs"
              letterSpacing="0.04em"
              textTransform="uppercase"
              w={{ md: "7rem" }}
              flexShrink={0}
              mb={0}
            >
              {formatPubDate(p)}
            </Text>
            <Box w={{ md: "7rem" }} flexShrink={0}>
              <Tag>{p.category}</Tag>
            </Box>
          </Flex>
          <Box flex="1" minW={0} w={{ base: "100%", md: "auto" }}>
            <Text
              fontWeight={600}
              fontSize="sm"
              lineHeight={1.4}
              color="gray.900"
              mb={1}
            >
              {p.title}
            </Text>
            <Text color="gray.600" fontSize="sm" mb={0}>
              {p.authors}
            </Text>
          </Box>
          <Accordion.ItemIndicator />
        </AccTrigger>
        <AccContent>
          <AccBody px={6} pb={6} pt={0}>
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={{ base: 6, md: 12 }}
              align="flex-start"
            >
              <Box
                w={{ base: "100%", md: "calc(60% - 1.5rem)" }}
                flexShrink={0}
                minW={0}
                order={{ base: 1, md: 0 }}
              >
                {p.bodyHtml && (
                  <Box
                    color="gray.800"
                    fontSize="sm"
                    lineHeight={1.6}
                    css={{
                      "& p": { margin: 0 },
                      "& p + p": { marginTop: "0.75rem" },
                    }}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown rendered at build time
                    dangerouslySetInnerHTML={{ __html: p.bodyHtml }}
                  />
                )}
                <HStack gap={4} mt={p.bodyHtml ? 4 : 0} flexWrap="wrap">
                  {p.doiHref && p.journal && (
                    <ActionLink href={p.doiHref}>{p.journal} ↗</ActionLink>
                  )}
                  {!p.doiHref && p.journal && (
                    <Text color="gray.600" fontSize="sm" mb={0}>
                      {p.journal}
                    </Text>
                  )}
                  {p.arxiv && (
                    <ActionLink href={`https://arxiv.org/abs/${p.arxiv}`}>
                      arXiv:{p.arxiv}
                    </ActionLink>
                  )}
                  {p.pdfHref && (
                    <ActionLink href={p.pdfHref} aria-label="PDF">
                      <FaRegFilePdf size={16} />
                    </ActionLink>
                  )}
                  <ActionLink href={p.scholarHref} aria-label="Google Scholar">
                    <SiGooglescholar size={16} />
                  </ActionLink>
                  {p.links?.map((l) => (
                    <ActionLink key={l.href} href={l.href}>
                      {l.label} ↗
                    </ActionLink>
                  ))}
                </HStack>
              </Box>
              {p.figureSrc && (
                <Box
                  flexShrink={0}
                  w={{ base: "100%", md: "calc(40% - 1.5rem)" }}
                  alignSelf="flex-start"
                  order={{ base: 0, md: 1 }}
                >
                  <chakra.img
                    src={p.figureSrc}
                    alt={p.figure?.caption ?? p.title}
                    display="block"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "20rem",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  />
                  {p.figure?.caption && (
                    <Text
                      color="gray.500"
                      fontSize="xs"
                      mt={2}
                      mb={0}
                      lineHeight={1.5}
                    >
                      {p.figure.caption}
                    </Text>
                  )}
                </Box>
              )}
            </Flex>
          </AccBody>
        </AccContent>
      </AccItem>
    ))}
  </Accordion.Root>
);

const PublicationsPage: NextPage<Props> = ({ publications }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const featured = useMemo(
    () => publications.filter((p) => p.featured).slice(0, 6),
    [publications],
  );

  // Sync open accordion item with URL hash on mount + hashchange.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      if (publications.some((p) => p.slug === hash)) {
        setOpenItems([hash]);
        // Defer scroll until accordion opens.
        window.setTimeout(() => {
          document
            .getElementById(hash)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [publications]);

  return (
    <Container>
      <Stack mt={{ base: 8, md: 12 }} gap={4} align="flex-start">
        <PortalEyebrow>Publications</PortalEyebrow>
        <Heading as="h1" size="2xl" maxW="15ch" lineHeight={1.15}>
          Publications on the Map Equation framework.
        </Heading>
        <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} maxW="42rem">
          Every publication from the Map Equation team and collaborators.
        </Text>
      </Stack>

      <Box id="how-to-cite" mt={{ base: 10, md: 12 }} scrollMarginTop="6rem">
        <HowToCite />
      </Box>

      {featured.length > 0 && (
        <PortalSection eyebrow="Featured" title="Highlights">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {featured.map((p) => (
              <chakra.a
                key={p.slug}
                href={`#${p.slug}`}
                onClick={() => {
                  // Open before the browser scrolls so layout is final.
                  setOpenItems([p.slug]);
                }}
                display="flex"
                flexDirection="column"
                gap={2}
                h="100%"
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                textDecoration="none"
                color="inherit"
                transition="border-color 150ms"
                _hover={{ borderColor: "gray.400", textDecoration: "none" }}
              >
                <Flex gap={2} align="center">
                  <Tag>{p.year}</Tag>
                </Flex>
                <Heading as="h3" size="sm" mb={0} lineHeight={1.4}>
                  {p.title}
                </Heading>
                <Text color="gray.700" fontSize="xs" mb={0}>
                  {p.authors}
                </Text>
                {p.journal && (
                  <Text color="gray.500" fontSize="xs" mb={0}>
                    {p.journal}
                  </Text>
                )}
                {p.figureSrc && (
                  <Box mt={2}>
                    <chakra.img
                      src={p.figureSrc}
                      alt={p.figure?.caption ?? p.title}
                      display="block"
                      w="100%"
                      h="auto"
                    />
                  </Box>
                )}
                {p.figure?.caption && (
                  <Text color="gray.500" fontSize="xs" lineHeight={1.5} mb={0}>
                    {p.figure.caption}
                  </Text>
                )}
              </chakra.a>
            ))}
          </SimpleGrid>
        </PortalSection>
      )}

      <PortalSection title="All publications">
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          <PublicationsAccordion
            publications={publications}
            value={openItems}
            onValueChange={setOpenItems}
          />
        </Box>
      </PortalSection>
    </Container>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { publications: loadPublications() },
});

export default PublicationsPage;
