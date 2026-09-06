import type { ReactNode } from "react";

/** Executable fixtures stay in the client module graph; ledgers contain metadata only. */
export interface ComponentFixture {
  id: string;
  name: string;
  description: string;
  assertions: string[];
  render: () => ReactNode;
}

export type Fixture = ComponentFixture;
