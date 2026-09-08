import { Chip } from "@heroui/react/chip";

import { InlineContent } from "@/components/overview/InlineContent";
import {
  canonicalTargets,
  inspectorTargets,
  supportFooter,
  supportIntro,
  supportModules,
} from "@/components/overview/content/support-matrix";

type ModuleTier = (typeof supportModules)[number]["tier"];

function TierChip({ tier }: { tier: ModuleTier }) {
  if (tier === "Stable track") {
    return (
      <Chip color="success" size="sm" variant="soft">
        <span aria-hidden="true" className="store-status-dot" />
        <Chip.Label>{tier}</Chip.Label>
      </Chip>
    );
  }

  return (
    <Chip color="warning" size="sm" variant="soft">
      <span aria-hidden="true" className="store-status-dot" />
      <Chip.Label>{tier}</Chip.Label>
    </Chip>
  );
}

export function SupportMatrix() {
  return (
    <section aria-label="Store 6 modules and targets" className="my-6 min-w-0">
      <p id="module-tier-guidance" className="text-sm leading-6 text-foreground-secondary">
        <InlineContent tokens={supportIntro} />
      </p>
      <ul className="my-5 list-none divide-y divide-border p-0" aria-label="Modules">
        {supportModules.map((entry) => (
          <li key={entry.module} id={entry.module} className="min-w-0 py-5" aria-describedby="module-tier-guidance">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <code className="store-inline-code break-all text-sm font-semibold">{entry.module}</code>
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
        <InlineContent tokens={supportFooter} />
      </p>
    </section>
  );
}
