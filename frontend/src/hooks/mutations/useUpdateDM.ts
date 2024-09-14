import { api } from "@/lib/api";
import { useMutation } from "react-query";

export function useUpdateDM() {
  return useMutation({
    mutationFn: (participantID: number) => api.updateDM(participantID),
  })
}
