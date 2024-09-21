import { useRef, useState, useEffect } from 'react'
import { CircleX as CloseIcon, SmilePlus as EmojiIcon, Hand as NoMessagesIcon } from 'lucide-react'
import { cn, getParticipantID } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { VerticalScrollbar } from "@/components/VerticalScrollbar"
import { useAppStore } from '@/stores/appStore';
import { ws } from '@/lib/ws';
import { Message } from '@/components/messages/message';
import { RoomRes, User } from '@/types';
import React from 'react';
import { MentionParticipants } from './MentionParticipants';
import { ReplyTo } from './ReplyTo';
import { PM } from './PM';
import { useMention } from './hooks/useMention';
import { SendMessage } from './SendMessage';
import { Emoji, useEmojiSearch } from './hooks/useEmojiSearch';
import { EmojiSearch } from './EmojiSearch';
import { Message as TMessage } from '@/types/broadcast';
import { LoadingIcon } from '@/pages/home/components/LoadingIcon';
import { useScroll } from './hooks/useScroll';
import { useReadMessage } from './hooks/useReadMessage';
import { useScrollPercentage } from './hooks/useScrollPercentage';

type Props = {
  pm: User | null
  setPM: (pm: User | null) => void
  room: RoomRes | null
  messages: TMessage[]

  // when this component is used as "dm"
  initialMessages?: TMessage[]
  dm: User | null
  prevMsg: {
    messages: TMessage[]
    isLoading: boolean
    ref: (node: Element | null) => void
  } | null
}

export const Messages = React.forwardRef((props: Props, _ref) => {
  const { initialMessages = [] } = props
  const previousMessages = props.prevMsg?.messages ?? []
  const user = useAppStore().user
  const messages = [...previousMessages, ...initialMessages, ...props.messages]
  const messagesRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editMsgID, setEditMsgID] = useState<string | undefined>(undefined)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const replyToMsg = messages.find(msg => replyTo && msg.id === replyTo)
  const [content, setContent] = useState('')
  const { search, setSearch, mentionedParticipants } = useMention(content, props.room)
  const { search: emojiSearch, setSearch: setEmojiSearch, emojis } = useEmojiSearch(content)

  const viewRef = useReadMessage(props.dm?.id, initialMessages, props.messages)
  const scrollPercent = useScrollPercentage(messagesRef)
  useScroll(messagesEndRef, scrollPercent, initialMessages, props.messages)

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

  // am now lazy to lift the state up and do it declaratively
  useEffect(() => {
    if (props.pm) {
      setEditMsgID(undefined)
      setContent('')
    }
  }, [props.pm])

  return (
    <div className="flex-1 flex flex-col bg-bg rounded-md overflow-hidden">
      {!messages.length && props.dm && (
        <div className="flex-1 text-muted flex flex-col items-center justify-center gap-3">
          <NoMessagesIcon strokeWidth={1.5} />
          <p className="max-w-[300px] text-center">
            Start a conversation! Messages older than 15 days will be automatically deleted
          </p>
        </div>
      )}

      {(messages.length || !props.dm) && (
        <ScrollArea.Root className="overflow-hidden flex-1">
          <ScrollArea.Viewport ref={messagesRef} className={cn("w-full h-full pt-2", {
            "pb-14": replyTo || props.pm,
            "pb-32": replyTo && props.pm,
          })}>
            {props.prevMsg && <div ref={props.prevMsg.ref} className="min-h-1 flex items-center justify-center">
              {props.prevMsg.isLoading && <LoadingIcon className='mt-2 text-accent/30 fill-accent' />}
            </div>}
            {messages.map(message => {
              return (
                <Message
                  messages={messages}
                  key={message.id}
                  message={message}
                  textareaRef={textareaRef}
                  editMsgID={editMsgID}
                  setEditMsgID={setEditMsgID}
                  setReplyTo={setReplyTo}
                  setPM={props.setPM}
                  dm={props.dm}
                />
              )
            })}
            <div className="min-h-1" ref={viewRef} />
            <div ref={messagesEndRef} />
          </ScrollArea.Viewport>
          <VerticalScrollbar />
        </ScrollArea.Root>
      )}


      <div className="flex flex-col gap-2 border-t border-border p-2.5 relative">
        <div className="flex">
          {props.room && (
            <MentionParticipants
              setSearch={setSearch}
              search={search}
              selectParticipant={selectParticipant}
              textareaRef={textareaRef}
              room={props.room}
              mentionedParticipants={mentionedParticipants}
            />
          )}

          <EmojiSearch
            setSearch={setEmojiSearch}
            search={emojiSearch}
            textareaRef={textareaRef}
            emojis={emojis}
            selectEmoji={selectEmoji}
          />

          <div className="gap-1 ml-auto mr-1.5 flex">
            <EmojiPicker
              trigger={
                <button>
                  <EmojiIcon strokeWidth={1.5} size={20} className="text-muted" />
                </button>
              }
              open={emojiOpen}
              setOpen={setEmojiOpen}
              onSelect={(_, emoji) => {
                const participantID = props.pm?.id || getParticipantID(replyToMsg, user!) || props.dm?.id
                ws.newMessage(emoji, replyTo, participantID, props.dm !== null)
                setReplyTo(undefined)
                setEmojiOpen(false)
              }}
            />
            {editMsgID && (
              <button className="ml-auto" onClick={() => {
                setEditMsgID(undefined)
                setContent('')
              }}>
                <CloseIcon size={20} className="text-muted" />
              </button>
            )}
          </div>
        </div>

        <ReplyTo replyTo={replyTo} setReplyTo={setReplyTo} pm={props.pm} messages={messages} />
        <PM pm={props.pm} setPM={props.setPM} />

        <SendMessage
          messages={messages}
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
          dm={props.dm}
        />
      </div>
    </div >
  )
})
