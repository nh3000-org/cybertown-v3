import { ws } from "@/lib/ws"
import { useAppStore } from "@/stores/appStore"
import { Message } from '@/pages/room/components/Message'
import { useEffect, useRef, useState } from "react"
import { CircleX as CloseIcon } from 'lucide-react'
import { scrollToMessage } from "@/lib/utils"

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const { roomID } = props
  const messages = useAppStore().rooms[roomID] ?? []
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | null>(null)

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
        <div className="flex-1 gap-2 flex flex-col overflow-auto scroller pt-2">
          {messages.map(message => {
            return (
              <Message key={message.id} message={message} textareaRef={textareaRef} setEditMsgID={setEditMsgID} setReplyTo={setReplyTo} />
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex flex-col gap-2 m-2">
          {replyToMsg && (
            <div role="button" onClick={() => {
              scrollToMessage(replyToMsg.id)
            }} className='flex gap-3 items-start rounded-md border-l-2 border-yellow-500 bg-sidebar p-2'>
              <img className="w-6 h-6 rounded-md" src={replyToMsg.from.avatar} referrerPolicy="no-referrer" />
              <div className="flex-1 flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-muted">{replyToMsg.from.username}</p>
                  <button onClick={() => setReplyTo(null)}>
                    <CloseIcon size={20} className="text-muted" />
                  </button>
                </div>
                <p className="ellipsis w-[300px]">{replyToMsg.message}</p>
              </div>
            </div>
          )}
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
          <textarea ref={textareaRef} onKeyDown={handleNewMessage} placeholder="Enter your message" className="bg-bg-2 text-fg-2 p-4 rounded-md border border-border" />
        </div>
      </div>
    </main>
  )
}
