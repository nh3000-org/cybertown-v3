import { Room, User } from '@/types'
import { ClearChatBroadcastEvent, DeleteMsgBroadcastEvent, EditMsgBroadcastEvent, KickParticipantBroadcastEvent, Message, NewMsgBroadcastEvent, ReactionToMsgBroadcastEvent } from '@/types/broadcast'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  isKicked: {
    kickedAt: string
    duration: number
  } | null
  user: User | null
  messages: Message[]
  alerts: {
    login: boolean
    logout: boolean
  }
  toast: {
    open: boolean
    content?: {
      type: "info" | "error"
      title: string
      description: string
    }
  }
  createOrUpdateRoom: {
    open: boolean
    room?: Room
  }
}

type Actions = {
  setUser: (user: User | null) => void
  setAlert: (alert: keyof State['alerts'], visibility: boolean) => void
  clearMessages: () => void
  setToast: (open: boolean, content?: State['toast']['content']) => void
  setCreateOrUpdateRoom: (open: boolean, room?: Room) => void

  // broadcast events
  addMsg: (event: NewMsgBroadcastEvent) => void
  editMsg: (event: EditMsgBroadcastEvent) => void
  deleteMsg: (event: DeleteMsgBroadcastEvent) => void
  reactionToMsg: (event: ReactionToMsgBroadcastEvent) => void
  clearChat: (event: ClearChatBroadcastEvent) => void
  kickParticipant: (event: KickParticipantBroadcastEvent) => void
}

export const useAppStore = create<State & Actions>()(
  immer((set) => ({
    isKicked: false,
    user: null,
    messages: [],
    alerts: {
      login: false,
      logout: false,
    },
    toast: {
      open: false
    },
    createOrUpdateRoom: {
      open: false
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

    setToast: (open, content) => set((state) => {
      state.toast = { open, content }
    }),

    setCreateOrUpdateRoom: (open, room) => set((state) => {
      if (open && !state.user) {
        state.alerts['login'] = true
        return
      }
      state.createOrUpdateRoom.open = open
      state.createOrUpdateRoom.room = room
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

    clearChat: (event) => set((state) => {
      state.messages.forEach(msg => {
        if (msg.from.id === event.data.participant.id && !msg.participant) {
          msg.isDeleted = true
        }
      })
    }),

    kickParticipant: (event) => set((state) => {
      if (event.data.participant.id === state.user?.id) {
        state.isKicked = {
          kickedAt: event.data.kickedAt,
          duration: event.data.duration,
        }
      }
    }),
  })),
)
