"use client";

import { FC, PropsWithChildren } from "react";
import { Toast } from "@heroui/react";

const RootProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      {children}
      <Toast.Provider maxVisibleToasts={4} placement="top" />
    </>
  );
};

export default RootProvider;
