import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="focus-ring min-h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="focus-ring min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="focus-ring min-h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      {...props}
    />
  );
}
