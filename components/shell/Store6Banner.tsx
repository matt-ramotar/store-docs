/**
 * Development-status strip shown above the top nav on every store6 route,
 * modeled on the HeroUI announcement banner: a dark full-width bar with an
 * accent pill and one short centered line. Store 5 routes never render it.
 */
export function Store6Banner() {
  return (
    <div
      aria-label="Store 6 development status"
      className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 bg-red-400 px-4 py-2 text-center text-red-950"
      role="note"
    >
      <span className="rounded-full bg-red-950 px-2.5 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap text-red-300">
        In development
      </span>
      <p className="text-xs font-medium sm:text-[13px]">
        Nothing in Store 6 is published yet — docs track{" "}
        <code className="rounded bg-red-950/10 px-1 py-px font-mono text-[0.9em]">main</code>;
        install coordinates land with 6.0.0-alpha01.
      </p>
    </div>
  );
}
