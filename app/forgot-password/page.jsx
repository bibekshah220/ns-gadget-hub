"use client";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AuthShell, { AuthField, AuthLink, AuthSubmit } from "@/components/AuthShell";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      toast.success(data.message);
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send the reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a link to set a new one. It expires in 30 minutes."
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      {sent ? (
        <p className="text-sm text-gray-600">
          If that email is registered, a reset link is on its way. Check the spam
          folder before trying again.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthSubmit disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </AuthSubmit>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
