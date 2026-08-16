/**
 * Development-status strip shown above the top nav on every store6 route,
 * modeled on the HeroUI announcement banner: a compact full-width bar whose
 * fill sits one step off the page background, with an accent pill and one
 * short centered line. Store 5 routes never render it.
 */
export function Store6Banner() {
  return (
    <div
      aria-label="Store 6 development status"
      className="bg-surface-secondary flex min-h-8 w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-4 py-1.5 text-center sm:h-8 sm:flex-nowrap sm:py-0"
      role="note"
    >
      <span className="bg-accent-soft text-accent-soft-foreground rounded-full px-2 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap">
        In development
      </span>
      <p className="text-foreground-secondary text-xs font-medium sm:text-[13px]">
        Nothing in Store 6 is published yet. Docs track{" "}
        <code className="bg-surface-tertiary text-foreground rounded px-1 py-px font-mono text-[0.9em]">
          main
        </code>, and install coordinates land with 6.0.0-alpha01.
      </p>
    </div>
  );
}
