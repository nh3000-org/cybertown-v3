export type User = {
  id: number
  username: string
  avatar: string
}

export type Room = {
  id: number
  createdAt: string
  host: User
  coHosts?: number[]
  welcomeMessage: string
} & CreateRoom

export type CreateRoom = {
  topic: string
  maxParticipants: number
  languages: string[]
}

export type RoomRes = Room & { participants: User[] }

export type RoomRole = "host" | "coHost" | "guest"
