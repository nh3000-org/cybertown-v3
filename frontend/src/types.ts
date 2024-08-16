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

export type SocketEvent =
  NewRoomEvent |
  JoinedRoomEvent |
  LeftRoomEvent |
  NewMessageBroadcastEvent |
  EditMessageBroadcastEvent |
  DeleteMessageBroadcastEvent |
  ReactionToMessageBroadcastEvent

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
    replyTo?: string
  }
}

export type EditMessageEvent = {
  name: "EDIT_MESSAGE"
  data: {
    id: string
    message: string
    roomID: number
  }
}

export type DeleteMessageEvent = {
  name: "DELETE_MESSAGE"
  data: {
    id: string
    roomID: number
  }
}

export type LeaveRoomEvent = {
  name: "LEAVE_ROOM"
  data: {
    roomID: number
  }
}

export type NewRoomEvent = {
  name: "NEW_ROOM"
  data: {
    roomID: number
  }
}

export type ReactionEvent = {
  name: "REACTION_TO_MESSAGE"
  data: {
    id: string
    reaction: string
    roomID: number
  }
}

export type NewMessageBroadcastEvent = {
  name: "NEW_MESSAGE_BROADCAST"
  data: RoomMessage
}

export type EditMessageBroadcastEvent = {
  name: "EDIT_MESSAGE_BROADCAST"
  data: EditRoomMessage
}

export type DeleteMessageBroadcastEvent = {
  name: "DELETE_MESSAGE_BROADCAST"
  data: DeleteRoomMessage
}

export type ReactionToMessageBroadcastEvent = {
  name: "REACTION_TO_MESSAGE_BROADCAST"
  data: ReactionToMessage
}

export type RoomMessage = {
  id: string
  message: string
  createdAt: string
  from: User
  roomID: number
  isEdited?: boolean
  isDeleted?: boolean
  replyTo?: string
  reactions: Record<string, Record<string, User>>
}

export type EditRoomMessage = {
  id: string
  message: string
  from: User
  roomID: number
}

export type DeleteRoomMessage = {
  id: string
  from: User
  roomID: number
}

export type ReactionToMessage = {
  id: string
  roomID: number
  from: User
  reaction: string
}
