import React, { PropsWithChildren } from "react";
import { NavBar } from "@/components/ui";

const BaseLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <NavBar></NavBar>
      <div className='py-16 bg-gray-50 min-h-screen overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 space-y-8 sm:px-6 lg:px-8'>{children}</div>
      </div>
    </>
  );
};

export default BaseLayout;
