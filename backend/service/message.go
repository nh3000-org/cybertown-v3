package service

import (
	t "backend/types"
	"backend/utils"
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

func (s *Service) CreateMessage(ctx context.Context, msg *t.Message, userID, participantID int) (string, error) {
	dmID, err := s.GetDM(ctx, userID, participantID)
	if err != nil {
		return "", err
	}
	return s.repo.CreateMessage(ctx, dmID, msg)
}

func (s *Service) ReactionToMessage(ctx context.Context, msgID string, userID, participantID int, reaction string) error {
	m, err := s.repo.GetMessage(ctx, msgID, userID, participantID, true)
	if err != nil {
		return err
	}

	reactions := map[string][]int{}
	if m.Reactions != nil {
		reactions = *m.Reactions
	}

	if _, ok := reactions[reaction]; ok {
		if !utils.Includes(reactions[reaction], userID) {
			reactions[reaction] = append(reactions[reaction], userID)
		} else {
			reactions[reaction] = utils.Filter(reactions[reaction], func(val int) bool {
				return val != userID
			})
		}
		if len(reactions[reaction]) == 0 {
			delete(reactions, reaction)
		}
	} else {
		reactions[reaction] = append(reactions[reaction], userID)
	}
	m.Reactions = &reactions

	return s.repo.UpdateMessage(ctx, m, true)
}
