export type User = {
  id: number
  username: string
  avatar: string
}

export type Room = {
  id: number
  createdAt: string
  settings: RoomSettings
} & CreateRoom

export type RoomSettings = {
  host: User
  coHosts?: number[]
  welcomeMessage?: string
}

export type CreateRoom = {
  topic: string
  maxParticipants: number
  languages: string[]
}

export type RoomRes = Room & { participants: (User & { status: string })[] }

export type RoomRole = "host" | "coHost" | "guest"
