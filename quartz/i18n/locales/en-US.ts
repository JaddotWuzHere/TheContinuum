import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided",
  },

  common: {
    close: "Close",
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

    mobileUtilityBar: {
      ariaLabel: "Page utilities",
    },

    settings: {
      handleLabel: "Settings",
      panelTitle: "Settings",
      performanceSection: "Performance",
      languageSection: "Language",
      reduceMotion: "Reduce Motion",
      disableFlickering: "Disable Flickering",
      disableRays: "Disable Ambient Rays",
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
