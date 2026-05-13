import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface AppCardProps {
  href: string;
  title: string;
  description?: string;
  image: string;
  imageAlt?: string;
  imagePosition?: string;
  imageSize?: string;
  external?: boolean;
  children?: ReactNode;
}

export default function AppCard({
  href,
  title,
  description,
  image,
  imageAlt = "",
  imagePosition = "center",
  imageSize = "cover",
  external = true,
}: AppCardProps) {
  return (
    <Stack as="article" gap={3} bg="transparent" transition="transform 150ms">
      <Link
        asChild
        _hover={{ textDecoration: "none" }}
        role="group"
        display="block"
      >
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          <Box
            aspectRatio="16 / 9"
            borderRadius="md"
            bg="white"
            boxShadow="sm"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            transition="box-shadow 150ms, border-color 150ms"
            _groupHover={{
              boxShadow: "md",
              borderColor: "rgba(18, 139, 194, 0.4)",
            }}
            style={{
              background: `white url(${image}) no-repeat ${imagePosition} / ${imageSize}`,
            }}
            role="img"
            aria-label={imageAlt}
          />
        </a>
      </Link>

      <Heading as="h3" textStyle="h2" color="gray.900" mb={0}>
        {title}
      </Heading>

      {description && (
        <Text color="gray.700" fontSize="sm" mb={0} lineHeight={1.55}>
          {description}
        </Text>
      )}

      <Box>
        <Link asChild fontSize="sm" fontWeight={600} color="#128bc2">
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            Launch →
          </a>
        </Link>
      </Box>
    </Stack>
  );
}
