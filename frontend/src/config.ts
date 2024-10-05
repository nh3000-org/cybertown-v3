export const config = {
	googleOAuth: {
		redirectURL: import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URL,
		clientID: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
		rootURL: import.meta.env.VITE_GOOGLE_OAUTH_ROOT_URL,
	},
	apiURL: import.meta.env.VITE_API_URL,
	googleProfileURL: import.meta.env.VITE_GOOGLE_PROFILE_URL,
	wsURL: import.meta.env.VITE_WS_URL,
	redirectURL: import.meta.env.VITE_REDIRECT_URL,
}
