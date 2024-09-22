package service

import (
	t "backend/types"
	"backend/utils"
	"context"
	"errors"
	"time"
)

var (
	ErrMaxRoomsHosted = errors.New("reached maximum number of rooms hosted")
)

func (s *Service) UpdateWelcomeMessage(ctx context.Context, roomID, userID int, wm string) error {
	r, err := s.repo.GetRoomSettings(ctx, roomID)
	if err != nil {
		return err
	}

	isHost := r.Host.ID == userID
	isCoHost := utils.Includes(r.CoHosts, userID)
	if !isHost && !isCoHost {
		return errors.New("permission denied")
	}

	r.WelcomeMessage = &wm
	return s.repo.UpdateRoomSettings(ctx, r)
}

func (s *Service) CanClearChat(ctx context.Context, roomID, userID, participantID int) error {
	r, err := s.repo.GetRoomSettings(ctx, roomID)
	if err != nil {
		return err
	}

	isHost := r.Host.ID == userID
	isCoHost := utils.Includes(r.CoHosts, userID)
	isParticipantHost := r.Host.ID == participantID
	if (!isHost && !isCoHost) || isParticipantHost {
		return errors.New("permission denied")
	}

	return nil
}

func (s *Service) AssignRole(ctx context.Context, role t.RoomRole, roomID, userID, participantID int) error {
	r, err := s.repo.GetRoomSettings(ctx, roomID)
	if err != nil {
		return err
	}

	isHost := r.Host.ID == userID
	isParticipantCoHost := utils.Includes(r.CoHosts, participantID)
	isParticipantHost := r.Host.ID == participantID

	if !isHost || isParticipantHost {
		return errors.New("permission denied")
	}

	filter := func(coHost int) bool {
		return coHost != participantID
	}

	switch role {

	case t.RoomRoleHost:
		count, err := s.repo.CountRoomsHosted(ctx, participantID)
		if err != nil {
			return err
		}
		if count >= s.conf.MaxRoomsHosted {
			return ErrMaxRoomsHosted
		}

		r.CoHosts = utils.Filter(r.CoHosts, filter)
		r.CoHosts = append(r.CoHosts, r.Host.ID)
		r.Host = t.User{
			ID: participantID,
		}
		welcomeMessage := ""
		r.WelcomeMessage = &welcomeMessage

	case t.RoomRoleGuest:
		if !isParticipantCoHost {
			return errors.New("should be 'co-host' to assign role 'guest'")
		}
		r.CoHosts = utils.Filter(r.CoHosts, filter)

	case t.RoomRoleCoHost:
		if isParticipantCoHost {
			return errors.New("should be 'guest' to assign role 'co-host'")
		}
		r.CoHosts = append(r.CoHosts, participantID)

	}

	return s.repo.UpdateRoomSettings(ctx, r)
}

func (s *Service) KickParticipant(ctx context.Context, duration time.Duration, roomID, userID, participantID int) (*t.Kick, error) {
	r, err := s.repo.GetRoomSettings(ctx, roomID)
	if err != nil {
		return nil, err
	}

	isHost := r.Host.ID == userID
	isCoHost := utils.Includes(r.CoHosts, userID)
	isParticipantHost := r.Host.ID == participantID
	if (!isHost && !isCoHost) || isParticipantHost {
		return nil, errors.New("permission denied")
	}

	k := t.Kick{
		RoomID:    roomID,
		UserID:    participantID,
		ExpiredAt: time.Now().UTC().Add(duration),
	}

	if utils.Includes(r.CoHosts, participantID) {
		return &k, nil
	}

	_, err = s.repo.GetKick(ctx, roomID, participantID)
	if nil == err {
		return nil, errors.New("participant is kicked already")
	}

	err = s.repo.KickParticipant(ctx, &k)
	if err != nil {
		return nil, err
	}

	return &k, nil
}
