import { api } from "@/lib/api";
import { useMutation } from "react-query";

export function useFollow() {
  return useMutation({
    mutationFn: (data: {
      followeeID: number,
      isFollowing: boolean
    }) => api.follow(data.followeeID, data.isFollowing),
  })
}
