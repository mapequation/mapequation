import { chakra } from "@chakra-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";

interface Props extends Omit<ComponentProps<typeof chakra.a>, "href"> {
  user: string;
  domain: string;
  children?: ReactNode;
}

/**
 * Renders an obfuscated mailto link. Until JavaScript hydrates, the address
 * shows as `user [at] domain` and href points to "#" — bots scraping HTML
 * never see the raw address. After mount, both are replaced with the real
 * email so a click opens the user's mail client.
 */
export default function EmailLink({
  user,
  domain,
  children,
  ...rest
}: Props) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(true);
  }, []);

  const href = revealed ? `mailto:${user}@${domain}` : "#";
  const fallback = `${user} [at] ${domain}`;

  return (
    <chakra.a href={href} {...rest}>
      {children ?? (revealed ? `${user}@${domain}` : fallback)}
    </chakra.a>
  );
}
