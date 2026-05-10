import { Button } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  href: string;
}

export function PrimaryButton({ children, href }: PrimaryButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      {...{
        bg: "#b22222",
        color: "white",
        _hover: { bg: "#971d1d" },
        _active: { bg: "#7f1818" },
      }}
    >
      <NextLink href={href}>{children}</NextLink>
    </Button>
  );
}
