import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-mint text-white hover:bg-emerald-700",
    secondary: "bg-white text-ink border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-ink hover:bg-slate-100"
  };

  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
