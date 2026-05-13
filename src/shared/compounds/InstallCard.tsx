import { Box, chakra, Flex, Stack, Tabs, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { CopyButton } from "../components/CopyButton";

const TabsRoot = Tabs.Root as ElementType;
const TabsList = Tabs.List as ElementType;
const TabsTrigger = Tabs.Trigger as ElementType;
const TabsContent = Tabs.Content as ElementType;

type InstallOption = {
  id: string;
  label: string;
  command: string;
  note: string;
  snippet?: string;
  links?: { label: string; href: string }[];
};

const installOptions: InstallOption[] = [
  {
    id: "python",
    label: "Python",
    command: "pip install infomap",
    note: "Recommended for most research workflows · Python 3.11+ · Windows / macOS / Linux wheels",
    links: [
      { label: "PyPI", href: "https://pypi.org/project/infomap/" },
      {
        label: "Python API docs",
        href: "https://mapequation.github.io/infomap-python-docs/",
      },
    ],
  },
  {
    id: "r",
    label: "R",
    command:
      'install.packages("infomap", repos = c("https://mapequation.r-universe.dev", "https://cloud.r-project.org"))',
    note: "For R analysis workflows · Pre-built binaries from r-universe",
    links: [
      {
        label: "r-universe",
        href: "https://mapequation.r-universe.dev/infomap",
      },
    ],
  },
  {
    id: "homebrew",
    label: "Homebrew",
    command: "brew install mapequation/infomap/infomap",
    note: "Native CLI for macOS and Linux workflows",
    links: [
      {
        label: "Homebrew tap",
        href: "https://github.com/mapequation/homebrew-infomap",
      },
    ],
  },
  {
    id: "docker",
    label: "Docker",
    command: "docker run ghcr.io/mapequation/infomap:latest",
    note: "Reproducible CLI runs from GitHub Container Registry",
    links: [
      {
        label: "ghcr.io/mapequation/infomap",
        href: "https://github.com/mapequation/infomap/pkgs/container/infomap",
      },
    ],
  },
  {
    id: "typescript",
    label: "TypeScript",
    command: "npm install @mapequation/infomap",
    note: "WebAssembly package for browser, Node.js, and TypeScript apps",
    links: [
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@mapequation/infomap",
      },
    ],
  },
  {
    id: "source",
    label: "Source",
    command: "make build-native",
    note: "Native CLI from source",
    links: [
      {
        label: "Latest GitHub release",
        href: "https://github.com/mapequation/infomap/releases/latest",
      },
    ],
  },
];

export default function InstallCard() {
  const router = useRouter();
  const [active, setActive] = useState<string>(installOptions[0].id);

  // Hydrate active tab from `?lang=` on mount and on URL change.
  useEffect(() => {
    const fromQuery =
      typeof router.query.lang === "string"
        ? installOptions.find((o) => o.id === router.query.lang)?.id
        : undefined;
    if (fromQuery && fromQuery !== active) setActive(fromQuery);
    // Intentionally watch only router.query.lang.
  }, [router.query.lang]);

  const onTabChange = (id: string) => {
    setActive(id);
    const next = { ...router.query, lang: id };
    router.replace({ pathname: router.pathname, query: next }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      overflow="hidden"
    >
      <TabsRoot
        value={active}
        onValueChange={(d: { value: string }) => onTabChange(d.value)}
      >
        <TabsList
          aria-label="Install options"
          gap={0}
          overflowX="auto"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
        >
          {installOptions.map((option) => (
            <TabsTrigger
              key={option.id}
              value={option.id}
              borderRadius={0}
              borderBottomWidth="3px"
              borderBottomColor="transparent"
              color="gray.500"
              fontWeight={400}
              px={{ base: 4, md: 7 }}
              h="64px"
              _hover={{ bg: "gray.50", color: "gray.900" }}
              _selected={{
                color: "gray.900",
                fontWeight: 700,
              }}
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {installOptions.map((option) => (
          <TabsContent key={option.id} value={option.id}>
            <Stack gap={5} py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }}>
              <Box
                bg="gray.100"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                py={2}
                px={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={4}
              >
                <chakra.code
                  border={0}
                  bg="transparent"
                  p={0}
                  fontSize={{ base: "sm", md: "md" }}
                  color="gray.900"
                >
                  {option.command}
                </chakra.code>
                <CopyButton
                  text={option.command}
                  size="sm"
                  ariaLabel={`Copy ${option.label} install command`}
                />
              </Box>

              <Flex
                justify="space-between"
                align="center"
                gap={4}
                flexWrap="wrap"
              >
                <Text color="gray.500" mb={0}>
                  {option.note}
                </Text>
                {option.links && option.links.length > 0 && (
                  <Flex gap={4} flexWrap="wrap">
                    {option.links.map((link) => (
                      <chakra.a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        fontSize="sm"
                        color="#128bc2"
                        textDecoration="none"
                        _hover={{
                          color: "#096992",
                          textDecoration: "underline",
                        }}
                      >
                        {link.label} ↗
                      </chakra.a>
                    ))}
                  </Flex>
                )}
              </Flex>
            </Stack>
          </TabsContent>
        ))}
      </TabsRoot>
    </Box>
  );
}
