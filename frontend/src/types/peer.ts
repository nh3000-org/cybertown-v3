export type PeerICECandidateEvent = {
	name: 'PEER_ICE_CANDIDATE'
	data: {
		candidate: string
		roomID: number
	}
}

export type PeerOfferEvent = {
	name: 'PEER_OFFER'
	data: {
		offer: string
		roomID: number
	}
}

export type PeerAnswerEvent = {
	name: 'PEER_ANSWER'
	data: {
		answer: string
		roomID: number
	}
}

export type PeerRenegotiateEvent = {
	name: 'PEER_RENEGOTIATE'
	data: {
		roomID: number
	}
}
