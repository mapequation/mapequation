import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { LuArrowRight } from "react-icons/lu";

export const PortalEyebrow = ({ children }: { children: ReactNode }) => (
  <Text
    color="gray.500"
    fontFamily="monospace"
    fontSize="xs"
    letterSpacing="0.1em"
    textTransform="uppercase"
    mb={3}
  >
    {children}
  </Text>
);

export const PortalSection = ({
  id,
  eyebrow,
  title,
  href,
  linkText,
  extra,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  href?: string;
  linkText?: string;
  extra?: ReactNode;
  children: ReactNode;
}) => (
  <Box as="section" id={id} mt={{ base: 10, md: 12 }}>
    {eyebrow && <PortalEyebrow>{eyebrow}</PortalEyebrow>}
    <Flex
      align={{ base: "flex-start", md: "baseline" }}
      justify="space-between"
      gap={4}
      direction={{ base: "column", md: "row" }}
      mb={5}
    >
      <Heading as="h2" size="md">
        {title}
      </Heading>
      {(extra || (href && linkText)) && (
        <Flex align="baseline" gap={4} flexWrap="wrap">
          {extra}
          {href && linkText && (
            <Link asChild fontSize="sm" fontWeight={600}>
              <NextLink href={href}>
                {linkText} <LuArrowRight />
              </NextLink>
            </Link>
          )}
        </Flex>
      )}
    </Flex>
    {children}
  </Box>
);
