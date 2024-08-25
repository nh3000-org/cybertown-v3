import { RoomRole } from "."

export type ClientEvent =
  JoinRoomEvent |
  NewMsgEvent |
  EditMsgEvent |
  DeleteMsgEvent |
  LeaveRoomEvent |
  ReactionToMsgEvent |
  ClearChatEvent |
  AssignRoleEvent |
  UpdateWelcomeMsgEvent |
  SetStatusEvent

export type JoinRoomEvent = {
  name: "JOIN_ROOM"
  data: {
    roomID: number
  }
}

export type LeaveRoomEvent = {
  name: "LEAVE_ROOM"
  data: {
    roomID: number
  }
}

export type NewMsgEvent = {
  name: "NEW_MESSAGE"
  data: {
    content: string
    roomID: number
    replyTo?: string
    participantID?: number
  }
}

export type EditMsgEvent = {
  name: "EDIT_MESSAGE"
  data: {
    id: string
    content: string
    roomID: number
    participantID?: number
  }
}

export type DeleteMsgEvent = {
  name: "DELETE_MESSAGE"
  data: {
    id: string
    roomID: number
    participantID?: number
  }
}

export type ReactionToMsgEvent = {
  name: "REACTION_TO_MESSAGE"
  data: {
    id: string
    reaction: string
    roomID: number
    participantID?: number
  }
}

export type ClearChatEvent = {
  name: "CLEAR_CHAT"
  data: {
    participantID: number
    roomID: number
  }
}

export type AssignRoleEvent = {
  name: "ASSIGN_ROLE"
  data: {
    role: RoomRole
    participantID: number
    roomID: number
  }
}

export type UpdateWelcomeMsgEvent = {
  name: "UPDATE_WELCOME_MESSAGE"
  data: {
    welcomeMessage: string
    roomID: number
  }
}

export type SetStatusEvent = {
  name: "SET_STATUS"
  data: {
    status: string
    roomID: number
  }
}
