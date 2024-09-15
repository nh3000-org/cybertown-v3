import { Messages } from "@/components/messages";
import { useMessages } from "@/hooks/queries/useMessages";
import { useAppStore } from "@/stores/appStore";
import { User } from "@/types"
import { ChevronLeft as LeftIcon } from 'lucide-react';
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { MESSAGES_LIMIT, usePreviousMessages } from "../hooks/usePreviousMessages";
import { Message } from "@/types/broadcast";

type Props = {
  user: User
  setDM: (dm: User | null) => void
}

export function DM(props: Props) {
  const clearDM = useAppStore().clearDM
  const dmUnread = useAppStore().dmUnread
  const { data: initialMessages } = useMessages(props.user.id)
  const messages = useAppStore().dm[props.user.id] ?? []
  const [previousMessages, setPreviousMessages] = useState<Message[]>([])
  const { ref: messagesStartRef, inView } = useInView()
  const { loading: isPrevMessagesLoading, fetchMessages } = usePreviousMessages(props.user.id)

  useEffect(() => {
    return function() {
      clearDM(props.user.id)
    }
  }, [props.user.id])

  useEffect(() => {
    if (inView && !isPrevMessagesLoading && initialMessages && initialMessages.length >= MESSAGES_LIMIT) {
      fetchMessages(initialMessages[0].createdAt).then(messages => {
        if (messages) {
          setPreviousMessages(prev => [...messages, ...prev])
        }
      })
    }
  }, [inView])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex gap-2 items-center">
        <button className="focus:ring-0" onClick={() => props.setDM(null)}>
          <LeftIcon size={22} className="text-muted" />
        </button>
        <div className="relative">
          <img className="w-8 h-8 rounded-full mr-1" src={props.user.avatar} referrerPolicy="no-referrer" />
          {dmUnread[props.user.id] && (
            <span className="w-[10px] h-[10px] rounded-full rounded-full block bg-danger absolute right-[2px] top-0" />
          )}
        </div>
        <p>{props.user.username}</p>
      </div>
      <Messages
        pm={null}
        setPM={() => { }}
        messages={messages}
        room={null}
        dm={props.user}
        initialMessages={initialMessages}
        prevMsg={{
          isLoading: isPrevMessagesLoading,
          ref: messagesStartRef,
          messages: previousMessages,
        }}
      />
    </div>
  )
}
