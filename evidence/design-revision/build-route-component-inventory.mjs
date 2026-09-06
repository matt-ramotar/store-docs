import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "../..");
const ROUTE_COVERAGE_PATH = resolve(import.meta.dirname, "route-coverage.json");
const MDX_COMPONENTS_PATH = resolve(ROOT, "mdx-components.tsx");
const OUTPUT_PATH = resolve(import.meta.dirname, "route-component-inventory.json");

const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function loadMdxParser() {
  const pnpmEntries = await readdir(resolve(ROOT, "node_modules/.pnpm"));
  const packageDirectory = sorted(pnpmEntries.filter((name) => name.startsWith("@mdx-js+mdx@"))).at(-1);
  if (!packageDirectory) throw new Error("Installed @mdx-js/mdx package was not found");
  const packageRoot = resolve(ROOT, "node_modules/.pnpm", packageDirectory, "node_modules/@mdx-js/mdx");
  const packageJson = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
  const module = await import(pathToFileURL(resolve(packageRoot, "index.js")));
  return { createProcessor: module.createProcessor, version: packageJson.version };
}

async function loadTsxParser() {
  const pnpmEntries = await readdir(resolve(ROOT, "node_modules/.pnpm"));
  const packageDirectory = sorted(pnpmEntries.filter((name) => name.startsWith("next@"))).at(-1);
  if (!packageDirectory) throw new Error("Installed next package was not found");
  const packageRoot = resolve(ROOT, "node_modules/.pnpm", packageDirectory, "node_modules/next");
  const packageJson = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
  const module = await import(pathToFileURL(resolve(packageRoot, "dist/compiled/babel/parser.js")));
  return { parse: module.parse ?? module.default.parse, version: packageJson.version };
}

function readComponentMap(source, parse) {
  const file = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const imports = new Map();
  const assignedMembers = new Map();
  let componentMap;

  for (const outerStatement of file.program.body) {
    const statement = outerStatement.type === "ExportNamedDeclaration" ? outerStatement.declaration : outerStatement;
    if (!statement) continue;
    if (statement.type === "ImportDeclaration") {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportSpecifier") {
          imports.set(specifier.local.name, {
            imported: specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value,
            module: statement.source.value,
          });
        } else if (specifier.type === "ImportDefaultSpecifier") {
          imports.set(specifier.local.name, { imported: "default", module: statement.source.value });
        }
      }
    }
    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        if (declaration.id.type !== "Identifier" || declaration.init?.type !== "CallExpression") continue;
        const expression = declaration.init.callee;
        if (expression.type !== "MemberExpression" || expression.object.type !== "Identifier" || expression.object.name !== "Object" || expression.property.type !== "Identifier" || expression.property.name !== "assign") continue;
        const memberObject = declaration.init.arguments.find((argument) => argument.type === "ObjectExpression");
        if (!memberObject) continue;
        assignedMembers.set(declaration.id.name, new Set(memberObject.properties.flatMap((property) => {
          if (property.type !== "ObjectProperty" && property.type !== "ObjectMethod") return [];
          if (property.key.type === "Identifier") return [property.key.name];
          if (property.key.type === "StringLiteral") return [property.key.value];
          return [];
        })));
      }
    }
    if (statement.type === "FunctionDeclaration" && statement.id?.name === "getMDXComponents") {
      const returned = statement.body.body.find((node) => node.type === "ReturnStatement")?.argument;
      if (returned?.type === "ObjectExpression") componentMap = returned;
    }
  }
  if (!componentMap) throw new Error("getMDXComponents return object was not found");

  const roots = new Map();
  for (const property of componentMap.properties) {
    if (property.type !== "ObjectProperty") continue;
    const root = property.key.type === "Identifier" ? property.key.name : property.key.type === "StringLiteral" ? property.key.value : null;
    if (root && property.value.type === "Identifier") roots.set(root, property.value.name);
  }
  return { assignedMembers, imports, roots };
}

async function resolveMemberRegistrations(actualNames, componentMap) {
  const registrations = new Map();
  for (const name of actualNames) {
    const [root, ...memberParts] = name.split(".");
    const binding = componentMap.roots.get(root);
    if (!binding) continue;
    if (memberParts.length === 0) {
      registrations.set(name, { binding, evidence: "getMDXComponents root property" });
      continue;
    }
    const member = memberParts.join(".");
    if (componentMap.assignedMembers.get(binding)?.has(member)) {
      registrations.set(name, { binding, evidence: `local Object.assign member ${member}` });
      continue;
    }
    const imported = componentMap.imports.get(binding);
    if (!imported || imported.module.startsWith("@/")) continue;
    const module = await import(imported.module);
    let value = module[imported.imported];
    if (memberParts.every((part) => value != null && (value = value[part]))) {
      registrations.set(name, { binding, evidence: `installed ${imported.module} runtime member ${member}` });
    }
  }
  return registrations;
}

function walk(node, visit) {
  visit(node);
  node.children?.forEach((child) => walk(child, visit));
}

const routeCoverageSource = await readFile(ROUTE_COVERAGE_PATH, "utf8");
const routeCoverage = JSON.parse(routeCoverageSource);
const mdxComponentsSource = await readFile(MDX_COMPONENTS_PATH, "utf8");
const { parse: parseTsx, version: nextParserVersion } = await loadTsxParser();
const componentMap = readComponentMap(mdxComponentsSource, parseTsx);
const { createProcessor, version: parserVersion } = await loadMdxParser();
const processor = createProcessor();
const files = [];
const allActualNames = new Set();
const fencedCandidates = new Map();

for (const route of routeCoverage.routes.filter(({ source }) => source.endsWith(".mdx"))) {
  const absoluteSource = resolve(ROOT, route.source);
  const source = await readFile(absoluteSource, "utf8");
  const tree = processor.parse(source);
  const counts = new Map();
  let fencedCodeBlocks = 0;
  walk(tree, (node) => {
    if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && /^[A-Z]/.test(node.name ?? "")) {
      counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
      allActualNames.add(node.name);
    }
    if (node.type === "code") {
      fencedCodeBlocks += 1;
      for (const match of node.value.matchAll(/<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)(?=[\s>,])/g)) {
        const record = fencedCandidates.get(match[1]) ?? { count: 0, files: new Set() };
        record.count += 1;
        record.files.add(route.source);
        fencedCandidates.set(match[1], record);
      }
    }
  });
  const jsxNames = sorted(counts.keys());
  files.push({
    route: route.route,
    source: route.source,
    sha256: sha256(source),
    fencedCodeBlocks,
    jsxNames: jsxNames.map((name) => ({ name, occurrences: counts.get(name) })),
    routeCoverageComponents: route.components,
    routeCoverageLexicalOnly: sorted(route.components.filter((name) => !counts.has(name))),
    routeCoverageMissingActual: jsxNames.filter((name) => !route.components.includes(name)),
  });
}

const memberRegistrations = await resolveMemberRegistrations(allActualNames, componentMap);
for (const file of files) {
  const names = file.jsxNames.map(({ name }) => name);
  file.registeredJsxNames = names.filter((name) => memberRegistrations.has(name));
  file.unregisteredJsxNames = names.filter((name) => !memberRegistrations.has(name));
}

const unregisteredNames = sorted(new Set(files.flatMap(({ unregisteredJsxNames }) => unregisteredJsxNames))).map((name) => ({
  name,
  files: files.filter(({ unregisteredJsxNames }) => unregisteredJsxNames.includes(name)).map(({ source }) => source),
}));

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  authority: {
    routeCoverage: "evidence/design-revision/route-coverage.json",
    routeCoverageSha256: sha256(routeCoverageSource),
    componentMap: "mdx-components.tsx",
    componentMapSha256: sha256(mdxComponentsSource),
    parser: `@mdx-js/mdx@${parserVersion}`,
    registrationParser: `next@${nextParserVersion} compiled Babel parser`,
    rule: "Only uppercase mdxJsxFlowElement and mdxJsxTextElement names are component registrations. Code and inlineCode nodes are excluded.",
  },
  summary: {
    routeSources: routeCoverage.routes.length,
    parsedMdxFiles: files.length,
    nonMdxSources: routeCoverage.routes.length - files.length,
    uniqueActualJsxNames: allActualNames.size,
    genuineUnregisteredNames: unregisteredNames.length,
  },
  actualJsxNames: sorted(allActualNames).map((name) => ({ name, registration: memberRegistrations.get(name) ?? null })),
  genuineUnregisteredNames: unregisteredNames,
  excludedFencedCodeCandidates: sorted(fencedCandidates.keys()).map((name) => ({
    name,
    occurrences: fencedCandidates.get(name).count,
    files: sorted(fencedCandidates.get(name).files),
  })),
  nonMdxSources: routeCoverage.routes.filter(({ source }) => !source.endsWith(".mdx")).map(({ route, source, components }) => ({ route, source, routeCoverageComponents: components })),
  files,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`${files.length} MDX files parsed; ${allActualNames.size} JSX names; ${unregisteredNames.length} unregistered names`);
