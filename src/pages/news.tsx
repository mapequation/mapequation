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
      <Heading as="h1" textStyle="h1">
        Releases, papers, and project updates
      </Heading>
      <Text color="gray.700" textStyle="body" maxW="42rem">
        Follow new Infomap releases, method papers, tutorials, and updates from
        the Map Equation team.
      </Text>
    </Stack>
    <NewsList items={items} />
  </Container>
);

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { items: loadNews() },
});

export default NewsPage;
