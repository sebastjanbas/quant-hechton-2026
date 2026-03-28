import {ReactNode} from "react";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";


const AppLayout = async ({children}: {children: ReactNode}) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session){
    redirect("/sign-in")
  }

  return (
    <div>
      LAYOUT
      <div>
        {children}
      </div>
    </div>
  );
};
export default AppLayout;
