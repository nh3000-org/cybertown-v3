import { ws } from "@/lib/ws"
import { useAppStore } from "@/stores/appStore"

type Props = {
  roomID: string
}

export function Room(props: Props) {
  const { roomID } = props
  const messages = useAppStore().rooms[roomID] ?? []

  function handleNewMessage(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.currentTarget.value
      if (!value.trim().length) {
        return
      }
      ws.sendMessage(value.trim(), props.roomID)
      e.currentTarget.value = ""
    }
  }

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg">
      </div>
      <div className="flex flex-col p-4 bg-bg rounded-md border border-border">
        <div className="flex-1 gap-4 flex flex-col">
          {messages.map(message => {
            return (
              <div key={message.id} className="flex gap-3 items-start">
                <img className="w-8 h-8 rounded-md" src={message.from.avatar} referrerPolicy="no-referrer" />
                <div>
                  <p className="text-sm text-muted mb-1">{message.from.username}</p>
                  <p>{message.message}</p>
                </div>
              </div>
            )
          })}
        </div>
        <textarea onKeyDown={handleNewMessage} placeholder="Enter your message" className="bg-bg-2 text-fg-2 p-4 rounded-md border border-border" />
      </div>
    </main>
  )
}
