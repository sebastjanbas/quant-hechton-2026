import {SignInCard} from "@/components/auth/sign-in-card";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";


export default async function SignInPage() {

  const session = await auth.api.getSession({ headers: await headers()})
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="h-screen w-full flex flex-row justify-center items-center p-5">
      <img className="h-full w-full object-cover absolute -z-10" src="/signinphoto.jpg" alt="Photo of houses aranged in a hexagon with a blue sky in the middle" />
      <SignInCard />
    </div>
  )
}
