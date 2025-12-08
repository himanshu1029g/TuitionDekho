import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api";   // FIXED NAME
import { useUser } from "@/contexts/UserContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { openLoginModal } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await forgotPassword(email); // FIXED CALL
      toast.success(res.message || "Password reset link sent!");

      openLoginModal("student"); // FIXED

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow rounded bg-white">
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          required
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button disabled={loading} type="submit" className="w-full">
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p
        className="text-sm text-blue-600 mt-4 cursor-pointer"
        onClick={() => openLoginModal("student")}
      >
        Back to Login
      </p>
    </div>
  );
};

export default ForgotPassword;
