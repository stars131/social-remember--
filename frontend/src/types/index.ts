export interface Contact {
  id?: number;
  name: string;
  type: '同学' | '同事' | '老师' | '领导' | '朋友' | '家人' | '其他';
  relationship_level?: '亲密' | '熟悉' | '一般' | '疏远';
  gender?: '男' | '女' | '其他' | '未知';
  birthday?: string;
  age?: number;
  phone?: string;
  email?: string;
  wechat?: string;
  qq?: string;
  company?: string;
  position?: string;
  address?: string;
  hometown?: string;
  tags?: string;
  notes?: string;
  avatar?: string;
  group_id?: number;
  pinyin?: string;
  is_favorite?: number;
  is_pinned?: number;
  last_contact_date?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface ContactPhoto {
  id?: number;
  contact_id: number;
  filename: string;
  original_name?: string;
  description?: string;
  created_at?: string;
}

export interface ContactGroup {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
}

export interface Activity {
  id?: number;
  title: string;
  activity_type: string;
  activity_date: string;
  location?: string;
  description?: string;
  notes?: string;
  created_at?: string;
  participants?: ActivityParticipant[];
  photos?: ActivityPhoto[];
}

export interface ActivityParticipant {
  id?: number;
  activity_id: number;
  contact_id: number;
  contact_name?: string;
  contact_avatar?: string;
  role?: string;
  notes?: string;
}

export interface ActivityPhoto {
  id?: number;
  activity_id: number;
  filename: string;
  original_name?: string;
  description?: string;
  created_at?: string;
}

export interface Gift {
  id?: number;
  contact_id: number;
  contact_name?: string;
  gift_type: 'sent' | 'received';
  gift_name: string;
  gift_date: string;
  occasion?: string;
  value?: number;
  notes?: string;
  created_at?: string;
}

export interface Reminder {
  id?: number;
  contact_id?: number;
  contact_name?: string;
  reminder_type: string;
  title: string;
  reminder_date: string;
  is_read?: number;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Statistics {
  totalContacts: number;
  favoriteCount: number;
  typeStats: { type: string; count: number }[];
  relationshipStats: { relationship_level: string; count: number }[];
  genderStats: { gender: string; count: number }[];
  groupStats: { name: string; color: string; count: number }[];
  recentContacts: Contact[];
  upcomingBirthdays: Contact[];
}

export const CONTACT_TYPES = ['同学', '同事', '老师', '领导', '朋友', '家人', '其他'] as const;
export const RELATIONSHIP_LEVELS = ['亲密', '熟悉', '一般', '疏远'] as const;
export const GENDERS = ['男', '女', '其他', '未知'] as const;
export const ACTIVITY_TYPES = ['聚餐', '旅游', '会议', '庆祝', '运动', '其他'] as const;
export const GIFT_TYPES = ['sent', 'received'] as const;

export const TYPE_COLORS: Record<string, string> = {
  '同学': 'blue',
  '同事': 'green',
  '老师': 'purple',
  '领导': 'red',
  '朋友': 'orange',
  '家人': 'pink',
  '其他': 'default',
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  '亲密': 'red',
  '熟悉': 'orange',
  '一般': 'blue',
  '疏远': 'default',
};

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  '聚餐': 'orange',
  '旅游': 'green',
  '会议': 'blue',
  '庆祝': 'red',
  '运动': 'cyan',
  '其他': 'default',
};
