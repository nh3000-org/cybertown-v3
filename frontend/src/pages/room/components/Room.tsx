import { ws } from "@/lib/ws"
import { useAppStore } from "@/stores/appStore"
import { Message } from '@/pages/room/components/Message'
import { useEffect, useRef, useState } from "react"
import { CircleX as CloseIcon } from 'lucide-react'

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const { roomID } = props
  const messages = useAppStore().rooms[roomID] ?? []
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | null>(null)

  function handleNewMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault()

      const value = e.currentTarget.value
      if (!value.trim().length) {
        return
      }

      if (editMsgID) {
        ws.editMessage(props.roomID, editMsgID, value.trim())
        setEditMsgID(null)
      } else {
        ws.newMessage(props.roomID, value.trim())
      }

      e.currentTarget.value = ""
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg">
      </div>
      <div className="flex flex-col p-4 bg-bg rounded-md border border-border overflow-hidden">
        <div className="flex-1 gap-4 flex flex-col overflow-auto scroller pb-4">
          {messages.map(message => {
            return (
              <Message key={message.id} message={message} textareaRef={textareaRef} setEditMsgID={setEditMsgID} />
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex flex-col gap-2">
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
