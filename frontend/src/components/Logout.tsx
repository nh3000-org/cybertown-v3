import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLogout } from "@/hooks/mutations/useLogout"
import { User } from "@/types"
import { Button } from "@/components/ui/button"

type Props = {
  user: User
}

export function Logout(props: Props) {
  const { user } = props
  const { mutate: logout } = useLogout()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild className="ml-auto">
        <Button className="gap-4" variant="outline">
          <img referrerPolicy="no-referrer" alt="avatar" className="w-8 h-8 rounded-full" src={user.avatar} />
          <span>{user.username}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Do you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>
            Before logging out, think of your friends that you made in cybertown
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>I changed my mind</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            logout()
          }}>Log me out!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
