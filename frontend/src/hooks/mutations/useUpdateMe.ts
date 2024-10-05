import { api } from '@/lib/api'
import { useMutation } from 'react-query'

export function useUpdateMe() {
	return useMutation({
		mutationFn: (bio: string) => api.updateMe(bio),
	})
}
