"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChangePasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordForm({
  open,
  onOpenChange,
}: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!formData.newPassword) newErrors.newPassword = "New password is required";
    if (formData.newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.error === "object" && data.details) {
          // Zod validation errors
          const fieldErrors: Record<string, string> = {};
          (data.details as Array<{ path: string[]; message: string }>).forEach(
            (err) => {
              fieldErrors[err.path[0]] = err.message;
            }
          );
          setErrors(fieldErrors);
        } else {
          toast.error(data.error || "Failed to change password");
        }
        setIsLoading(false);
        return;
      }

      toast.success("Password changed successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Change Password</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder="Enter your current password"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder="Enter new password"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="Confirm new password"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium inline-flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
