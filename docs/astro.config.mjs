import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsTxt from "starlight-llms-txt";

export default defineConfig({
  site: "https://cmendezs.github.io",
  base: "/payment-foundry/",
  integrations: [
    starlight({
      title: "Payment Foundry",
      description: "Cross-functional alignment, not just code.",
      customCss: ["./src/styles/docs-theme.css"],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/cmendezs/payment-foundry" },
      ],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        fr: { label: "Français", lang: "fr" },
        de: { label: "Deutsch", lang: "de" },
        it: { label: "Italiano", lang: "it" },
        es: { label: "Español", lang: "es" },
        pt: { label: "Português", lang: "pt" },
        pl: { label: "Polski", lang: "pl" },
        ar: { label: "العربية", lang: "ar", dir: "rtl" },
      },
      sidebar: [
        { label: "Overview", link: "/" },
        { label: "Changelog", link: "/changelog/" },
        { label: "Contributing", link: "/contributing/" },
        { label: "Security", link: "/security/" },
        { label: "Code of Conduct", link: "/code-of-conduct/" },
        { label: "Support", link: "/support/" },
      ],
      plugins: [
        starlightLlmsTxt({
          projectName: "Payment Foundry",
          description: "Cross-functional alignment, not just code.",
          customSets: [
            {
              label: "Key links",
              description: "Repository and license",
              links: ["https://github.com/cmendezs/payment-foundry"],
            },
          ],
        }),
      ],
    }),
  ],
});
