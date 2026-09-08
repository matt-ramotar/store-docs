import type { InlineToken } from "./inline";

export const canonicalTargets =
  "Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.";

export const inspectorTargets =
  "Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.";

export const supportModules = [
  {
    module: "store6-core",
    tier: "Stable track",
    release: "alpha01",
    targets: "Canonical 12",
    detail: "The API is not frozen until the beta01 freeze candidate.",
  },
  {
    module: "store6-testing",
    tier: "Experimental",
    release: "alpha01",
    targets: "Canonical 12",
    detail: undefined,
  },
  {
    module: "store6-mutations",
    tier: "Experimental",
    release: "alpha01",
    targets: "Canonical 12",
    detail: undefined,
  },
  {
    module: "store6-compose",
    tier: "Experimental",
    release: "alpha01, may slip one alpha",
    targets: "Canonical 12",
    detail: undefined,
  },
  {
    module: "store6-sqldelight",
    tier: "Experimental",
    release: "alpha01, may slip one alpha",
    targets:
      "Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows. JS and Wasm are compile-only.",
    detail: undefined,
  },
  {
    module: "store6-room",
    tier: "Experimental",
    release: "alpha01, may slip one alpha",
    targets:
      "Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.",
    detail: undefined,
  },
  {
    module: "store6-devtools",
    tier: "Experimental",
    release: "alpha02 (target)",
    targets: "Canonical 12",
    detail: undefined,
  },
  {
    module: "store6-devtools-inspector",
    tier: "Experimental",
    release: "alpha02 (target)",
    targets: "Inspector 8",
    detail: undefined,
  },
] as const;

export const supportIntro = [
  "Read the ",
  { href: "/docs/store6/stability", label: "Stability" },
  " policy and ",
  { href: "/docs/store6/concepts/api-tiers", label: "API tiers" },
  " guidance for these classifications.",
] as const satisfies readonly InlineToken[];

export const supportFooter = [
  "Browse the ",
  { href: "/reference/store6-core/index.html", label: "store6-core API reference" },
  " for the core surface.",
] as const satisfies readonly InlineToken[];
