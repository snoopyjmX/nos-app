export interface MemoryItem {
  id: string;
  couple_id: string;
  title: string;
  memory_date: string;
  image_url: string;
  thumb_path?: string | null;
  displayUrl?: string;
  displayThumbUrl?: string;
  created_at: string;
  created_by?: string;
}

export interface MemberProfile {
  name: string;
  push_token?: string | null;
}
