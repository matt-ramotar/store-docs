import { Chip } from "@heroui/react/chip";
import { Link } from "@heroui/react/link";

const canonicalTargets =
  "Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.";

const inspectorTargets =
  "Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.";

const modules = [
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

type ModuleTier = (typeof modules)[number]["tier"];

function TierChip({ tier }: { tier: ModuleTier }) {
  if (tier === "Stable track") {
    return (
      <Chip color="success" size="sm" variant="soft">
        <Chip.Label>{tier}</Chip.Label>
      </Chip>
    );
  }

  return (
    <Chip color="warning" size="sm" variant="soft">
      <Chip.Label>{tier}</Chip.Label>
    </Chip>
  );
}

export function SupportMatrix() {
  return (
    <section aria-label="Store 6 modules and targets" className="my-6 min-w-0">
      <p id="module-tier-guidance" className="text-sm leading-6 text-foreground-secondary">
        Read the <Link href="/docs/store6/stability">Stability</Link> policy and{" "}
        <Link href="/docs/store6/concepts/api-tiers">API tiers</Link> guidance for these classifications.
      </p>
      <ul className="my-5 list-none divide-y divide-border p-0" aria-label="Modules">
        {modules.map((entry) => (
          <li key={entry.module} id={entry.module} className="min-w-0 py-5" aria-describedby="module-tier-guidance">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <code className="break-all text-sm font-semibold">{entry.module}</code>
              <TierChip tier={entry.tier} />
            </div>
            {entry.detail ? <p className="mt-2 text-sm leading-6 text-foreground-secondary">{entry.detail}</p> : null}
            <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="min-w-0"><dt className="text-xs font-semibold text-foreground-secondary">Release target</dt><dd className="mt-1 text-sm leading-6">{entry.release}</dd></div>
              <div className="min-w-0"><dt className="text-xs font-semibold text-foreground-secondary">Targets</dt><dd className="mt-1 text-sm leading-6" aria-describedby={entry.module === "store6-room" ? undefined : entry.module === "store6-devtools-inspector" ? "inspector-targets" : "canonical-targets"}>{entry.targets}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="space-y-2 text-sm leading-6 text-foreground-secondary" aria-label="Shared target groups">
        <p id="canonical-targets">{canonicalTargets}</p>
        <p id="inspector-targets">{inspectorTargets}</p>
      </div>
      <p className="my-6 text-sm leading-6 text-foreground-secondary">
        Browse the <Link href="/reference/store6-core/index.html">store6-core API reference</Link>{" "}
        for the core surface.
      </p>
    </section>
  );
}
