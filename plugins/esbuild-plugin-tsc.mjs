import fs from 'node:fs/promises';
import path from 'path';
import typescript from 'typescript';

import { inspect } from 'util';

const esbuildPluginTsc = ({
  tsconfigPath = path.join(process.cwd(), './tsconfig.json'),
} = {}) => ({
  name: 'tsc',
  setup(build) {
    let parsedTsConfig = null;

    build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
      if (!parsedTsConfig) {
        parsedTsConfig = parseTsConfig(tsconfigPath, process.cwd());
        if (parsedTsConfig.sourcemap) {
          parsedTsConfig.sourcemap = false;
          parsedTsConfig.inlineSources = true;
          parsedTsConfig.inlineSourceMap = true;
        }
      }
      const ts = await fs
        .readFile(args.path, 'utf8')
        .catch((err) => printDiagnostics({ file: args.path, err }));

      const program = typescript.transpileModule(ts, {
        compilerOptions: { ...parsedTsConfig.options, module: 'ESNext' },
      });
      return { contents: program.outputText };
    });
  },
});

function parseTsConfig(tsconfig, cwd = process.cwd()) {
  const fileName = typescript.findConfigFile(
    cwd,
    typescript.sys.fileExists,
    tsconfig
  );

  // if the value was provided, but no file, fail hard
  if (tsconfig !== undefined && !fileName)
    throw new Error(`failed to open '${fileName}'`);

  let loadedConfig = {};
  let baseDir = cwd;
  let configFileName;
  if (fileName) {
    const text = typescript.sys.readFile(fileName);
    if (text === undefined) throw new Error(`failed to read '${fileName}'`);

    const result = typescript.parseConfigFileTextToJson(fileName, text);

    if (result.error !== undefined) {
      printDiagnostics(result.error);
      throw new Error(`failed to parse '${fileName}'`);
    }

    loadedConfig = result.config;
    baseDir = path.dirname(fileName);
    configFileName = fileName;
  }

  const parsedTsConfig = typescript.parseJsonConfigFileContent(
    loadedConfig,
    typescript.sys,
    baseDir
  );

  if (parsedTsConfig.errors[0]) printDiagnostics(parsedTsConfig.errors);

  return parsedTsConfig;
}

function printDiagnostics(...args) {
  console.log(inspect(args, false, 10, true));
}
export default esbuildPluginTsc;
