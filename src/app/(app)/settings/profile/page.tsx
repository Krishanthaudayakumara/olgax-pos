"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { useSession } from "@better-auth/react";

export default function ProfilePage() {
  const session = useSession();
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (!session.data?.user) {
    return <div>Loading...</div>;
  }

  const user = session.data.user;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Account Information</h2>
          <p className="text-sm text-muted-foreground">Your personal account details</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-base font-medium">{user.name || "(Not set)"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-base font-medium">{user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <div className="mt-1">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === "ADMIN"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Password</h3>
            <p className="text-sm text-muted-foreground">Change your password regularly for security</p>
          </div>
          <Button onClick={() => setPasswordOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <ChangePasswordForm
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
