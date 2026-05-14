import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "The Continuum",
    pageTitleSuffix: " | Magic made reality",
    baseUrl: "continuumarchives.com",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    ignorePatterns: ["private", "templates", ".obsidian"],
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        title: "Cinzel",
        header: "EBGaramond",
        body: "EBGaramond",
        code: "ui-monospace",
      },
      colors: {
        light: "#030705",
        lightgray: "#393639",
        gray: "#646464",
        darkgray: "#d4d4d4",
        dark: "#ebebec",
        secondary: "#8b6f3a",
        tertiary: "#b08d57",
        highlight: "rgba(143, 159, 169, 0.15)",
        textHighlight: "#b3aa0288",
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.SyntaxHighlighting({
        theme: "github-dark",
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({
        comments: true,
        highlight: true,
        wikilinks: true,
        callouts: true,

        parseArrows: true,

        enableInHtmlEmbed: false,

        disableBrokenWikilinks: false,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
