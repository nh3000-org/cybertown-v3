import { RoomRole, User } from '@/types'

export type BroadcastEvent =
  JoinedRoomBroadcastEvent |
  LeftRoomBroadcastEvent |
  NewRoomBroadcastEvent |
  UpdateRoomBroadcastEvent |
  NewMsgBroadcastEvent |
  EditMsgBroadcastEvent |
  DeleteMsgBroadcastEvent |
  ReactionToMsgBroadcastEvent |
  ClearChatBroadcastEvent |
  AssignRoleBroadcastEvent |
  UpdateWelcomeMsgBroadcastEvent |
  SetStatusBroadcastEvent |
  KickParticipantBroadcastEvent

export type JoinedRoomBroadcastEvent = {
  name: "JOINED_ROOM_BROADCAST"
  data: {
    roomID: number
    user: User
  }
}

export type LeftRoomBroadcastEvent = {
  name: "LEFT_ROOM_BROADCAST"
  data: {
    roomID: number
    user: User
  }
}

export type NewRoomBroadcastEvent = {
  name: "NEW_ROOM_BROADCAST"
  data: {
    roomID: number
  }
}

export type UpdateRoomBroadcastEvent = {
  name: "UPDATE_ROOM_BROADCAST"
  data: ReactionToMessage
}

export type NewMsgBroadcastEvent = {
  name: "NEW_MESSAGE_BROADCAST"
  data: Message
}

export type EditMsgBroadcastEvent = {
  name: "EDIT_MESSAGE_BROADCAST"
  data: EditMessage
}

export type DeleteMsgBroadcastEvent = {
  name: "DELETE_MESSAGE_BROADCAST"
  data: DeleteMessage
}

export type ReactionToMsgBroadcastEvent = {
  name: "REACTION_TO_MESSAGE_BROADCAST"
  data: ReactionToMessage
}

export type ClearChatBroadcastEvent = {
  name: "CLEAR_CHAT_BROADCAST"
  data: RoomAction
}

export type AssignRoleBroadcastEvent = {
  name: "ASSIGN_ROLE_BROADCAST"
  data: RoomAction & { role: RoomRole }
}

export type UpdateWelcomeMsgBroadcastEvent = {
  name: "UPDATE_WELCOME_MESSAGE_BROADCAST"
  data: {
    welcomeMessage: string
    roomID: number
  }
}

export type SetStatusBroadcastEvent = {
  name: "SET_STATUS_BROADCAST"
  data: {
    status: string
    roomID: number
  }
}

export type KickParticipantBroadcastEvent = {
  name: "KICK_PARTICIPANT_BROADCAST"
  data: {
    participant: User
    roomID: number
    expiredAt: string
  }
}

export type Message = {
  id: string
  content: string
  createdAt: string
  from: User
  roomID: number
  reactions: Record<string, Record<string, User>>
  isEdited?: boolean
  isDeleted?: boolean
  replyTo?: string
  participant?: User
}

export type EditMessage = {
  id: string
  content: string
  from: User
  roomID: number
}

export type DeleteMessage = {
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

type RoomAction = {
  roomID: number
  by: User
  participant: User
}
