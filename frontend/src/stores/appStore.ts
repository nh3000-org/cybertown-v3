import { User } from '@/types'
import { DeleteMsgBroadcastEvent, EditMsgBroadcastEvent, Message, NewMsgBroadcastEvent, ReactionToMsgBroadcastEvent } from '@/types/broadcast'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  user: User | null
  messages: Message[]
  alerts: {
    login: boolean
    logout: boolean
  }
}

type Actions = {
  setUser: (user: User | null) => void
  setAlert: (alert: keyof State['alerts'], visibility: boolean) => void
  clearMessages: () => void

  // broadcast events
  addMsg: (event: NewMsgBroadcastEvent) => void
  editMsg: (event: EditMsgBroadcastEvent) => void
  deleteMsg: (event: DeleteMsgBroadcastEvent) => void
  reactionToMsg: (event: ReactionToMsgBroadcastEvent) => void
}

export const useAppStore = create<State & Actions>()(
  immer((set) => ({
    user: null,
    messages: [],
    alerts: {
      login: false,
      logout: false,
    },

    setUser: (user) => set((state) => {
      state.user = user
    }),

    setAlert: (alert, visibility) => set((state) => {
      state.alerts[alert] = visibility
    }),

    clearMessages: () => set((state) => {
      state.messages = []
    }),

    addMsg: (event) =>
      set((state) => {
        state.messages.push(event.data)
      }),

    editMsg: (event) => set((state) => {
      const { content, from, id } = event.data
      const index = state.messages.findIndex(msg => msg.id == id && msg.from.id === from.id)
      if (index === -1) {
        return
      }
      state.messages[index].isEdited = true
      state.messages[index].content = content
    }),

    deleteMsg: (event) => set((state) => {
      const { from, id } = event.data
      const index = state.messages.findIndex(msg => msg.id == id && msg.from.id === from.id)
      if (index === -1) {
        return
      }
      state.messages[index].isDeleted = true
    }),

    reactionToMsg: (event) => set((state) => {
      const { id, reaction, from } = event.data
      const index = state.messages.findIndex(msg => msg.id === id)
      if (index === -1) {
        return
      }
      const reactions = state.messages[index].reactions
      if (!reactions[reaction]) {
        reactions[reaction] = {}
      }
      const isReacted = reactions[reaction][from.id]
      if (isReacted) {
        delete reactions[reaction][from.id]
        if (!Object.keys(reactions[reaction]).length) {
          delete reactions[reaction]
        }
      } else {
        reactions[reaction][from.id] = from
      }
    }),
  })),
)
