import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { QueryClient } from 'react-query'
import { config } from "@/config"

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
