import { ws } from './ws'

class Peer {
	private static instance: Peer
	pc: RTCPeerConnection | null = null

	static getInstance(): Peer {
		if (!Peer.instance) {
			this.instance = new Peer()
		}
		return this.instance
	}

	createPeer() {
		if (this.pc) {
			this.pc.close()
			this.pc = null
		}

		const configuration = {
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		}
		const pc = new RTCPeerConnection(configuration)
		this.pc = pc

		pc.addTransceiver('audio', {
			direction: 'sendrecv',
		})

		pc.ontrack = (e) => {
			if (e.track.kind !== 'audio') {
				return
			}
			const element = document.createElement('audio')
			element.srcObject = e.streams[0]
			element.autoplay = true
			element.play()
			console.log('received track event:', e)
		}

		pc.onicecandidate = (e) => {
			if (!e.candidate) {
				return
			}
			ws.sendICECandidate(JSON.stringify(e.candidate))
		}

		this.makeOffer()
	}

	async speak() {
		try {
			const pc = this.pc!

			// this will prompt the user to give permissions
			await navigator.mediaDevices.getUserMedia({ audio: true })

			const devices = await navigator.mediaDevices.enumerateDevices()
			const defaultDevice = devices.find(
				(device) =>
					device.kind === 'audioinput' && device.deviceId === 'default'
			)

			if (!defaultDevice) {
				throw new Error('No default audio input device found')
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { deviceId: defaultDevice.deviceId },
			})

			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream)
			})
			this.makeOffer()
		} catch (err) {
			throw err
		}
	}

	async makeOffer() {
		if (!this.pc) {
			return
		}
		const offer = await this.pc.createOffer()
		this.pc.setLocalDescription(offer)
		console.log('create offer', JSON.stringify(offer))
		ws.sendPeerOffer(JSON.stringify(offer))
	}

	async acceptAnswer(answer: string) {
		const pc = this.pc!
		try {
			pc.setRemoteDescription(JSON.parse(answer))
			console.log('accepted answer', JSON.parse(answer))
		} catch (err) {
			console.error('failed to accept offer', err)
		}
	}
}

export const peer = Peer.getInstance()
