export type User = {
  id: string
  username: string
  avatar: string
}

export type Room = {
  id: number
  topic: string
  maxParticipants: number
  language: string
  createdBy: number
}

export type CreateRoom = {
  topic: string
  maxParticipants: number
  language: string
}
