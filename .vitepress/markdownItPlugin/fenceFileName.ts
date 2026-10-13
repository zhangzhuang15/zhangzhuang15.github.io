import type { MarkdownOptions } from "vitepress"

type MarkdownIt = Parameters<MarkdownOptions['config'] & {}>[0]
export default (md: MarkdownIt) => {
  // 当外层被 :::code-group包裹时，给fence的token添加meta.codeGroup = true，方便后续渲染时判断
  const defaultCodeGroupOpenRender = md.renderer.rules["container_code-group_open"]
  md.renderer.rules["container_code-group_open"] = (tokens, idx, options, env, self) => {
    // 循环判定条件来自 vitepress 源码，markdown/plugins/container.ts
    for (
      let i = idx + 1;
      !(
        tokens[i].nesting === -1 &&
        tokens[i].type === 'container_code-group_close'
      );
      ++i
    ) {
      if (tokens[i].type === 'fence') {
        tokens[i].meta = tokens[i].meta || {}
        tokens[i].meta.codeGroup = true
      }
    }
    return defaultCodeGroupOpenRender?.(tokens, idx, options, env, self) || ''
  }

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

    // 外层有:::code-group包裹时，不用设置标题
    if (token.meta?.codeGroup) {
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