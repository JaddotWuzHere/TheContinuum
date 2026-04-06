import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "Sans titre",
    description: "Aucune description fournie",
  },

  components: {
    backlinks: {
      title: "Références",
      noBacklinksFound: "Aucune référence trouvée",
    },

    explorer: {
      title: "Explorateur",
      toggleLabel: "Afficher ou masquer l’explorateur",
    },

    search: {
      title: "Recherche",
      searchBarPlaceholder: "Saisir un terme",
      returnButton: "Retour",
      beginSearchingTitle: "Commencez la recherche.",
      beginSearchingText: "Saisissez un terme pour rechercher dans les archives.",
      noMatchTitle: "Aucune archive correspondante.",
      noMatchText: "L’index ne contient aucune entrée pour ce terme.",
      resultIndex: "Index des résultats",
    },

    tableOfContents: {
      title: "Plan de la page",
    },

    settings: {
      handleLabel: "Paramètres",
      panelTitle: "Paramètres",
      performanceSection: "Performances",
      languageSection: "Langue",
      disableAnimations: "Désactiver les animations",
      disableRays: "Désactiver les rayons",
      disableMovement: "Désactiver le mouvement",
      disableFlickering: "Désactiver le scintillement",
      disableParallax: "Désactiver la parallaxe",
      disableBackgroundParallax: "Désactiver la parallaxe de l’arrière-plan",
    },

    footer: {
      recordTitle: "Archive du Continuum",
      copyright: "© {year} Jason Ding",
    },
  },

  pages: {
    error: {
      code: "CENSURÉ",
      title: "Archive restreinte",
      message: "L’archive demandée n’est pas disponible à la consultation.",
      goBack: "Retour",
      returnToGenesis: "Retour à la Genèse",
    },
  },

  layout: {
    pageTitleSuffix: " | La magie devenue réalité",
  },
} as const satisfies Translation