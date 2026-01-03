
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useAuth, useFirestore } from "@/firebase";

interface UserSignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const formSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type UserFormValue = z.infer<typeof formSchema>

export function UserSignUpForm({ className, ...props }: UserSignUpFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(data: UserFormValue) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        // Use a generic placeholder avatar on signup
        const placeholderAvatar = `https://picsum.photos/seed/${data.username}/200/200`;
        
        await updateProfile(user, {
            displayName: data.username,
            photoURL: placeholderAvatar,
        });
          
        const userProfile = {
          id: user.uid,
          email: user.email,
          username: data.username,
          fullName: data.fullName,
          photoURL: placeholderAvatar,
          highestWPM: 0,
          gamesPlayed: 0,
          createdAt: new Date().toISOString(),
        };

        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, userProfile, { merge: true });

        toast({
          title: "Account Created",
          description: "You have been successfully signed up.",
        });
        router.push('/game');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                id="fullName"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading}
                {...register("fullName")}
                />
                {errors?.fullName && (
                <p className="px-1 text-xs text-destructive">
                    {errors.fullName.message}
                </p>
                )}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                id="username"
                placeholder="johndoe"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                disabled={isLoading}
                {...register("username")}
                />
                {errors?.username && (
                <p className="px-1 text-xs text-destructive">
                    {errors.username.message}
                </p>
                )}
            </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              disabled={isLoading}
              {...register("password")}
            />
             {errors?.password && (
              <p className="px-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
           <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              disabled={isLoading}
              {...register("confirmPassword")}
            />
             {errors?.confirmPassword && (
              <p className="px-1 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Sign Up
          </Button>
        </div>
      </form>
    </div>
  )
}

    