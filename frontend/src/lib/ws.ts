import { config } from "@/config";
import { ClientEvent } from "@/types/client-event";
import { BroadcastEvent } from "@/types/broadcast";
import { queryClient } from "./utils";
import { useAppStore } from "@/stores/appStore";
import { RoomRole } from "@/types";

class WS {
  private socket: WebSocket
  private static instance: WS
  roomID: number | null = null

  public static getInstance(): WS {
    if (!WS.instance) {
      WS.instance = new WS()
    }
    return WS.instance
  }

  constructor() {
    const socket = new WebSocket(config.wsURL);

    socket.onopen = function() {
      console.log("socket connection established")
    }

    socket.onclose = function(e: CloseEvent) {
      console.log("socket connection closed", e.code)
    }


    socket.onmessage = (e: MessageEvent) => {
      try {
        const event: BroadcastEvent = JSON.parse(e.data)
        console.log("received event", event)
        switch (event.name) {
          case "JOINED_ROOM_BROADCAST":
          case "LEFT_ROOM_BROADCAST":
          case "NEW_ROOM_BROADCAST":
          case "UPDATE_ROOM_BROADCAST":
          case "ASSIGN_ROLE_BROADCAST":
          case "UPDATE_WELCOME_MESSAGE_BROADCAST":
            queryClient.invalidateQueries({
              queryKey: ['rooms'],
            })
            break;
          case "NEW_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.roomID) {
              return
            }
            useAppStore.getState().addMsg(event)
            break;
          case "EDIT_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.roomID) {
              return
            }
            useAppStore.getState().editMsg(event)
            break;
          case "DELETE_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.roomID) {
              return
            }
            useAppStore.getState().deleteMsg(event)
            break;
          case "REACTION_TO_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.roomID) {
              return
            }
            useAppStore.getState().reactionToMsg(event)
            break;
          case "CLEAR_CHAT_BROADCAST":
            if (event.data.roomID !== this.roomID) {
              return
            }
            useAppStore.getState().clearChat(event)
            break;
        }
      } catch (err) {
        console.error("failed to parse broadcast event 'data' field", err)
      }
    }
    this.socket = socket
  }

  joinRoom(roomID: number) {
    this.roomID = roomID
    this.sendClientEvent({
      name: "JOIN_ROOM",
      data: {
        roomID: roomID,
      }
    })
  }

  leaveRoom(roomID: number) {
    this.roomID = null
    useAppStore.getState().clearMessages()
    this.sendClientEvent({
      name: "LEAVE_ROOM",
      data: {
        roomID: roomID,
      }
    })
  }

  editMsg(id: string, content: string, participantID?: number) {
    this.sendClientEvent({
      name: "EDIT_MESSAGE",
      data: {
        id,
        content,
        participantID,
        roomID: this.roomID!,
      }
    })
  }

  deleteMsg(id: string, participantID?: number) {
    this.sendClientEvent({
      name: "DELETE_MESSAGE",
      data: {
        id,
        participantID,
        roomID: this.roomID!,
      }
    })
  }

  reactionToMsg(id: string, reaction: string, participantID?: number) {
    this.sendClientEvent({
      name: 'REACTION_TO_MESSAGE',
      data: {
        id,
        reaction,
        participantID,
        roomID: this.roomID!,
      }
    })
  }

  newMessage(content: string, replyTo?: string, participantID?: number) {
    this.sendClientEvent({
      name: "NEW_MESSAGE",
      data: {
        content,
        replyTo,
        participantID,
        roomID: this.roomID!,
      }
    })
  }

  clearChat(participantID: number) {
    this.sendClientEvent({
      name: "CLEAR_CHAT",
      data: {
        roomID: this.roomID!,
        participantID,
      }
    })
  }

  transferRoom(participantID: number) {
    this.sendClientEvent({
      name: "ASSIGN_ROLE",
      data: {
        roomID: this.roomID!,
        participantID,
        role: "host"
      }
    })
  }

  assignRole(role: Exclude<RoomRole, "host">, participantID: number) {
    this.sendClientEvent({
      name: "ASSIGN_ROLE",
      data: {
        roomID: this.roomID!,
        participantID,
        role
      }
    })
  }

  updateWelcomeMsg(welcomeMessage: string) {
    this.sendClientEvent({
      name: "UPDATE_WELCOME_MESSAGE",
      data: {
        roomID: this.roomID!,
        welcomeMessage,
      }
    })
  }

  sendClientEvent(event: ClientEvent) {
    this.socket.send(JSON.stringify(event))
  }
}

export const ws = WS.getInstance()
