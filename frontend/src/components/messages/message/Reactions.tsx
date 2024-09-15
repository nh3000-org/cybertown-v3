import { getParticipantID } from "@/lib/utils"
import { ws } from "@/lib/ws"
import { useAppStore } from "@/stores/appStore"
import { Message } from "@/types/broadcast"
import * as HoverCard from '@radix-ui/react-hover-card'

type Props = {
  message: Message
}

export function Reactions(props: Props) {
  const { message } = props
  const user = useAppStore().user

  return (
    <div className="flex gap-2 mt-1 text-sm items-center flex-wrap">
      {Object.entries(message.reactions ?? {}).map(([reaction, userMap]) => {
        return (
          <HoverCard.Root key={reaction}>
            <HoverCard.Trigger asChild>
              <button key={reaction} className='text-sm focus:ring-0 flex items-center gap-2 border border-accent/60 bg-accent/20 px-[6px] py-[2px] rounded-md' onClick={() => {
                ws.reactionToMsg(props.message.id, reaction, getParticipantID(props.message, user!))
              }}>
                <em-emoji id={reaction}></em-emoji>
                <span className='font-semibold'>{Object.keys(userMap).length}</span>
              </button>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content className='rounded-lg p-3 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-3 border border-border' sideOffset={10}>
                {Object.values(userMap).map(user => {
                  return <div key={user.id} className='flex gap-2 items-center'>
                    <img className="w-4 h-4 rounded-md" src={user.avatar} referrerPolicy="no-referrer" />
                    <p className='text-xs'>{user.username}</p>
                  </div>
                })}
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        )
      })}
    </div>
  )
}
