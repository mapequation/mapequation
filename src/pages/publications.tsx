import {
  Accordion,
  Box,
  Container,
  chakra,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetStaticProps, NextPage } from "next";
import type { FC, PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { FaRegFilePdf } from "react-icons/fa6";
import { LuX } from "react-icons/lu";
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
const DialogContent = Dialog.Content as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogBackdrop = Dialog.Backdrop as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogPositioner = Dialog.Positioner as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogBody = Dialog.Body as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogTitle = Dialog.Title as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogDescription = Dialog.Description as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DialogCloseTrigger = Dialog.CloseTrigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
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

const PublicationFigureModal = ({
  publication,
  onClose,
}: {
  publication?: Publication;
  onClose: () => void;
}) => (
  <Dialog.Root
    open={Boolean(publication)}
    onOpenChange={(details) => {
      if (!details.open) onClose();
    }}
    placement="center"
  >
    <Portal>
      <DialogBackdrop bg="blackAlpha.700" />
      <DialogPositioner p={{ base: 3, md: 6 }}>
        <DialogContent
          bg="white"
          borderRadius="md"
          boxShadow="2xl"
          color="gray.900"
          w="fit-content"
          maxW="calc(100vw - 2rem)"
          maxH="calc(100dvh - 2rem)"
          p={{ base: 3, md: 4 }}
          position="relative"
        >
          <DialogTitle srOnly>{publication?.title}</DialogTitle>
          <DialogCloseTrigger asChild>
            <IconButton
              aria-label="Close figure"
              position="absolute"
              top={2}
              right={2}
              size="sm"
              variant="ghost"
              color="gray.700"
              zIndex={1}
            >
              <LuX />
            </IconButton>
          </DialogCloseTrigger>
          <DialogBody
            p={0}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
          >
            {publication?.figureSrc && (
              <chakra.img
                src={publication.figureSrc}
                alt={publication.figure?.caption ?? publication.title}
                width={publication.figureWidth}
                height={publication.figureHeight}
                display="block"
                style={{
                  maxWidth: "min(72rem, calc(100vw - 4rem))",
                  maxHeight: publication.figure?.caption
                    ? "calc(100dvh - 11rem)"
                    : "calc(100dvh - 6rem)",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            )}
            {publication?.figure?.caption && (
              <DialogDescription
                color="gray.600"
                fontSize="sm"
                lineHeight={1.5}
                mb={0}
                maxW="min(72ch, calc(100vw - 4rem))"
              >
                {publication.figure.caption}
              </DialogDescription>
            )}
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </Portal>
  </Dialog.Root>
);

const PublicationsAccordion = ({
  publications,
  value,
  onValueChange,
  onFigureOpen,
}: {
  publications: Publication[];
  value: string[];
  onValueChange: (next: string[]) => void;
  onFigureOpen: (publication: Publication) => void;
}) => (
  <Accordion.Root
    collapsible
    variant="plain"
    value={value}
    onValueChange={(d) => onValueChange(d.value)}
  >
    {publications.map((p, i) => (
      <Box key={p.slug} id={p.slug} scrollMarginTop="7rem">
        <AccItem
          value={p.slug}
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
                    <ActionLink
                      href={p.scholarHref}
                      aria-label="Google Scholar"
                    >
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
                    <chakra.button
                      type="button"
                      aria-label={`Open figure for ${p.title}`}
                      onClick={() => onFigureOpen(p)}
                      display="block"
                      mx="auto"
                      p={0}
                      bg="transparent"
                      borderWidth="1px"
                      borderColor="transparent"
                      borderRadius="sm"
                      cursor="zoom-in"
                      transition="border-color 150ms, opacity 150ms"
                      _hover={{ borderColor: "gray.300", opacity: 0.9 }}
                      _focusVisible={{
                        outline: "2px solid",
                        outlineColor: "#128bc2",
                        outlineOffset: "3px",
                      }}
                    >
                      <chakra.img
                        src={p.figureSrc}
                        alt={p.figure?.caption ?? p.title}
                        width={p.figureWidth}
                        height={p.figureHeight}
                        loading="lazy"
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
                    </chakra.button>
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
      </Box>
    ))}
  </Accordion.Root>
);

const PublicationsPage: NextPage<Props> = ({ publications }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [figurePublication, setFigurePublication] = useState<Publication>();

  const featured = useMemo(
    () => publications.filter((p) => p.featured).slice(0, 6),
    [publications],
  );

  // Sync open accordion item with URL hash on mount + hashchange.
  useEffect(() => {
    const sync = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      if (!publications.some((p) => p.slug === hash)) return;
      setOpenItems([hash]);
      // Accordion animation is disabled via theme globalCss, so layout has
      // stabilized by the time React commits — one frame is enough.
      requestAnimationFrame(() => {
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [publications]);

  return (
    <Container>
      <Stack mt={{ base: 8, md: 12 }} gap={4} align="flex-start">
        <PortalEyebrow>Publications</PortalEyebrow>
        <Heading as="h1" textStyle="h1" maxW="20ch">
          Papers behind the Map Equation framework
        </Heading>
        <Text color="gray.700" textStyle="body" maxW="42rem">
          Find the core method papers, software citations, surveys, and
          application papers for flow-based community detection with Infomap.
        </Text>
      </Stack>

      <Box id="how-to-cite" mt={{ base: 10, md: 12 }} scrollMarginTop="6rem">
        <HowToCite />
      </Box>

      {featured.length > 0 && (
        <PortalSection eyebrow="Featured" title="Featured papers">
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
                      width={p.figureWidth}
                      height={p.figureHeight}
                      loading="lazy"
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

      <PortalSection title="All papers">
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
            onFigureOpen={setFigurePublication}
          />
        </Box>
      </PortalSection>
      <PublicationFigureModal
        publication={figurePublication}
        onClose={() => setFigurePublication(undefined)}
      />
    </Container>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { publications: loadPublications() },
});

export default PublicationsPage;
