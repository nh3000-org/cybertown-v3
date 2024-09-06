package service

import (
	"context"
	"errors"
)

func (s *Service) GetDM(ctx context.Context, userID, participantID int) (int, error) {
	ok, err := s.repo.IsFriends(context.Background(), userID, participantID)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, errors.New("Should be friends to create a dm")
	}

	dmID, err := s.repo.GetDM(context.Background(), userID, participantID)
	if nil == err {
		return dmID, nil
	}

	dmID, err = s.repo.CreateDM(context.Background(), userID, participantID)
	if err != nil {
		return 0, err
	}

	return dmID, nil
}
