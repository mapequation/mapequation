import "../styles/globals.css";
import "@fontsource/philosopher/400.css";
import "@fontsource/philosopher/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import SiteLayout from "../shared/compounds/SiteLayout";
import system from "../theme";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const fillViewport = Boolean((Component as any).fillViewport);

  return (
    <>
      <Head>
        <title>MapEquation — research, software, and visualizations</title>
      </Head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=UA-27168379-1"
        onLoad={() => {
          window.dataLayer = window.dataLayer || [];

          window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);

          window.gtag("js", new Date());
          window.gtag("config", "UA-27168379-1");
        }}
      />

      <ChakraProvider value={system}>
        <SiteLayout fillViewport={fillViewport}>
          <Component {...pageProps} />
        </SiteLayout>
      </ChakraProvider>
    </>
  );
}
