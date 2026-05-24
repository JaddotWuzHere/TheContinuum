import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "無題",
    description: "説明はありません",
  },

  common: {
    close: "閉じる",
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
      beginSearchingTitle: "検索を開始。",
      beginSearchingText: "記録を検索する語句を入力してください。",
      noMatchTitle: "一致する記録はありません。",
      noMatchText: "その語句に対応する項目は索引内に存在しません。",
      resultIndex: "検索結果索引",
      awaitingSelection: "記録の選択待ち",
      recordPreview: "記録プレビュー",
    },

    tableOfContents: {
      title: "ページ概要",
    },

    mobileUtilityBar: {
      ariaLabel: "ページ補助",
    },

    settings: {
      handleLabel: "設定",
      panelTitle: "設定",
      performanceSection: "パフォーマンス",
      languageSection: "言語",
      reduceMotion: "動きを減らす",
      disableFlickering: "点滅を無効化",
      disableRays: "環境光線を無効化",
      disableBackgroundParallax: "背景視差を無効化",
    },
  },

  pages: {
    error: {
      code: "抹消済み",
      title: "記録未検出",
      message: "この要求に一致する記録は、一度も索引に登録されていません。",
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
