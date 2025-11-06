export type CorrespondenceType = 'incoming' | 'outgoing';

export interface Correspondence {
  id: string;
  number: string;
  type: CorrespondenceType;
  subject: string;
  from: string;
  date: string;
  content: string;
  attachments?: string[];
  notes?: string;
  received_by?: string;
  received_at?: string;
  received_by_profile?: {
    full_name: string;
    email: string;
  };
}
