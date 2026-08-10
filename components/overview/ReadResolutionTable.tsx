import { Alert, Chip, Table } from "@heroui/react";

const origins = [
  {
    label: "Origin.MEMORY",
    boundary: "Resident replay",
    meaning: "The collector receives a value already resident in this engine.",
    chipClass: "bg-store-origin-memory-soft text-foreground",
    dotClass: "bg-store-origin-memory",
  },
  {
    label: "Origin.SOT",
    boundary: "Persistence",
    meaning: "A hydrated or externally observed persisted row supplied the value.",
    chipClass: "bg-store-origin-sot-soft text-foreground",
    dotClass: "bg-store-origin-sot",
  },
  {
    label: "Origin.FETCHER",
    boundary: "Fetcher",
    meaning: "The configured fetcher produced or revalidated the authoritative value.",
    chipClass: "bg-store-origin-fetcher-soft text-foreground",
    dotClass: "bg-store-origin-fetcher",
  },
  {
    label: "Origin.OVERLAY",
    boundary: "Stream projection",
    meaning: "An optimistic overlay projected the committed value for stream collectors.",
    chipClass: "bg-store-origin-overlay-soft text-foreground",
    dotClass: "bg-store-origin-overlay",
  },
] as const;

export function ReadResolutionTable() {
  return (
    <>
      <div aria-label="Origin legend" className="my-6 flex flex-wrap gap-2">
        {origins.map((origin) => (
          <Chip key={origin.label} className={origin.chipClass} size="sm" variant="soft">
            <span aria-hidden="true" className={`size-2 rounded-full ${origin.dotClass}`} />
            <Chip.Label>{origin.label}</Chip.Label>
          </Chip>
        ))}
      </div>

      <Table className="my-6" variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="Store 6 read origins" className="min-w-[640px]">
            <Table.Header>
              <Table.Column isRowHeader>Origin</Table.Column>
              <Table.Column>Resolution boundary</Table.Column>
              <Table.Column>Meaning</Table.Column>
            </Table.Header>
            <Table.Body>
              {origins.map((origin) => (
                <Table.Row key={origin.label} id={origin.label}>
                  <Table.Cell>
                    <code className="text-sm font-semibold">{origin.label}</code>
                  </Table.Cell>
                  <Table.Cell>{origin.boundary}</Table.Cell>
                  <Table.Cell>{origin.meaning}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Alert className="my-6" status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Important default</Alert.Title>
          <Alert.Description>
            Wall-clock age alone never makes <code>Freshness.CachedOrFetch</code> fetch. A fetch is
            planned when no resident value exists, freshness metadata is missing, the resident is
            invalidated, or durable status marks it stale. Use <code>Freshness.MaxAge</code> when
            elapsed age should participate in the decision.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="my-6 space-y-3 text-sm leading-6 text-foreground-secondary">
        <p>
          On the first cold stream after restart, a durably invalidated persisted row is served as
          <code> Data(origin=Origin.SOT, isStale=true, refreshing=true)</code>. If its refresh fails,
          the next lifecycle result is <code>Error(StoreError.Fetch, servedStale=true)</code>, with
          no intervening <code>Loading</code>, and the stream stays live.
        </p>
        <p>
          <code>Bookkeeper.recordFailure</code> completes before that fetch error is emitted.
          Hydration drops persisted ETags, so the first fetch sees <code>etag=null</code>. After the
          first hydrated emission, a later resident emission may use <code>Origin.MEMORY</code>.
        </p>
      </div>
    </>
  );
}
