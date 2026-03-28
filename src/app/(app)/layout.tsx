import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

const AppLayout = ({ children }: { children: ReactNode }) => {
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
