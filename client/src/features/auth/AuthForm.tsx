import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Field, Input } from "../../components/Field";
import { ApiError } from "../../lib/api";
import { useAuth } from "./AuthProvider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") await signup(name, email, password);
      else await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cloud px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{mode === "signup" ? "Create account" : "Log in"}</h1>
          <p className="mt-1 text-sm text-slate-600">Track shared expenses with small groups.</p>
        </div>
        <div className="grid gap-4">
          {mode === "signup" && (
            <Field label="Name">
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
          )}
          <Field label="Email">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Working..." : mode === "signup" ? "Sign up" : "Log in"}
          </Button>
          <p className="text-center text-sm text-slate-600">
            {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
            <Link className="font-semibold text-mint" to={mode === "signup" ? "/login" : "/signup"}>
              {mode === "signup" ? "Log in" : "Sign up"}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
