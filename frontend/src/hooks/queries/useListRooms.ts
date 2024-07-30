import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useListRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: api.listRooms
  })
}
