import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/yumuzhihan",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "目录",
      // mapFn 只在 Node.js 后端运行，用于去掉显示名称中的数字前缀
      mapFn: (node) => {
        const nodeAsAny = node as any
        const match = nodeAsAny.displayName.match(/^\d+-(.*)/)
        if (match) {
          nodeAsAny.displayName = match[1].trim()
        }
      },
      sortFn: (a, b) => {
        const nodeA = a as any
        const nodeB = b as any

        // --- 彻底拍平的提取逻辑，拒绝任何内部嵌套函数 ---

        // 提取 NodeA 的数字前缀
        let orderA = 99999
        const slugA = nodeA.data?.slug || nodeA.file?.slug || nodeA.name || ""
        const partsA = slugA.split("/")
        const fileNameA = partsA[partsA.length - 1] || ""
        const matchA = fileNameA.match(/^(\d+)-/)
        if (matchA) {
          orderA = parseInt(matchA[1], 10)
        }

        // 提取 NodeB 的数字前缀
        let orderB = 99999
        const slugB = nodeB.data?.slug || nodeB.file?.slug || nodeB.name || ""
        const partsB = slugB.split("/")
        const fileNameB = partsB[partsB.length - 1] || ""
        const matchB = fileNameB.match(/^(\d+)-/)
        if (matchB) {
          orderB = parseInt(matchB[1], 10)
        }

        // 1. 按提取出的序号排序
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 2. 文件夹排在前面
        const aIsFolder = nodeA.isFolder ?? (!nodeA.file && !nodeA.data)
        const bIsFolder = nodeB.isFolder ?? (!nodeB.file && !nodeB.data)
        if (aIsFolder !== bIsFolder) {
          return aIsFolder ? -1 : 1
        }

        // 3. 按名字兜底排序
        return nodeA.displayName.localeCompare(nodeB.displayName, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      },
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "目录",
      // mapFn 只在 Node.js 后端运行，用于去掉显示名称中的数字前缀
      mapFn: (node) => {
        const nodeAsAny = node as any
        const match = nodeAsAny.displayName.match(/^\d+-(.*)/)
        if (match) {
          nodeAsAny.displayName = match[1].trim()
        }
      },
      sortFn: (a, b) => {
        const nodeA = a as any
        const nodeB = b as any

        // --- 彻底拍平的提取逻辑，拒绝任何内部嵌套函数 ---

        // 提取 NodeA 的数字前缀
        let orderA = 99999
        const slugA = nodeA.data?.slug || nodeA.file?.slug || nodeA.name || ""
        const partsA = slugA.split("/")
        const fileNameA = partsA[partsA.length - 1] || ""
        const matchA = fileNameA.match(/^(\d+)-/)
        if (matchA) {
          orderA = parseInt(matchA[1], 10)
        }

        // 提取 NodeB 的数字前缀
        let orderB = 99999
        const slugB = nodeB.data?.slug || nodeB.file?.slug || nodeB.name || ""
        const partsB = slugB.split("/")
        const fileNameB = partsB[partsB.length - 1] || ""
        const matchB = fileNameB.match(/^(\d+)-/)
        if (matchB) {
          orderB = parseInt(matchB[1], 10)
        }

        // 1. 按提取出的序号排序
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 2. 文件夹排在前面
        const aIsFolder = nodeA.isFolder ?? (!nodeA.file && !nodeA.data)
        const bIsFolder = nodeB.isFolder ?? (!nodeB.file && !nodeB.data)
        if (aIsFolder !== bIsFolder) {
          return aIsFolder ? -1 : 1
        }

        // 3. 按名字兜底排序
        return nodeA.displayName.localeCompare(nodeB.displayName, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      },
    }),
  ],
  right: [],
}
