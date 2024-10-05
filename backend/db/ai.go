package db

import (
	t "backend/types"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

const (
	maxAIMessages = 25
)

// contents[0] - user message, contens[1] - reply from ai
func (r *Repo) SetAIReply(ctx context.Context, roomID int, msgID string, userID int, contents []string) {
	key := fmt.Sprintf("ai-reply:%d:%s", roomID, msgID)
	_, err := r.rdb.Set(ctx, key, contents[1], 0).Result()
	if err != nil {
		log.Printf("failed to set ai reply: %v", err)
		return
	}
	r.SetAIReplies(ctx, roomID, userID, contents)
}

func (r *Repo) SetAIReplies(ctx context.Context, roomID, userID int, contents []string) {
	key := fmt.Sprintf("ai-reply:%d:%d", roomID, userID)

	aiMessages, err := r.GetAIMessages(ctx, roomID, userID)
	if err != nil {
		log.Printf("failed to get ai messages: %v", err)
		return
	}

	for i, content := range contents {
		role := "user"
		if i == 1 {
			role = "model"
		}
		aiMessages = append(aiMessages, &t.AIMessage{
			Role:    role,
			Content: content,
		})
	}

	b, err := json.Marshal(aiMessages)
	if err != nil {
		log.Printf("failed to marshal ai replies: %v", err)
		return
	}

	if len(aiMessages) > maxAIMessages {
		aiMessages = aiMessages[len(aiMessages)-maxAIMessages:]
	}

	err = r.rdb.Set(ctx, key, string(b), 0).Err()
	if err != nil {
		log.Printf("failed to set ai replies: %v", err)
	}
}

func (r *Repo) GetAIMessages(ctx context.Context, roomID, userID int) ([]*t.AIMessage, error) {
	var (
		aiMessages = []*t.AIMessage{}
		key        = fmt.Sprintf("ai-reply:%d:%d", roomID, userID)
	)

	value, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			value = "[]"
		} else {
			return nil, err
		}
	}

	err = json.Unmarshal([]byte(value), &aiMessages)
	if err != nil {
		return nil, err
	}

	return aiMessages, nil
}

func (r *Repo) IsReplyToAI(ctx context.Context, roomID int, msgID string) (string, error) {
	key := fmt.Sprintf("ai-reply:%d:%s", roomID, msgID)
	value, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			value = ""
		} else {
			return "", err
		}
	}
	return value, nil
}

func (r *Repo) DeleteAIReplies(ctx context.Context, roomID int) {
	var cursor uint64
	match := fmt.Sprintf("ai-reply:%d:*", roomID)

	for {
		keys, nextCusor, err := r.rdb.Scan(ctx, cursor, match, 100).Result()
		if err != nil {
			log.Printf("failed to scan ai replies keys: %v", err)
			return
		}

		if len(keys) > 0 {
			_, err := r.rdb.Del(ctx, keys...).Result()
			if err != nil {
				log.Printf("failed to delete ai replies keys: %v", err)
				return
			}
			log.Printf("deleted %d keys for key %q", len(keys), match)
		}

		cursor = nextCusor
		if nextCusor == 0 {
			break
		}
	}

	log.Printf("deleted all keys for key %q", match)
}
