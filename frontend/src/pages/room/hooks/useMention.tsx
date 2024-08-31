import { useEffect, useState } from "react"


export type MentionSearch = {
  query: string
  show: boolean
}

export function useMention(content: string) {
  const [search, setSearch] = useState<MentionSearch>({
    query: '',
    show: false,
  })

  useEffect(() => {
    const words = content.split(" ")
    const lastWord = words[words.length - 1]
    if (!lastWord) {
      setSearch({
        show: false,
        query: '',
      })
      return
    }
    if (lastWord.endsWith('@')) {
      setSearch({
        query: '',
        show: true,
      })
      return
    }
    const index = lastWord.lastIndexOf('@')
    if (index === -1) {
      return
    }
    const query = lastWord.substring(index + 1)
    setSearch({
      query,
      show: true,
    })
  }, [content])

  return [search, setSearch] as const
}
