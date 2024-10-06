package service

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

const (
	systemPrompt = `
		I want you to act as a user of the site "Cybertown", where users can 
		create or join rooms to interact via text, audio, screen sharing, or
		watch parties. Keep your responses brief and to the point. Aim to wrap
		up the conversation without prolonging it.
	`
)

func (s *Service) GetReplyFromAI(roomID int, userID int, content, aiReply string) (string, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(s.conf.Gemini.APIKey))
	if err != nil {
		return "", err
	}

	if len(aiReply) != 0 {
		content += fmt.Sprintf(`
			The user is referring to this msg:
			"""
			%s
			"""
		`, aiReply)
	}

	model := client.GenerativeModel(s.conf.Gemini.AIModel)
	model.SystemInstruction = genai.NewUserContent(genai.Text(systemPrompt))

	var history []*genai.Content
	messages, err := s.repo.GetAIMessages(ctx, roomID, userID)
	if err != nil {
		return "", err
	}
	for _, msg := range messages {
		history = append(history, &genai.Content{
			Role: msg.Role,
			Parts: []genai.Part{
				genai.Text(msg.Content),
			},
		})
	}

	c := model.StartChat()
	c.History = history

	resp, err := c.SendMessage(ctx, genai.Text(content))
	if err != nil {
		return "", err
	}

	part := resp.Candidates[0].Content.Parts[0]
	return fmt.Sprintf("%v", part), nil
}
