/** Release information appears once in the Store 6 reading shell. */
export function Store6Banner() {
  return (
    <div
      aria-label="Store 6 development status"
      className="bg-surface-secondary text-foreground-secondary px-4 py-2 text-center text-xs leading-5"
      role="note"
    >
      In development. Nothing in Store 6 is published yet.
    </div>
  );
}
