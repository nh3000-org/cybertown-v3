import { RoomRes } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'

type Props = {
  room: RoomRes
}

export function RoomCard(props: Props) {
  const user = useAppStore().user
  const setShowLoginAlert = useAppStore().setShowLoginAlert
  const { room } = props
  const navigate = useNavigate()

  const style = {
    width: room.maxParticipants > 3 ? 58 : 96,
    height: room.maxParticipants > 3 ? 58 : 96,
  }

  function joinRoom(roomID: number) {
    if (!user) {
      setShowLoginAlert(true)
      return
    }
    navigate(`/room/${roomID}`)
  }

  return (
    <Card className="p-4 flex flex-col">
      <CardTitle className="text-md pb-1">{room.topic}</CardTitle>
      <CardDescription>{room.language}</CardDescription>
      <CardContent className="p-0 mt-4 min-h-[100px] flex flex-col">
        <div className="flex gap-4 flex-wrap mb-8">
          {room.users.map(user => {
            return (
              <img referrerPolicy="no-referrer" className="rounded-full" key={user.id} src={user.avatar} style={style}>
              </img>
            )
          })}
          {Array.from({ length: room.maxParticipants - room.users.length }).map((_, idx) => {
            return <div key={idx} style={style} className="rounded-full border"></div>
          })}
        </div>
      </CardContent>
      <Button variant="outline" className="mt-auto self-center" onClick={() => joinRoom(room.id)}>
        Join Room
      </Button>
    </Card >
  )
}
