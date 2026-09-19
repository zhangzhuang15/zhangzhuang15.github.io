import type { MarkdownOptions } from "vitepress"

type MarkdownIt = Parameters<MarkdownOptions['config'] & {}>[0]
export default (md: MarkdownIt) => {
  // 保存原始fence渲染函数
  const defaultFenceRender = md.renderer.rules.fence

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()

    // 正则匹配 [example.ts]
    const filenameMatch = info.match(/\[([^\]]+)\]/)
    const fileName = filenameMatch?.[1] || ''

    // 调用原生渲染，得到 <pre>...</pre>
    const codeHtml = defaultFenceRender?.(tokens, idx, options, env, self) || ''

    if (!fileName) {
      // 没有写 [xxx]，原样返回
      return codeHtml
    }

    // ✅ 包裹标题栏，外层容器，和VitePress样式对齐
    return `
<div class="vp-code-block-with-title">
  <div class="vp-code-title">${md.utils.escapeHtml(fileName)}</div>
  ${codeHtml}
</div>
`
  }
}