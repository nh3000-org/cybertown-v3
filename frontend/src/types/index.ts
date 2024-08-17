export type User = {
  id: string
  username: string
  avatar: string
}

export type Room = {
  id: number
  createdBy: number
} & CreateRoom

export type CreateRoom = {
  topic: string
  maxParticipants: number
  languages: string[]
}

export type RoomRes = Room & { participants: User[] }
