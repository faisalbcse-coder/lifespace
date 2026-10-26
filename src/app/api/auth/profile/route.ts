import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { UpdateProfileSchema } from "@/lib/validators";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return apiError("Unauthorized", 401);
  }

  const [user, totalSections, totalTasks, completedTasks] = await Promise.all([
    db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        fatherName: true,
        motherName: true,
        phone: true,
        address: true,
        permanentAddress: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        occupation: true,
        bio: true,
        emergencyContact: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.section.count({
      where: { userId: currentUser.id, isArchived: false },
    }),
    db.sectionItem.count({
      where: { userId: currentUser.id, isArchived: false },
    }),
    db.sectionItem.count({
      where: { userId: currentUser.id, isArchived: false, status: "DONE" },
    }),
  ]);

  if (!user) {
    return apiError("User not found", 404);
  }

  return apiSuccess({
    user,
    stats: {
      totalSections,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return apiError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid profile data", 400);
    }

    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        name: true,
        fatherName: true,
        motherName: true,
        phone: true,
        address: true,
        permanentAddress: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        occupation: true,
        bio: true,
        emergencyContact: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch {
    return apiError("Failed to update profile", 500);
  }
}
