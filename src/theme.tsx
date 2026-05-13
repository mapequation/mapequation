import "@fontsource/philosopher/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { createSystem, defaultConfig } from "@chakra-ui/react";

const monoStack =
  "Monaco, Consolas, Inconsolata, Deja Vu Sans Mono, Droid Sans Mono, Andale Mono, Lucida Console, monospace";

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      fontFamily: "Open Sans, -apple-system, sans-serif",
      background:
        "#f5f2f0 url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACHUlEQVQ4T1XUCW5bMQwEUMn7cv8btmnqxLGT1vui4AkY4EeA8BeRwyGHVN38+d3G43GxW2tlMpmU2+1Wns9nWSwW5Xg8ltFoVB6PR7FWq1V/v1wuZTqdltls1r/v93v3qW+vLy1G1+u1gzLMYhgnjvZ6vS6Hw6HUWrv9fD7v7+fzudTPj/eG0XK57GzCCojNUUBngDgBAczndDr1ZzKsUpamH2EACDPgngCkLTA2QNjLRABPDPs+fO2b6Fg4BAbAO+dhPdVIWRCwwkpQAe263bw2yD7ChKOoDLEG4Okc6wTzz3vE6gx375sWhTgC4ugQOyuMvLNlk/SjtjLIrn7ttl2U1ISBVKXGEVuLje+0SECdC4hEb5v/n7sG3QdQikVJQAHkpCypl7P0J3AYylH/vvxqXoYNnTZK6tgKZqUTiJgSCGr3ftxv37ooqQkj32mXGEZ5QMoS4aJ6MuwqY+iHFBgDV2DGomKvwaUWgdIBAgjGtquc0UsPpiUAAx32oToBTHAEYhO1e8qZW3XS5EN1h+OFReo4nJxhRn30oqzotnQsABikPhFEwPRr1I5P/bf/6KOXuY2a6UdMpJoejBjqlbbiw74LShSFV3SgDqWAqUC5NHIGMO2k3rLzD/s+KQAZOJBiqOfSjVPEyiWQWvNxraU7+qRgl5+ZDE8tkbFMegDCVpAMxI/bRsqYOcwtDAjzlCA3cxpZTaN67k4kvgH79HB6cJuWywAAAABJRU5ErkJggg==')",
      backgroundSize: "10px 10px",
    },
    a: {
      color: "#128bc2",
      _hover: {
        color: "#096992",
      },
    },
    code: {
      fontFamily: monoStack,
      color: "gray.700",
      fontSize: "sm",
      px: "0.4em",
      borderRadius: "md",
      borderWidth: 1,
      borderColor: "gray.200",
      bg: "whiteAlpha.800",
      display: "inline-block",
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
    },
    p: {
      mb: 4,
    },
    '[data-scope="accordion"][data-part="item-content"]': {
      animation: "none !important",
      transition: "none !important",
    },
  },

  theme: {
    semanticTokens: {
      colors: {
        error: {
          value: "red.100",
        },
        warning: {
          value: "orange.50",
        },
        info: {
          value: "blue.50",
        },
      },
    },
    textStyles: {
      h1: {
        value: {
          fontFamily: '"Open Sans", -apple-system, sans-serif',
          fontWeight: 700,
          fontSize: { base: "35px", md: "40px" },
          lineHeight: 1.05,
          letterSpacing: "-0.005em",
        },
      },
      h2: {
        value: {
          fontFamily: '"Open Sans", -apple-system, sans-serif',
          fontWeight: 600,
          fontSize: { base: "24px", md: "28px" },
          lineHeight: 1.2,
        },
      },
      body: {
        value: {
          fontFamily: '"Open Sans", -apple-system, sans-serif',
          fontWeight: 400,
          fontSize: "18px",
          lineHeight: 1.55,
        },
      },
      meta: {
        value: {
          fontFamily: monoStack,
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: 1.5,
        },
      },
      code: {
        value: {
          fontFamily: monoStack,
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: 1.55,
        },
      },
    },
  },
});

export default system;
