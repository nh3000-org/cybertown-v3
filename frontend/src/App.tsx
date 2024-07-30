import { Button } from "@/components/ui/button";
import { useMe } from '@/hooks/queries/useMe';
import { getGoogleOAuthURL } from '@/lib/utils';
import { Logout } from '@/components/Logout';
import { CreateRoom } from "./components/CreateRoom";
import { useListRooms } from "./hooks/queries/useListRooms";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react";

export function App() {
  const { data: rooms } = useListRooms()
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
            <Card className="p-4">
              <CardTitle className="text-md pb-1">{room.topic}</CardTitle>
              <CardDescription>{room.language}</CardDescription>
              <CardContent className="p-0 mt-4 min-h-[100px] flex flex-col">
                <Button variant="outline" className="mt-auto self-center">Join Room</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

function UserHeader() {
  const { data: user, isLoading } = useMe()

  if (isLoading) {
    return null
  }

  return (
    <div className="flex">
      {user ? <Logout user={user} /> :
        <Button className="px-6 ml-auto" onClick={() => {
          window.location.href = getGoogleOAuthURL()
        }}>Login</Button>}
    </div>
  )
}
