import { Textarea } from "@/components/ui/textarea"
import { ws } from "@/lib/ws"
import { useRoomStore } from "@/stores/roomStore"

type Props = {
  roomID: string
}

export function Room(props: Props) {
  const messages = useRoomStore().messages

  return (
    <main className="h-full w-full grid grid-cols-[1fr_400px]">
      <div className="border-r border-input ">
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
          {messages.map(message => {
            return (
              <div key={message.id} className="flex gap-4">
                <img className="w-8 h-8 rounded-sm" src={message.from.avatar} referrerPolicy="no-referrer" alt={`${message.from.username}'s avatar`} />
                <div>
                  <p className="text-muted-foreground">{message.from.username}</p>
                  <p>{message.message}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-input min-h-[100px] p-4">
          <Textarea onKeyUp={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const value = e.currentTarget.value
              if (!value.trim().length) {
                return
              }
              ws.sendMessage(value.trim(), props.roomID)
              e.currentTarget.value = ""
            }
          }} className="text-base" />
        </div>
      </div>
    </main>
  )
}
