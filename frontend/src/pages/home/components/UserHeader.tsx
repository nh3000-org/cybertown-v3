import { Button } from "@/components/ui/button"
import { getGoogleOAuthURL } from "@/lib/utils"
import { Logout } from "@/pages/home/components/Logout"
import { useAppStore } from "@/stores/appStore"

export function UserHeader() {
  const user = useAppStore().user
  return (
    <div className="flex">
      {user ? <Logout user={user} /> :
        <Button className="px-6 ml-auto" onClick={() => {
          window.location.href = getGoogleOAuthURL()
        }}>Login</Button>}
    </div>
  )
}
