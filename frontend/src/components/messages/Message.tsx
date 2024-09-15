import { ChevronDown as ChevronDownIcon, SquarePen as PencilIcon, Trash as TrashIcon, ReplyAll as ReplyIcon, SmilePlus as EmojiIcon } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import { cn, getParticipantID, scrollToMessage, toHHMM } from '@/lib/utils'
import { ws } from '@/lib/ws'
import { useAppStore } from '@/stores/appStore'
import { EmojiPicker } from '@/components/EmojiPicker'
import * as HoverCard from '@radix-ui/react-hover-card';
import { Message as TMessage } from '@/types/broadcast'
import { User } from '@/types'
import { MessageContent } from './MessageContent'

type Props = {
  message: TMessage
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setEditMsgID: (messageID: string | undefined) => void
  setReplyTo: (messageID: string | undefined) => void
  editMsgID: string | undefined
  setPM: (pm: User | null) => void
  messages: TMessage[]
  dm: User | null
}

type MessageOptionsProps = Props & {
  setEmojiOpen: (open: boolean) => void
}


export function Message(props: Props) {
  const { message, messages } = props
  const user = useAppStore().user
  const replyToMsg = messages.find(msg => message.replyTo && message.replyTo === msg.id)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const isPrivateMessage = props.dm === null && message.participant?.id

  return (
    <div className={cn("px-4 py-1 py-2 flex gap-3 items-start group", {
      "bg-accent/10": props.editMsgID === message.id,
      "bg-danger/5": isPrivateMessage,
    })} id={`message-${message.id}`}>
      <img className="w-8 h-8 rounded-md" src={message.from.avatar} referrerPolicy="no-referrer" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-muted text-sm mb-1">
          <div className="flex items-center gap-3">
            {(props.dm === null && message.participant && message.from?.id === user?.id) ? <div className="flex gap-2 items-center mb-1">
              <img className="w-6 h-6 rounded-md" src={message.participant.avatar} referrerPolicy='no-referrer' />
              <p>{message.participant.username}</p>
            </div> : <p>{message.from.username}</p>}
            <MessageOptions {...props} setEmojiOpen={setEmojiOpen} />
          </div>
          <div className="flex gap-2 items-center">
            {message.isEdited && <PencilIcon size={14} className="text-muted" />}
            <span className="text-xs">{toHHMM(message.createdAt)}</span>
            <EmojiPicker
              align='start'
              open={emojiOpen}
              setOpen={setEmojiOpen}
              onSelect={id => {
                ws.reactionToMsg(props.message.id, id, getParticipantID(props.message, user!))
                setEmojiOpen(false)
              }}
              trigger={null}
            />
          </div>
        </div>
        {replyToMsg && (
          <div role="button" onClick={() => scrollToMessage(replyToMsg.id)} className='flex gap-3 items-start rounded-md border-l-2 border-yellow-500 bg-sidebar p-2 mb-1'>
            <img className="w-6 h-6 rounded-md" src={replyToMsg.from.avatar} referrerPolicy="no-referrer" />
            <div className="flex-1 flex flex-col gap-1 text-sm">
              <p className="text-muted">{replyToMsg.from.username}</p>
              <MessageContent message={replyToMsg} />
            </div>
          </div>
        )}
        <MessageContent message={message} />
        {!message.isDeleted && (
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
        )}
      </div>
    </div>
  )
}
