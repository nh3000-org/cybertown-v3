import { useMe } from "@/hooks/queries/useMe"
import { useRoom } from "@/hooks/queries/useRoom"
import { ws } from "@/lib/ws"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Onboarding } from "@/pages/room/components/Onboarding"
import { RoomError, UserError } from "@/pages/room/components/Error"
import { Room } from "@/pages/room/components/Room"

export function RoomPage() {
  const [isOnboarding, setIsOnBoarding] = useState(true)
  const { roomID } = useParams()
  const { data: user, isLoading, error: userError } = useMe()
  const { data: room, isLoading: isRoomLoading, error: roomError } = useRoom(roomID!, !userError)

  useEffect(() => {
    if (room) {
      ws.joinRoom(roomID!)
    }
  }, [room])

  if (isLoading || isRoomLoading) {
    return null
  }

  if (userError) {
    return <UserError />
  }

  if (roomError) {
    return <RoomError />
  }

  if (isOnboarding && user) {
    return <Onboarding user={user} setIsOnboarding={setIsOnBoarding} />
  }

  return <Room roomID={roomID!} />
}
