import { Messages } from "./Messages";
import { useRooms } from "@/hooks/queries/useRooms";
import { Participants } from "./Participants";
import { useState } from "react";
import { User } from "@/types";

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const { data: rooms, isLoading } = useRooms()
  const room = rooms?.find(room => room.id === props.roomID)
  const [pm, setPM] = useState<User | null>(null)

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg flex flex-col">
        <div className="min-h-[100px]">
        </div>
        <div className="flex-1 border-y border-border">
        </div>
        <div className="min-h-[100px] p-4">
          {(!isLoading && room) && <Participants room={room} setPM={setPM} />}
        </div>
      </div>
      <Messages pm={pm} setPM={setPM} />
    </main>
  )
}
