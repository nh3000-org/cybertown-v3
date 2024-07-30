import { api } from "@/lib/api";
import { queryClient } from "@/lib/utils";
import { CreateRoom } from "@/types";
import { useMutation } from "react-query";

export function useCreateRoom() {
  return useMutation({
    mutationFn: (room: CreateRoom) => api.createRoom(room),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rooms']
      })
    }
  })
}
