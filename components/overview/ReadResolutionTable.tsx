import { Chip } from "@heroui/react/chip";
import { Table } from "@heroui/react/table";

import { Callout } from "@/components/docs/Callout";
import { InlineContent } from "@/components/overview/InlineContent";
import { readNotice, readOrigins, readParagraphs } from "@/components/overview/content/read-resolution";

export function ReadResolutionTable() {
  return (
    <>
      <ul aria-label="Origin legend" className="my-6 flex flex-wrap gap-2">
        {readOrigins.map((origin) => (
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
              {readOrigins.map((origin) => (
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

      <Callout title={readNotice.title} type={readNotice.type}>
        <InlineContent tokens={readNotice.body} />
      </Callout>

      <div className="my-6 space-y-3 text-sm leading-6 text-foreground-secondary">
        {readParagraphs.map((tokens, index) => (
          <p key={index}>
            <InlineContent tokens={tokens} />
          </p>
        ))}
      </div>
    </>
  );
}
