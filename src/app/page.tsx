
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
    if (!isUserLoading && user) {
      router.push('/game')
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    )
  }
  
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
