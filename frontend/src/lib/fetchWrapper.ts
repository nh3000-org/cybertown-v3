import { APIError } from "./utils"

type Wrap<T extends string, D> = {
  [Key in T]: D
}

type PromiseWrap<T extends string, D> = Promise<Wrap<T, D>>

export async function fetchWrapper<K extends string, D>(url: string, options: RequestInit = {}): PromiseWrap<K, D> {
  const resp = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // it is assumed that the api we are interacting always returns json
  const data = await resp.json()

  if (!resp.ok) {
    let errors: Record<string, any> = {}
    if ("errors" in data) {
      errors = data.errors
    }
    const message = `received status code: ${resp.status}`
    const err = new APIError(message, resp.status, errors)
    throw err
  }

  return data
}
