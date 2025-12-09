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
  created_at?: string;
  updated_at?: string;
}

export interface ContactFilter {
  type?: string;
  relationship_level?: string;
  search?: string;
  page?: number;
  limit?: number;
}
