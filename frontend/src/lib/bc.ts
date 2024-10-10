import { config } from '@/config'
import { useAppStore } from '@/stores/appStore'

class BC {
	private channel: BroadcastChannel
	private static instance: BC

	static getInstance(): BC {
		if (!BC.instance) {
			BC.instance = new BC()
		}
		return BC.instance
	}

	constructor() {
		this.channel = new BroadcastChannel('cybertown')

		this.channel.addEventListener('message', (msg) => {
			const url = new URL(window.location.href)
			const roomRegex = /^\/room\/\d+$/

			try {
				const event = JSON.parse(msg.data)
				if (event.name === 'VISITED_HOMEPAGE' && url.pathname === '/') {
					window.location.href = config.redirectURL
				} else if (
					event.name === 'VISITED_ROOM_PAGE' &&
					roomRegex.test(url.pathname)
				) {
					useAppStore.getState().setJoinedAnotherRoom(true)
				} else if (event.name === 'THEME_CHANGED') {
					document.documentElement.dataset.theme = event.theme
				} else if (event.name === 'COLOR_CHANGED') {
					document.documentElement.style.setProperty('--brand', event.color)
				} else if (event.name === 'DM_READ_PARTICIPANT') {
					useAppStore.getState().setDMReadForParticipant(event.participantID)
				}
			} catch (err) {
				console.error('failed to parse broadcast event', err)
			}
		})
	}

	sendMessage(event: Record<string, any>) {
		this.channel.postMessage(JSON.stringify(event))
	}
}

export const bc = BC.getInstance()
