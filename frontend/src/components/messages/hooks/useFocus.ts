import { RefObject, useEffect } from 'react'
import { useAppStore } from '../../../stores/appStore'

export function useFocus(messagesRef: RefObject<HTMLDivElement>) {
	const selectedDM = useAppStore().selectedDM
	const isMessagesTab = useAppStore().roomTab === 'messages'
	const setUnreadCount = useAppStore().setUnreadCount
	const dmUnread = useAppStore().dmUnread
	const setDMRead = useAppStore().setDMReadForParticipant

	useEffect(() => {
		function onFocus() {
			if (document.visibilityState === 'hidden') {
				return
			}
			setTimeout(() => {
				if (!messagesRef.current) {
					return
				}
				const element = messagesRef.current
				const hasScrollbar = element.scrollHeight > element.clientHeight

				if (!selectedDM && isMessagesTab && !hasScrollbar) {
					setUnreadCount(0)
				}

				if (selectedDM && dmUnread[selectedDM] && !hasScrollbar) {
					setDMRead(selectedDM)
				}
			}, 300)
		}

		document.addEventListener('visibilitychange', onFocus)

		return () => {
			document.removeEventListener('visibilitychange', onFocus)
		}
	}, [messagesRef.current])
}
