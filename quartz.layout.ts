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
        // 1. 尝试读取 frontmatter 中的 order 属性
        // 使用 as any 绕过 TS 对 ContentDetails 的严格类型检查
        const getOrder = (node: any) => {
          // 兼容性写法：优先读取 node.data（新版），降级读取 node.file（老版）
          const frontmatter = node.data?.frontmatter ?? node.file?.frontmatter
          return frontmatter?.order ? Number(frontmatter.order) : 100
        }

        const orderA = getOrder(a)
        const orderB = getOrder(b)

        // 2. 如果两者 order 不同，则按从小到大排序
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 3. 如果 order 相同（或者都没设置），则退回到 Quartz 的默认排序逻辑：
        // 同级别下，按展示名称的字母/拼音顺序排列
        if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
          return a.displayName.localeCompare(b.displayName)
        }

        // 4. 文件夹排在文件前面
        return a.isFolder && !b.isFolder ? -1 : 1
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
        // 1. 尝试读取 frontmatter 中的 order 属性
        // 使用 as any 绕过 TS 对 ContentDetails 的严格类型检查
        const getOrder = (node: any) => {
          // 兼容性写法：优先读取 node.data（新版），降级读取 node.file（老版）
          const frontmatter = node.data?.frontmatter ?? node.file?.frontmatter
          return frontmatter?.order ? Number(frontmatter.order) : 100
        }

        const orderA = getOrder(a)
        const orderB = getOrder(b)

        // 2. 如果两者 order 不同，则按从小到大排序
        if (orderA !== orderB) {
          return orderA - orderB
        }

        // 3. 如果 order 相同（或者都没设置），则退回到 Quartz 的默认排序逻辑：
        // 同级别下，按展示名称的字母/拼音顺序排列
        if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
          return a.displayName.localeCompare(b.displayName)
        }

        // 4. 文件夹排在文件前面
        return a.isFolder && !b.isFolder ? -1 : 1
      },
    }),
  ],
  right: [],
}
