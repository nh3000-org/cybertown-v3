import { MessageContent } from "./MessageContent"
import { cn, toHHMM } from "@/lib/utils"
import { useAppStore } from "@/stores/appStore"
import { MessageOptions } from "./MessageOptions"
import { Props } from '.'
import { useState } from "react"
import { EmojiPicker } from "@/components/EmojiPicker"
import { ws } from "@/lib/ws"
import { ReplyTo } from "./ReplyTo"
import { SquarePenIcon as PencilIcon } from "lucide-react"
import { Reactions } from "./Reactions"

export function DMMessage(props: Props) {
  const user = useAppStore().user
  const { message, messages } = props
  const [emojiOpen, setEmojiOpen] = useState(false)
  const replyToMsg = messages.find(msg => message.replyTo && message.replyTo === msg.id)
  const isFromMe = user?.id === message.from.id

  return (
    <div className={cn("px-4 py-1 py-2 flex flex-col group", {
      "bg-accent/10": props.editMsgID === message.id,
    })} id={`message-${message.id}`}>
      <div className={cn("bg-bg-2 text-fg-2 max-w-[75%] rounded-md p-2 flex flex-col relative", {
        "ml-auto border border-border bg-transparent text-fg": isFromMe,
        "mr-auto": !isFromMe,
      })}>
        {replyToMsg && <ReplyTo message={replyToMsg} isDM={props.dm !== null} />}
        <MessageContent message={props.message} />
        <div className={cn("absolute top-0", {
          "-left-6": isFromMe,
          "-right-6": !isFromMe,
        })}>
          <MessageOptions {...props} setEmojiOpen={setEmojiOpen} side="bottom" align="end" />
          <EmojiPicker
            align={isFromMe ? "end" : "start"}
            side="top"
            open={emojiOpen}
            setOpen={setEmojiOpen}
            onSelect={id => {
              ws.reactionToMsg(props.message.id, id, props.dm?.id, true)
              setEmojiOpen(false)
            }}
            trigger={null}
          />
        </div>
      </div>
      {!message.isDeleted && <Reactions message={message} dm={props.dm} />}
      <div className={cn("flex gap-2 self-end mt-2", {
        "self-start": !isFromMe,
      })}>
        {message.isEdited && <PencilIcon size={14} className="text-muted" />}
        <span className="text-xs text-muted">{toHHMM(message.createdAt)}</span>
      </div>
    </div>
  )
}
