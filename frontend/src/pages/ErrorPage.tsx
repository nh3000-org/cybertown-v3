import { XCircle } from "lucide-react"

export function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-fg text-center">
      <XCircle className="stroke-danger mb-2 h-12 w-12" aria-hidden="true" />
      <h1 className="text-4xl font-bold">Error Occured</h1>
      <p className="text-muted mt-3 max-w-[300px]">Encountered an unexpected error, try refreshing the page</p>
    </div>
  )
}

