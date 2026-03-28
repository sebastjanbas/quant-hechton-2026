import {ReactNode} from "react";


const AppLayout = ({children}: {children: ReactNode}) => {
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
