import { chakra, HStack } from "@chakra-ui/react";
import NextLink from "next/link";

interface Props {
  size?: number;
  href?: string;
}

export default function Logo({ size = 40, href = "/" }: Props) {
  return (
    <NextLink href={href}>
      <HStack gap={2.5} color="gray.900" textDecoration="none">
        <chakra.img
          src="/twocolormapicon_whiteboarder.svg"
          alt=""
          width={`${size}px`}
          height={`${size}px`}
          display="block"
          flexShrink={0}
        />
        <chakra.span
          fontFamily="Philosopher, serif"
          fontSize={`${Math.round(size * 0.7)}px`}
          fontWeight={700}
          lineHeight={1}
          whiteSpace="nowrap"
        >
          <chakra.span color="gray.600">Map</chakra.span>
          <chakra.span color="#b22222">Equation</chakra.span>
        </chakra.span>
      </HStack>
    </NextLink>
  );
}
