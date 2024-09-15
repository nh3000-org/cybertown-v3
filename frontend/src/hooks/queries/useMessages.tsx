import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useMessages(participantID: number) {
  return useQuery({
    queryKey: ['messages', participantID],
    queryFn: () => api.getMessages(participantID),
  })
}
