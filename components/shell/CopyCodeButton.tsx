"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "success" | "error";

const resetDelay = 1600;

export function CopyCodeButton({ code }: { code: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAttempt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      activeAttempt.current += 1;
      if (announcementTimer.current !== null) clearTimeout(announcementTimer.current);
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyCode() {
    const attempt = activeAttempt.current + 1;
    activeAttempt.current = attempt;

    if (announcementTimer.current !== null) {
      clearTimeout(announcementTimer.current);
      announcementTimer.current = null;
    }
    if (resetTimer.current !== null) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setAnnouncement("");
    setCopyState("idle");

    try {
      const clipboard = navigator.clipboard;

      if (!clipboard || typeof clipboard.writeText !== "function") {
        presentResult("error", attempt);
        return;
      }

      await clipboard.writeText(code);
      presentResult("success", attempt);
    } catch {
      presentResult("error", attempt);
    }
  }

  function presentResult(result: Exclude<CopyState, "idle">, attempt: number) {
    if (!mounted.current || activeAttempt.current !== attempt) return;

    const message =
      result === "success"
        ? "Code copied."
        : "Copy failed. Select the code and copy it manually.";

    setCopyState(result);
    setAnnouncement("");
    announcementTimer.current = setTimeout(() => {
      setAnnouncement(message);
      announcementTimer.current = null;
    }, 0);
    resetTimer.current = setTimeout(() => {
      setCopyState("idle");
      setAnnouncement("");
      resetTimer.current = null;
    }, resetDelay);
  }

  const visibleLabel =
    copyState === "success" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy";

  return (
    <>
      <Button
        aria-label="Copy code"
        className="text-store-code-foreground data-[hovered=true]:bg-store-code-foreground/10"
        size="sm"
        variant="ghost"
        onPress={copyCode}
      >
        <span aria-hidden="true">{visibleLabel}</span>
      </Button>
      <span aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
