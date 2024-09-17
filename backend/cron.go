package main

import (
	"backend/types"
	"context"
	"log"
	"time"
)

func (a *application) deleteInactiveRooms(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var roomIDs []int
			for rID, r := range a.ss.rooms {
				if len(r.conns) == 0 && time.Now().UTC().After(r.lastActivity.Add(10*time.Minute)) {
					roomIDs = append(roomIDs, rID)
				}
			}

			if len(roomIDs) > 0 {
				err := a.repo.DeleteRooms(ctx, roomIDs)
				if err != nil {
					log.Printf("failed to delete rooms: %v", err)
					continue
				}
				a.ss.broadcastEvent(&types.Event{
					Name: "ROOMS_DELETED_BROADCAST",
					Data: map[string]any{
						"roomIDs": roomIDs,
					},
				})
			}
		}
	}
}
