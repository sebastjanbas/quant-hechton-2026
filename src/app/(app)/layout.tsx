import {ReactNode} from "react";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import { Sidebar } from "@/components/sidebar";


const AppLayout = async ({children}: {children: ReactNode}) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session){
    redirect("/sign-in")
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
