import { config } from "@/config"
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
      } else if (msg.data === "VISITED_ROOM_PAGE" && roomRegex.test(url.pathname)) {
        useAppStore.getState().setJoinedAnotherRoom(true)
      }
    })
  }

  sendMessage(event: string) {
    this.channel.postMessage(event)
  }
}

export const bc = BC.getInstance()
