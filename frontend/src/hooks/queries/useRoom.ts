import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useRoom(roomID: string, hasUser: boolean) {
  return useQuery({
    queryKey: ['room', roomID],
    queryFn: () => api.getRoom(roomID as string),
    enabled: hasUser
  })
}
