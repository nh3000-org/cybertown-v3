package service

import (
	t "backend/types"
	"context"
)

func (s *Service) DeleteMessage(ctx context.Context, msgID string, userID, participantID int) error {
	m, err := s.repo.GetMessage(ctx, msgID, userID, participantID, false)
	if err != nil {
		return err
	}
	m.IsDeleted = true
	m.Content = ""

	return s.repo.UpdateMessage(ctx, m, false)
}

func (s *Service) EditMessage(ctx context.Context, msgID, content string, userID, participantID int) error {
	m, err := s.repo.GetMessage(ctx, msgID, userID, participantID, false)
	if err != nil {
		return err
	}
	m.IsEdited = true
	m.Content = content

	return s.repo.UpdateMessage(ctx, m, false)
}

func (s *Service) CreateMessage(ctx context.Context, msg *t.Message, userID, participantID int) error {
	dmID, err := s.GetDM(ctx, userID, participantID)
	if err != nil {
		return err
	}
	return s.repo.CreateMessage(ctx, dmID, msg)
}
