'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

// ステージバッジ用の inline HTML（span + style）を許可するサニタイズスキーマ。
// style 属性は span/td/th のみ許可し、それ以外はデフォルトの厳格設定を維持する。
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'span'],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), 'style'],
    td: [...(defaultSchema.attributes?.td ?? []), 'style', 'align'],
    th: [...(defaultSchema.attributes?.th ?? []), 'style', 'align'],
  },
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
    >
      {children}
    </ReactMarkdown>
  )
}
