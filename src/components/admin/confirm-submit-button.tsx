"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  children: ReactNode;
};

/** Submit button that asks before posting a destructive form action. */
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  onClick,
  ...rest
}: Props) {
  return (
    <button
      type="submit"
      {...rest}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
