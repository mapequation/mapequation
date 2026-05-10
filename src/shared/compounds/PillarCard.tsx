import { Box, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";

const PillarCard = ({
  href,
  eyebrow,
  title,
  text,
  cta,
}: {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  cta?: string;
}) => (
  <NextLink href={href}>
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={5}
      h="100%"
      transition="border-color 150ms"
      _hover={{ borderColor: "gray.400" }}
    >
      <Text
        color="gray.500"
        fontFamily="monospace"
        fontSize="xs"
        letterSpacing="0.1em"
        textTransform="uppercase"
        mb={2}
      >
        {eyebrow}
      </Text>
      <Heading as="h3" size="md" mb={2}>
        {title}
      </Heading>
      <Text color="gray.700" fontSize="sm" mb={cta ? 3 : 0}>
        {text}
      </Text>
      {cta && (
        <Text color="#128bc2" fontWeight={600} fontSize="sm" mb={0}>
          {cta} →
        </Text>
      )}
    </Box>
  </NextLink>
);

export default PillarCard;
