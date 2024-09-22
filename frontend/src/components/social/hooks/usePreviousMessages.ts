import { api } from '@/lib/api'
import { useState } from 'react'

export const MESSAGES_LIMIT = 50

export function usePreviousMessages(participantID: number) {
	const [loading, setLoading] = useState(false)
	const [hasNext, setHasNext] = useState(true)

	async function fetchMessages(cursor: string) {
		if (!hasNext) {
			return
		}
		setLoading(true)
		try {
			const messages = await api.getMessages(participantID, cursor)
			if (messages.length != MESSAGES_LIMIT) {
				setHasNext(false)
			}
			return messages
		} finally {
			setLoading(false)
		}
	}

	return {
		loading,
		fetchMessages,
	}
}
