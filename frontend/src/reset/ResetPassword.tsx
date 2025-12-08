import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resetPassword } from "@/lib/api"; // FIXED import
import { useSearchParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [params] = useSearchParams();
  const token = params.get("token");

  const { openLoginModal } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token.");
      console.log("TOKEN",token);
      return;
    }

    if (!password || !confirm) {
      toast.error("Please fill both password fields");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword(token, password); // FIXED CALL
      toast.success(res.message || "Password updated!");

      openLoginModal("student"); // FIXED

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow rounded bg-white">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="New Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Confirm Password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button disabled={loading} type="submit" className="w-full">
          {loading ? "Updating..." : "Reset Password"}
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

export default ResetPassword;
