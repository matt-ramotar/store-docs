# Agents and LLMs

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/agents/overview

Markdown: https\://store.mobilenativefoundation.org/llms/store6/agents/overview\.md

Source kind: site-authored; source path: content/docs/store6/agents/overview\.mdx

Give a coding agent Store6 documentation that matches your project.

Use Store6 documentation as context when asking an agent to implement reads, persistence,
mutations, UI collection, or a migration. Start by identifying the Store6 dependency or source
revision in your project. A matching name or major version alone does not establish API compatibility.

## Choose your context

| Method                                                                                      | Use it when                                                                                                          |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Copy Prompt**                                                                             | You want a coding agent to check skill availability, install the Store6 skill in your project, and verify its setup. |
| **Copy Markdown**                                                                           | You want to paste one complete guide into a conversation.                                                            |
| **View as Markdown** (in the dropdown)                                                      | Your agent can open a documentation URL and select the pages it needs.                                               |
| **Set up in Cursor / VS Code** (in the dropdown)                                            | You want the skill setup guide for your editor.                                                                      |
| **Open in ChatGPT / Claude** (in the dropdown)                                              | You want to ask questions about the page in a new chat. The link includes its public Markdown URL.                   |
| [Store6 skill](https://store.mobilenativefoundation.org/llms/store6/agents/agent-skills.md) | Your coding agent supports skills and should check the project version before retrieving task-specific guides.       |

The page actions appear on Store6 guides with a Markdown export. See
[LLM context](https://store.mobilenativefoundation.org/llms/store6/agents/llm-context.md) for the index, complete guide corpus, and source records.

## Start with a concrete task

Give the agent the repository, desired behavior, and relevant platform. For example:

**Example prompt**

```text
Inspect this project's Store6 dependency or source revision. Use the matching Store6 documentation from https://store.mobilenativefoundation.org/llms.txt to implement a typed user repository. Cite the read and lifetime contracts, then run the project's relevant checks. If the version is unsupported, identify the mismatch before generating code.
```

For a persistence or mutation task, state what must survive a restart and which database and
platforms your application uses. Ask the agent to distinguish what it checked in source from what
it compiled or exercised in a test.

## Check the source identity

The documentation manifest records the Store6 source revision and each page's provenance. Some
pages are synchronized from that source; others are authored in the documentation site and retain
their own source record. The shared revision does not mean every page was verified against it.

The skill accepts a matching full source revision or an exact dependency coordinate that its
manifest explicitly lists as verified. An unlisted version, including a mutable `SNAPSHOT`, is a
mismatch. Resolve the dependency or provide matching documentation before asking it to generate code.
