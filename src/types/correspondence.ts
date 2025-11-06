export type CorrespondenceType = 'incoming' | 'outgoing';
export type CorrespondenceStatus = 'pending' | 'in-progress' | 'completed' | 'archived';

export interface Correspondence {
  id: string;
  number: string;
  type: CorrespondenceType;
  subject: string;
  from: string;
  to: string;
  date: Date;
  status: CorrespondenceStatus;
  content: string;
  attachments?: string[];
  notes?: string;
}
