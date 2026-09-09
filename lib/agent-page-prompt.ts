type AgentPage = { title: string; canonicalUrl: string };

export function createAgentChatUrl(client: "chatgpt" | "claude", markdownUrl: string) {
  const url = new URL(client === "chatgpt" ? "https://chatgpt.com/" : "https://claude.ai/new");
  if (client === "chatgpt") url.searchParams.set("hints", "search");
  url.searchParams.set("q", `Read ${markdownUrl}. I want to ask questions about this Store6 documentation. If you cannot access the page, ask me to paste its Markdown.`);
  return url.toString();
}

export function createAgentSetupPrompt(page: AgentPage) {
  return `# Set up Store6 agent support

Set up this project's coding agent to use the Store6 skill and matching Markdown documentation. Run the commands yourself when your environment permits, follow the project's instructions, and report the results you actually observe.

## 1. Check the project and skill availability

Identify the project directory, agent, and actual Store6 dependency coordinates or immutable source revision. A SNAPSHOT label alone does not establish compatibility. Check that Node.js is 22.18 or newer:

\`\`\`sh
node --version
\`\`\`

The distribution repository is matt-ramotar/store-agent-skills. The skill is a development candidate; setup is incomplete until its matching Markdown bundle is available from the public documentation site and retrieval succeeds. Check that the repository exposes the store6 skill before installing. This command lists available skills without installing them:

\`\`\`sh
npx skills add matt-ramotar/store-agent-skills --list
\`\`\`

If discovery fails or does not list store6, stop the installation and report the result. Do not substitute another repository or claim that setup succeeded. The documentation's Copy Markdown action can supply page context while publication is pending.

## 2. Install the skill in this project

Once store6 is available, run this command from the project directory. Select the store6 skill and your intended agent when prompted:

\`\`\`sh
npx skills add matt-ramotar/store-agent-skills
\`\`\`

Use project scope and choose Copy for the installation method. This command follows the repository's default branch; it does not select an immutable release. Record the source revision reported by the installer when available, the actual installation directory, and the packaged documentation manifest. Read the installed SKILL.md. Store6 provides an Agent Skill and Markdown documentation; it does not currently publish an MCP server to register.

## 3. Verify the installed skill

From the installed Store6 skill directory, list the available guides:

\`\`\`sh
node scripts/get-docs.mjs --list
\`\`\`

Compare the project's actual identity with references/docs-manifest.json. Retrieve relevant guides using exactly one --source-revision or --coordinate argument followed by one to four guide IDs. Use the project's verified identity; do not copy the documentation revision as a substitute. If the version, bundle, or content does not match, report the mismatch before generating code.

Start a fresh agent session if required for discovery. Report the installed path, whether discovery and retrieval were verified, and any remaining steps. Do not report installation alone as a successful native invocation.

## Resources

- Agent skills: https://store.mobilenativefoundation.org/docs/store6/agents/agent-skills
- Markdown index: https://store.mobilenativefoundation.org/llms.txt
- Documentation manifest: https://store.mobilenativefoundation.org/llms/store6-manifest.json
- Current page: ${page.title} — ${page.canonicalUrl}
`;
}
