import { config } from "@/config"
import { fetchWrapper } from "@/lib/fetchWrapper"
import { CreateRoom, Room, RoomRes, User } from "@/types"

export const api = {
  async me() {
    const url = config.apiURL + "/me"
    const data = await fetchWrapper<"user", User>(url)
    return data.user
  },

  async logout() {
    const url = config.apiURL + "/auth/logout"
    const data = await fetchWrapper<"message", string>(url, {
      method: 'DELETE',
    })
    return data.message
  },

  async createRoom(room: CreateRoom) {
    const url = config.apiURL + "/rooms"
    const data = await fetchWrapper<"roomID", number>(url, {
      method: 'POST',
      body: JSON.stringify(room),
    })
    return data.roomID
  },

  async updateRoom(roomID: number, room: CreateRoom) {
    const url = config.apiURL + `/rooms/${roomID}`
    const data = await fetchWrapper<"message", string>(url, {
      method: 'PUT',
      body: JSON.stringify(room),
    })
    return data.message
  },

  async getRooms() {
    const url = config.apiURL + "/rooms"
    const data = await fetchWrapper<"rooms", RoomRes[]>(url)
    return data.rooms
  },

  async joinRoom(roomID: number) {
    const url = config.apiURL + `/rooms/${roomID}/join`
    const data = await fetchWrapper<"room", Room>(url)
    return data.room
  },

  async emoji() {
    const url = "https://cdn.jsdelivr.net/npm/@emoji-mart/data"
    const res = await fetch(url)
    const data = await res.json()
    return data
  },
}
