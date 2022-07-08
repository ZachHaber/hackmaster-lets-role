/**
 *
 * @param {import("@babel/core")} param0
 * @returns {import("@babel/core").PluginObj}
 */
export default function ({ types: t }) {
  return {
    visitor: {
      LogicalExpression(path) {
        // Remove `typeof Symbol === 'undefined' && o[Symbol.iterator] type checks
        // as they break in lets role
        if (
          path.node.operator !== '||' ||
          !t.isLogicalExpression(path.node.left, { operator: '&&' }) ||
          !t.isBinaryExpression(path.node.left.left, { operator: '!==' }) ||
          !t.isUnaryExpression(path.node.left.left.left, {
            operator: 'typeof',
          }) ||
          !t.isIdentifier(path.node.left.left.left.argument, {
            name: 'Symbol',
          }) ||
          !t.isStringLiteral(path.node.left.left.right, { value: 'undefined' })
        ) {
          return;
        }
        path.replaceWith(path.node.right);
        /** @type {import("@babel/core").types.LogicalExpression} */
      },
    },
  };
}
