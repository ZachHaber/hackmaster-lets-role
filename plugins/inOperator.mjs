/**
 *
 * @param {import("@babel/core")} param0
 * @returns {import("@babel/core").PluginObj}
 */
export default function ({ types: t }) {
  return {
    visitor: {
      BinaryExpression(path) {
        // Replace `key in obj` expressions with Object.hasOwnProperty()
        // It's not a *true* replacement as it won't go up the prototype chain...
        if (path.node.operator !== 'in') {
          return;
        }
        let replacement = t.callExpression(
          t.memberExpression(path.node.right, t.identifier('hasOwnProperty')),
          [path.node.left]
        );
        path.replaceWith(replacement);
      },
    },
  };
}
