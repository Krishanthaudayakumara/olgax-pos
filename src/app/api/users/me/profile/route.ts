import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
});

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, email } = validation.data;

    // Update user profile using Better Auth server-side API so that session/cookie cache is updated.
    // This will throw if the email is already in use by another user.
    await auth.api.updateUser({
      body: {
        ...(name && { name }),
        ...(email && { email }),
      },
      headers: await headers(),
    });

    // Fetch the updated user details to return to the client
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    return Response.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return Response.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
