import "../styles/globals.css";
import "@fontsource/philosopher/400.css";
import "@fontsource/philosopher/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import { useEffect } from "react";
import SiteLayout from "../shared/compounds/SiteLayout";
import system from "../theme";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// GitHub Pages reserves /infomap for the infomap repository, so that repo can
// trampoline direct visits through /?redirect_to=/infomap back into this app.
const REDIRECT_TARGET_PREFIX = "/infomap";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getRedirectTarget() {
  const target = new URLSearchParams(window.location.search).get("redirect_to");

  if (!target?.startsWith("/") || target.startsWith("//")) {
    return null;
  }

  const url = new URL(target, window.location.origin);

  if (
    url.origin !== window.location.origin ||
    (url.pathname !== REDIRECT_TARGET_PREFIX &&
      !url.pathname.startsWith(`${REDIRECT_TARGET_PREFIX}/`))
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const fillViewport = Boolean((Component as any).fillViewport);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      return;
    }

    const target = getRedirectTarget();

    if (target) {
      void router.replace(target);
    }
  }, [router]);

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
