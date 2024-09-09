import { api } from "@/lib/api";
import { useQuery } from "react-query";

export function useRelation(relation: string) {
  return useQuery({
    queryKey: ['relations', relation],
    queryFn: () => api.getRelations(relation),
  })
}
