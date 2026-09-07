"use client";

import { useState } from "react";
import type { ComponentFixture } from "@/components/docs/mintlify/fixture-contract";

import { fixtures as statusFixtures } from "@/components/docs/mintlify/status/fixtures";
import { fixtures as disclosureFixtures } from "@/components/docs/mintlify/disclosure/fixtures";
import { fixtures as layoutFixtures } from "@/components/docs/mintlify/layout/fixtures";
import { fixtures as codeFixtures } from "@/components/docs/mintlify/code/fixtures";
import { fixtures as overlaysFixtures } from "@/components/docs/mintlify/overlays/fixtures";
import { fixtures as diagramsFixtures } from "@/components/docs/mintlify/diagrams/fixtures";

export const fixtures: ComponentFixture[] = [...statusFixtures, ...disclosureFixtures, ...layoutFixtures, ...codeFixtures, ...overlaysFixtures, ...diagramsFixtures];

export function ClientFixtures() {
  const [count, setCount] = useState(0);
  return <div className="space-y-8">
    <section id="fixture-client-boundary"><h2>Client boundary</h2><button className="rounded-lg border border-muted px-4 py-2" onClick={() => setCount(count + 1)}>Fixture count: {count}</button></section>
    {fixtures.map(fixture => <section className="min-w-0 space-y-3 border-t border-border py-6" id={fixture.id} key={fixture.id} data-fixture={fixture.id} data-export={fixture.name}>
      <h2 className="text-xl font-semibold">{fixture.name}</h2><p className="text-muted">{fixture.description}</p>{fixture.render()}
    </section>)}
  </div>;
}
