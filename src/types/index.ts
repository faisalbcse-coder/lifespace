export type ItemStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type ItemPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ItemType = "TASK" | "NOTE" | "PROJECT" | "HABIT" | "SKILL";

export interface SubTask {
  id: string;
  itemId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
}

export type AttachmentType = "PDF" | "IMAGE" | "LINK" | "FILE";

export interface ItemAttachment {
  id: string;
  itemId: string;
  type: AttachmentType;
  title: string;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface ProgressLog {
  id: string;
  itemId: string;
  note: string;
  progressSnapshot: number | null;
  createdAt: string;
}

export type SectionKind = "TASK" | "GOAL";

export interface SubGoal {
  id: string;
  goalId: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  orderIndex: number;
  collapsed: boolean;
  createdAt: string;
  updatedAt: string;
  tasks?: Item[];
  progress?: number | null;
  totalTasks?: number;
  completedTasks?: number;
}

/** Target is the user-facing alias for SubGoal */
export type Target = SubGoal;

export interface Item {
  id: string;
  sectionId: string;
  userId: string;
  title: string;
  description: string | null;
  content?: string | null;
  progress: number;
  scheduledDate: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  rolloverCount: number;
  status: ItemStatus;
  priority: ItemPriority;
  itemType: string;
  metadata: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  /** Goal hierarchy associations */
  subGoalId?: string | null;
  subGoal?: {
    id: string;
    title: string;
    goal?: { id: string; title: string };
  } | null;
  subGoals?: SubGoal[];
  section?: { id: string; name: string; color: string | null; type?: SectionKind };
  /** Lightweight indicators included by the sections endpoint */
  subTasks?: Pick<SubTask, "id" | "isCompleted">[];
  logs?: ProgressLog[];
  _count?: { attachments: number; logs: number };
}

export interface ItemDetail extends Omit<Item, "subTasks" | "_count"> {
  section: { id: string; name: string; color: string | null; type?: SectionKind };
  subTasks: SubTask[];
  attachments: ItemAttachment[];
  logs: ProgressLog[];
  subGoals?: SubGoal[];
  goalProgress?: {
    totalTasks: number;
    completedTasks: number;
    percentage: number | null;
  };
}

export interface Section {
  id: string;
  userId: string;
  name: string;
  orderIndex: number;
  color: string | null;
  type?: SectionKind;
  collapsed: boolean;
  isArchived: boolean;
  isHidden: boolean;
  items: Item[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  address?: string | null;
  permanentAddress?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  occupation?: string | null;
  bio?: string | null;
  emergencyContact?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreference {
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable";
  showArchived: boolean;
  seeMoreExpanded: boolean;
}

export interface SectionCardSize {
  width?: number;
  height?: number;
  isFullWidth?: boolean;
}

