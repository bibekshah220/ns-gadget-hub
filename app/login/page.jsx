"use client";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import AuthShell, { AuthField, AuthLink, AuthSubmit } from "@/components/AuthShell";

const Login = () => {
  const { fetchUserData, router } = useAppContext();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/login", form);

      if (data.success) {
        await fetchUserData();
        toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);

        /* Only ever bounce to a path on this site. */
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use the email and password you registered with."
      footer={
        <div className="flex justify-between">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          <span>
            New here? <AuthLink href="/register">Create an account</AuthLink>
          </span>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <AuthSubmit disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default Login;
