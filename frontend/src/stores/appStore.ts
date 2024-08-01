import { RoomMessage, User } from '@/types'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  user: User | null
  rooms: Record<string, RoomMessage[]>
  showLoginAlert: boolean
}

type Actions = {
  addMessage: (message: RoomMessage, roomID: string) => void
  setUser: (user: User | null) => void
  clearMessages: (roomID: string) => void
  setShowLoginAlert: (visibility: boolean) => void
}

export const useAppStore = create<State & Actions>()(
  immer((set) => ({
    user: null,
    messages: [],
    rooms: {},
    showLoginAlert: false,

    setShowLoginAlert: (visibility) => set((state) => {
      state.showLoginAlert = visibility
    }),

    clearMessages: (roomID) => set((state) => {
      state.rooms[roomID] = []
    }),

    setUser: (user) => set((state) => {
      state.user = user
    }),

    addMessage: (message, roomID) =>
      set((state) => {
        if (!state.rooms[roomID]) {
          state.rooms[roomID] = []
        }
        state.rooms[roomID].push(message)
      }),
  })),
)
