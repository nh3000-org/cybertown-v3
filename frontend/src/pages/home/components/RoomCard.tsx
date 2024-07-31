import { RoomRes } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

type Props = {
  room: RoomRes
}

export function RoomCard(props: Props) {
  const { room } = props

  const style = {
    width: room.maxParticipants > 3 ? 58 : 96,
    height: room.maxParticipants > 3 ? 58 : 96,
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
      <Button asChild variant="outline" className="mt-auto self-center">
        <Link to={`/room/${room.id}`}>Join Room</Link>
      </Button>
    </Card >
  )
}
