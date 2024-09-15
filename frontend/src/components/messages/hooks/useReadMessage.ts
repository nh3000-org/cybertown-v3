import { useUpdateDM } from "@/hooks/mutations/useUpdateDM"
import { useAppStore } from "@/stores/appStore"
import { Message } from "@/types/broadcast"
import { useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"

export function useReadMessage(participantID: number | undefined, initialMessages: Message[], messages: Message[]) {
  const user = useAppStore().user
  const setDMRead = useAppStore().setDMReadForParticipant
  const { mutate: updateDM } = useUpdateDM()
  const { ref, inView } = useInView()
  const lastMessageRef = useRef<string | null>(null)

  useEffect(() => {
    let timeoutID: ReturnType<typeof setTimeout>

    if (inView && participantID) {
      timeoutID = setTimeout(() => {
        const allMessages = [...initialMessages, ...messages]
        if (!allMessages.length) {
          return
        }

        const lastMessage = allMessages[allMessages.length - 1]
        const isFromMe = lastMessage.from.id === user?.id
        if (isFromMe || lastMessageRef.current === lastMessage.id) {
          return
        }

        setDMRead(participantID)
        updateDM(participantID)
        lastMessageRef.current = lastMessage.id
      }, 1500)
    }

    return () => clearTimeout(timeoutID)
  }, [messages, initialMessages, inView])

  return ref
}

