import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Chip } from "@heroui/react/chip";
import { Link } from "@heroui/react/link";

import { startHereItems } from "@/components/overview/content/start-here";

export function StartHereList() {
  return (
    <nav aria-label="Start here" className="my-6">
      <ul className="divide-y divide-separator border-y border-separator">
        {startHereItems.map((item) => (
          <li className="space-y-2 px-1 py-4" key={item.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{item.title}</span>
              {item.experimental ? (
                <Chip color="warning" size="sm" variant="soft">
                  <span aria-hidden="true" className="store-status-dot" />
                  <Chip.Label>Experimental</Chip.Label>
                </Chip>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-foreground-secondary">{item.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {item.links.map((link) => (
                <Link
                  className="inline-flex items-center gap-1 text-sm font-medium no-underline hover:no-underline"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                  <Link.Icon className="size-3.5 shrink-0"><HugeiconsIcon aria-hidden="true" className="size-3.5" icon={ArrowUpRight01Icon} strokeWidth={1.5} /></Link.Icon>
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
