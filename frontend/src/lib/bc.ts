import { config } from "@/config"
import { ws } from "./ws"
import { useAppStore } from "@/stores/appStore"

class BC {
  private channel: BroadcastChannel
  private static instance: BC

  static getInstance(): BC {
    if (!BC.instance) {
      BC.instance = new BC()
    }
    return BC.instance
  }

  constructor() {
    this.channel = new BroadcastChannel("cybertown")

    this.channel.addEventListener("message", (msg) => {
      const url = new URL(window.location.href)
      const roomRegex = /^\/room\/\d+$/;

      if (msg.data === "VISITED_HOMEPAGE" && url.pathname === '/') {
        window.location.href = config.redirectURL
      } else if (msg.data === "JOIN_ROOM_REQUEST" && roomRegex.test(url.pathname)) {
        ws.close()
        useAppStore.getState().setJoinedAnotherRoom(true)
      }
    })
  }

  sendMessage(event: string) {
    this.channel.postMessage(event)
  }
}

export const bc = BC.getInstance()
