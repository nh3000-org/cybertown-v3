export type User = {
  id: number
  username: string
  avatar: string
}

export type Profile = {
  isMe: boolean
  isFollowing: boolean
  friendsCount: number
  followingCount: number
  followersCount: number
} & User

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
