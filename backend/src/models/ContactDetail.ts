export interface ContactDetail {
  id?: number;
  contact_id: number;
  category: string;
  content: string;
  created_at?: string;
}

export interface SocialInteraction {
  id?: number;
  contact_id: number;
  interaction_date: string;
  interaction_type?: string;
  location?: string;
  notes?: string;
  follow_up_needed?: boolean;
  follow_up_date?: string;
  created_at?: string;
}

export interface ImportantDate {
  id?: number;
  contact_id: number;
  date_name: string;
  date_value: string;
  remind_before_days?: number;
  notes?: string;
  created_at?: string;
}
