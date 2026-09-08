import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { parseDocument } from 'yaml';

export function parsePage(input, path) {
  const source = input.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source);
  if (!match) throw new Error(`${path}: required frontmatter missing`);
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) throw new Error(`${path}: ${document.errors[0].message}`);
  const metadata = document.toJS();
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(`${path}: frontmatter must be a mapping`);
  }
  if (typeof metadata.title !== 'string' || !metadata.title.trim()) {
    throw new Error(`${path}: title must be a nonempty string`);
  }
  if (metadata.description !== undefined && typeof metadata.description !== 'string') {
    throw new Error(`${path}: description must be a string`);
  }
  const body = source.slice(match[0].length);
  return {
    metadata,
    tree: fromMarkdown(body, {
      extensions: [gfm(), mdxjs()],
      mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()],
    }),
  };
}
