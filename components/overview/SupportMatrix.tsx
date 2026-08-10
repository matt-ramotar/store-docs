import { Chip, Table } from "@heroui/react";

const canonicalTargets =
  "Canonical 12: Android, JVM, JS, Wasm, three iOS variants, macOS, tvOS, watchOS, Linux, and Windows.";

const modules = [
  {
    module: "store6-core",
    tier: "Stable track",
    targets: canonicalTargets,
  },
  {
    module: "store6-testing",
    tier: "Experimental",
    targets: canonicalTargets,
  },
  {
    module: "store6-mutations",
    tier: "Experimental",
    targets: canonicalTargets,
  },
  {
    module: "store6-compose",
    tier: "Experimental",
    targets: canonicalTargets,
  },
  {
    module: "store6-sqldelight",
    tier: "Experimental",
    targets:
      "Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows; JS and Wasm are compile-only.",
  },
  {
    module: "store6-room",
    tier: "Experimental",
    targets:
      "Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.",
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
    <Table className="my-6" variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Store 6 modules and targets" className="min-w-[720px]">
          <Table.Header>
            <Table.Column isRowHeader>Module</Table.Column>
            <Table.Column>API tier</Table.Column>
            <Table.Column>Targets</Table.Column>
          </Table.Header>
          <Table.Body>
            {modules.map((entry) => (
              <Table.Row key={entry.module} id={entry.module}>
                <Table.Cell>
                  <code className="text-sm font-semibold">{entry.module}</code>
                </Table.Cell>
                <Table.Cell>
                  <TierChip tier={entry.tier} />
                </Table.Cell>
                <Table.Cell>{entry.targets}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
