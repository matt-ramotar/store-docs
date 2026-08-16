"use client";

import type { ReactNode } from "react";
import { Heading } from "@heroui/react/typography";

function mergeClassName(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

type MdxHeadingProps = {
  children?: ReactNode;
  className?: string;
  id?: string;
};

export function MdxH2({ className, ...props }: MdxHeadingProps) {
  return (
    <Heading
      {...props}
      className={mergeClassName("mt-12 mb-4 scroll-mt-24 text-foreground", className)}
      level={2}
    />
  );
}

export function MdxH3({ className, ...props }: MdxHeadingProps) {
  return (
    <Heading
      {...props}
      className={mergeClassName("mt-10 mb-3 scroll-mt-24 text-foreground", className)}
      level={3}
    />
  );
}

export function MdxH4({ className, ...props }: MdxHeadingProps) {
  return (
    <Heading
      {...props}
      className={mergeClassName("mt-8 mb-3 scroll-mt-24 text-foreground", className)}
      level={4}
    />
  );
}

export function MdxH5({ className, ...props }: MdxHeadingProps) {
  return (
    <Heading
      {...props}
      className={mergeClassName("mt-8 mb-2 scroll-mt-24 text-foreground", className)}
      level={5}
    />
  );
}

export function MdxH6({ className, ...props }: MdxHeadingProps) {
  return (
    <Heading
      {...props}
      className={mergeClassName("mt-6 mb-2 scroll-mt-24 text-foreground", className)}
      level={6}
    />
  );
}
