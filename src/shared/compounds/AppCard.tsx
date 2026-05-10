import { Box, Heading, Link } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface AppCardProps {
  href: string;
  title: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  imageSize?: string;
  external?: boolean;
  children?: ReactNode;
}

export default function AppCard({
  href,
  title,
  image,
  imageAlt = "",
  imagePosition = "center",
  imageSize = "cover",
  external = true,
  children,
}: AppCardProps) {
  return (
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
        {image ? (
          <Box
            aspectRatio="16 / 10"
            borderRadius="md"
            bg="white"
            boxShadow="sm"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            transition="all 150ms"
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
        ) : (
          <Box
            aspectRatio="16 / 10"
            borderRadius="md"
            bg="white"
            boxShadow="sm"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            p={4}
            overflow="hidden"
            transition="all 150ms"
            _groupHover={{
              boxShadow: "md",
              borderColor: "rgba(18, 139, 194, 0.4)",
            }}
          >
            {children}
          </Box>
        )}
        <Heading
          as="h3"
          size="sm"
          mt={3}
          color="#128bc2"
          _groupHover={{ color: "#096992" }}
        >
          {title}{" "}
          <span aria-hidden="true" style={{ fontWeight: 400 }}>
            »
          </span>
        </Heading>
      </a>
    </Link>
  );
}
