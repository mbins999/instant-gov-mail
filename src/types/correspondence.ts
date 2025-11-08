// New database types based on the improved design

export interface Organization {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  entity_name: string;
  organization_id?: number;
  created_at: string;
  role?: 'admin' | 'user';
}

export interface Letter {
  id: number;
  ref_no: string;
  subject: string;
  body: string;
  greeting: string;
  sender_org_id: number;
  recipient_org_id?: number;
  status: 'draft' | 'sent' | 'received' | 'archived';
  created_by: number;
  received_by?: number;
  received_at?: string;
  signature_url?: string;
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  sender_org?: Organization;
  recipient_org?: Organization;
  creator?: User;
  receiver?: User;
  attachments?: Attachment[];
  comments?: Comment[];
  tasks?: Task[];
}

export interface Attachment {
  id: number;
  letter_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_at: string;
}

export interface LetterStatusHistory {
  id: number;
  letter_id: number;
  old_status?: string;
  new_status: string;
  changed_by: number;
  changed_at: string;
  changer?: User;
}

export interface Comment {
  id: number;
  letter_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: User;
}

export interface Task {
  id: number;
  letter_id: number;
  assigned_to: number;
  due_date?: string;
  status: 'open' | 'done' | 'late';
  notes?: string;
  created_at: string;
  completed_at?: string;
  assignee?: User;
}

// Legacy types for backward compatibility
export type CorrespondenceType = 'incoming' | 'outgoing';

export interface Correspondence {
  id: string;
  number: string;
  type: CorrespondenceType;
  subject: string;
  from: string;
  from_entity?: string;
  received_by_entity?: string;
  date: string;
  content: string;
  greeting?: string;
  responsible_person?: string;
  signature_url?: string;
  display_type?: 'content' | 'attachment_only';
  attachments?: string[];
  notes?: string;
  received_by?: string;
  received_at?: string;
  pdf_url?: string;
  received_by_profile?: {
    full_name: string;
    email: string;
  };
}
