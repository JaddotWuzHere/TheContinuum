import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "无题",
    description: "未提供描述",
  },

  components: {
    backlinks: {
      title: "参考条目",
      noBacklinksFound: "未找到参考条目",
    },

    explorer: {
      title: "索引",
      toggleLabel: "切换索引栏",
    },

    search: {
      title: "检索",
      searchBarPlaceholder: "输入词条",
      returnButton: "返回",
      beginSearchingTitle: "开始检索。",
      beginSearchingText: "输入词条以检索档案记录。",
      noMatchTitle: "未找到匹配记录。",
      noMatchText: "索引中不存在该词条的记录。",
      resultIndex: "结果索引",
    },

    tableOfContents: {
      title: "页面提纲",
    },

    settings: {
      handleLabel: "设置",
      panelTitle: "设置",
      performanceSection: "性能",
      languageSection: "语言",
      disableAnimations: "禁用动画",
      disableRays: "禁用光线",
      disableMovement: "禁用移动",
      disableFlickering: "禁用闪烁",
      disableParallax: "禁用视差",
      disableBackgroundParallax: "禁用背景视差",
    },

    footer: {
      recordTitle: "Continuum 档案记录",
      copyright: "© {year} Jason Ding",
    },
  },

  pages: {
    error: {
      code: "已删改",
      title: "档案受限",
      message: "所请求的档案记录当前无法查阅。",
      goBack: "返回",
      returnToGenesis: "返回 Genesis",
    },
  },

  layout: {
    pageTitleSuffix: " | 以魔为实",
  },
} as const satisfies Translation