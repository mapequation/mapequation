import {
  Box,
  Container,
  Drawer,
  Flex,
  Heading,
  HoverCard,
  HStack,
  IconButton,
  Portal,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { LuMenu, LuX } from "react-icons/lu";
import Logo from "../components/Logo";

interface NavItem {
  id: string;
  label: string;
  href: string;
  isInfomap?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { id: "infomap", label: "Infomap", href: "/infomap", isInfomap: true },
  { id: "apps", label: "Apps & Notebooks", href: "/apps" },
  //{ id: "tutorial", label: "Tutorial", href: "/demo" },
  { id: "publications", label: "Publications", href: "/publications" },
  { id: "about", label: "About", href: "/about" },
];

function topSection(pathname: string): string {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/infomap")) return "infomap";
  if (pathname.startsWith("/apps")) return "apps";
  //if (pathname.startsWith("/demo")) return "tutorial";
  if (pathname.startsWith("/publications")) return "publications";
  if (pathname.startsWith("/about")) return "about";
  return "";
}

const navLinkStyles = (active: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  px: 3,
  py: 2,
  borderRadius: "md",
  color: active ? "#b22222" : "gray.600",
  fontSize: "sm",
  fontWeight: active ? 600 : 400,
  textDecoration: "none",
  transition: "background 120ms, color 120ms",
  _hover: { bg: "blackAlpha.50", color: "gray.900" },
});

const NavLink = ({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) => (
  <Box asChild {...navLinkStyles(active)}>
    <NextLink href={href}>{children}</NextLink>
  </Box>
);

const MegaSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Stack gap={0}>
    <Heading
      as="h4"
      color="gray.500"
      fontFamily="monospace"
      fontSize="xs"
      letterSpacing="0.16em"
      textTransform="uppercase"
      fontWeight={400}
      mb={2}
    >
      {title}
    </Heading>
    {children}
  </Stack>
);

const MegaLink = ({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) => (
  <Box
    asChild
    display="block"
    px={2.5}
    py={2}
    borderRadius="md"
    color="gray.900"
    textDecoration="none"
    _hover={{ bg: "gray.100" }}
  >
    <NextLink href={href}>
      <Text as="strong" fontSize="sm" fontWeight={600} mb={0}>
        {label}
      </Text>
      <Text color="gray.500" fontSize="xs" mb={0} mt="2px">
        {desc}
      </Text>
    </NextLink>
  </Box>
);

// Chakra v3 HoverCard's Trigger/Content children prop is missing from
// the published types — runtime accepts children fine, just narrow.
const HoverTrigger = HoverCard.Trigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
>;
const HoverPositioner = HoverCard.Positioner as FC<PropsWithChildren>;
const HoverContent = HoverCard.Content as FC<
  PropsWithChildren<Record<string, unknown>>
>;

const InfomapMega = ({ active, href }: { active: boolean; href: string }) => (
  <HoverCard.Root
    openDelay={50}
    closeDelay={150}
    positioning={{ placement: "bottom" }}
  >
    <HoverTrigger asChild>
      <Box asChild {...navLinkStyles(active)}>
        <NextLink href={href}>
          Infomap
          <Box as="span" fontSize="sm" opacity={0.7} ml={1}>
            ▾
          </Box>
        </NextLink>
      </Box>
    </HoverTrigger>
    <HoverPositioner>
      <HoverContent
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow="lg"
        p={5}
        w="780px"
      >
        <SimpleGrid columns={2} gap={3}>
          <MegaSection title="Software">
            <MegaLink
              href="/infomap/workbench"
              label="Try it"
              desc="Run Infomap in your browser"
            />
            <MegaLink
              href="/infomap/install"
              label="Install"
              desc="Python · R · CLI · Docker"
            />
          </MegaSection>
          <MegaSection title="Documentation">
            <MegaLink
              href="/infomap/formats"
              label="Formats"
              desc="Input and output formats"
            />
            <MegaLink
              href="/infomap/how-it-works"
              label="How it works"
              desc="The map equation and the search algorithm"
            />
          </MegaSection>
        </SimpleGrid>
      </HoverContent>
    </HoverPositioner>
  </HoverCard.Root>
);

// Chakra v3's Drawer compound types omit `children` — runtime accepts it.
const DrawerCloseTrigger = Drawer.CloseTrigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
>;
const DrawerTrigger = Drawer.Trigger as FC<
  PropsWithChildren<{ asChild?: boolean }>
>;
const DrawerContent = Drawer.Content as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DrawerBody = Drawer.Body as FC<
  PropsWithChildren<Record<string, unknown>>
>;
const DrawerPositioner = Drawer.Positioner as FC<PropsWithChildren>;

const MobileNav = ({ active }: { active: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root
      size="full"
      placement="end"
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
    >
      <DrawerTrigger asChild>
        <IconButton aria-label="Open menu" variant="ghost" size="md">
          <LuMenu />
        </IconButton>
      </DrawerTrigger>
      <Portal>
        <Drawer.Backdrop />
        <DrawerPositioner>
          <DrawerContent bg="#f5f2f0">
            <Flex justify="flex-end" p={4}>
              <DrawerCloseTrigger asChild>
                <IconButton aria-label="Close menu" variant="ghost" size="md">
                  <LuX />
                </IconButton>
              </DrawerCloseTrigger>
            </Flex>
            <DrawerBody>
              <Stack as="nav" gap={2} mt={4}>
                {MAIN_NAV.map((item) => (
                  <Box
                    key={item.id}
                    asChild
                    display="block"
                    px={4}
                    py={3}
                    minH="44px"
                    borderRadius="md"
                    fontSize="xl"
                    fontWeight={active === item.id ? 600 : 400}
                    color={active === item.id ? "#b22222" : "gray.900"}
                    textDecoration="none"
                    _hover={{ bg: "blackAlpha.50" }}
                  >
                    <NextLink href={item.href} onClick={() => setOpen(false)}>
                      {item.label}
                    </NextLink>
                  </Box>
                ))}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </DrawerPositioner>
      </Portal>
    </Drawer.Root>
  );
};

export default function Header() {
  const router = useRouter();
  const top = topSection(router.pathname);

  return (
    <Box
      as="header"
      position={{ base: "static", md: "sticky" }}
      top={0}
      zIndex={50}
      bg="#f5f2f0"
      bgImage="linear-gradient(to bottom, rgba(100, 80, 50, 0.35) 0%, rgba(0, 0, 0, 0) 100%), url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACHUlEQVQ4T1XUCW5bMQwEUMn7cv8btmnqxLGT1vui4AkY4EeA8BeRwyGHVN38+d3G43GxW2tlMpmU2+1Wns9nWSwW5Xg8ltFoVB6PR7FWq1V/v1wuZTqdltls1r/v93v3qW+vLy1G1+u1gzLMYhgnjvZ6vS6Hw6HUWrv9fD7v7+fzudTPj/eG0XK57GzCCojNUUBngDgBAczndDr1ZzKsUpamH2EACDPgngCkLTA2QNjLRABPDPs+fO2b6Fg4BAbAO+dhPdVIWRCwwkpQAe263bw2yD7ChKOoDLEG4Okc6wTzz3vE6gx375sWhTgC4ugQOyuMvLNlk/SjtjLIrn7ttl2U1ISBVKXGEVuLje+0SECdC4hEb5v/n7sG3QdQikVJQAHkpCypl7P0J3AYylH/vvxqXoYNnTZK6tgKZqUTiJgSCGr3ftxv37ooqQkj32mXGEZ5QMoS4aJ6MuwqY+iHFBgDV2DGomKvwaUWgdIBAgjGtquc0UsPpiUAAx32oToBTHAEYhO1e8qZW3XS5EN1h+OFReo4nJxhRn30oqzotnQsABikPhFEwPRr1I5P/bf/6KOXuY2a6UdMpJoejBjqlbbiw74LShSFV3SgDqWAqUC5NHIGMO2k3rLzD/s+KQAZOJBiqOfSjVPEyiWQWvNxraU7+qRgl5+ZDE8tkbFMegDCVpAMxI/bRsqYOcwtDAjzlCA3cxpZTaN67k4kvgH79HB6cJuWywAAAABJRU5ErkJggg==')"
      bgRepeat="no-repeat, repeat"
      bgSize="auto, 10px 10px"
    >
      <Container>
        <Flex align="center" justify="space-between" py={3} minW={0} gap={4}>
          <Box flexShrink={0}>
            <Logo size={38} />
          </Box>

          <HStack
            as="nav"
            columnGap={2}
            rowGap={0}
            flexWrap="wrap"
            display={{ base: "none", md: "flex" }}
          >
            {MAIN_NAV.map((item) => {
              const active = top === item.id;
              if (item.isInfomap) {
                return (
                  <InfomapMega key={item.id} active={active} href={item.href} />
                );
              }
              return (
                <NavLink key={item.id} href={item.href} active={active}>
                  {item.label}
                </NavLink>
              );
            })}
          </HStack>

          <Box display={{ base: "block", md: "none" }}>
            <MobileNav active={top} />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
