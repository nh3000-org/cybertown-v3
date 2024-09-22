import { api } from '@/lib/api'
import { queryClient } from '@/lib/utils'
import { useMutation } from 'react-query'

export function useFollow() {
	return useMutation({
		mutationFn: (data: { followeeID: number; isFollowing: boolean }) =>
			api.follow(data.followeeID, data.isFollowing),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['dms'] })
			queryClient.invalidateQueries({ queryKey: ['relations'] })
		},
	})
}
