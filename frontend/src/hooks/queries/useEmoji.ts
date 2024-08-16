import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useEmoji() {
  return useQuery({
    queryKey: ['emoji'],
    queryFn: api.emoji
  })
}
