import { useFollow } from "@/hooks/mutations/useFollow";
import { useProfile } from "@/hooks/queries/useProfile";
import { cn, queryClient } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { User } from "@/types"
import * as Popover from '@radix-ui/react-popover';
import { useState } from "react";

type Props = {
  user: User
  style: Record<string, number>
}

export function Profile(props: Props) {
  const [open, setOpen] = useState(false)
  const { data: profile } = useProfile(props.user.id, open)
  const { mutateAsync: followMutate } = useFollow()
  const user = useAppStore().user

  return (
    <Popover.Root>
      <Popover.Trigger asChild onClick={() => setOpen(true)}>
        <img src={props.user.avatar} referrerPolicy="no-referrer" style={props.style} className="rounded-full" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" sideOffset={12} align="start" className="focus:outline-none rounded-lg p-4 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border">
          <div className="min-w-[230px]">
            <div className="flex items-center justify-between">
              <img className="w-16 h-16 rounded-full mb-4 relative top-2" src={props.user.avatar} referrerPolicy="no-referrer" />
              {user && profile && !profile.isMe && (
                <div>
                  <button onClick={async () => {
                    await followMutate({
                      isFollowing: profile.isFollowing,
                      followeeID: props.user.id
                    })
                    const queryKeys = [
                      ['profile', props.user.id],
                      ['profile', user.id]
                    ]
                    queryKeys.forEach(queryKey => {
                      queryClient.invalidateQueries({
                        queryKey
                      })
                    })
                  }} className={cn("px-4 py-1 rounded-md transition-colors duration-300 border border-accent bg-accent/30 text-accent-fg focus:ring-0 hover:bg-accent hover:text-white", {
                    "border-danger bg-danger/10 text-danger hover:bg-danger hover:text-white": profile.isFollowing
                  })}>{profile.isFollowing ? 'Unfollow' : 'Follow'}</button>
                </div>
              )}
            </div>
            <p className="font-bold mb-6">{props.user.username}</p>
            {profile && (
              <div className="flex items-center gap-4">
                <p className="font-medium">{profile.followingCount} <span className="text-muted">Following</span></p>
                <p className="font-medium">{profile.followersCount} <span className="text-muted">Followers</span></p>
                <p className="font-medium">{profile.friendsCount} <span className="text-muted">Friends</span></p>
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
