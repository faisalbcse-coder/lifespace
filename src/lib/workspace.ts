import { db } from "./db";
import { logger } from "./logger";

export const DEFAULT_SECTIONS = [
  { name: "Current", orderIndex: 0, color: "indigo" },
  { name: "Next", orderIndex: 1, color: "blue" },
  { name: "Skill", orderIndex: 2, color: "emerald" },
  { name: "Project Parking", orderIndex: 3, color: "amber" },
  { name: "Daily", orderIndex: 4, color: "rose" },
];

/**
 * Idempotently initializes the default 5 sections and default preferences for a brand new user.
 * Once a workspace has been initialized, deleted sections will NEVER be recreated automatically.
 */
export async function ensureWorkspaceInitialized(userId: string) {
  try {
    return await db.$transaction(async (tx) => {
      // 1. Check if user already has preferences (signifies workspace was already initialized)
      const existingPref = await tx.userPreference.findUnique({
        where: { userId },
      });

      // 2. Fetch any existing sections for this user
      const existingSections = await tx.section.findMany({
        where: { userId },
        select: { id: true, name: true, orderIndex: true },
      });

      // If preferences exist or user already has sections, this workspace is already initialized.
      // Do NOT resurrect sections that the user explicitly deleted.
      if (existingPref || existingSections.length > 0) {
        if (!existingPref) {
          await tx.userPreference.create({
            data: {
              userId,
              theme: "system",
              density: "compact",
              showArchived: false,
              seeMoreExpanded: false,
            },
          });
        }
        return {
          initializedCount: 0,
          totalSections: existingSections.length,
        };
      }

      // Brand new workspace initialization: create preferences & default 5 sections
      await tx.userPreference.create({
        data: {
          userId,
          theme: "system",
          density: "compact",
          showArchived: false,
          seeMoreExpanded: false,
        },
      });

      const createdSections = [];
      let currentOrder = 0;

      for (const def of DEFAULT_SECTIONS) {
        const newSection = await tx.section.create({
          data: {
            userId,
            name: def.name,
            color: def.color,
            orderIndex: currentOrder++,
            collapsed: false,
            isArchived: false,
            isHidden: false,
          },
        });
        createdSections.push(newSection);
      }

      if (createdSections.length > 0) {
        logger.info("Initialized default sections for workspace", {
          userId,
          count: createdSections.length,
        });
      }

      return {
        initializedCount: createdSections.length,
        totalSections: createdSections.length,
      };
    });
  } catch (error) {
    logger.error("Failed to initialize workspace", error, { userId });
    throw error;
  }
}
