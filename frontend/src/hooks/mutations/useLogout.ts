import { api } from "@/lib/api";
import { queryClient } from "@/lib/utils";
import { useMutation } from "react-query";

export function useLogout() {
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.resetQueries({
        queryKey: ['me']
      })
    }
  })
}
