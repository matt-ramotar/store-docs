import assert from "node:assert/strict";
import test from "node:test";

import { measureSample, parseColor } from "./measure-rendered-contrast.mjs";

test("composites foreground alpha and nested ancestor opacity before the white canvas", () => {
  const row = measureSample({
    id: "alpha-ancestor",
    fixture: "self-test",
    label: "Nested translucent text",
    kind: "text",
    foreground: "rgba(0, 0, 0, 0.5)",
    fontSize: "16px",
    fontWeight: "400",
    layers: [
      { backgroundColor: "rgb(255 0 0 / 50%)", opacity: "0.5", backgroundImage: "none" },
      { backgroundColor: "color(srgb 0 0 1 / 0.5)", opacity: "0.5", backgroundImage: "none" },
    ],
  });

  assert.equal(row.status, "fail");
  assert.equal(row.threshold, 4.5);
  assert.deepEqual(row.foregroundPixel, { r: 0.71875, g: 0.65625, b: 0.8125, a: 1 });
  assert.deepEqual(row.backgroundPixel, { r: 0.8125, g: 0.6875, b: 0.875, a: 1 });
  assert.ok(row.ratio > 1 && row.ratio < 4.5);
});

test("accepts finite positive numeric font sizes as captured CSS pixels", () => {
  const row = measureSample({
    id: "numeric-font-size",
    fixture: "self-test",
    label: "Large bold text",
    kind: "text",
    foreground: "rgb(0 0 0)",
    fontSize: 18.6667,
    fontWeight: "700",
    layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
  });
  assert.equal(row.threshold, 3);
  assert.equal(row.status, "pass");

  for (const fontWeight of [650, "650", 700.5, "700.5"]) {
    const variableWeight = measureSample({
      id: "variable-font-weight",
      fixture: "self-test",
      label: "Variable font text",
      kind: "text",
      foreground: "rgb(0 0 0)",
      fontSize: 18.6667,
      fontWeight,
      layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
    });
    assert.equal(variableWeight.threshold, Number(fontWeight) >= 700 ? 3 : 4.5);
    assert.equal(variableWeight.status, "pass");
  }

  for (const fontSize of [0, -1, Number.POSITIVE_INFINITY]) {
    const invalid = measureSample({
      id: "invalid-numeric-font-size",
      fixture: "self-test",
      label: "Invalid numeric size",
      kind: "text",
      foreground: "rgb(0 0 0)",
      fontSize,
      fontWeight: "400",
      layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
    });
    assert.equal(invalid.status, "indeterminate");
  }
  for (const fontWeight of [0, 1001, Number.POSITIVE_INFINITY, "1000.1"]) {
    const invalid = measureSample({
      id: "invalid-variable-font-weight",
      fixture: "self-test",
      label: "Invalid variable weight",
      kind: "text",
      foreground: "rgb(0 0 0)",
      fontSize: 16,
      fontWeight,
      layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
    });
    assert.equal(invalid.status, "indeterminate");
  }
});

test("converts in-gamut OKLab through the CSS Color 4 matrices and preserves alpha", () => {
  const white = parseColor("oklab(100% 0 0)");
  assert.ok(Math.abs(white.r - 1) < 1e-7);
  assert.ok(Math.abs(white.g - 1) < 1e-7);
  assert.ok(Math.abs(white.b - 1) < 1e-7);
  assert.equal(white.a, 1);

  const black = parseColor("oklab(0 0 0 / 25%)");
  assert.deepEqual(black, { r: 0, g: 0, b: 0, a: 0.25 });

  const captured = parseColor("oklab(0.972251 -0.00119099 0.00792855 / 0.5)");
  assert.equal(captured.a, 0.5);
  assert.ok([captured.r, captured.g, captured.b].every((channel) => channel >= 0 && channel <= 1));

  const outOfGamut = measureSample({
    id: "out-of-gamut-oklab",
    fixture: "self-test",
    label: "Unmapped OKLab",
    kind: "control",
    foreground: "oklab(0.7 0.4 0.4)",
    layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
  });
  assert.equal(outOfGamut.status, "indeterminate");
  assert.match(outOfGamut.reason, /out-of-sRGB-gamut/);
});

test("converts OKLCH polar coordinates to the same OKLab reference colors", () => {
  const polar = parseColor("oklch(0.7 0.1 60deg / 40%)");
  const cartesian = parseColor("oklab(0.7 0.05 0.08660254037844387 / 0.4)");
  for (const channel of ["r", "g", "b", "a"]) {
    assert.ok(Math.abs(polar[channel] - cartesian[channel]) < 1e-12, `${channel} differs`);
  }
  assert.equal(polar.a, 0.4);

  const percentChroma = parseColor("oklch(70% 25% 0 / 25%)");
  const numericChroma = parseColor("oklab(0.7 0.1 0 / 0.25)");
  for (const channel of ["r", "g", "b", "a"]) {
    assert.ok(Math.abs(percentChroma[channel] - numericChroma[channel]) < 1e-12, `${channel} differs`);
  }

  const angleReferences = [
    "oklch(0.7 0.05 180deg)",
    "oklch(0.7 0.05 200grad)",
    "oklch(0.7 0.05 3.141592653589793rad)",
    "oklch(0.7 0.05 0.5turn)",
  ].map(parseColor);
  for (const reference of angleReferences.slice(1)) {
    for (const channel of ["r", "g", "b", "a"]) {
      assert.ok(Math.abs(reference[channel] - angleReferences[0][channel]) < 1e-12, `${channel} angle differs`);
    }
  }

  const outOfGamut = measureSample({
    id: "out-of-gamut-oklch",
    fixture: "self-test",
    label: "Unmapped OKLCH",
    kind: "control",
    foreground: "oklch(0.7 0.4 40)",
    layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
  });
  assert.equal(outOfGamut.status, "indeterminate");
  assert.match(outOfGamut.reason, /out-of-sRGB-gamut/);
});

test("keeps unsupported images indeterminate and exceptions separate from calculation status", () => {
  const row = measureSample({
    id: "image-exception",
    fixture: "self-test",
    label: "Authored image control",
    kind: "control",
    foreground: "rgb(0 0 0)",
    inactive: false,
    authoredException: "Brand artwork",
    layers: [{ backgroundColor: "transparent", opacity: 1, backgroundImage: "linear-gradient(red, blue)" }],
  });

  assert.equal(row.status, "indeterminate");
  assert.equal(row.applicability, "authored-exception");
  assert.equal(row.authoredException, "Brand artwork");
  assert.match(row.reason, /backgroundImage/);

  const inactive = measureSample({
    id: "inactive-control",
    fixture: "self-test",
    label: "Inactive control",
    kind: "control",
    foreground: "rgb(0 0 0)",
    inactive: true,
    layers: [{ backgroundColor: "rgb(255 255 255)", opacity: 1, backgroundImage: "none" }],
  });
  assert.equal(inactive.contrastStatus, "pass");
  assert.equal(inactive.status, "inactive");
  assert.equal(inactive.applicability, "inactive");
});
