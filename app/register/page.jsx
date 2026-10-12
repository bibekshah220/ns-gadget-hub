"use client";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import AuthShell, { AuthField, AuthLink, AuthSubmit } from "@/components/AuthShell";
import PasswordRules from "@/components/PasswordRules";

const Register = () => {
  const { fetchUserData, router } = useAppContext();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirm) {
      toast.error("The two passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (data.success) {
        await fetchUserData();
        toast.success("Account created");
        router.push("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create the account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      subtitle="Pick a password you do not use anywhere else."
      footer={
        <span>
          Already registered? <AuthLink href="/login">Sign in</AuthLink>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Full name"
          required
          maxLength={80}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <div>
          <AuthField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <PasswordRules value={form.password} />
        </div>
        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
        <AuthSubmit disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default Register;
