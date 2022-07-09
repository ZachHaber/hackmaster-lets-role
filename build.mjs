import esbuild from 'esbuild';
import babel from '@babel/core';
import fs from 'fs-extra';
import { argv } from 'process';
import path from 'path';
import typescript from 'typescript';
import esbuildPluginTsc from './plugins/esbuild-plugin-tsc.mjs';

const isBuild = argv.some((arg) => ['-b', '--build'].includes(arg));
const isWatch = argv.some((arg) => ['-w', '--watch'].includes(arg));

const awaiter = `var _awaiter = function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};`;
const generator = `var _generator = function (thisArg, body) {
  let _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2), '@@iterator': function(){ return this; } };
  function verb(n) { return function () { return step([n, arguments[0]]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_) try {
          f = 1;
          if (y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          y = 0;
          if (t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : undefined, done: true };
  }
};
`;

try {
  const result = await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outdir: 'build',
    format: 'esm',
    write: false,
    minify: isBuild,
    tsconfig: './tsconfig.esbuild.json',
    watch: isWatch && {
      async onRebuild(error, result) {
        if (error) console.error('watch build failed:', error);
        else {
          await transpileBuild(result);
          console.log('watch build succeeded');
        }
      },
    },
    plugins: [
      // esbuildPluginTsc({ tsconfigPath: './tsconfig.json', force: true }),
    ],
  });
  await transpileBuild(result);
  console.log('Initial Build');
} catch (error) {
  console.error(error);
  process.exit(1);
}

/**
 *
 * @param {esbuild.BuildResult}
 */
async function transpileBuild({ outputFiles }) {
  for (const { path: filePath, contents } of outputFiles) {
    const raw = new TextDecoder().decode(contents);
    await fs.ensureDir(path.dirname(filePath));
    if (filePath.endsWith('.js')) {
      const res = typescript.transpile(raw, {
        allowJs: true,
        checkJs: false,
        target: typescript.ScriptTarget.ES5,
        lib: ['ESNext'],
        downlevelIteration: true,
      });
      const transpiled = await babel.transformAsync(res, {
        minified: isBuild,
        configFile: true,
        filename: path.basename(filePath),
      });
      await fs.writeFile(filePath, transpiled.code, { flag: 'w' });
      return;
    }
    // if (filePath.endsWith('.js')) {
    //   const res = await babel.transformAsync(raw, {
    //     minified: isBuild,
    //     configFile: true,
    //     filename: path.basename(filePath),
    //   });
    //   await fs.writeFile(
    //     filePath,
    //     res.code
    //       .replaceAll(
    //         `import { _generator } from "babel-plugin-lite-regenerator-runtime";`,
    //         generator
    //       )
    //       .replaceAll(
    //         `import { _awaiter } from "babel-plugin-lite-regenerator-runtime";`,
    //         awaiter
    //       ),
    //     {
    //       flag: 'w',
    //     }
    //   );
    // } else {
    //   // don't run css through babel
    // }
    await fs.writeFile(filePath, raw, { flag: 'w' });
  }
}

// const await = `var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }`
// const asyncGenerator = `var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
//   if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
//   var g = generator.apply(thisArg, _arguments || []), i, q = [];
//   return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
//   function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
//   function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
//   function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
//   function fulfill(value) { resume("next", value); }
//   function reject(value) { resume("throw", value); }
//   function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
// };`
