import esbuild from 'esbuild';
import babel from '@babel/core';
import fs from 'fs/promises';

try {
  const result = await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'build/index.js',
    format: 'esm',
    write: false,
    watch: {
      async onRebuild(error, result) {
        if (error) console.error('watch build failed:', error);
        else {
          await transpileBuild(result);
          console.log('watch build succeeded');
        }
      },
    },
  });
  await transpileBuild(result);
  console.log('Initial Build')
} catch (error) {
  console.error(error);
  process.exit(1);
}

/**
 *
 * @param {esbuild.BuildResult}
 */
async function transpileBuild({ outputFiles }) {
  for (const { path, contents } of outputFiles) {
    const raw = new TextDecoder().decode(contents);

    if (path.endsWith('.js')) {
      const res = await babel.transformAsync(raw, {
        plugins: [
          '@babel/plugin-transform-arrow-functions',
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-transform-template-literals',
          '@babel/plugin-transform-computed-properties',
          '@babel/plugin-transform-parameters',
        ],
      });
      await fs.writeFile(path, res.code.replaceAll('void 0', 'undefined'), {
        flag: 'w',
      });
    } else {
      // don't run css through babel
      await fs.writeFile(path, raw, { flag: 'w' });
    }
  }
}
