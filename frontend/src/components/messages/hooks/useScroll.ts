import { useAppStore } from "@/stores/appStore"
import { Message } from "@/types/broadcast"
import { RefObject, useEffect } from "react"

export function useScroll(messagesEndRef: RefObject<HTMLDivElement>, scrollPercent: number, initialMessages: Message[], messages: Message[]) {
  const user = useAppStore().user

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView()
    }
  }, [initialMessages.length])

  useEffect(() => {
    if (!messages.length) {
      return
    }
    const lastMessage = messages[messages.length - 1]
    const isFromMe = lastMessage.from.id === user?.id
    if ((isFromMe || scrollPercent > 98) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView()
    }
  }, [messages.length])
}
