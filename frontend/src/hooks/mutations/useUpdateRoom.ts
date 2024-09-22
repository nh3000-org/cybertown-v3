import { api } from '@/lib/api'
import { CreateRoom } from '@/types'
import { useMutation } from 'react-query'

export function useUpdateRoom() {
	return useMutation({
		mutationFn: (data: { roomID: number; room: CreateRoom }) =>
			api.updateRoom(data.roomID, data.room),
	})
}
