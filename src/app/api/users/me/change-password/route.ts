import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((pwd) => pwd !== "", "New password is required"),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);

    // Call Better Auth server-side API to change user's password.
    // This automatically verifies the current password and hashes the new password using scrypt.
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
      },
      headers: await headers(),
    });

    return Response.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error changing password:", error);
    return Response.json(
      { error: error.message || "Failed to change password" },
      { status: 400 }
    );
  }
}
