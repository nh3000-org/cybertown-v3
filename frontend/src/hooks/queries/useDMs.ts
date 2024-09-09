import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useDMs() {
  return useQuery({
    queryKey: ['dms'],
    queryFn: api.getDMs
  })
}
