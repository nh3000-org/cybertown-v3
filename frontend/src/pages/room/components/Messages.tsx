import { useRef, useState, useEffect } from 'react'
import { CircleX as CloseIcon, SmilePlus as EmojiIcon } from 'lucide-react'
import { cn, getParticipantID, scrollToMessage } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { VerticalScrollbar } from "@/components/VerticalScrollbar"
import { useAppStore } from '@/stores/appStore';
import { ws } from '@/lib/ws';
import { Message } from './Message';
import { User } from '@/types';
import React from 'react';
import { MessageContent } from './MessageContent';

type Props = {
  pm: User | null
  setPM: (pm: User | null) => void
}

export const Messages = React.forwardRef((props: Props, _ref) => {
  const messages = useAppStore().messages
  const user = useAppStore().user
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | undefined>(undefined)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState('')

  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const replyToMsg = messages.find(msg => replyTo && msg.id === replyTo)
  const editMsg = messages.find(msg => editMsgID && msg.id === editMsgID)

  function handleNewMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()

      const value = e.currentTarget.value
      if (!value.trim().length) {
        return
      }

      if (value.trim().length > 1024) {
        setError("Exceeded maximum of 1024 characters")
        return
      }

      if (editMsgID) {
        ws.editMsg(editMsgID, value.trim(), editMsg?.participant?.id)
      } else {
        const participantID = props.pm?.id || getParticipantID(replyToMsg, user!)
        ws.newMessage(value.trim(), replyTo, participantID)
      }

      setEditMsgID(undefined)
      setReplyTo(undefined)
      e.currentTarget.value = ""
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView()
    }
  }, [messages.length])

  // am now lazy to lift the state up and do it declaratively
  useEffect(() => {
    if (props.pm) {
      setEditMsgID(undefined)
      if (textareaRef.current) {
        textareaRef.current.value = ''
      }
    }
  }, [props.pm])

  return (
    <div className="flex-1 flex flex-col bg-bg rounded-md overflow-hidden">
      <ScrollArea.Root className="overflow-hidden flex-1">
        <ScrollArea.Viewport className={cn("w-full h-full flex gap-2 flex-col pt-2", {
          "pb-14": replyTo || props.pm,
          "pb-32": replyTo && props.pm,
        })}>
          {messages.map(message => {
            return (
              <Message key={message.id} message={message} textareaRef={textareaRef} editMsgID={editMsgID} setEditMsgID={setEditMsgID} setReplyTo={setReplyTo} setPM={props.setPM} />
            )
          })}
          <div ref={messagesEndRef} />
        </ScrollArea.Viewport>
        <VerticalScrollbar />
      </ScrollArea.Root>
      <div className="flex flex-col gap-2 border-t border-border p-2.5 relative">
        <div className="flex gap-1 self-end mr-1.5">
          <EmojiPicker trigger={<button><EmojiIcon strokeWidth={1.5} size={20} className="text-muted" /></button>} open={emojiOpen} setOpen={setEmojiOpen} onSelect={(_, emoji) => {
            const participantID = props.pm?.id || getParticipantID(replyToMsg, user!)
            ws.newMessage(emoji, replyTo, participantID)
            setReplyTo(undefined)
            setEmojiOpen(false)
          }} />
          {editMsgID && (
            <button className="ml-auto" onClick={() => {
              setEditMsgID(undefined)
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
          }} className={cn("flex gap-3 items-start bg-sidebar p-2 absolute top-0 left-0 -translate-y-full w-full", {
            '-top-[60px]': props.pm
          })}>
            <img className="w-6 h-6 rounded-md" src={replyToMsg.from.avatar} referrerPolicy="no-referrer" />
            <div className="flex-1 flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted">{replyToMsg.from.username}</p>
                <button onClick={(e) => {
                  setReplyTo(undefined)
                  e.stopPropagation()
                }}>
                  <CloseIcon size={20} className="text-muted" />
                </button>
              </div>
              <p className="ellipsis w-[300px]">{replyToMsg.content}</p>
            </div>
          </div>
        )}

        {props.pm && (
          <div className='flex gap-3 items-start bg-sidebar p-2 absolute top-0 left-0 -translate-y-full w-full'>
            <img className="w-6 h-6 rounded-md" src={props.pm.avatar} referrerPolicy="no-referrer" />
            <div className="flex-1 flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-danger mb-1">Private message to:</p>
                  <p>{props.pm.username}</p>
                </div>
                <button onClick={() => props.setPM(null)}>
                  <CloseIcon size={20} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        )}

        <textarea id="messages-textarea" onChange={() => setError('')} ref={textareaRef} onKeyDown={handleNewMessage} placeholder="You can use @ to mention someone" rows={3} className="resize-none bg-bg-2 text-fg-2 p-2 rounded-md border border-border scroller" />
        {error ? <span className="text-danger text-sm">{error}</span> : null}
      </div>
    </div>
  )
})
