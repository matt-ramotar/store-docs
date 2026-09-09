export function literalString(node, context) {
  const program = node?.data?.estree;
  if (!program || program.type !== 'Program' || program.body.length !== 1 ||
      program.body[0].type !== 'ExpressionStatement') {
    throw new Error(`${context}: expected a string literal`);
  }
  const expression = program.body[0].expression;
  if (expression.type === 'Literal' && typeof expression.value === 'string') {
    return expression.value;
  }
  if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0 &&
      expression.quasis.length === 1 && typeof expression.quasis[0].value.cooked === 'string') {
    return expression.quasis[0].value.cooked;
  }
  throw new Error(`${context}: dynamic MDX expression is unsupported`);
}

export function literalAttributes(node, allowed) {
  const values = {};
  for (const attribute of node.attributes) {
    if (attribute.type !== 'mdxJsxAttribute' || !allowed.includes(attribute.name) ||
        Object.hasOwn(values, attribute.name)) {
      throw new Error(`${node.name}: unsupported or duplicate attribute`);
    }
    if (attribute.value === null) throw new Error(`${node.name}.${attribute.name}: boolean attribute unsupported`);
    values[attribute.name] = typeof attribute.value === 'string'
      ? attribute.value
      : literalString(attribute.value, `${node.name}.${attribute.name}`);
  }
  return values;
}

export function isCommentExpression(node) {
  const program = node?.data?.estree;
  return program?.type === 'Program' && program.body.length === 0 &&
    Array.isArray(program.comments) && program.comments.length > 0;
}
