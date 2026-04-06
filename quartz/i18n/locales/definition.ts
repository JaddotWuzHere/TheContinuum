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
    }

    tableOfContents: {
      title: string
    }

    settings: {
      handleLabel: string
      panelTitle: string
      performanceSection: string
      languageSection: string
      disableAnimations: string
      disableRays: string
      disableMovement: string
      disableFlickering: string
      disableParallax: string
      disableBackgroundParallax: string
    }

    footer: {
      recordTitle: string
      copyright: string
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
  }

  layout: {
    pageTitleSuffix: string
  }
}