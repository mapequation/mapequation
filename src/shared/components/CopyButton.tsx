import { Button, type ButtonProps, VisuallyHidden } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";

type Props = {
  text: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  ariaLabel,
  size = "xs",
  variant = "surface",
}: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      aria-label={ariaLabel ?? `${label} to clipboard`}
      onClick={async () => {
        if (typeof navigator === "undefined" || !navigator.clipboard) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <LuCheck /> : <LuCopy />}
      <span>{copied ? copiedLabel : label}</span>
      <VisuallyHidden aria-live="polite">
        {copied ? `${copiedLabel}.` : ""}
      </VisuallyHidden>
    </Button>
  );
}
