import { literalAttributes, literalString, isCommentExpression } from './literals.mjs';
import { semanticComponent, text, p } from './semantic-components.mjs';

const phrasingTypes = new Set([
  'text',
  'inlineCode',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'image',
  'imageReference',
  'break',
  'footnoteReference',
]);
const ordinaryTypes = new Set([
  'root',
  'paragraph',
  'heading',
  'text',
  'inlineCode',
  'code',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'image',
  'imageReference',
  'break',
  'thematicBreak',
  'blockquote',
  'list',
  'listItem',
  'definition',
  'table',
  'tableRow',
  'tableCell',
  'footnoteDefinition',
  'footnoteReference',
]);
const inlineContainerTypes = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
]);

export function lowerMdx(tree, context) {
  function asBlocks(nodes) {
    const result = [];
    let pending = [];
    const flush = () => {
      if (pending.length) result.push(p(pending));
      pending = [];
    };
    for (const node of nodes) {
      if (phrasingTypes.has(node.type)) pending.push(node);
      else {
        flush();
        result.push(node);
      }
    }
    flush();
    return result;
  }

  function asInline(nodes) {
    const result = [];
    for (const node of nodes) {
      if (node.type === 'paragraph') {
        if (result.length) result.push(text(' '));
        result.push(...node.children);
      } else if (phrasingTypes.has(node.type)) {
        result.push(node);
      } else {
        throw new Error(`Expected inline content, received ${node.type}`);
      }
    }
    return result;
  }

  function empty(node) {
    if (node.children.length) throw new Error(`${node.name}: unexpected children`);
  }

  function required(attributes, key, name) {
    if (typeof attributes[key] !== 'string' || !attributes[key]) {
      throw new Error(`${name}: ${key} required`);
    }
    return attributes[key];
  }

  function convert(node) {
    if (node.type === 'mdxjsEsm') {
      throw new Error('MDX imports and exports are unsupported in agent docs');
    }
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      return isCommentExpression(node) ? [] : [text(literalString(node, 'MDX body'))];
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const children = () => node.children.flatMap(convert);
      switch (node.name) {
        case 'div':
          literalAttributes(node, ['className']);
          return asBlocks(children());
        case 'p':
          literalAttributes(node, ['className']);
          return [p(asInline(children()))];
        case 'Link': {
          const attributes = literalAttributes(node, ['href', 'className']);
          const link = {
            type: 'link',
            url: required(attributes, 'href', node.name),
            children: asInline(children()),
          };
          return node.type === 'mdxJsxFlowElement' ? [p([link])] : [link];
        }
        case 'Link.Icon':
          literalAttributes(node, []);
          empty(node);
          return [];
        case 'a': {
          const attributes = literalAttributes(node, ['id']);
          empty(node);
          const id = required(attributes, 'id', node.name);
          if (!/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(id)) {
            throw new Error(`Unsupported anchor: ${id}`);
          }
          return [{ type: 'html', value: `<a id="${id}"></a>` }];
        }
        case 'Callout': {
          const attributes = literalAttributes(node, ['type', 'title']);
          const severity = required(attributes, 'type', node.name);
          if (!['Note', 'Info', 'Tip', 'Warning', 'Danger', 'Check'].includes(severity)) {
            throw new Error(`Unknown callout severity: ${severity}`);
          }
          const label = attributes.title ? `${severity}: ${attributes.title}` : severity;
          return [{
            type: 'blockquote',
            children: [p([{ type: 'strong', children: [text(label)] }]), ...asBlocks(children())],
          }];
        }
        case 'CodeSlab': {
          const attributes = literalAttributes(node, ['code', 'lang', 'title']);
          empty(node);
          if (typeof attributes.code !== 'string') throw new Error('CodeSlab.code required');
          return [
            p([{ type: 'strong', children: [text(required(attributes, 'title', node.name))] }]),
            {
              type: 'code',
              lang: required(attributes, 'lang', node.name),
              value: attributes.code,
            },
          ];
        }
        case 'ReadResolutionTable':
        case 'SupportMatrix':
        case 'StartHereList':
          literalAttributes(node, []);
          empty(node);
          return semanticComponent(node.name);
        case 'StoreDiagram': {
          const attributes = literalAttributes(node, ['id']);
          empty(node);
          const id = required(attributes, 'id', node.name);
          const diagram = context.diagram(id);
          return [
            p([{ type: 'strong', children: [text(diagram.title)] }]),
            p([text(diagram.description)]),
            {
              type: 'list',
              ordered: false,
              spread: false,
              children: diagram.labels.map(label => ({
                type: 'listItem',
                spread: false,
                children: [p([text(label)])],
              })),
            },
            p([{
              type: 'link',
              url: `/diagrams/${id}.html`,
              children: [text('Open full-size diagram')],
            }]),
          ];
        }
        default:
          throw new Error(`Unsupported MDX component: ${node.name}`);
      }
    }
    if (!ordinaryTypes.has(node.type)) {
      throw new Error(`Unsupported Markdown node: ${node.type}`);
    }
    if (node.type === 'emphasis') {
      const sourceRecord = context.recordedSource(node);
      if (sourceRecord) return sourceRecord;
    }
    if (!node.children) return [{ ...node }];
    const children = node.children.flatMap(convert);
    return [{
      ...node,
      children: node.type === 'root'
        ? asBlocks(children)
        : inlineContainerTypes.has(node.type)
          ? asInline(children)
          : children,
    }];
  }

  return convert(tree)[0];
}
