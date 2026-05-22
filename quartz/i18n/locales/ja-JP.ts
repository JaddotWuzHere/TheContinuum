import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "無題",
    description: "説明はありません",
  },

  components: {
    backlinks: {
      title: "参考項目",
      noBacklinksFound: "参考項目はありません",
    },

    explorer: {
      title: "探索",
      toggleLabel: "探索欄を切り替える",
    },

    search: {
      title: "検索",
      searchBarPlaceholder: "語句を入力",
      returnButton: "戻る",
      beginSearchingTitle: "検索を開始。",
      beginSearchingText: "記録を検索する語句を入力してください。",
      noMatchTitle: "一致する記録はありません。",
      noMatchText: "その語句に対応する項目は索引内に存在しません。",
      resultIndex: "検索結果索引",
    },

    tableOfContents: {
      title: "ページ概要",
    },

    settings: {
      handleLabel: "設定",
      panelTitle: "設定",
      performanceSection: "パフォーマンス",
      languageSection: "言語",
      disableAnimations: "アニメーションを無効化",
      disableRays: "光線を無効化",
      disableMovement: "動きを無効化",
      disableFlickering: "点滅を無効化",
      disableParallax: "視差を無効化",
      disableBackgroundParallax: "背景視差を無効化",
    },

    footer: {
      recordTitle: "コンティニュアム・アーカイブ記録",
      copyright: "© {year} Jason Ding",
    },
  },

  pages: {
    error: {
      code: "閲覧禁止",
      title: "記録制限",
      message: "要求された記録は閲覧できません。",
      goBack: "戻る",
      returnToGenesis: "端緒へ戻る",
    },

    untranslated: {
      code: "訳文欠落",
      title: "現在の訳本は未収録",
      message: "この記録には英語原文がありますが、選択中の言語版はまだ収録されていません。",
      viewEnglish: "英語原文を見る",
    },
  },

  layout: {
    pageTitleSuffix: " | 魔法が現実となる",
  },
} as const satisfies Translation