import { useAppStore } from "@/stores/appStore"
import { RoomRes } from "@/types"
import { useEffect, useState } from "react"

export type TextareaSearch = {
  query: string
  show: boolean
}

export function useMention(content: string, room: RoomRes | null) {
  const user = useAppStore().user
  const [search, setSearch] = useState<TextareaSearch>({
    query: '',
    show: false,
  })

  const mentionedParticipants = room === null ? [] : room.participants.
    filter(el => el.id !== user?.id && el.username.toLowerCase().
      includes(search.query.toLowerCase()))

  useEffect(() => {
    if (room === null) {
      return
    }

    const timeoutID = setTimeout(() => {
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
    })
    return () => clearTimeout(timeoutID)
  }, [content])

  return {
    search,
    setSearch,
    mentionedParticipants
  }
}
