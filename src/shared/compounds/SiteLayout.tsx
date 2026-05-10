import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";
import ErrorBoundary from "./ErrorBoundary";
import Footer from "./Footer";
import Header from "./Header";
import "katex/dist/katex.min.css";

interface Props {
  children: ReactNode;
  fillViewport?: boolean;
}

export default function SiteLayout({ children, fillViewport = false }: Props) {
  if (fillViewport) {
    return (
      <Box h="100dvh" overflow="hidden" display="flex" flexDirection="column">
        <Header />
        <Box
          as="main"
          flex="1"
          minH={0}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </Box>
      </Box>
    );
  }
  return (
    <Box minH="100dvh" display="flex" flexDirection="column">
      <Header />
      <Box as="main" flex="1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </Box>
      <Footer />
    </Box>
  );
}
