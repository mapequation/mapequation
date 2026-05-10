import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const Tag = ({ children }: { children: ReactNode }) => (
  <Box
    as="span"
    bg="gray.100"
    color="gray.600"
    borderRadius="sm"
    px={2}
    py={1}
    fontFamily="monospace"
    fontSize="xs"
  >
    {children}
  </Box>
);
