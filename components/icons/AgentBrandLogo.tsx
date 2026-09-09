type AgentBrand = "cursor" | "claude" | "openai" | "vscode";

/** Official artwork; sources and ownership are recorded in public/brands/README.md. */
export function AgentBrandLogo({
  brand,
  size = 20,
  onDark = false,
}: {
  brand: AgentBrand;
  size?: number;
  onDark?: boolean;
}) {
  const src = brand === "cursor" && onDark
    ? "/brands/cursor-light.svg"
    : `/brands/${brand}.svg`;

  return (
    <img
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${onDark && brand === "claude" ? "brightness-0 invert" : onDark && brand === "openai" ? "invert" : ""}`}
      height={size}
      src={src}
      style={{ width: size, height: size }}
      width={size}
    />
  );
}
