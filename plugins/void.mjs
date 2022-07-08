/**
 *
 * @param {import("@babel/core")} param0
 * @returns {import("@babel/core").PluginObj}
 */
export default function ({ types: t }) {
  return {
    visitor: {
      UnaryExpression(path) {
        // Replace `void 0` with undefined as lets role throws on `void` operator
        if (path.node.operator !== 'void') {
          return;
        }
        if (!t.isLiteral(path.node.argument)) {
          console.error(
            `Build will likely fail due to presence of a 'void' operator`
          );
          return;
        }
        path.replaceWith(t.identifier('undefined'));
      },
    },
  };
}
