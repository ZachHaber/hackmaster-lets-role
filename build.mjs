import esbuild from "esbuild";

try {
  await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "build/index.js",
    format: "esm",
  });
} catch (error) {
  process.exit(1);
}
