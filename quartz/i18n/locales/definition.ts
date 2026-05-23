export interface Translation {
  propertyDefaults: {
    title: string
    description: string
  }

  components: {
    backlinks: {
      title: string
      noBacklinksFound: string
    }

    explorer: {
      title: string
      toggleLabel: string
    }

    search: {
      title: string
      searchBarPlaceholder: string
      returnButton: string
      beginSearchingTitle: string
      beginSearchingText: string
      noMatchTitle: string
      noMatchText: string
      resultIndex: string
      awaitingSelection: string
      recordPreview: string
    }

    tableOfContents: {
      title: string
    }

    settings: {
      handleLabel: string
      panelTitle: string
      performanceSection: string
      languageSection: string
      reduceMotion: string
      disableFlickering: string
      disableRays: string
      disableBackgroundParallax: string
    }
  }

  pages: {
    error: {
      code: string
      title: string
      message: string
      goBack: string
      returnToGenesis: string
    }

    untranslated: {
      code: string
      title: string
      message: string
      viewEnglish: string
    }
  }

  layout: {
    pageTitleSuffix: string
  }
}