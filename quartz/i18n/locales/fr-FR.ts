import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "Sans titre",
    description: "Aucune description fournie",
  },

  common: {
    close: "Fermer",
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
      beginSearchingTitle: "Commencez la recherche.",
      beginSearchingText: "Saisissez un terme pour rechercher dans les archives.",
      noMatchTitle: "Aucune archive correspondante.",
      noMatchText: "L’index ne contient aucune entrée pour ce terme.",
      resultIndex: "Index des résultats",
      awaitingSelection: "En attente d’une archive sélectionnée",
      recordPreview: "Aperçu de l’archive",
    },

    tableOfContents: {
      title: "Plan de la page",
    },

    mobileUtilityBar: {
      ariaLabel: "Utilitaires de page",
    },

    settings: {
      handleLabel: "Paramètres",
      panelTitle: "Paramètres",
      performanceSection: "Performances",
      languageSection: "Langue",
      reduceMotion: "Réduire le mouvement",
      disableFlickering: "Désactiver le scintillement",
      disableRays: "Désactiver les rayons d’ambiance",
      disableBackgroundParallax: "Désactiver la parallaxe de l’arrière-plan",
    },
  },

  pages: {
    error: {
      code: "EXPURGÉ",
      title: "Archive introuvable",
      message: "Aucune archive correspondant à cette requête n’a été indexée.",
      goBack: "Retour",
      returnToGenesis: "Retour à la Genèse",
    },

    untranslated: {
      code: "TRADUCTION MANQUANTE",
      title: "Version non archivée",
      message: "Cette archive existe en version anglaise, mais la version sélectionnée n’a pas encore été archivée.",
      viewEnglish: "Voir l’original anglais",
    },
  },

  layout: {
    pageTitleSuffix: " | La magie devenue réalité",
  },
} as const satisfies Translation
