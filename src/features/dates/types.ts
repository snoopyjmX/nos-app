import { Feather } from '@expo/vector-icons';

export interface SpecialDate {
  id: string;
  couple_id: string;
  title: string;
  category: string;
  event_date: string;
  created_by?: string;
  created_at: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
}
