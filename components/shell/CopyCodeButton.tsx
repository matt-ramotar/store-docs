"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      className="text-store-code-foreground data-[hovered=true]:bg-store-code-foreground/10"
      size="sm"
      variant="ghost"
      onPress={copyCode}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
