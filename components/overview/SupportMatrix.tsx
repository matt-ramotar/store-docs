import { Chip } from "@heroui/react/chip";
import { Link } from "@heroui/react/link";
import { Table } from "@heroui/react/table";

const canonicalTargets =
  "Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.";

const inspectorTargets =
  "Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.";

const modules = [
  {
    module: "store6-core",
    tier: "Stable track",
    release: "alpha01",
    targets: canonicalTargets,
    detail: "The API is not frozen until the beta01 freeze candidate.",
  },
  {
    module: "store6-testing",
    tier: "Experimental",
    release: "alpha01",
    targets: canonicalTargets,
    detail: undefined,
  },
  {
    module: "store6-mutations",
    tier: "Experimental",
    release: "alpha01",
    targets: canonicalTargets,
    detail: undefined,
  },
  {
    module: "store6-compose",
    tier: "Experimental",
    release: "alpha01, may slip one alpha",
    targets: canonicalTargets,
    detail: undefined,
  },
  {
    module: "store6-sqldelight",
    tier: "Experimental",
    release: "alpha01, may slip one alpha",
    targets:
      "Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows; JS and Wasm are compile-only.",
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
    targets: canonicalTargets,
    detail: undefined,
  },
  {
    module: "store6-devtools-inspector",
    tier: "Experimental",
    release: "alpha02 (target)",
    targets: inspectorTargets,
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
    <>
      <Table className="my-6" variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="Store 6 modules and targets" className="min-w-[760px]">
            <Table.Header>
              <Table.Column className="text-foreground-secondary" isRowHeader>
                Module
              </Table.Column>
              <Table.Column className="text-foreground-secondary">API tier</Table.Column>
              <Table.Column className="text-foreground-secondary">Release target</Table.Column>
              <Table.Column className="text-foreground-secondary">Targets</Table.Column>
            </Table.Header>
            <Table.Body>
              {modules.map((entry) => (
                <Table.Row key={entry.module} id={entry.module}>
                  <Table.Cell>
                    <code className="text-sm font-semibold">{entry.module}</code>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1" data-tier-guidance={entry.module}>
                      <TierChip tier={entry.tier} />
                      <p className="flex flex-wrap gap-x-2 text-xs leading-5">
                        <Link
                          aria-label={`${entry.module} stability policy`}
                          href="/docs/store6/stability"
                        >
                          Stability
                        </Link>
                        <Link
                          aria-label={`${entry.module} API tier guidance`}
                          href="/docs/store6/concepts/api-tiers"
                        >
                          API tiers
                        </Link>
                      </p>
                      {entry.detail ? (
                        <p className="max-w-52 text-xs leading-5 text-foreground-secondary">
                          {entry.detail}
                        </p>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{entry.release}</Table.Cell>
                  <Table.Cell>{entry.targets}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <p className="my-6 text-sm leading-6 text-foreground-secondary">
        Browse the <Link href="/reference/store6-core/index.html">store6-core API reference</Link>{" "}
        for the core surface.
      </p>
    </>
  );
}
