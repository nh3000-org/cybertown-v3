import { CreateRoom } from "@/pages/home/components/CreateRoom";
import { useRooms } from "@/hooks/queries/useRooms";
import { useState } from "react";
import { RoomCard } from "@/pages/home/components/RoomCard";
import { UserHeader } from "@/pages/home/components/UserHeader";

export function HomePage() {
  const { data: rooms } = useRooms()
  const [open, setOpen] = useState(false)

  return (
    <main className="max-w-7xl mx-auto my-4 px-8">
      <UserHeader />

      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center my-6">
        Cybertown
      </h1>

      <CreateRoom open={open} setOpen={setOpen} />

      <div className="mt-8 rooms gap-6">
        {rooms?.map(room => {
          return (
            <RoomCard key={room.id} room={room} />
          )
        })}
      </div>
    </main>
  )
}
