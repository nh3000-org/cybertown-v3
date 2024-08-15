import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useRoom(roomID: number, hasUser: boolean) {
  return useQuery({
    queryKey: ['room', roomID],
    queryFn: () => api.getRoom(roomID),
    enabled: hasUser
  })
}
