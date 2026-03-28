"use client"
import {useState} from 'react'
import {IconBrandGithub, IconBrandGoogleFilled, IconLoader2, IconTriangleFilled} from "@tabler/icons-react";
import {authClient, validateEmail} from "@/lib/auth-client";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {checkUserByEmail} from "@/app/actions/auth";
import {useRouter} from "next/navigation";


export function SignInCard() {

  // State variable set-up
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [stage, setStage] = useState(0)
  const [existingUser, setExistingUser] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  // Title set-up depending on sign-in card stage
  const title = [
    "Welcome to OpenCare",
    "Create your account",
    "Enter your password"
  ]

  // Description set-up depending on sign-in card stage
  const description = [
    "Please choose one of the options to continue",
    "Welcome! Please fill in the details to get started",
    "Enter the password associated with your account"
  ]

  // Helper function to decide if a user should be signed-in or signed-up
  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)

    const {message, valid} = validateEmail(email) // validate email field
    setError(message)

    if (!valid) { // reject the email
      setLoading(false)
      return
    }

    // check the database for a user with this email (existing user)
    const response = await checkUserByEmail(email)
    if (response.data.length > 0){
      setExistingUser(true)
      setStage(2) // user exists -> only need to add the password
    } else {
      setStage(1) // registering new user -> needs to add a name and a password
    }

    setLoading(false)
  }


  // Function to sign-in or sign-up the user depending on the user state
  async function handleSignIn(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Calling the correct function depending if a user exists
    const {data, error} = existingUser ? await authClient.signIn.email({
      email,
      password
    }) : await authClient.signUp.email({email, password, name: firstName + " " + lastName})

    setLoading(false)

    if (error) {
      setError(error.message || 'Sign in failed')
    } else if (data) {
      router.push('/dashboard') // after successful sign-in/sign-up redirect to /dashboard
    }
  }

  const AuthForm = () => {
    switch (stage) {
      case 0: // First check for the users email
        return (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/90"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="gap-3 mt-2"
            >
              {loading ? (
                <IconLoader2 className="animate-spin"/>
              ) : (
                <>
                  <span>Continue</span>
                  <IconTriangleFilled className="rotate-90 size-2 text-background/50"/>
                </>
              )}
            </Button>
          </form>
        )
      case 1: // User does not exist -> needs to add name and password to sign-up
        return (
          <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-row gap-4">
                <div className="flex flex-col gap-1 justify-start flex-1">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                  <Input
                    id="firstName"
                    type="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="bg-white/90"
                  />
                </div>
                <div className="flex flex-col gap-1 justify-start flex-1">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                  <Input
                    id="lastName"
                    type="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="bg-white/90"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/90"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your passwrord"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white/90"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="gap-3 mt-2"
            >
              {loading ? (<IconLoader2 className="animate-spin"/>) : (
                <>
                  <span>Continue</span>
                  <IconTriangleFilled className="rotate-90 size-2 text-background/50"/>
                </>
              )}
            </Button>
          </form>
        )
      case 2: // User exists -> needs to add a password to sign-in
        return (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/90"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="gap-3 mt-2"
            >
              {loading ? (<IconLoader2 className="animate-spin"/>) : (
                <>
                  <span>Continue</span>
                  <IconTriangleFilled className="rotate-90 size-2 text-background/50"/>
                </>
              )}
            </Button>
          </form>
        )
    }
  }


  // Card component
  return (
    <Card className="w-full max-w-lg mx-auto rounded-3xl bg-white/75">
      <CardHeader className="w-full text-center">
        <CardTitle className="text-xl font-bold">{title[stage]}</CardTitle>
        <CardDescription>{description[stage]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2 md:gap-4 w-full">
          <Button disabled={loading} onClick={() => setError("Google OAuth2 currently not available")} variant="outline" className="flex-1 bg-white/90">
            <IconBrandGoogleFilled/>
            {loading ? (<IconLoader2 className="animate-spin" /> ) : "Google"}
          </Button>
          <Button disabled={loading} onClick={() => setError("Github OAuth2 currently not available")} variant="outline" className="flex-1 bg-white/90">
            <IconBrandGithub/>
            {loading ? (<IconLoader2 className="animate-spin" /> ) : "Github"}
          </Button>
        </div>
        <div className="w-full flex flex-row justify-between items-center my-6 gap-4 px-5">
          <div className="flex-1 w-auto h-px bg-border"></div>
          <span>or</span>
          <div className="flex-1 w-auto h-px bg-border"></div>
        </div>
        <div>
          {AuthForm()}  {/* AuthForm generates the form fields needed */}
        </div>
      </CardContent>
    </Card>
  )
}
