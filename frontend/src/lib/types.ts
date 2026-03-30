export const STATUSES = [
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof STATUSES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ApplicationNote = {
  id: string;
  content: string;
  createdAt: string;
};

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  referral: boolean;
  referrerName: string | null;
  appliedDate: string;
  status: ApplicationStatus;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: ApplicationNote[];
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  read: boolean;
  createdAt: string;
};
