export type User = {
  id: string
  username: string
  avatar: string
}

export type Room = {
  id: number
  topic: string
  maxParticipants: number
  language: string
  createdBy: number
}

export type RoomRes = Room & { users: User[] }

export type CreateRoom = {
  topic: string
  maxParticipants: number
  language: string
}

export type SocketEvent = JoinRoomEvent | JoinedRoomEvent | LeftRoomEvent | NewMessageEvent | NewMessageBroadcastEvent

export type JoinRoomEvent = {
  name: "JOIN_ROOM"
  data: {
    roomID: number
  }
}

export type JoinedRoomEvent = {
  name: "JOINED_ROOM"
  data: {
    roomID: number
    user: User
  }
}

type LeftRoomEvent = {
  name: "LEFT_ROOM"
  data: {
    roomID: number
    user: User
  }
}

export type NewMessageEvent = {
  name: "NEW_MESSAGE"
  data: {
    message: string
    roomID: number
  }
}

export type NewMessageBroadcastEvent = {
  name: "NEW_MESSAGE_BROADCAST"
  data: RoomMessage
}

export type RoomMessage = {
  id: string
  message: string
  createdAt: string
  from: User
}
