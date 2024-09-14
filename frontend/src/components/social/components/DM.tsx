import { Messages } from "@/components/messages";
import { useUpdateDM } from "@/hooks/mutations/useUpdateDM";
import { useMessages } from "@/hooks/queries/useMessages";
import { useAppStore } from "@/stores/appStore";
import { User } from "@/types"
import { ChevronLeft as LeftIcon } from 'lucide-react';
import { useEffect } from "react";

type Props = {
  user: User
  setDM: (dm: User | null) => void
}

export function DM(props: Props) {
  const setDM = useAppStore().setDM
  const clearDM = useAppStore().clearDM
  const setDMRead = useAppStore().setDMReadForParticipant
  const { data: prevMessages } = useMessages(props.user.id)
  const messages = useAppStore().dm[props.user.id] ?? []
  const { mutate: updateDM } = useUpdateDM()

  useEffect(() => {
    if (prevMessages) {
      setDM(props.user.id, prevMessages)
    }

    return function() {
      clearDM(props.user.id)
    }
  }, [prevMessages, props.user.id])

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      setDMRead(props.user.id)
      updateDM(props.user.id)
    }, 1500)
    return () => clearTimeout(timeoutID)
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex gap-2 items-center">
        <button className="focus:ring-0" onClick={() => props.setDM(null)}>
          <LeftIcon size={22} className="text-muted" />
        </button>
        <img className="w-8 h-8 rounded-full mr-1" src={props.user.avatar} referrerPolicy="no-referrer" />
        <p>{props.user.username}</p>
      </div>
      <Messages
        pm={null}
        setPM={() => { }}
        messages={messages}
        room={null}
        dm={props.user}
      />
    </div>
  )
}
