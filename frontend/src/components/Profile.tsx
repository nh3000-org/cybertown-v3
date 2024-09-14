import { useFollow } from "@/hooks/mutations/useFollow";
import { useProfile } from "@/hooks/queries/useProfile";
import { cn, queryClient } from "@/lib/utils";
import { LoadingIcon } from "@/pages/home/components/LoadingIcon";
import { useAppStore } from "@/stores/appStore";
import { User } from "@/types"
import * as Popover from '@radix-ui/react-popover';

type Props = {
  user: User
  style: Record<string, number>
  open: boolean
  setOpen: (open: boolean) => void
}

export function Profile(props: Props) {
  const { data: profile } = useProfile(props.user.id, props.open === true)
  const { mutateAsync: followMutate, isLoading } = useFollow()
  const user = useAppStore().user

  async function follow() {
    if (!profile || !user) {
      return
    }
    await followMutate({
      isFollowing: profile.isFollowing,
      followeeID: props.user.id
    })
    queryClient.invalidateQueries({
      queryKey: ['profile', props.user.id]
    })
  }

  return (
    <Popover.Root open={props.open} onOpenChange={props.setOpen}>
      <Popover.Trigger asChild>
        <img src={props.user.avatar} referrerPolicy="no-referrer" style={props.style} className="rounded-full" />
      </Popover.Trigger>
      <Popover.Content side="top" sideOffset={12} align="start" className="focus:outline-none rounded-lg p-4 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border">
        <div className="min-w-[230px]">
          <div className="flex items-center justify-between">
            <img className="w-16 h-16 rounded-full mb-4 relative top-2" src={props.user.avatar} referrerPolicy="no-referrer" />
            {user && profile && !profile.isMe && (
              <div>
                <button onClick={follow} disabled={isLoading} className={cn("px-4 py-1 rounded-md transition-colors duration-300 border border-accent bg-accent/30 text-accent-fg focus:ring-0 hover:bg-accent hover:text-white flex items-center gap-2 disabled:pointer-events-none", {
                  "border-danger bg-danger/10 text-danger hover:bg-danger hover:text-white": profile.isFollowing
                })}>
                  {isLoading && (
                    <LoadingIcon className={cn("fill-accent", {
                      "fill-white text-danger": profile.isFollowing
                    })} />
                  )}
                  <span>{profile.isFollowing ? 'Unfollow' : 'Follow'}</span>
                </button>
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
    </Popover.Root>
  )
}
