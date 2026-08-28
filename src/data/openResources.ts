export interface OpenResourceSource {
  id: string;
  name: string;
  scope: string;
  note: string;
  searchUrl: (query: string) => string;
}

export const openResourceSources: OpenResourceSource[] = [
  {
    id: "marxists",
    name: "Marxists Internet Archive",
    scope: "马克思、恩格斯与西方马克思主义公开文本",
    note: "优先核对版本、译者、目录与页面版权说明。",
    searchUrl: (query) =>
      `https://www.google.com/search?q=${encodeURIComponent(`site:marxists.org/chinese ${query}`)}`
  },
  {
    id: "wikisource",
    name: "维基文库",
    scope: "进入公版范围的中文与外文经典",
    note: "仅使用明确标注版权状态的页面。",
    searchUrl: (query) =>
      `https://zh.wikisource.org/w/index.php?search=${encodeURIComponent(query)}`
  },
  {
    id: "internet-archive",
    name: "Internet Archive",
    scope: "历史版本、公共领域扫描本与受控借阅资源",
    note: "借阅资源不下载再分发，公共领域资源需核验条目标记。",
    searchUrl: (query) =>
      `https://archive.org/search?query=${encodeURIComponent(query)}`
  },
  {
    id: "stanford",
    name: "Stanford Encyclopedia of Philosophy",
    scope: "哲学家、流派与概念的权威二手资料",
    note: "用于检索线索与释义，不替代原著页码引用。",
    searchUrl: (query) =>
      `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent(query)}`
  }
];
