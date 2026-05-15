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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      <ChakraProvider value={system}>
        <SiteLayout fillViewport={fillViewport}>
          <Component {...pageProps} />
        </SiteLayout>
      </ChakraProvider>
    </>
  );
}
