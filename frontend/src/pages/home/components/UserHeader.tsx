import { Button } from "@/components/ui/button"
import { useMe } from "@/hooks/queries/useMe"
import { getGoogleOAuthURL } from "@/lib/utils"
import { Logout } from "@/pages/home/components/Logout"

export function UserHeader() {
  const { data: user, isLoading } = useMe()

  if (isLoading) {
    return null
  }

  return (
    <div className="flex">
      {user ? <Logout user={user} /> :
        <Button className="px-6 ml-auto" onClick={() => {
          window.location.href = getGoogleOAuthURL()
        }}>Login</Button>}
    </div>
  )
}
