import { RoomMessage } from '@/types'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  messages: RoomMessage[]
}

type Actions = {
  addMessage: (message: RoomMessage) => void
}

export const useRoomStore = create<State & Actions>()(
  immer((set) => ({
    messages: [],
    addMessage: (message) =>
      set((state) => {
        state.messages.push(message)
      }),
  })),
)
