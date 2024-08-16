import { RoomMessage } from '@/types'
import { ChevronDown as ChevronDownIcon, SquarePen as PencilIcon, Trash as TrashIcon, ReplyAll as ReplyIcon, SmilePlus as EmojiIcon } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import { cn, scrollToMessage, toHHMM } from '@/lib/utils'
import { ws } from '@/lib/ws'
import { useAppStore } from '@/stores/appStore'
import { EmojiPicker } from '@/components/EmojiPicker'
import * as HoverCard from '@radix-ui/react-hover-card';

type Props = {
  message: RoomMessage
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setEditMsgID: (messageID: string | null) => void
  setReplyTo: (messageID: string | null) => void
}

type MessageOptionsProps = Props & {
  setEmojiOpen: (open: boolean) => void
}

function MessageOptions(props: MessageOptionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dropdown.Root onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <button className={cn('invisible group-hover:visible', {
          'visible': open
        })}>
          <ChevronDownIcon size={18} className="text-muted" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="rounded-lg p-2 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border" side='bottom' sideOffset={12} align='start' onCloseAutoFocus={e => e.preventDefault()}>
          <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
            props.setReplyTo(null)
            props.setEditMsgID(props.message.id)
            // if you remove the `setTimeout`, it won't work
            setTimeout(() => {
              if (props.textareaRef.current) {
                props.textareaRef.current.focus()
                props.textareaRef.current.value = props.message.message
              }
            }, 0)
          }}>
            <PencilIcon size={20} className="text-muted" />
            <span>Edit</span>
          </Dropdown.Item>
          <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
            ws.deleteMessage(props.message.roomID, props.message.id)
          }}>
            <TrashIcon size={20} className="text-muted" />
            <span>Delete</span>
          </Dropdown.Item>
          <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
            props.setEditMsgID(null)
            props.setReplyTo(props.message.id)
            // if you remove the `setTimeout`, it won't work
            setTimeout(() => {
              if (props.textareaRef.current) {
                props.textareaRef.current.focus()
              }
            }, 0)
          }}>
            <ReplyIcon size={20} className="text-muted" />
            <span>Reply</span>
          </Dropdown.Item>
          <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => props.setEmojiOpen(true)}>
            <EmojiIcon size={20} className="text-muted" />
            <span>React</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

export function Message(props: Props) {
  const { message } = props
  const messages = useAppStore().rooms[message.roomID] ?? []
  const replyToMsg = messages.find(msg => message.replyTo && message.replyTo === msg.id)
  const [emojiOpen, setEmojiOpen] = useState(false)

  return (
    <div className='px-4 py-2 flex gap-3 items-start group' id={`message-${message.id}`}>
      <img className="w-8 h-8 rounded-md" src={message.from.avatar} referrerPolicy="no-referrer" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-muted text-sm mb-1">
          <div className="flex items-center gap-3">
            <p>{message.from.username}</p>
            <MessageOptions {...props} setEmojiOpen={setEmojiOpen} />
          </div>
          <div className="flex gap-2 items-center">
            {message.isEdited && <PencilIcon size={14} className="text-muted" />}
            <span className="text-xs">{toHHMM(message.createdAt)}</span>
            <EmojiPicker
              align='start'
              open={emojiOpen}
              setOpen={setEmojiOpen}
              onSelect={emoji => {
                ws.react(props.message.roomID, props.message.id, emoji)
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
              <p className="ellipsis w-[269px]">{replyToMsg.message}</p>
            </div>
          </div>
        )}
        <p className={cn({
          'italic text-muted': message.isDeleted
        })}>{message.isDeleted ? 'This message has been deleted' : message.message}</p>
        {!message.isDeleted && (
          <div className="flex gap-2 mt-1 text-sm items-center flex-wrap">
            {Object.entries(message.reactions).map(([reaction, userMap]) => {
              return (
                <HoverCard.Root key={reaction}>
                  <HoverCard.Trigger asChild>
                    <button key={reaction} className='text-sm focus:ring-0 flex items-center gap-2 border border-accent/60 bg-accent/20 px-[6px] py-[2px] rounded-md' onClick={() => ws.react(props.message.roomID, props.message.id, reaction)}>
                      <span>{reaction}</span>
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
