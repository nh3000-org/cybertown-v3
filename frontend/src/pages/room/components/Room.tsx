import { ws } from "@/lib/ws"
import { useAppStore } from "@/stores/appStore"
import { Message } from '@/pages/room/components/Message'
import { useEffect, useRef, useState } from "react"
import { CircleX as CloseIcon, SmilePlus as EmojiIcon } from 'lucide-react'
import { cn, scrollToMessage } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { VerticalScrollbar } from "@/components/VerticalScrollbar"

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const { roomID } = props
  const messages = useAppStore().rooms[roomID] ?? []
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)

  const [replyTo, setReplyTo] = useState<string | null>(null)
  const replyToMsg = messages.find(msg => replyTo && msg.id === replyTo)

  function handleNewMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault()

      const value = e.currentTarget.value
      if (!value.trim().length) {
        return
      }

      if (editMsgID) {
        ws.editMessage(props.roomID, editMsgID, value.trim())
      } else {
        ws.newMessage(props.roomID, {
          message: value.trim(),
          replyTo: replyTo ?? undefined
        })
      }

      setEditMsgID(null)
      setReplyTo(null)
      e.currentTarget.value = ""
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView()
    }
  }, [messages.length])

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg">
      </div>
      <div className="flex flex-col bg-bg rounded-md border border-border overflow-hidden">
        <ScrollArea.Root className="overflow-hidden flex-1">
          <ScrollArea.Viewport className={cn("w-full h-full flex gap-2 flex-col pt-2", {
            "pb-14": replyTo
          })}>
            {messages.map(message => {
              return (
                <Message key={message.id} message={message} textareaRef={textareaRef} setEditMsgID={setEditMsgID} setReplyTo={setReplyTo} />
              )
            })}
            <div ref={messagesEndRef} />
          </ScrollArea.Viewport>
          <VerticalScrollbar />
        </ScrollArea.Root>
        <div className="flex flex-col gap-2 border-t border-border p-2.5 relative">
          <div className="flex gap-1 self-end mr-1.5">
            <EmojiPicker trigger={<button><EmojiIcon strokeWidth={1.5} size={20} className="text-muted" /></button>} open={emojiOpen} setOpen={setEmojiOpen} onSelect={(emoji) => {
              ws.newMessage(props.roomID, { message: emoji })
              setEmojiOpen(false)
            }} />
            {editMsgID && (
              <button className="ml-auto" onClick={() => {
                setEditMsgID(null)
                if (textareaRef.current) {
                  textareaRef.current.value = ''
                }
              }}>
                <CloseIcon size={20} className="text-muted" />
              </button>
            )}
          </div>

          {replyToMsg && (
            <div role="button" onClick={() => {
              scrollToMessage(replyToMsg.id)
            }} className='flex gap-3 items-start bg-sidebar p-2 absolute top-0 left-0 -translate-y-full w-full'>
              <img className="w-6 h-6 rounded-md" src={replyToMsg.from.avatar} referrerPolicy="no-referrer" />
              <div className="flex-1 flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-muted">{replyToMsg.from.username}</p>
                  <button onClick={(e) => {
                    setReplyTo(null)
                    e.stopPropagation()
                  }}>
                    <CloseIcon size={20} className="text-muted" />
                  </button>
                </div>
                <p className="ellipsis w-[300px]">{replyToMsg.message}</p>
              </div>
            </div>
          )}

          <textarea ref={textareaRef} onKeyDown={handleNewMessage} placeholder="Enter your message" className="bg-bg-2 text-fg-2 p-4 rounded-md border border-border" />
        </div>
      </div>
    </main>
  )
}
