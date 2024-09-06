import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useProfile(userID: number, enabled: boolean) {
  return useQuery({
    queryKey: ['profile', userID],
    queryFn: () => api.getProfile(userID),
    enabled
  })
}
