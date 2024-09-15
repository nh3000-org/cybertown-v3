import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import { useQuery } from "react-query";

export function useDMs(hasUser: boolean) {
  return useQuery({
    queryKey: ['dms'],
    queryFn: api.getDMs,
    enabled: hasUser,
    onSuccess: (dms) => {
      const dmUnread = dms.reduce((acc, curr) => {
        return {
          ...acc,
          [curr.user.id]: curr.lastMessage?.isUnread ?? false
        }
      }, {}) as Record<string, boolean>
      useAppStore.getState().setDMUnread(dmUnread)
    }
  })
}
