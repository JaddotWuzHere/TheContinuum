import { Translation } from "./definition"

export default {
  propertyDefaults: {
    title: "无题",
    description: "未提供描述",
  },

  common: {
    close: "关闭",
  },

  components: {
    backlinks: {
      title: "参考条目",
      noBacklinksFound: "未找到参考条目",
    },

    explorer: {
      title: "索引",
      toggleLabel: "切换探索器",
      folderPathAriaLabel: "档案路径",
      foldersSection: "目录",
      pagesSection: "记录",
      emptyState: "未找到记录。",
      openFolder: (folderName: string) => `打开${folderName}`,
      backToFolder: (folderName: string) => `返回${folderName}`,
    },
    
    search: {
      title: "检索",
      searchBarPlaceholder: "输入词条",
      beginSearchingTitle: "开始检索。",
      beginSearchingText: "输入词条以检索档案记录。",
      noMatchTitle: "未找到匹配记录。",
      noMatchText: "索引中不存在该词条的记录。",
      resultIndex: "结果索引",
      awaitingSelection: "等待选择档案记录",
      recordPreview: "档案预览",
    },

    tableOfContents: {
      title: "页面提纲",
    },

    mobileUtilityBar: {
      ariaLabel: "页面工具",
    },

    settings: {
      handleLabel: "设置",
      panelTitle: "设置",
      performanceSection: "性能",
      languageSection: "语言",
      reduceMotion: "减少动态效果",
      disableFlickering: "禁用闪烁",
      disableRays: "禁用氛围光线",
      disableBackgroundParallax: "禁用背景视差",
    },
  },

  pages: {
    error: {
      code: "已删改",
      title: "未找到档案",
      message: "未有任何符合请求的档案记录被收录。",
      goBack: "返回",
      returnToGenesis: "返回初章",
    },

    untranslated: {
      code: "译文缺页",
      title: "当前译本尚未归档",
      message: "此记录已有英文原文，但当前语言的译本尚未收录。",
      viewEnglish: "查看英文原文",
    },
  },

  layout: {
    pageTitleSuffix: " | 以魔为实",
  },
} as const satisfies Translation
