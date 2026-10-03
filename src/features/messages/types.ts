export interface Message {
  id: string;
  couple_id: string;
  created_by: string;
  content: string;
  created_at: string;
  sending?: boolean;
}

export interface UserProfile {
  name: string;
  avatar_url?: string | null;
  push_token?: string | null;
}
