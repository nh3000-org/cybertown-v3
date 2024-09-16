import { useJoinRoom } from "@/hooks/queries/useJoinRoom"
import { ws } from "@/lib/ws"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Onboarding } from "@/pages/room/components/Onboarding"
import { RoomError } from "@/pages/room/components/RoomError"
import { Room } from "@/pages/room/components/Room"
import { useAppStore } from "@/stores/appStore"
import { APIError } from "@/lib/utils"
import { join } from "path"
import { bc } from "@/lib/bc"

export function RoomPage() {
  const [isOnboarding, setIsOnBoarding] = useState(true)
  const roomID = Number(useParams().roomID)
  const user = useAppStore().user
  const isKicked = useAppStore().isKicked
  const joinedAnotherRoom = useAppStore().joinedAnotherRoom
  const { isLoading, error } = useJoinRoom(roomID!, user !== null)

  useEffect(() => {
    if (!isOnboarding && user) {
      ws.joinRoom(roomID!)
    }
  }, [isOnboarding, user])

  useEffect(() => {
    bc.sendMessage("JOIN_ROOM_REQUEST")
  }, [])

  if (isLoading) {
    return null
  }

  if (!user || error || isKicked || joinedAnotherRoom) {
    return <RoomError error={error as APIError} user={user} isKicked={isKicked} joinedAnotherRoom={joinedAnotherRoom} />
  }

  if (isOnboarding && user) {
    return <Onboarding user={user} setIsOnboarding={setIsOnBoarding} />
  }

  return <Room roomID={roomID!} />
}
