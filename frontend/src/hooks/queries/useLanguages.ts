import { api } from '@/lib/api'
import { useQuery } from 'react-query'

export function useLanguages() {
	return useQuery({
		queryKey: ['languages'],
		queryFn: () => api.getLanguages(),
		staleTime: Infinity,
	})
}
