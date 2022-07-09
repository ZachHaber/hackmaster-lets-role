import esbuild from 'esbuild';
import babel from '@babel/core';
import fs from 'fs-extra';
import { argv } from 'process';
import path from 'path';

const isBuild = argv.some((arg) => ['-b', '--build'].includes(arg));
const isWatch = argv.some((arg) => ['-w', '--watch'].includes(arg));

try {
  const result = await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outdir: 'build',
    format: 'esm',
    write: false,
    minify: isBuild,
    watch: isWatch && {
      async onRebuild(error, result) {
        if (error) console.error('watch build failed:', error);
        else {
          await transpileBuild(result);
          console.log(`${new Date().toISOString()}: watch build succeeded`);
        }
      },
    },
  });
  await transpileBuild(result);
  console.log(`${new Date().toISOString()}: Initial Build`);
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
      const res = await babel.transformAsync(raw, {
        minified: isBuild,
        configFile: true,
        filename: path.basename(filePath),
      });
      await fs.writeFile(filePath, res.code, {
        flag: 'w',
      });
    } else {
      // don't run css through babel
      await fs.writeFile(filePath, raw, { flag: 'w' });
    }
  }
}
