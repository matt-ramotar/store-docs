import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePage } from './agent-docs/parse.mjs';
import { literalAttributes, literalString, isCommentExpression } from './agent-docs/literals.mjs';

const parse = body => parsePage(`---\ntitle: Fixture\n---\n\n${body}\n`, 'fixture.mdx').tree;
test('CodeSlab preserves literal code and language without evaluating expressions', () => {
  const code = 'val users = store<UserKey, User> {\n  fetcher { key -> api.get(key.id) }\n}';
  const [node] = parse(`<CodeSlab code={${JSON.stringify(code)}} lang="kotlin" title="Example" />`).children;
  assert.deepEqual(literalAttributes(node, ['code', 'lang', 'title']), {
    code, lang: 'kotlin', title: 'Example',
  });
});
test('template literals use the cooked string and reject interpolation', () => {
  const [literal] = parse('<CodeSlab code={`one\\ntwo`} lang="text" title="Example" />').children;
  assert.equal(literalAttributes(literal, ['code', 'lang', 'title']).code, 'one\ntwo');
  const [dynamic] = parse('<CodeSlab code={`hello ${runCode()}`} lang="text" title="Example" />').children;
  assert.throws(() => literalAttributes(dynamic, ['code', 'lang', 'title']), /dynamic MDX expression/);
});
test('JSX spread attributes fail rather than disappearing', () => {
  const [node] = parse('<CodeSlab {...props} />').children;
  assert.throws(() => literalAttributes(node, ['code', 'lang', 'title']), /unsupported or duplicate/);
});
test('comments are distinct from literal text and executable expressions', () => {
  const [comment] = parse('{/* snippet: fixture-code */}').children;
  assert.equal(isCommentExpression(comment), true);
  const [literal] = parse('{"Visible text"}').children;
  assert.equal(literalString(literal, 'body'), 'Visible text');
  const [dynamic] = parse('{runCode()}').children;
  assert.equal(isCommentExpression(dynamic), false);
  assert.throws(() => literalString(dynamic, 'body'), /dynamic MDX expression/);
});
test('Kotlin generics and interpolation remain ordinary fenced code', () => {
  const code = 'val users: Store<UserKey, User> = users\nprintln("Name=${user.name}")';
  const [node] = parse('```kotlin\n' + code + '\n```').children;
  assert.equal(node.type, 'code');
  assert.equal(node.lang, 'kotlin');
  assert.equal(node.value, code);
});
