#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };
const KINDS = new Set(["text", "focus", "control"]);

export function measureDocument(input, source = {}) {
  if (!input || !Array.isArray(input.samples)) throw new Error("input must contain a samples array");
  const rows = input.samples.map(measureSample);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source,
    counts: {
      samples: rows.length,
      pass: rows.filter(({ status }) => status === "pass").length,
      fail: rows.filter(({ status }) => status === "fail").length,
      indeterminate: rows.filter(({ status }) => status === "indeterminate").length,
      inactive: rows.filter(({ applicability }) => applicability === "inactive").length,
      authoredExceptions: rows.filter(({ authoredException }) => authoredException).length,
    },
    rows,
  };
}

export function measureSample(sample) {
  const base = {
    id: sample?.id,
    fixture: sample?.fixture,
    label: sample?.label,
    kind: sample?.kind,
    inactive: sample?.inactive === true,
    authoredException: sample?.authoredException ?? null,
  };
  const applicability = base.inactive
    ? "inactive"
    : base.authoredException
      ? "authored-exception"
      : "active";
  try {
    validateSample(sample);
    const foreground = parseColor(sample.foreground);
    let foregroundBranch = foreground;
    let backgroundBranch = TRANSPARENT;
    for (const [index, layer] of sample.layers.entries()) {
      if (hasBackgroundImage(layer.backgroundImage)) {
        throw new Indeterminate(`layers[${index}].backgroundImage is not none`);
      }
      const opacity = parseOpacity(layer.opacity, `layers[${index}].opacity`);
      const layerBackground = parseColor(layer.backgroundColor ?? "transparent");
      foregroundBranch = multiplyOpacity(composite(foregroundBranch, layerBackground), opacity);
      backgroundBranch = multiplyOpacity(composite(backgroundBranch, layerBackground), opacity);
    }
    const foregroundPixel = composite(foregroundBranch, WHITE);
    const backgroundPixel = composite(backgroundBranch, WHITE);
    const ratio = contrastRatio(foregroundPixel, backgroundPixel);
    const threshold = contrastThreshold(sample);
    const contrastStatus = ratio >= threshold ? "pass" : "fail";
    return {
      ...base,
      applicability,
      foregroundPixel,
      backgroundPixel,
      ratio,
      threshold,
      contrastStatus,
      status: applicability === "active" ? contrastStatus : applicability,
    };
  } catch (error) {
    if (!(error instanceof Indeterminate)) throw error;
    return {
      ...base,
      applicability,
      foregroundPixel: null,
      backgroundPixel: null,
      ratio: null,
      threshold: thresholdIfKnown(sample),
      contrastStatus: "indeterminate",
      status: "indeterminate",
      reason: error.message,
    };
  }
}

function validateSample(sample) {
  if (!sample || typeof sample !== "object") throw new Error("each sample must be an object");
  for (const field of ["id", "fixture", "label"]) {
    if (typeof sample[field] !== "string" || sample[field].length === 0) {
      throw new Error(`${field} must be a non-empty string`);
    }
  }
  if (!KINDS.has(sample.kind)) throw new Error(`${sample.id}: unsupported kind ${sample.kind}`);
  if (!Array.isArray(sample.layers)) throw new Error(`${sample.id}: layers must be an array`);
}

function contrastThreshold(sample) {
  if (sample.kind === "focus" || sample.kind === "control") return 3;
  const fontSize = parsePixelSize(sample.fontSize);
  const fontWeight = parseFontWeight(sample.fontWeight);
  return fontSize >= 24 || (fontSize >= 18.6667 && fontWeight >= 700) ? 3 : 4.5;
}

function thresholdIfKnown(sample) {
  try {
    return KINDS.has(sample?.kind) ? contrastThreshold(sample) : null;
  } catch (error) {
    if (error instanceof Indeterminate) return null;
    throw error;
  }
}

function parsePixelSize(value) {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value > 0) return value;
    throw new Indeterminate(`unsupported fontSize ${JSON.stringify(value)}`);
  }
  const match = String(value ?? "").trim().match(/^([0-9]+(?:\.[0-9]+)?)px$/i);
  if (!match || Number(match[1]) <= 0) throw new Indeterminate(`unsupported fontSize ${JSON.stringify(value)}`);
  return Number(match[1]);
}

function parseFontWeight(value) {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 1 && value <= 1000) return value;
    throw new Indeterminate(`unsupported fontWeight ${JSON.stringify(value)}`);
  }
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "normal") return 400;
  if (normalized === "bold") return 700;
  if (/^(?:[1-9]\d{0,2}|1000)(?:\.\d+)?$/.test(normalized)) {
    const numeric = Number(normalized);
    if (numeric >= 1 && numeric <= 1000) return numeric;
  }
  throw new Indeterminate(`unsupported fontWeight ${JSON.stringify(value)}`);
}

function hasBackgroundImage(value) {
  const normalized = String(value ?? "none").trim().toLowerCase();
  return normalized !== "" && normalized !== "none";
}

function parseOpacity(value, label) {
  const opacity = value === undefined || value === null || value === "" ? 1 : Number(value);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new Indeterminate(`unsupported ${label} ${JSON.stringify(value)}`);
  }
  return opacity;
}

export function parseColor(value) {
  const input = String(value ?? "").trim().toLowerCase();
  if (input === "transparent") return TRANSPARENT;
  const functionMatch = input.match(/^([a-z]+)\((.*)\)$/s);
  if (!functionMatch) throw new Indeterminate(`unsupported color ${JSON.stringify(value)}`);
  const [, name, body] = functionMatch;
  if (name === "rgb" || name === "rgba") return parseRgb(body, value);
  if (name === "color") return parseSrgb(body, value);
  if (name === "oklab") return parseOklab(body, value);
  if (name === "oklch") return parseOklch(body, value);
  throw new Indeterminate(`unsupported color ${JSON.stringify(value)}`);
}

function parseRgb(body, original) {
  let channels;
  let alpha = 1;
  if (body.includes(",")) {
    const parts = body.split(",").map((part) => part.trim());
    if (parts.length !== 3 && parts.length !== 4) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
    channels = parts.slice(0, 3);
    if (parts[3] !== undefined) alpha = parseAlpha(parts[3], original);
  } else {
    const [channelText, alphaText] = body.split("/").map((part) => part.trim());
    channels = channelText.split(/\s+/).filter(Boolean);
    if (alphaText !== undefined) alpha = parseAlpha(alphaText, original);
  }
  if (channels.length !== 3) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  return {
    r: parseRgbChannel(channels[0], original),
    g: parseRgbChannel(channels[1], original),
    b: parseRgbChannel(channels[2], original),
    a: alpha,
  };
}

function parseSrgb(body, original) {
  const match = body.trim().match(/^srgb\s+(.+?)(?:\s*\/\s*(\S+))?$/);
  if (!match) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  const channels = match[1].trim().split(/\s+/);
  if (channels.length !== 3) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  return {
    r: parseUnitChannel(channels[0], original),
    g: parseUnitChannel(channels[1], original),
    b: parseUnitChannel(channels[2], original),
    a: match[2] === undefined ? 1 : parseAlpha(match[2], original),
  };
}

function parseOklab(body, original) {
  const [channelText, alphaText] = body.split("/").map((part) => part.trim());
  const channels = channelText.split(/\s+/).filter(Boolean);
  if (channels.length !== 3 || body.split("/").length > 2) {
    throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  }
  const lightness = parseOklabChannel(channels[0], 1, original, true);
  const a = parseOklabChannel(channels[1], 0.4, original, false);
  const b = parseOklabChannel(channels[2], 0.4, original, false);
  const alpha = alphaText === undefined ? 1 : parseAlpha(alphaText, original);
  return convertOklabToSrgb(lightness, a, b, alpha, original);
}

function parseOklch(body, original) {
  const [channelText, alphaText] = body.split("/").map((part) => part.trim());
  const channels = channelText.split(/\s+/).filter(Boolean);
  if (channels.length !== 3 || body.split("/").length > 2) {
    throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  }
  const lightness = parseOklabChannel(channels[0], 1, original, true);
  const chroma = parseOklabChannel(channels[1], 0.4, original, false);
  if (chroma < 0) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  const hueRadians = parseHueRadians(channels[2], original);
  const alpha = alphaText === undefined ? 1 : parseAlpha(alphaText, original);
  return convertOklabToSrgb(
    lightness,
    chroma * Math.cos(hueRadians),
    chroma * Math.sin(hueRadians),
    alpha,
    original,
  );
}

function parseHueRadians(token, original) {
  const match = token.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i);
  if (!match) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  const value = Number(match[1]);
  if (!Number.isFinite(value)) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  const degrees = match[2]?.toLowerCase() === "grad"
    ? value * 0.9
    : match[2]?.toLowerCase() === "rad"
      ? value * 180 / Math.PI
      : match[2]?.toLowerCase() === "turn"
        ? value * 360
        : value;
  return degrees * Math.PI / 180;
}

function convertOklabToSrgb(lightness, a, b, alpha, original) {

  // CSS Color 4 sample conversion: OKLab -> D65 XYZ -> linear sRGB -> gamma sRGB.
  // https://www.w3.org/TR/css-color-4/#color-conversion-code
  const lms = multiplyMatrix([
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092],
  ], [lightness, a, b]).map((channel) => channel ** 3);
  const xyz = multiplyMatrix([
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
  ], lms);
  const linear = multiplyMatrix([
    [12831 / 3959, -329 / 214, -1974 / 3959],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
    [705 / 12673, -2585 / 12673, 705 / 667],
  ], xyz);
  const srgb = linear.map(gammaEncodeSrgb);
  // This tolerance absorbs only matrix floating-point noise at 0 and 1. Values beyond it
  // remain indeterminate; clampUnit is not used as a gamut-mapping algorithm.
  const epsilon = 1e-7;
  if (srgb.some((channel) => channel < -epsilon || channel > 1 + epsilon)) {
    throw new Indeterminate(`out-of-sRGB-gamut color ${JSON.stringify(original)}`);
  }
  return { r: clampUnit(srgb[0]), g: clampUnit(srgb[1]), b: clampUnit(srgb[2]), a: alpha };
}

function parseOklabChannel(token, percentageScale, original, clampLightness) {
  const number = token.endsWith("%")
    ? Number(token.slice(0, -1)) / 100 * percentageScale
    : Number(token);
  if (!Number.isFinite(number)) throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  return clampLightness ? Math.min(1, Math.max(0, number)) : number;
}

function multiplyMatrix(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function gammaEncodeSrgb(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  return absolute > 0.0031308
    ? sign * (1.055 * absolute ** (1 / 2.4) - 0.055)
    : 12.92 * value;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function parseRgbChannel(token, original) {
  if (token.endsWith("%")) return bounded(Number(token.slice(0, -1)) / 100, original);
  return bounded(Number(token) / 255, original);
}

function parseUnitChannel(token, original) {
  if (token.endsWith("%")) return bounded(Number(token.slice(0, -1)) / 100, original);
  return bounded(Number(token), original);
}

function parseAlpha(token, original) {
  return token.endsWith("%")
    ? bounded(Number(token.slice(0, -1)) / 100, original)
    : bounded(Number(token), original);
}

function bounded(number, original) {
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Indeterminate(`unsupported color ${JSON.stringify(original)}`);
  }
  return number;
}

export function composite(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return TRANSPARENT;
  return {
    r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
    g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
    b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
    a,
  };
}

function multiplyOpacity(color, opacity) {
  return { ...color, a: color.a * opacity };
}

function contrastRatio(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function luminance(color) {
  const channel = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

class Indeterminate extends Error {}

async function main() {
  const [inputArgument, outputArgument] = process.argv.slice(2);
  if (!inputArgument || process.argv.length > 4) {
    throw new Error("usage: measure-rendered-contrast.mjs <browser-samples.json> [report.json]");
  }
  const inputPath = resolve(inputArgument);
  const bytes = await readFile(inputPath);
  const input = JSON.parse(bytes.toString("utf8"));
  const report = measureDocument(input, {
    path: inputPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (outputArgument) await writeFile(resolve(outputArgument), output, "utf8");
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
