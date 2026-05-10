import { Container, Heading, Stack, Text } from "@chakra-ui/react";
import type { GetStaticProps, NextPage } from "next";
import NewsList from "../shared/compounds/NewsList";
import { PortalEyebrow } from "../shared/compounds/portal";
import { loadNews, type NewsItem } from "../shared/loadNews";

interface Props {
  items: NewsItem[];
}

const NewsPage: NextPage<Props> = ({ items }) => (
  <Container>
    <Stack mt={{ base: 8, md: 12 }} mb={8} gap={4} align="flex-start">
      <PortalEyebrow>News</PortalEyebrow>
      <Heading as="h1" size="2xl" lineHeight={1.15}>
        Every release and every paper.
      </Heading>
      <Text color="gray.700" fontSize={{ base: "md", md: "lg" }} maxW="42rem">
        Software releases and every publication from the Map Equation team.
      </Text>
    </Stack>
    <NewsList items={items} />
  </Container>
);

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { items: loadNews() },
});

export default NewsPage;
