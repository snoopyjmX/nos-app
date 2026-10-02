export interface RecentMemory {
  id: string;
  title: string;
  memory_date: string;
  image_url: string | null;
  displayUrl?: string | null;
}

export interface LatestMessage {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  isMe: boolean;
  authorName: string;
  authorAvatarUrl: string | null;
}

export interface NextMilestone {
  id: string;
  title: string;
  category: string;
  event_date: string;
  daysRemaining: number;
}

export interface AccumulatedTime {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  breakdownMonths: number;
  breakdownDays: number;
  breakdownHours: number;
}
