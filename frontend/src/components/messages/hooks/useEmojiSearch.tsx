import { useEmoji } from "@/hooks/queries/useEmoji";
import { useEffect, useState } from "react";

export type Emoji = {
  id: string
  name: string
  emoji: string
}

export function useEmojiSearch(content: string) {
  const { data } = useEmoji()

  const [search, setSearch] = useState({
    show: false,
    query: ''
  })

  const emojis: Emoji[] = search.query ? (Object.values(data.emojis as Record<string, any>).
    filter((emoji) => {
      return emoji.name.toLowerCase().includes(search.query.toLowerCase())
    })).map(e => {
      return {
        name: e.name,
        id: e.id,
        emoji: e.skins[0].native,
      }
    }) : []

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      const words = content.split(" ")
      const lastWord = words[words.length - 1]
      const show = lastWord.startsWith(":") && lastWord.length >= 2
      let query = ''
      if (show) {
        query += lastWord.substring(1)
      }
      setSearch({
        show,
        query,
      })
    }, 300)
    return () => clearTimeout(timeoutID)
  }, [content])

  return {
    search,
    setSearch,
    emojis,
  }
}
