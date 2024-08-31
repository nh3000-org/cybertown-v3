import { useRef, useState, useEffect } from 'react'
import { CircleX as CloseIcon, SmilePlus as EmojiIcon } from 'lucide-react'
import { cn, getParticipantID } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { VerticalScrollbar } from "@/components/VerticalScrollbar"
import { useAppStore } from '@/stores/appStore';
import { ws } from '@/lib/ws';
import { Message } from '@/pages/room/components/Message';
import { RoomRes, User } from '@/types';
import React from 'react';
import { MentionParticipants } from './MentionParticipants';
import { ReplyTo } from './ReplyTo';
import { PM } from './PM';
import { useMention } from '@/pages/room/hooks/useMention';
import { SendMessage } from './SendMessage';
import { Emoji, useEmojiSearch } from '../../hooks/useEmojiSearch';
import { EmojiSearch } from './EmojiSearch';

type Props = {
  pm: User | null
  setPM: (pm: User | null) => void
  room: RoomRes
}

export const Messages = React.forwardRef((props: Props, _ref) => {
  const messages = useAppStore().messages
  const user = useAppStore().user
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | undefined>(undefined)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const replyToMsg = messages.find(msg => replyTo && msg.id === replyTo)
  const [content, setContent] = useState('')
  const { search, setSearch, mentionedParticipants } = useMention(content, props.room)
  const { search: emojiSearch, setSearch: setEmojiSearch, emojis } = useEmojiSearch(content)

  function selectParticipant(participant: User) {
    setSearch({
      query: '',
      show: false,
    })
    const index = content.lastIndexOf('@')
    if (index === -1) {
      return
    }
    let at = "`@"
    if (index !== 0 && content[index - 1] !== ' ') {
      at = " `@"
    }
    const value = content.substring(0, index) + at + participant.username + "` "
    setContent(value)
  }

  function selectEmoji(emoji: Emoji) {
    setEmojiSearch({
      query: '',
      show: false,
    })
    const index = content.lastIndexOf(':')
    if (index === -1) {
      return
    }
    const value = content.substring(0, index) + " " + emoji.emoji + " "
    setContent(value)
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
              <Message
                key={message.id}
                message={message}
                textareaRef={textareaRef}
                editMsgID={editMsgID}
                setEditMsgID={setEditMsgID}
                setReplyTo={setReplyTo}
                setPM={props.setPM}
              />
            )
          })}
          <div ref={messagesEndRef} />
        </ScrollArea.Viewport>
        <VerticalScrollbar />
      </ScrollArea.Root>

      <div className="flex flex-col gap-2 border-t border-border p-2.5 relative">
        <div className="flex">
          <MentionParticipants
            setSearch={setSearch}
            search={search}
            selectParticipant={selectParticipant}
            textareaRef={textareaRef}
            room={props.room}
            mentionedParticipants={mentionedParticipants}
          />

          <EmojiSearch
            setSearch={setEmojiSearch}
            search={emojiSearch}
            textareaRef={textareaRef}
            emojis={emojis}
            selectEmoji={selectEmoji}
          />

          <div className="gap-1 ml-auto mr-1.5">
            <EmojiPicker
              trigger={
                <button>
                  <EmojiIcon strokeWidth={1.5} size={20} className="text-muted" />
                </button>
              }
              open={emojiOpen}
              setOpen={setEmojiOpen}
              onSelect={(_, emoji) => {
                const participantID = props.pm?.id || getParticipantID(replyToMsg, user!)
                ws.newMessage(emoji, replyTo, participantID)
                setReplyTo(undefined)
                setEmojiOpen(false)
              }}
            />
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
        </div>

        <ReplyTo replyTo={replyTo} setReplyTo={setReplyTo} pm={props.pm} />
        <PM pm={props.pm} setPM={props.setPM} />

        <SendMessage
          setReplyTo={setReplyTo}
          replyTo={replyTo}
          content={content}
          setContent={setContent}
          search={search}
          setEditMsgID={setEditMsgID}
          editMsgID={editMsgID}
          selectParticipant={selectParticipant}
          selectEmoji={selectEmoji}
          emojis={emojis}
          emojiSearch={emojiSearch}
          mentionedParticipants={mentionedParticipants}
          textareaRef={textareaRef}
          pm={props.pm}
        />
      </div>
    </div >
  )
})
