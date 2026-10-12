"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import AuthShell, { AuthField, AuthLink, AuthSubmit } from "@/components/AuthShell";
import PasswordRules from "@/components/PasswordRules";

const ResetPassword = () => {
  const { router } = useAppContext();
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  /* Read from the URL on the client so the page needs no Suspense boundary. */
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirm) {
      toast.error("The two passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/reset-password", {
        token,
        password: form.password,
      });

      if (data.success) {
        toast.success(data.message);
        router.push("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset the password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Signing in again will be required on every device."
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      {token ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <AuthField
              label="New password"
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
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
          <AuthSubmit disabled={submitting}>
            {submitting ? "Saving..." : "Update password"}
          </AuthSubmit>
        </form>
      ) : (
        <p className="text-sm text-gray-600">
          This page needs the link from the reset email.{" "}
          <AuthLink href="/forgot-password">Request a new one</AuthLink>.
        </p>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
