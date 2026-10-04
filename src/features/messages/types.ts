export interface Message {
  id: string;
  couple_id: string;
  created_by: string;
  content: string;
  created_at: string;
  /** Bilhete intencional (Bilhete do Dia); false/ausente é recado normal de chat. */
  is_note: boolean;
  sending?: boolean;
}

export interface UserProfile {
  name: string;
  avatar_url?: string | null;
  push_token?: string | null;
}
