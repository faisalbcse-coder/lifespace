import { db } from "./db";

/** Returns the item only if it exists and belongs to the user; otherwise null. */
export async function getOwnedItem(itemId: string, userId: string) {
  const item = await db.sectionItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) return null;
  return item;
}
