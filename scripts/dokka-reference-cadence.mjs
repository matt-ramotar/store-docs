import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FIRST_RELEASE_TAG = "6.0.0-alpha01";
const PRERELEASE_IDENTIFIER = String.raw`(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)`;
const BUILD_IDENTIFIER = String.raw`[0-9A-Za-z-]+`;
const STORE6_RELEASE_TAG = new RegExp(
  String.raw`^6\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)` +
    String.raw`(?:-${PRERELEASE_IDENTIFIER}(?:\.${PRERELEASE_IDENTIFIER})*)?` +
    String.raw`(?:\+${BUILD_IDENTIFIER}(?:\.${BUILD_IDENTIFIER})*)?$`,
);

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const decision = inspectCheckout(options);
    process.stdout.write(formatGitHubOutput(decision));
  } catch (error) {
    process.stderr.write(
      `dokka-reference cadence error: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}

export function decideReferenceCadence(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("cadence input must be an object");
  }
  const { eventName, firstReleaseExists, releaseTagsAtHead } = input;
  if (eventName !== "schedule" && eventName !== "workflow_dispatch") {
    throw new Error(
      `unsupported GitHub event: ${typeof eventName === "string" ? eventName : "<missing>"}`,
    );
  }
  if (typeof firstReleaseExists !== "boolean") {
    throw new Error("firstReleaseExists must be a boolean");
  }
  if (
    !Array.isArray(releaseTagsAtHead) ||
    releaseTagsAtHead.some((tag) => typeof tag !== "string")
  ) {
    throw new Error("releaseTagsAtHead must be an array of tag names");
  }

  if (!firstReleaseExists) {
    return { mode: "main-tracking", process: true };
  }
  if (eventName === "schedule") {
    return { mode: "tag-only", process: false };
  }

  const releaseTags = [
    ...new Set(releaseTagsAtHead.filter((tag) => STORE6_RELEASE_TAG.test(tag))),
  ].sort();
  if (releaseTags.length === 0) {
    throw new Error("post-alpha workflow_dispatch must point to a valid Store6 6.x release tag");
  }
  if (releaseTags.length > 1) {
    throw new Error(
      `multiple valid Store6 6.x release tags point at HEAD: ${releaseTags.join(", ")}`,
    );
  }
  const [releaseTag] = releaseTags;
  return { mode: "tag-only", process: true, releaseTag };
}

export function inspectCheckout({ eventName, sourceRoot }) {
  const checkout = resolve(sourceRoot);
  const firstReleaseExists = gitLines(checkout, ["tag", "--list", FIRST_RELEASE_TAG]).includes(
    FIRST_RELEASE_TAG,
  );
  const releaseTagsAtHead = gitLines(checkout, ["tag", "--points-at", "HEAD"]);
  return decideReferenceCadence({ eventName, firstReleaseExists, releaseTagsAtHead });
}

export function formatGitHubOutput(decision) {
  const lines = [`process=${decision.process}`, `mode=${decision.mode}`];
  if (decision.releaseTag) lines.push(`release_tag=${decision.releaseTag}`);
  return `${lines.join("\n")}\n`;
}

function parseArguments(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument !== "--source-root" && argument !== "--event") {
      throw new Error(`unknown argument: ${argument}`);
    }
    const key = argument === "--source-root" ? "sourceRoot" : "eventName";
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`);
    }
    if (Object.hasOwn(options, key)) {
      throw new Error(`${argument} may only be specified once`);
    }
    options[key] = value;
    index += 1;
  }
  if (!options.sourceRoot || !options.eventName) {
    throw new Error(
      "usage: dokka-reference-cadence.mjs --source-root <Store6 checkout> --event <schedule|workflow_dispatch>",
    );
  }
  return options;
}

function gitLines(checkout, argumentsList) {
  const result = spawnSync("git", ["-C", checkout, ...argumentsList], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`unable to inspect Store6 checkout with git ${argumentsList.join(" ")}`);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
