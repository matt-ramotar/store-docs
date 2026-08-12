import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const HELPER_PATH = resolve(ROOT, "scripts/dokka-reference-cadence.mjs");
const HELPER_URL = pathToFileURL(HELPER_PATH).href;
const WORKFLOW_PATH = resolve(ROOT, ".github/workflows/drift.yml");
const FIRST_RELEASE_TAG = "6.0.0-alpha01";

test("pre-alpha schedule and workflow dispatch process in main-tracking mode", async () => {
  const { decideReferenceCadence } = await import(HELPER_URL);
  for (const eventName of ["schedule", "workflow_dispatch"]) {
    assert.deepEqual(
      decideReferenceCadence({ eventName, firstReleaseExists: false, releaseTagsAtHead: [] }),
      { mode: "main-tracking", process: true },
    );
  }
});

test("post-alpha schedule is a green tag-only no-op", async () => {
  const { decideReferenceCadence } = await import(HELPER_URL);
  assert.deepEqual(
    decideReferenceCadence({
      eventName: "schedule",
      firstReleaseExists: true,
      releaseTagsAtHead: [],
    }),
    { mode: "tag-only", process: false },
  );
});

test("post-alpha dispatch requires exactly one valid 6.x tag at HEAD", async () => {
  const { decideReferenceCadence } = await import(HELPER_URL);
  for (const releaseTag of [FIRST_RELEASE_TAG, "6.1.0", "6.2.3-rc.1", "6.3.4+build.5"]) {
    assert.deepEqual(
      decideReferenceCadence({
        eventName: "workflow_dispatch",
        firstReleaseExists: true,
        releaseTagsAtHead: ["not-a-release", releaseTag],
      }),
      { mode: "tag-only", process: true, releaseTag },
    );
  }
  for (const releaseTagsAtHead of [[], ["6.1"], ["6.01.0"], ["6.1.0-01"], ["v6.1.0"]]) {
    assert.throws(
      () =>
        decideReferenceCadence({
          eventName: "workflow_dispatch",
          firstReleaseExists: true,
          releaseTagsAtHead,
        }),
      /must point to a valid Store6 6\.x release tag/,
    );
  }
  assert.throws(
    () =>
      decideReferenceCadence({
        eventName: "workflow_dispatch",
        firstReleaseExists: true,
        releaseTagsAtHead: ["6.1.0", "6.1.1-rc.1"],
      }),
    /multiple valid Store6 6\.x release tags/,
  );
});

test("cadence rejects invalid inputs and inspects tags at exact HEAD", async () => {
  const { decideReferenceCadence } = await import(HELPER_URL);
  assert.throws(() => decideReferenceCadence(), /cadence input must be an object/);
  assert.throws(
    () =>
      decideReferenceCadence({
        eventName: "push",
        firstReleaseExists: false,
        releaseTagsAtHead: [],
      }),
    /unsupported GitHub event/,
  );

  withGitCheckout((checkout) => {
    commitFixture(checkout, "first");
    git(checkout, "tag", FIRST_RELEASE_TAG);
    commitFixture(checkout, "second");
    git(checkout, "tag", "--annotate", "6.1.0-rc.1", "--message", "fixture release");
    const result = runCli(checkout, "workflow_dispatch");
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "process=true\nmode=tag-only\nrelease_tag=6.1.0-rc.1\n");
  });
});

test("workflow parses as two least-privilege jobs on trusted documentation main", () => {
  const workflow = readWorkflow();
  const parsed = spawnSync(
    "ruby",
    [
      "-e",
      'require "yaml"; require "json"; puts JSON.generate(YAML.load_file(ARGV.fetch(0)).fetch("jobs").keys)',
      WORKFLOW_PATH,
    ],
    { encoding: "utf8" },
  );
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.deepEqual(JSON.parse(parsed.stdout), ["dokka-reference", "publish"]);
  assert.deepEqual(workflowJobNames(workflow), ["dokka-reference", "publish"]);

  const generator = workflowJob(workflow, "dokka-reference", "publish");
  const publisher = workflowJob(workflow, "publish");
  assert.match(generator, /permissions:\n      contents: read/);
  assert.doesNotMatch(generator, /pull-requests: write|contents: write|GH_TOKEN|git push|gh pr |gh api/);
  assert.match(publisher, /needs: dokka-reference/);
  assert.match(publisher, /permissions:\n      contents: write\n      pull-requests: write/);
  for (const job of [generator, publisher]) {
    assert.match(job, /uses: actions\/checkout@v4[\s\S]*?ref: main[\s\S]*?persist-credentials: false/);
  }
  assert.ok(requiredIndex(generator, "Require main workflow ref") < requiredIndex(generator, "actions/checkout@v4"));
});

test("Store6 checkout rejects refspecs before fetching origin tags", () => {
  const generator = workflowJob(readWorkflow(), "dokka-reference", "publish");
  const checkout = generator.slice(
    requiredIndex(generator, "- name: Check out the requested Store6 revision"),
    requiredIndex(generator, "- name: Determine Dokka reference cadence"),
  );
  const clone = requiredIndex(checkout, "git clone --no-checkout");
  const validation = requiredIndex(checkout, 'git check-ref-format --branch "$STORE6_REF"');
  const fetch = requiredIndex(checkout, 'git -C ../Store6 fetch --force --tags origin "$STORE6_REF"');

  assert.ok(clone < validation && validation < fetch);
  assert.match(checkout, /Store6 ref must be a valid branch, tag, or commit SHA without refspec syntax\./);
  for (const value of ["main", "0123456789abcdef0123456789abcdef01234567", "refs/tags/6.1.0"]) {
    const result = spawnSync("git", ["check-ref-format", "--branch", value], { encoding: "utf8" });
    assert.equal(result.status, 0, `${value} must remain a valid Store6 ref`);
  }
  for (const value of ["refs/heads/main:refs/tags/6.9.9", "--upload-pack=evil"]) {
    const result = spawnSync("git", ["check-ref-format", "--branch", value], { encoding: "utf8" });
    assert.notEqual(result.status, 0, `${value} must be rejected before any Store6 fetch`);
  }
});

test("every workflow step has exactly one executable form", () => {
  const program = [
    'require "yaml"',
    'workflow = YAML.load_file(ARGV.fetch(0))',
    'workflow.fetch("jobs").each do |job_name, job|',
    '  job.fetch("steps").each_with_index do |step, index|',
    '    forms = [step.key?("run"), step.key?("uses")].count(true)',
    '    raise "#{job_name} step #{index} must have exactly one of run or uses" unless forms == 1',
    '  end',
    'end',
  ].join("; ");
  const parsed = spawnSync("ruby", ["-e", program, WORKFLOW_PATH], { encoding: "utf8" });
  assert.equal(parsed.status, 0, parsed.stderr);
});

test("generator validates cadence, exact revision, Dokka outputs, and full verification order", () => {
  const generator = workflowJob(readWorkflow(), "dokka-reference", "publish");
  const clone = requiredIndex(generator, "git clone --no-checkout");
  const cadence = requiredIndex(generator, "- name: Determine Dokka reference cadence");
  const repin = requiredIndex(generator, "node scripts/repin-store6-lock.mjs --source-root ../Store6");
  const sync = requiredIndex(generator, "node scripts/sync-store6-docs.mjs --source-root ../Store6 --check");
  const revision = requiredIndex(generator, "- name: Verify exact reference revision");
  const java = requiredIndex(generator, "uses: actions/setup-java@v4");
  const gradle = requiredIndex(generator, "./gradlew :store6-core:dokkaHtml :store6-mutations:dokkaHtml --stacktrace");
  const replace = requiredIndex(generator, "- name: Replace public Dokka reference trees");
  const unresolved = requiredIndex(generator, "- name: Reject unresolved Dokka links");
  const build = requiredIndex(generator, "run: pnpm build");
  const tests = requiredIndex(generator, "run: node --test scripts/*.test.mjs");
  const crawl = requiredIndex(generator, "node scripts/t8-verification.mjs --local");
  const search = requiredIndex(generator, "node scripts/verify-search-index.mjs");
  const t6b = requiredIndex(generator, "node scripts/test-t6b-reference.mjs");

  assert.ok(clone < cadence && cadence < repin && repin < sync && sync < revision);
  assert.ok(revision < java && java < gradle && gradle < replace && replace < unresolved);
  assert.ok(unresolved < build && build < tests && tests < crawl && crawl < search && search < t6b);
  assert.match(generator, /git -C \.\.\/Store6 fetch --force --tags origin "\$STORE6_REF"/);
  assert.match(generator, /distribution: zulu/);
  assert.match(generator, /java-version: ['"]17['"]/);
  assert.match(generator, /\[\[ "\$head" == "\$locked" \]\][\s\S]*exit 1/);
  assert.match(generator, /rsync -a --delete \.\.\/Store6\/store6-core\/build\/dokka\/html\/ public\/reference\/store6-core\//);
  assert.match(generator, /rsync -a --delete \.\.\/Store6\/store6-mutations\/build\/dokka\/html\/ public\/reference\/store6-mutations\//);
  assert.match(generator, /case "\$grep_status" in[\s\S]*0\)[\s\S]*exit 1[\s\S]*1\)[\s\S]*;;[\s\S]*\*\)[\s\S]*exit "\$grep_status"/);
});

test("release tags regenerate even at the pinned SHA and require same-PR editorial review", () => {
  const workflow = readWorkflow();
  const generator = workflowJob(workflow, "dokka-reference", "publish");
  const publisher = workflowJob(workflow, "publish");
  const detect = generator.slice(
    requiredIndex(generator, "- name: Detect Store6 drift"),
    requiredIndex(generator, "- name: Save the current source lock"),
  );
  const record = requiredIndex(generator, "- name: Record release reference provenance");
  const build = requiredIndex(generator, "- name: Build the site");

  assert.match(detect, /MODE: \$\{\{ steps\.cadence\.outputs\.mode \}\}/);
  assert.match(detect, /RELEASE_TAG: \$\{\{ steps\.cadence\.outputs\.release_tag \}\}/);
  assert.match(
    detect,
    /if \[\[ "\$MODE" == "tag-only" \]\]; then[\s\S]*changed=true[\s\S]*exit 0/,
  );
  assert.ok(record < build);
  assert.match(
    generator.slice(record, build),
    /evidence\/T6b\.md[\s\S]*Last automated release refresh:[\s\S]*RELEASE_TAG/,
  );
  assert.match(generator, /evidence\/T6b\.md/);
  assert.match(
    generator,
    /evidence\/T4-store6-source-lock\.json\|evidence\/T4-owned-targets\.json\|evidence\/store6-claims\.json\|evidence\/T6b\.md/,
  );
  assert.match(generator, /if \[\[ "\$MODE" == "tag-only" \]\]; then[\s\S]*review_required=true/);
  assert.match(generator, /--arg release_tag "\$\{\{ steps\.cadence\.outputs\.release_tag \}\}"/);
  assert.match(publisher, /RELEASE_TAG: \$\{\{ needs\.dokka-reference\.outputs\.release_tag \}\}/);
  assert.match(publisher, /\.release_tag == \$release_tag/);
  assert.match(
    publisher,
    /evidence\/T4-store6-source-lock\.json\|evidence\/T4-owned-targets\.json\|evidence\/store6-claims\.json\|evidence\/T6b\.md/,
  );
  assert.match(
    publisher,
    /Release editorial gate[\s\S]*support matrix[\s\S]*T3_OVERVIEW_SHA256[\s\S]*release-notes/,
  );
  assert.match(
    publisher,
    /release-tag reference refresh requires the support matrix, overview hash, and release-notes decision/,
  );
});

test("generator emits only an allowlisted binary patch plus bounded verified metadata", () => {
  const generator = workflowJob(readWorkflow(), "dokka-reference", "publish");
  const prepare = requiredIndex(generator, "- name: Prepare validated publication artifact");
  const upload = requiredIndex(generator, "- name: Upload validated publication artifact");
  const step = generator.slice(prepare, upload);

  assert.match(step, /trusted_targets/);
  assert.match(step, /public\/reference\/store6-core/);
  assert.match(step, /public\/reference\/store6-mutations/);
  assert.match(step, /git add -A --/);
  assert.match(step, /git diff --cached --name-only -z/);
  assert.match(step, /unexpected staged path/);
  assert.match(step, /if ! git diff --quiet; then[\s\S]*unstaged tracked residue[\s\S]*exit 1/);
  assert.match(
    step,
    /git ls-files --others --exclude-standard[\s\S]*untracked residue[\s\S]*exit 1/,
  );
  assert.match(step, /git diff --cached --binary --full-index --no-ext-diff/);
  assert.match(step, /changes\.patch/);
  assert.match(step, /claims-report\.txt/);
  assert.match(step, /snippets-report\.txt/);
  assert.match(step, /metadata\.json/);
  assert.match(step, /sha256sum/);
  assert.match(step, /metadata_size="\$\(wc -c[\s\S]*metadata_size" -le 65536/);
  assert.match(generator.slice(upload), /uses: actions\/upload-artifact@v4/);
  assert.doesNotMatch(generator.slice(upload), /path: \.\/?$|path: \.\.\/Store6/m);
});

test("publisher validates base, artifact, indexed apply, allowlist, and residue before one commit", () => {
  const workflow = readWorkflow();
  const publisher = workflowJob(workflow, "publish");
  const apply = requiredIndex(publisher, "- name: Apply validated publication artifact");
  const publish = requiredIndex(publisher, "- name: Push and create or refresh the rolling re-pin pull request");
  const applyStep = publisher.slice(apply, publish);
  const switchToBase = requiredIndex(applyStep, "git switch -C docs-sync/repin origin/main");
  const captureBaseTargets = requiredIndex(
    applyStep,
    'evidence/T4-store6-source-lock.json > "$BASE_TRUSTED_TARGETS"',
  );
  const attestArtifactTargets = requiredIndex(
    applyStep,
    '.trusted_targets == $trusted[0]',
  );
  const applyPatch = requiredIndex(applyStep, "git apply --index --binary");
  const attestPatchedTargets = requiredIndex(
    applyStep,
    '[.sources[].target] == $trusted[0]',
  );

  assert.match(publisher, /needs\.dokka-reference\.outputs\.process == 'true'/);
  assert.match(publisher, /needs\.dokka-reference\.outputs\.changed == 'true'/);
  assert.match(publisher, /git fetch --force origin main:refs\/remotes\/origin\/main/);
  assert.match(publisher, /needs\.dokka-reference\.outputs\.base_revision/);
  assert.match(
    applyStep,
    /BASE_TRUSTED_TARGETS: \$\{\{ runner\.temp \}\}\/store6-publisher-targets\.json/,
  );
  assert.ok(
    switchToBase < captureBaseTargets &&
      captureBaseTargets < attestArtifactTargets &&
      attestArtifactTargets < applyPatch &&
      applyPatch < attestPatchedTargets,
  );
  assert.match(applyStep, /expected_inventory/);
  assert.match(applyStep, /sha256sum/);
  assert.match(applyStep, /git apply --check --index --binary/);
  assert.match(applyStep, /git apply --index --binary/);
  assert.match(
    applyStep,
    /--slurpfile trusted "\$BASE_TRUSTED_TARGETS"[\s\S]*\.trusted_targets == \$trusted\[0\]/,
  );
  assert.match(applyStep, /\[\.sources\[\]\.target\] == \$trusted\[0\]/);
  assert.match(applyStep, /mapfile -t trusted_targets < <\(jq -r '\.\[\]' "\$BASE_TRUSTED_TARGETS"\)/);
  assert.doesNotMatch(
    applyStep,
    /mapfile -t trusted_targets < <\(jq -r '\.trusted_targets\[\]' "\$ARTIFACT_DIR\/metadata\.json"\)/,
  );
  assert.match(applyStep, /git diff --cached --name-only -z/);
  assert.match(applyStep, /unexpected staged path/);
  assert.match(applyStep, /git diff --quiet/);
  assert.match(applyStep, /git ls-files --others --exclude-standard/);
  assert.equal(matches(workflow, /git commit -m "chore\(docs\): repin Store6 sources"/g), 1);
  assert.doesNotMatch(publisher, /\.\.\/Store6|\.\/gradlew|\bpnpm\b|node scripts\/|corepack/);
});

test("token is isolated to final rolling branch publication with review-final-red semantics", () => {
  const workflow = readWorkflow();
  const generator = workflowJob(workflow, "dokka-reference", "publish");
  const publisher = workflowJob(workflow, "publish");
  const publishStart = requiredIndex(publisher, "- name: Push and create or refresh the rolling re-pin pull request");
  const reviewFailure = requiredIndex(publisher, "- name: Fail when Store6 re-verification needs review");
  const publishStep = publisher.slice(publishStart, reviewFailure);
  const reviewStep = publisher.slice(reviewFailure);

  assert.doesNotMatch(generator, /GH_TOKEN|gh auth setup-git|gh pr |gh api |git push/);
  assert.match(publishStep, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(publishStep, /gh auth setup-git/);
  assert.match(publishStep, /git push --force-with-lease origin HEAD:docs-sync\/repin/);
  assert.match(publishStep, /gh api --method GET repos\/matt-ramotar\/store-docs\/pulls/);
  assert.match(publishStep, /head='matt-ramotar:docs-sync\/repin'/);
  assert.match(publishStep, /base='main'/);
  assert.match(publishStep, /gh pr edit "\$number" --repo matt-ramotar\/store-docs/);
  assert.match(publishStep, /gh pr create --repo matt-ramotar\/store-docs --base main --head docs-sync\/repin/);
  assert.match(reviewStep, /needs\.dokka-reference\.outputs\.review_required == 'true'/);
  assert.match(reviewStep, /rolling re-pin PR was created/);
  assert.match(reviewStep, /exit 1/);
});

function readWorkflow() {
  return readFileSync(WORKFLOW_PATH, "utf8");
}

function workflowJobNames(workflow) {
  const jobs = workflow.slice(requiredIndex(workflow, "jobs:\n") + "jobs:\n".length);
  return [...jobs.matchAll(/^  ([a-z0-9_-]+):\n/gm)].map((match) => match[1]);
}

function workflowJob(workflow, jobName, nextJobName) {
  const start = requiredIndex(workflow, `  ${jobName}:\n`);
  const end = nextJobName ? requiredIndex(workflow, `  ${nextJobName}:\n`) : workflow.length;
  return workflow.slice(start, end);
}

function matches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function requiredIndex(value, substring) {
  const index = value.indexOf(substring);
  assert.notEqual(index, -1, `missing workflow fragment: ${substring}`);
  return index;
}

function withGitCheckout(callback) {
  const checkout = mkdtempSync(join(tmpdir(), "store-docs-dokka-cadence-"));
  try {
    git(checkout, "init", "--quiet");
    git(checkout, "config", "user.email", "fixture@example.com");
    git(checkout, "config", "user.name", "Fixture");
    callback(checkout);
  } finally {
    rmSync(checkout, { force: true, recursive: true });
  }
}

function commitFixture(checkout, contents) {
  writeFileSync(join(checkout, "fixture.txt"), `${contents}\n`);
  git(checkout, "add", "fixture.txt");
  git(checkout, "commit", "--quiet", "-m", contents);
}

function git(checkout, ...argumentsList) {
  return execFileSync("git", ["-C", checkout, ...argumentsList], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runCli(checkout, eventName) {
  return spawnSync(
    process.execPath,
    [HELPER_PATH, "--source-root", checkout, "--event", eventName],
    { encoding: "utf8" },
  );
}
