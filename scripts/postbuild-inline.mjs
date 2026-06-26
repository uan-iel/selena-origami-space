import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");

const assetFiles = await readdir(assetsDir);
const jsFile = assetFiles.find((file) => file.endsWith(".js"));
const cssFile = assetFiles.find((file) => file.endsWith(".css"));

if (!jsFile || !cssFile) {
  throw new Error("Build assets not found for inline postbuild.");
}

const [html, js, css] = await Promise.all([
  readFile(path.join(distDir, "index.html"), "utf8"),
  readFile(path.join(assetsDir, jsFile), "utf8"),
  readFile(path.join(assetsDir, cssFile), "utf8")
]);

const escapedClosingScript = js.replace(/<\/script>/gi, "<\\/script>");

const inlinedHtml = html
  .replace(
    /<script type="module" crossorigin src="\.\/assets\/[^"]+"><\/script>/,
    `<script defer src="./assets/${jsFile}"></script>`
  )
  .replace(
    /<link rel="stylesheet" crossorigin href="\.\/assets\/[^"]+">/,
    `<style>${css}</style>`
  );

await writeFile(path.join(assetsDir, jsFile), escapedClosingScript, "utf8");

await writeFile(path.join(distDir, "index.html"), inlinedHtml, "utf8");
