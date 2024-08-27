import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { QueryClient } from 'react-query'
import { config } from "@/config"
import { ZodError } from "zod"
import { Message } from '@/types/broadcast'
import { User } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: import.meta.env.DEV === false,
    }
  }
})

export function getGoogleOAuthURL() {
  const options = {
    redirect_uri: config.googleOAuth.redirectURL,
    client_id: config.googleOAuth.clientID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);

  return `${config.googleOAuth.rootURL}?${qs.toString()}`;
}

export function toHHMM(createdAt: string) {
  const date = new Date(createdAt);
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  } as const;
  const formattedTime = date.toLocaleString('en-US', options);
  return formattedTime;
}

export function scrollToMessage(id: string) {
  const el = document.getElementById(`message-${id}`)
  if (!el) {
    return
  }
  el.classList.add("blink-bg")
  el.scrollIntoView()
  setTimeout(() => {
    el.classList.remove("blink-bg")
  }, 1500)
}

export function flattenError(error: ZodError) {
  const fieldErrors = error.flatten().fieldErrors
  const errors: Record<string, string> = Object.entries(fieldErrors).reduce((acc, curr) => {
    const [key, value] = curr
    if (Array.isArray(value)) {
      return {
        ...acc,
        [key]: value[0],
      }
    }
    return acc
  }, {})
  return errors
}

export function getParticipantID(message: Message | undefined, me: User) {
  if (!message?.participant) {
    return undefined
  }
  if (message.participant.id === me.id) {
    return message.from.id
  }
  return message.participant.id
}

export class APIError extends Error {
  status: number
  errors: Record<string, any>

  constructor(message: string, status: number, errors: Record<string, any>) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.errors = errors
  }
}
