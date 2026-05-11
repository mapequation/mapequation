import { Box, Button, chakra, Flex, Stack, Tabs, Text } from "@chakra-ui/react";
import type { ElementType } from "react";
import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";

const TabsRoot = Tabs.Root as ElementType;
const TabsList = Tabs.List as ElementType;
const TabsTrigger = Tabs.Trigger as ElementType;
const TabsContent = Tabs.Content as ElementType;

type InstallOption = {
  label: string;
  command: string;
  note: string;
  links?: { label: string; href: string }[];
};

const installOptions: InstallOption[] = [
  {
    label: "Python",
    command: "pip install infomap",
    note: "Python 3.11+ · Windows / macOS / Linux wheels",
    links: [
      { label: "PyPI", href: "https://pypi.org/project/infomap/" },
      {
        label: "Python API docs",
        href: "https://mapequation.github.io/infomap-python-docs/",
      },
    ],
  },
  {
    label: "R",
    command:
      'install.packages("infomap", repos = c("https://mapequation.r-universe.dev", "https://cloud.r-project.org"))',
    note: "Pre-built R binaries from r-universe",
    links: [
      {
        label: "r-universe",
        href: "https://mapequation.r-universe.dev/infomap",
      },
    ],
  },
  {
    label: "Homebrew",
    command: "brew install mapequation/infomap/infomap",
    note: "Native CLI on macOS and Linux",
    links: [
      {
        label: "Homebrew tap",
        href: "https://github.com/mapequation/homebrew-infomap",
      },
    ],
  },
  {
    label: "Docker",
    command: "docker run ghcr.io/mapequation/infomap:latest",
    note: "Multi-architecture image from GitHub Container Registry",
    links: [
      {
        label: "ghcr.io/mapequation/infomap",
        href: "https://github.com/mapequation/infomap/pkgs/container/infomap",
      },
    ],
  },
  {
    label: "TypeScript",
    command: "npm install @mapequation/infomap",
    note: "WebAssembly package for browser and Node.js apps",
    links: [
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@mapequation/infomap",
      },
    ],
  },
  {
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
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      overflow="hidden"
    >
      <TabsRoot defaultValue={installOptions[0].label}>
        <TabsList
          aria-label="Install options"
          gap={0}
          overflowX="auto"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
        >
          {installOptions.map((option) => (
            <TabsTrigger
              key={option.label}
              value={option.label}
              borderRadius={0}
              borderBottomWidth="3px"
              borderBottomColor="transparent"
              color="gray.500"
              fontWeight={400}
              px={{ base: 4, md: 7 }}
              h="64px"
              _hover={{ bg: "gray.50", color: "gray.900" }}
              _selected={{
                //borderBottomColor: "red.500",
                color: "gray.900",
                fontWeight: 700,
              }}
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {installOptions.map((option) => (
          <TabsContent key={option.label} value={option.label}>
            <Stack gap={5} py={{ base: 4, md: 6 }} px={8}>
              <Box
                bg="gray.100"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                py={{ base: 2, md: 2 }}
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
                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  flexShrink={0}
                  onClick={async () => {
                    await navigator?.clipboard?.writeText(option.command);
                    setCopiedTab(option.label);
                  }}
                >
                  {copiedTab === option.label ? <LuCheck /> : <LuCopy />}
                  {copiedTab === option.label ? "Copied" : "Copy"}
                </Button>
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
