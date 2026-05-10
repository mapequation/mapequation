import {
  Box,
  Container,
  chakra,
  Flex,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import EmailLink from "../components/EmailLink";
import Logo from "../components/Logo";
import { PortalEyebrow } from "./portal";

const linkStyles = {
  color: "gray.700",
  fontSize: "sm",
  textDecoration: "none",
  _hover: { color: "#128bc2" },
};

const FootLink = ({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) =>
  external ? (
    <chakra.a href={href} target="_blank" rel="noreferrer" {...linkStyles}>
      {children}
    </chakra.a>
  ) : (
    <Box asChild {...linkStyles}>
      <NextLink href={href}>{children}</NextLink>
    </Box>
  );

export default function Footer() {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderTopColor="gray.200"
      bg="white"
      pt={10}
      pb={7}
      mt={16}
    >
      <Container>
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 4 }}
          gap={8}
          alignItems="start"
        >
          <Box>
            <Logo size={36} />
            <Text fontSize="sm" color="gray.600" maxW="34ch" mt={4} mb={0}>
              A research framework for understanding flows on networks.
            </Text>
          </Box>
          <Box>
            <PortalEyebrow>Software</PortalEyebrow>
            <Stack gap={2}>
              <FootLink href="/infomap">Infomap</FootLink>
              <FootLink href="/apps">Apps &amp; Notebooks</FootLink>
            </Stack>
          </Box>
          <Box>
            <PortalEyebrow>Research</PortalEyebrow>
            <Stack gap={2}>
              <FootLink href="/publications">Publications</FootLink>
              <FootLink href="/about">About</FootLink>
            </Stack>
          </Box>
          <Box>
            <PortalEyebrow>Packages</PortalEyebrow>
            <Stack gap={2}>
              <FootLink href="https://github.com/mapequation/infomap" external>
                GitHub ↗
              </FootLink>
              <FootLink href="https://pypi.org/project/infomap/" external>
                PyPI ↗
              </FootLink>
              <FootLink
                href="https://mapequation.r-universe.dev/infomap"
                external
              >
                R-universe ↗
              </FootLink>
              <FootLink
                href="https://www.npmjs.com/package/@mapequation/infomap"
                external
              >
                npm ↗
              </FootLink>
            </Stack>
          </Box>
        </SimpleGrid>
        <Flex
          mt={8}
          pt={5}
          borderTopWidth="1px"
          borderTopColor="gray.200"
          justify="space-between"
          color="gray.500"
          fontSize="xs"
          flexWrap="wrap"
          gap={2}
        >
          <Text mb={0}>© 2008–{new Date().getFullYear()} mapequation.org</Text>
          <Text mb={0}>
            Contact{" "}
            <EmailLink
              user="martin.rosvall"
              domain="umu.se"
              color="gray.500"
              textDecoration="none"
              _hover={{ color: "#128bc2" }}
            />
            {" · "}
            Made at Umeå University
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}
