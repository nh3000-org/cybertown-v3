import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useJoinRoom(roomID: number, hasUser: boolean) {
  return useQuery({
    queryKey: ['room', roomID],
    queryFn: () => api.joinRoom(roomID),
    enabled: hasUser,
    staleTime: Infinity,
    cacheTime: Infinity,
  })
}
