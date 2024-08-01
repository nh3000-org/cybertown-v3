import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getGoogleOAuthURL } from "@/lib/utils"
import { useAppStore } from "@/stores/appStore"

export function LoginAlert() {
  const showLoginAlert = useAppStore().showLoginAlert
  const setShowLoginAlert = useAppStore().setShowLoginAlert

  return (
    <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
      <AlertDialogTrigger asChild>
        <div />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You need to be logged in to do this</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            window.location.href = getGoogleOAuthURL()
          }}>Log In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
