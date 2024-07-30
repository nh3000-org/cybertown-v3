import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@/App.tsx'
import { QueryClientProvider } from 'react-query'
import { queryClient } from '@/lib/utils'
import '@/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
