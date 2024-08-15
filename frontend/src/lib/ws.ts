import { config } from "@/config";
import { DeleteMessageEvent, EditMessageEvent, JoinRoomEvent, LeaveRoomEvent, NewMessageEvent, SocketEvent } from "@/types";
import { queryClient } from "./utils";
import { useAppStore } from "@/stores/appStore";

class WS {
  private socket: WebSocket
  private static instance: WS
  currentRoomID: number | null = null

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
        const event: SocketEvent = JSON.parse(e.data)
        console.log("received event", event)
        switch (event.name) {
          case "JOINED_ROOM":
          case "LEFT_ROOM":
          case "NEW_ROOM":
            queryClient.invalidateQueries({
              queryKey: ['rooms']
            })
            break;
          case "NEW_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.currentRoomID) {
              return
            }
            useAppStore.getState().addMessage(this.currentRoomID, event.data)
            break;
          case "EDIT_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.currentRoomID) {
              return
            }
            useAppStore.getState().editMessage(this.currentRoomID, event.data)
            break;
          case "DELETE_MESSAGE_BROADCAST":
            if (event.data.roomID !== this.currentRoomID) {
              return
            }
            useAppStore.getState().deleteMessage(this.currentRoomID, event.data.id, event.data.from)
            break;
        }
      } catch (err) {
        console.error("failed to parse socket data", err)
      }
    }
    this.socket = socket
  }

  joinRoom(roomID: number) {
    const event: JoinRoomEvent = {
      name: "JOIN_ROOM",
      data: {
        roomID: Number(roomID),
      }
    }
    this.socket.send(JSON.stringify(event))
    this.currentRoomID = roomID
  }

  leaveRoom(roomID: number) {
    const event: LeaveRoomEvent = {
      name: "LEAVE_ROOM",
      data: {
        roomID: Number(roomID),
      }
    }
    this.socket.send(JSON.stringify(event))
    useAppStore.getState().clearMessages(this.currentRoomID!)
    this.currentRoomID = null
  }

  editMessage(roomID: number, id: string, message: string) {
    const event: EditMessageEvent = {
      name: "EDIT_MESSAGE",
      data: {
        id,
        message,
        roomID,
      }
    }
    this.socket.send(JSON.stringify(event))
  }

  deleteMessage(roomID: number, msgID: string) {
    const event: DeleteMessageEvent = {
      name: "DELETE_MESSAGE",
      data: {
        id: msgID,
        roomID,
      }
    }
    this.socket.send(JSON.stringify(event))
  }

  newMessage(roomID: number, data: { message: string, replyTo?: string }) {
    const event: NewMessageEvent = {
      name: "NEW_MESSAGE",
      data: {
        ...data,
        roomID,
      }
    }
    this.socket.send(JSON.stringify(event))
  }
}

export let ws = WS.getInstance()
