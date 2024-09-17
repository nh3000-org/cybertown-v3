import { getDMParticipant } from '@/lib/utils'
import { ws } from '@/lib/ws'
import { Room, User } from '@/types'
import { ClearChatBroadcastEvent, DeleteMsgBroadcastEvent, EditMsgBroadcastEvent, KickParticipantBroadcastEvent, Message, NewMsgBroadcastEvent, ReactionToMsgBroadcastEvent } from '@/types/broadcast'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type State = {
  isKicked: {
    expiredAt: string
  } | null
  joinedAnotherRoom: boolean

  dm: Record<string, Message[]>
  dmUnread: Record<string, boolean>

  /*
   undefined -> /me api call is not made yet
   null      -> /me api call is made but no user
  */
  user: User | null | undefined

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
  setUser: (user: User | null | undefined) => void
  setAlert: (alert: keyof State['alerts'], visibility: boolean) => void
  clearMessages: () => void
  setToast: (open: boolean, content?: State['toast']['content']) => void
  setCreateOrUpdateRoom: (open: boolean, room?: Room) => void
  setJoinedAnotherRoom: (isJoined: boolean) => void

  // dm
  setDM: (participantID: number, messages: Message[]) => void
  clearDM: (participantID: number) => void
  setDMUnread: (dmUnread: Record<string, boolean>) => void
  setDMReadForParticipant: (participantID: number) => void

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
    isKicked: null,
    user: undefined,
    joinedAnotherRoom: false,
    messages: [],
    dm: {},
    dmUnread: {},
    hasUnreadDM: false,
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

    setJoinedAnotherRoom: (isJoined) => set((state) => {
      state.joinedAnotherRoom = isJoined
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

    setDMUnread: (dmUnread) => set((state) => {
      state.dmUnread = dmUnread
    }),

    setDMReadForParticipant: (participantID: number) => set((state) => {
      state.dmUnread[participantID] = false
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
        if (event.data.roomID === ws.roomID) {
          state.messages.push(event.data)
          return
        }
        const id = getDMParticipant(event.data.from, event.data.participant!, state.user!)
        if (!state.dm[id]) {
          state.dm[id] = []
        }
        state.dm[id].push(event.data)
        if (event.data.from.id !== state.user?.id) {
          state.dmUnread[id] = true
        }
      }),

    editMsg: (event) => set((state) => {
      let messages = []
      if (event.data.roomID === ws.roomID) {
        messages = state.messages
      } else {
        const id = getDMParticipant(event.data.from, event.data.participant!, state.user!)
        messages = state.dm[id]
      }
      const { content, from, id } = event.data
      const index = messages.findIndex(msg => msg.id == id && msg.from.id === from.id)
      if (index === -1) {
        return
      }
      messages[index].isEdited = true
      messages[index].content = content
    }),

    deleteMsg: (event) => set((state) => {
      let messages = []
      if (event.data.roomID === ws.roomID) {
        messages = state.messages
      } else {
        const id = getDMParticipant(event.data.from, event.data.participant!, state.user!)
        messages = state.dm[id]
      }
      const { from, id } = event.data
      const index = messages.findIndex(msg => msg.id == id && msg.from.id === from.id)
      if (index === -1) {
        return
      }
      messages[index].isDeleted = true
      messages[index].content = ''
    }),

    reactionToMsg: (event) => set((state) => {
      let messages = []
      if (event.data.roomID === ws.roomID) {
        messages = state.messages
      } else {
        const id = getDMParticipant(event.data.from, event.data.participant!, state.user!)
        messages = state.dm[id]
      }
      const { id, reaction, from } = event.data
      const index = messages.findIndex(msg => msg.id === id)
      if (index === -1) {
        return
      }
      if (!messages[index].reactions) {
        messages[index].reactions = {}
      }
      const reactions = messages[index].reactions
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
          msg.content = ''
        }
      })
    }),

    setDM: (participantID, messages) => set((state) => {
      if (!state.dm[participantID]) {
        state.dm[participantID] = []
      }
      const currentMessages = state.dm[participantID]
      state.dm[participantID] = [...messages, ...currentMessages]
    }),

    clearDM: (participantID) => set((state) => {
      state.dm[participantID] = []
    }),

    kickParticipant: (event) => set((state) => {
      if (event.data.participant.id === state.user?.id) {
        state.isKicked = {
          expiredAt: event.data.expiredAt,
        }
      }
    }),
  })),
)
