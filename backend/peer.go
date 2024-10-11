package main

import (
	t "backend/types"
	"backend/utils"
	"encoding/json"
	"log"

	"github.com/pion/webrtc/v4"
	"nhooyr.io/websocket"
)

type Peer struct {
	roomID int
	conn   *websocket.Conn
	*webrtc.PeerConnection
}

func (p *Peer) sendAnswer() error {
	answer, err := p.CreateAnswer(nil)
	if err != nil {
		return err
	}
	p.SetLocalDescription(answer)

	b, err := json.Marshal(answer)
	if err != nil {
		return err
	}

	utils.WriteEvent(p.conn, &t.Event{
		Name: "PEER_ANSWER",
		Data: map[string]any{
			"answer": string(b),
			"roomID": p.roomID,
		},
	})
	return nil
}

func (p *Peer) addICECandidate(b []byte) {
	data, err := utils.ParseJSON[t.ICECandiate](b)
	if err != nil {
		log.Printf("ice candidate event: failed to parse: %v", err)
		return
	}

	var i webrtc.ICECandidateInit
	err = json.Unmarshal([]byte(data.Candidate), &i)
	if err != nil {
		log.Printf("ice candidate event: failed to unmarshal ice candidate: %v", err)
		return
	}

	err = p.AddICECandidate(i)
	if err != nil {
		log.Printf("ice candidate event: failed to add ice candidate: %v", err)
		return
	}

	log.Println("added ice candidate")
}

func (p *Peer) acceptOffer(b []byte) {
	data, err := utils.ParseJSON[t.PeerOffer](b)
	if err != nil {
		log.Printf("peer answer event: failed to parse: %v", err)
		return
	}

	var d webrtc.SessionDescription
	err = json.Unmarshal([]byte(data.Offer), &d)
	if err != nil {
		log.Printf("peer answer event: failed to unmarshal answer: %v", err)
	}

	err = p.SetRemoteDescription(d)
	if err != nil {
		log.Printf("peer answer event: failed to set remote desc: %v", err)
		return
	}

	err = p.sendAnswer()
	if err != nil {
		log.Printf("peer answer event: failed to send answer: %v", err)
		return
	}
}

func NewPeer(roomID int, conn *websocket.Conn) (*Peer, error) {
	p, err := webrtc.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	peer := &Peer{
		roomID:         roomID,
		PeerConnection: p,
		conn:           conn,
	}

	_, err = peer.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionSendrecv,
	})
	if err != nil {
		return nil, err
	}

	p.OnICECandidate(func(i *webrtc.ICECandidate) {
		if i == nil {
			return
		}

		b, err := json.Marshal(i.ToJSON())
		if err != nil {
			log.Printf("failed to marshal ice candidate: %v", err)
			return
		}

		utils.WriteEvent(conn, &t.Event{
			Name: "PEER_ICE_CANDIDATE",
			Data: map[string]any{
				"roomID":    roomID,
				"candidate": string(b),
			},
		})
	})

	return peer, nil
}
