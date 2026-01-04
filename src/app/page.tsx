'use client'

import { UserAuthForm } from "@/components/auth/UserAuthForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useUser } from "@/firebase"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if the user is definitively logged in and loading is complete.
    if (!isUserLoading && user) {
      router.push('/game')
    }
  }, [user, isUserLoading, router])

  // While checking auth state, show a loader. This prevents the login form from flashing.
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    )
  }
  
  // Only show the login form if the user is not logged in and auth check is complete.
  if (!user) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tighter">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <UserAuthForm />
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="underline text-primary">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // If user is logged in but the redirect hasn't happened yet, show a loader.
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
    </div>
  )
}
