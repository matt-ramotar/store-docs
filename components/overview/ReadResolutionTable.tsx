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
    boundary: "Source of truth",
    meaning: "A source-of-truth read or write supplied the confirmed value.",
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
    meaning: "An overlay projected over confirmed residence or confirmed absence for streams.",
    chipClass: "bg-store-origin-overlay-soft text-foreground",
    dotClass: "bg-store-origin-overlay",
  },
] as const;

export function ReadResolutionTable() {
  return (
    <>
      <ul aria-label="Origin legend" className="my-6 flex flex-wrap gap-2">
        {origins.map((origin) => (
          <li key={origin.label}>
            <Chip className={origin.chipClass} size="sm" variant="soft">
              <span aria-hidden="true" className={`size-2 rounded-full ${origin.dotClass}`} />
              <Chip.Label>{origin.label}</Chip.Label>
            </Chip>
          </li>
        ))}
      </ul>

      <Table className="my-6" variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="Store 6 read origins" className="min-w-[640px]">
            <Table.Header>
              <Table.Column className="text-foreground-secondary" isRowHeader>
                Origin
              </Table.Column>
              <Table.Column className="text-foreground-secondary">
                Resolution boundary
              </Table.Column>
              <Table.Column className="text-foreground-secondary">Meaning</Table.Column>
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
            With Store 6&apos;s default freshness validator, wall-clock age alone never makes
            <code> Freshness.CachedOrFetch</code> fetch. It fetches when no resident value exists,
            freshness metadata is missing, the resident is invalidated, or durable status marks it
            stale. Use <code>Freshness.MaxAge</code> when elapsed age should participate. A custom
            <code> FreshnessValidator</code> may plan differently, and
            <code> Freshness.MustBeFresh</code> follows different serving and failure rules.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="my-6 space-y-3 text-sm leading-6 text-foreground-secondary">
        <p>
          With Store 6&apos;s default freshness validator and
          <code> Freshness.CachedOrFetch</code>, the first cold stream after restart serves a durably
          invalidated persisted row as
          <code> Data(origin=Origin.SOT, isStale=true, refreshing=true)</code>. If its refresh fails,
          the stream emits <code>Error(StoreError.Fetch, servedStale=true)</code> without an
          intervening <code>Loading</code>, and the stream stays live.
        </p>
        <p>
          <code>Bookkeeper.recordFailure</code> completes before that fetch error is emitted.
          Hydrated resident metadata does not reuse the persisted ETag, so a fetch planned from that
          state sees <code>etag=null</code>. After the first hydrated emission, a later resident
          emission may use <code>Origin.MEMORY</code>.
        </p>
      </div>
    </>
  );
}
