import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";
import { externalMarkdown } from "./loaders/external-md.mjs";

export const collections = {
  docs: defineCollection({
    loader: externalMarkdown([
      { id: "index", path: "../README.md" },
      { id: "fr", path: "../README.fr.md" },
      { id: "de", path: "../README.de.md" },
      { id: "it", path: "../README.it.md" },
      { id: "es", path: "../README.es.md" },
      { id: "pt", path: "../README.pt.md" },
      { id: "pl", path: "../README.pl.md" },
      { id: "ar", path: "../README.ar.md" },
      { id: "changelog", path: "../CHANGELOG.md" },
      { id: "contributing", path: "../CONTRIBUTING.md" },
      { id: "security", path: "../SECURITY.md" },
      { id: "code-of-conduct", path: "../CODE_OF_CONDUCT.md" },
      { id: "support", path: "../SUPPORT.md" },
    ]),
    schema: docsSchema(),
  }),
};
