import { AlertCircle } from 'lucide-react'

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-bg text-fg text-center">
			<AlertCircle
				className="stroke-danger mb-2 h-12 w-12"
				aria-hidden="true"
			/>
			<h1 className="text-4xl font-bold">Page Not Found</h1>
			<p className="text-muted mt-3 max-w-[300px]">
				Hey, the page you trying to visit doesn't exist
			</p>
		</div>
	)
}
