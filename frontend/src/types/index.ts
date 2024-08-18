export type User = {
  id: string
  username: string
  avatar: string
}

export type Room = {
  id: number
  createdBy: User
  createdAt: string
} & CreateRoom

export type CreateRoom = {
  topic: string
  maxParticipants: number
  languages: string[]
}

export type RoomRes = Room & { participants: User[] }
