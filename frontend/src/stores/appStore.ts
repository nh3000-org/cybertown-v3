import { EditRoomMessage, ReactionToMessage, RoomMessage, User } from '@/types'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  user: User | null
  rooms: Record<string, RoomMessage[]>
  alerts: {
    login: boolean
    logout: boolean
  }
}

type Actions = {
  addMessage: (roomID: number, message: RoomMessage) => void
  editMessage: (roomID: number, message: EditRoomMessage) => void
  deleteMessage: (roomID: number, msgID: string, from: User) => void
  setUser: (user: User | null) => void
  clearMessages: (roomID: number) => void
  setAlert: (alert: keyof State['alerts'], visibility: boolean) => void
  react: (data: ReactionToMessage) => void
}

export const useAppStore = create<State & Actions>()(
  immer((set) => ({
    user: null,
    messages: [],
    rooms: {},
    alerts: {
      login: false,
      logout: false,
    },

    setAlert: (alert, visibility) => set((state) => {
      state.alerts[alert] = visibility
    }),

    react: (data) => set((state) => {
      const messages = state.rooms[data.roomID]
      if (!messages) {
        return
      }
      const index = messages.findIndex(msg => msg.id === data.id)
      if (index === -1) {
        return
      }
      const reactions = messages[index].reactions
      if (!reactions[data.reaction]) {
        reactions[data.reaction] = {}
      }
      const isReacted = reactions[data.reaction][data.from.id]
      if (isReacted) {
        delete reactions[data.reaction][data.from.id]
        if (!Object.keys(reactions[data.reaction]).length) {
          delete reactions[data.reaction]
        }
      } else {
        reactions[data.reaction][data.from.id] = data.from
      }
    }),

    editMessage: (roomID, message) => set((state) => {
      const messages = state.rooms[roomID]
      if (!messages) {
        return
      }
      const index = messages.findIndex(msg => msg.id == message.id && msg.from.id === message.from.id)
      if (index === -1) {
        return
      }
      messages[index] = {
        ...messages[index],
        isEdited: true,
        message: message.message
      }
    }),

    deleteMessage: (roomID, msgID, from) => set((state) => {
      const messages = state.rooms[roomID]
      if (!messages) {
        return
      }
      const index = messages.findIndex(msg => msg.id == msgID && msg.from.id === from.id)
      if (index === -1) {
        return
      }
      messages[index] = {
        ...messages[index],
        isDeleted: true,
      }
    }),

    clearMessages: (roomID) => set((state) => {
      state.rooms[roomID] = []
    }),

    setUser: (user) => set((state) => {
      state.user = user
    }),

    addMessage: (roomID, message) =>
      set((state) => {
        if (!state.rooms[roomID]) {
          state.rooms[roomID] = []
        }
        state.rooms[roomID].push(message)
      }),
  })),
)
