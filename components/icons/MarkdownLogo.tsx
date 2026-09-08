/**
 * Adapted from HeroUI's MarkdownIcon. Copyright 2025 NextUI Inc.
 * SVG geometry is unchanged; the wrapper fixes decorative accessibility and sizing.
 * Licensed under Apache-2.0; see ./MarkdownLogo.LICENSE.
 * Source: https://github.com/heroui-inc/heroui/blob/98553cefdc2ab4cdb36ed236f29e65bfe89449b8/apps/docs/src/icons/dev.tsx#L594-L612
 */
export function MarkdownLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      fill="currentColor"
      focusable="false"
      height={size}
      viewBox="0 0 16 16"
      width={size}
    >
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M3.44314 4.69872C3.22071 4.26947 2.77757 4 2.29412 4C1.5794 4 1 4.5794 1 5.29412V11.25C1 11.6642 1.33579 12 1.75 12C2.16421 12 2.5 11.6642 2.5 11.25V6.13892L4.33409 9.67839C4.463 9.92716 4.71982 10.0833 5 10.0833C5.28018 10.0833 5.537 9.92716 5.66591 9.67839L7.5 6.13892V11.25C7.5 11.6642 7.83579 12 8.25 12C8.66421 12 9 11.6642 9 11.25V5.29412C9 4.5794 8.4206 4 7.70588 4C7.22243 4 6.77929 4.26947 6.55686 4.69872L5 7.70319L3.44314 4.69872ZM13.25 4.75C13.25 4.33579 12.9142 4 12.5 4C12.0858 4 11.75 4.33579 11.75 4.75V9.43934L11.2803 8.96967C10.9874 8.67678 10.5126 8.67678 10.2197 8.96967C9.92678 9.26256 9.92678 9.73744 10.2197 10.0303L11.9697 11.7803C12.2626 12.0732 12.7374 12.0732 13.0303 11.7803L14.7803 10.0303C15.0732 9.73744 15.0732 9.26256 14.7803 8.96967C14.4874 8.67678 14.0126 8.67678 13.7197 8.96967L13.25 9.43934V4.75Z"
      />
    </svg>
  );
}
