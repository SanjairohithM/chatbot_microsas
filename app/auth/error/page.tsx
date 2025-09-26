"use client"

import { useSearchParams, useRouter } from "next/navigation"

export default function AuthErrorPage() {
  const params = useSearchParams()
  const router = useRouter()
  const error = params?.get("error")

  const message =
    error === "AccessDenied"
      ? "Access was denied by the provider. Check Google OAuth settings and env vars."
      : error === "OAuthAccountNotLinked"
      ? "This email is already linked with a different sign-in method."
      : error || "Unknown error"

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-3">Sign-in Error</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          onClick={() => router.replace("/auth")}
        >
          Back to Sign in
        </button>
      </div>
    </div>
  )
}


