export type ClientEvent =
  JoinRoomEvent |
  NewMsgEvent |
  EditMsgEvent |
  DeleteMsgEvent |
  LeaveRoomEvent |
  ReactionToMsgEvent

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
  }
}

export type EditMsgEvent = {
  name: "EDIT_MESSAGE"
  data: {
    id: string
    content: string
    roomID: number
  }
}

export type DeleteMsgEvent = {
  name: "DELETE_MESSAGE"
  data: {
    id: string
    roomID: number
  }
}

export type ReactionToMsgEvent = {
  name: "REACTION_TO_MESSAGE"
  data: {
    id: string
    reaction: string
    roomID: number
  }
}
