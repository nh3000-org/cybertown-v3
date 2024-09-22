import { api } from '@/lib/api'
import { useQuery } from 'react-query'

export function useMe() {
	return useQuery({
		queryKey: ['me'],
		queryFn: api.me,
	})
}
