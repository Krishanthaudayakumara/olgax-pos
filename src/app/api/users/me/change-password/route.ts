import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

    // Get user with password for verification
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password using bcryptjs (Better Auth's password hashing algorithm)
    const bcrypt = await import("bcryptjs");
    const isPasswordValid = await bcrypt.compare(
      parsed.currentPassword,
      user.password || ""
    );

    if (!isPasswordValid) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password with bcryptjs
    const hashedPassword = await bcrypt.hash(parsed.newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return Response.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error changing password:", error);
    return Response.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
