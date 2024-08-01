import { config } from "@/config";
import { JoinRoomEvent, LeaveRoomEvent, NewMessageEvent, SocketEvent } from "@/types";
import { queryClient } from "./utils";
import { useAppStore } from "@/stores/appStore";

class WS {
  private socket: WebSocket
  private static instance: WS
  currentRoomID: string | null = null

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
            queryClient.invalidateQueries({
              queryKey: ['rooms']
            })
            break;
          case "NEW_MESSAGE_BROADCAST":
            useAppStore.getState().addMessage(event.data, this.currentRoomID!)
            break;
        }
      } catch (err) {
        console.error("failed to parse socket data", err)
      }
    }
    this.socket = socket
  }

  joinRoom(roomID: string) {
    const event: JoinRoomEvent = {
      name: "JOIN_ROOM",
      data: {
        roomID: Number(roomID),
      }
    }
    this.socket.send(JSON.stringify(event))
    this.currentRoomID = roomID
  }

  leaveRoom(roomID: string) {
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

  sendMessage(message: string, roomID: string) {
    const event: NewMessageEvent = {
      name: "NEW_MESSAGE",
      data: {
        message,
        roomID: Number(roomID),
      }
    }
    this.socket.send(JSON.stringify(event))
  }
}

export let ws = WS.getInstance()
