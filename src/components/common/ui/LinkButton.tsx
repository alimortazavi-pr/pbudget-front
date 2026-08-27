import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@heroui/styles";

type ButtonVariantOptions = NonNullable<Parameters<typeof buttonVariants>[0]>;

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className" | "children"> &
  Pick<ButtonVariantOptions, "fullWidth" | "isIconOnly" | "size" | "variant"> & {
    children: ReactNode;
    className?: string;
  };

export function LinkButton({
  children,
  className,
  fullWidth,
  isIconOnly,
  size,
  variant,
  ...linkProps
}: LinkButtonProps) {
  return (
    <Link
      {...linkProps}
      className={buttonVariants({
        className,
        fullWidth,
        isIconOnly,
        size,
        variant,
      })}
    >
      {children}
    </Link>
  );
}
