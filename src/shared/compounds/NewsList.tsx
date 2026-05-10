import { Box, chakra, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { Tag } from "../components/Tag";
import type { NewsItem } from "../loadNews";

export default function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <Stack gap={0} divideY="1px" divideColor="gray.200">
      {items.map((n, i) => (
        <Flex
          key={i}
          gap={{ base: 3, md: 6 }}
          py={5}
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "flex-start" }}
        >
          <Flex
            w={{ md: "7rem" }}
            flexShrink={0}
            pt={1}
            align="center"
            gap={2}
          >
            {n.featured && (
              <Box
                w="6px"
                h="6px"
                borderRadius="full"
                bg="#b22222"
                flexShrink={0}
                aria-label="Featured"
              />
            )}
            <Text
              color="gray.500"
              fontFamily="monospace"
              fontSize="xs"
              letterSpacing="0.04em"
              textTransform="uppercase"
              mb={0}
            >
              {n.displayDate}
            </Text>
          </Flex>
          <Box w={{ md: "7rem" }} flexShrink={0}>
            <Tag>{n.type}</Tag>
          </Box>
          <Box flex="1" minW={0}>
            <Heading as="h3" size="sm" mb={1}>
              {n.href.startsWith("/") ? (
                <NextLink
                  href={n.href}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {n.title}
                </NextLink>
              ) : (
                <chakra.a
                  href={n.href}
                  target="_blank"
                  rel="noreferrer"
                  color="inherit"
                  _hover={{ color: "#128bc2" }}
                >
                  {n.title}
                </chakra.a>
              )}
            </Heading>
            <Box
              color="gray.700"
              fontSize="sm"
              css={{
                "& p": { margin: 0 },
                "& p + p": { marginTop: "0.5rem" },
                "& code": {
                  bg: "gray.100",
                  borderWidth: "1px",
                  borderColor: "gray.200",
                  borderRadius: "sm",
                  px: 1.5,
                  fontFamily: "monospace",
                  fontSize: "0.9em",
                },
              }}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown rendered at build time
              dangerouslySetInnerHTML={{ __html: n.descriptionHtml }}
            />
          </Box>
        </Flex>
      ))}
    </Stack>
  );
}
