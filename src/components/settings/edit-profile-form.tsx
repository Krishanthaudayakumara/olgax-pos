"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string | null;
    email: string;
  };
  onSuccess?: (updatedUser: { name: string | null; email: string }) => void;
}

export function EditProfileForm({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
          toast.error(data.error || "Failed to update profile");
        }
        setIsLoading(false);
        return;
      }

      toast.success("Profile updated successfully");
      onOpenChange(false);
      onSuccess?.(data.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Edit Profile</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
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
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
