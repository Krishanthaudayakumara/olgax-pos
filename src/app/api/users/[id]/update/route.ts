import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["ADMIN", "CASHIER"]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return Response.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.parse(body);

    // Prevent self-demotion from admin
    if (parsed.role && parsed.role !== "ADMIN" && session.user.id === id) {
      return Response.json(
        { error: "Cannot demote yourself from admin role" },
        { status: 400 }
      );
    }

    // If changing email, check for duplicates
    if (parsed.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: parsed.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return Response.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.email && { email: parsed.email }),
      },
    });

    // Update role if provided
    if (parsed.role) {
      await db.userRole.updateMany({
        where: { userId: id },
        data: { role: parsed.role },
      });
    }

    return Response.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: parsed.role,
        updatedAt: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return Response.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
