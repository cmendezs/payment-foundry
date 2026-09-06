import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function extractTitle(raw, fallback) {
  const m = raw.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function stripLeadingH1(raw) {
  return raw.replace(/^#\s+.*\r?\n+/, "");
}

/**
 * @param {{ id: string, path: string, title?: string }[]} entries
 *   `path` is resolved relative to the Astro project root (this package's `docs/` directory).
 *   A locale's homepage uses the bare locale code as `id` (e.g. "fr" for README.fr.md) — the one
 *   Starlight-recognized special case where an index-like page's id is not "<locale>/<slug>".
 *   A missing file is skipped with a warning, not an error.
 */
export function externalMarkdown(entries) {
  return {
    name: "external-markdown-loader",
    load: async ({ config, store, parseData, renderMarkdown, generateDigest, logger }) => {
      for (const { id, path, title: titleOverride } of entries) {
        const fileUrl = new URL(path, config.root);
        if (!existsSync(fileUrl)) {
          logger.warn(`External markdown source not found for "${id}": ${path}`);
          continue;
        }
        const raw = readFileSync(fileUrl, "utf-8");
        const body = stripLeadingH1(raw);
        const data = { title: titleOverride ?? extractTitle(raw, id) };
        const parsedData = await parseData({ id, data, filePath: fileURLToPath(fileUrl) });
        const rendered = await renderMarkdown(body);
        const digest = generateDigest(raw);
        store.set({ id, data: parsedData, body, filePath: path, digest, rendered });
      }
    },
  };
}
