import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided",
  },

  components: {
    backlinks: {
      title: "References",
      noBacklinksFound: "No references found",
    },

    explorer: {
      title: "Explorer",
      toggleLabel: "Toggle explorer",
    },

    search: {
      title: "Search",
      searchBarPlaceholder: "Enter a term",
      returnButton: "Return",
      beginSearchingTitle: "Begin Searching.",
      beginSearchingText: "Enter a term to search for records.",
      noMatchTitle: "No matching record.",
      noMatchText: "The index contains no entry for that term.",
      resultIndex: "Result Index",
      awaitingSelection: "Awaiting record selection",
      recordPreview: "Record Preview",
    },

    tableOfContents: {
      title: "Page Outline",
    },

    settings: {
      handleLabel: "Settings",
      panelTitle: "Settings",
      performanceSection: "Performance",
      languageSection: "Language",
      disableAnimations: "Disable Animations",
      disableRays: "Disable Rays",
      disableMovement: "Disable Movement",
      disableFlickering: "Disable Flickering",
      disableParallax: "Disable Parallax",
      disableBackgroundParallax: "Disable Background Parallax",
    },
  },

  pages: {
    error: {
      code: "REDACTED",
      title: "Record Not Found",
      message: "No record matching this request has ever been indexed.",
      goBack: "Return",
      returnToGenesis: "Return to Genesis",
    },

    untranslated: {
      code: "MISSING TRANSLATION",
      title: "Current Transcript Not Archived",
      message: "This record exists in English, but the selected language version has not yet been archived.",
      viewEnglish: "View English Original",
    },
  },

  layout: {
    pageTitleSuffix: " | Magic Made Reality",
  },
} as const satisfies Translation