import { Head, Html, Main, NextScript } from "next/document";

// GitHub Pages reserves /infomap for the infomap repository, so that repo can
// trampoline direct visits through /?redirect_to=/infomap back into this app.
const githubPagesInfomapRedirectScript = `
(function () {
  if (window.location.pathname !== "/") return;

  var target = new URLSearchParams(window.location.search).get("redirect_to");
  if (!target || !target.startsWith("/") || target.startsWith("//")) return;

  var url = new URL(target, window.location.origin);
  if (
    url.origin !== window.location.origin ||
    (url.pathname !== "/infomap" && !url.pathname.startsWith("/infomap/"))
  ) {
    return;
  }

  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Runs before hydration to avoid a GitHub Pages routing collision.
          dangerouslySetInnerHTML={{
            __html: githubPagesInfomapRedirectScript,
          }}
        />
        <meta
          name="description"
          content="MapEquation - Network community detection using the Map Equation framework"
        />
        <meta name="author" content="" />

        <meta property="og:title" content="MapEquation" />
        <meta property="og:site_name" content="mapequation.org" />
        <meta
          property="og:description"
          content="Network community detection using the Map Equation framework"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mapequation.org" />
        <meta
          property="og:image"
          content="https://www.mapequation.org/assets/img/icons/apple-touch-icon-144.png"
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="144" />
        <meta property="og:image:height" content="144" />
        <meta property="og:image:alt" content="MapEquation" />

        <link
          rel="shortcut icon"
          href="https://www.mapequation.org/assets/img/icons/favicon.ico"
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="https://www.mapequation.org/assets/img/icons/apple-touch-icon-57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="https://www.mapequation.org/assets/img/icons/apple-touch-icon-72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="https://www.mapequation.org/assets/img/icons/apple-touch-icon-114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="https://www.mapequation.org/assets/img/icons/apple-touch-icon-144.png"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
