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
      sortFn: (a, b) => {
        // 第一步：在函数的最开头，直接把 a 和 b 暴力断言为 any，彻底干掉 TS 的类型检查
        const nodeA = a as any
        const nodeB = b as any

        // 第二步：使用 nodeA 和 nodeB 去获取 order，用最扁平的 if 判断
        let orderA = 100
        if (nodeA.file && nodeA.file.frontmatter && nodeA.file.frontmatter.order) {
          orderA = Number(nodeA.file.frontmatter.order)
        } else if (nodeA.data && nodeA.data.frontmatter && nodeA.data.frontmatter.order) {
          orderA = Number(nodeA.data.frontmatter.order)
        }

        let orderB = 100
        if (nodeB.file && nodeB.file.frontmatter && nodeB.file.frontmatter.order) {
          orderB = Number(nodeB.file.frontmatter.order)
        } else if (nodeB.data && nodeB.data.frontmatter && nodeB.data.frontmatter.order) {
          orderB = Number(nodeB.data.frontmatter.order)
        }

        // 第三步：核心排序逻辑
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 兼容新版 isFolder 和旧版的判定逻辑
        const aIsFolder = nodeA.isFolder ?? (!nodeA.file && !nodeA.data)
        const bIsFolder = nodeB.isFolder ?? (!nodeB.file && !nodeB.data)

        if (aIsFolder !== bIsFolder) {
          return aIsFolder ? -1 : 1
        }

        // 同级别下按名称字母/拼音顺序排序
        return nodeA.displayName.localeCompare(nodeB.displayName)
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
      sortFn: (a, b) => {
        // 第一步：在函数的最开头，直接把 a 和 b 暴力断言为 any，彻底干掉 TS 的类型检查
        const nodeA = a as any
        const nodeB = b as any

        // 第二步：使用 nodeA 和 nodeB 去获取 order，用最扁平的 if 判断
        let orderA = 100
        if (nodeA.file && nodeA.file.frontmatter && nodeA.file.frontmatter.order) {
          orderA = Number(nodeA.file.frontmatter.order)
        } else if (nodeA.data && nodeA.data.frontmatter && nodeA.data.frontmatter.order) {
          orderA = Number(nodeA.data.frontmatter.order)
        }

        let orderB = 100
        if (nodeB.file && nodeB.file.frontmatter && nodeB.file.frontmatter.order) {
          orderB = Number(nodeB.file.frontmatter.order)
        } else if (nodeB.data && nodeB.data.frontmatter && nodeB.data.frontmatter.order) {
          orderB = Number(nodeB.data.frontmatter.order)
        }

        // 第三步：核心排序逻辑
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 兼容新版 isFolder 和旧版的判定逻辑
        const aIsFolder = nodeA.isFolder ?? (!nodeA.file && !nodeA.data)
        const bIsFolder = nodeB.isFolder ?? (!nodeB.file && !nodeB.data)

        if (aIsFolder !== bIsFolder) {
          return aIsFolder ? -1 : 1
        }

        // 同级别下按名称字母/拼音顺序排序
        return nodeA.displayName.localeCompare(nodeB.displayName)
      },
    }),
  ],
  right: [],
}
