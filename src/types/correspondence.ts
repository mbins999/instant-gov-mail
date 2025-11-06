export type CorrespondenceType = 'incoming' | 'outgoing';

export interface Correspondence {
  id: string;
  number: string;
  type: CorrespondenceType;
  subject: string;
  from: string;
  recipient: string;
  date: Date;
  content: string;
  attachments?: string[];
  notes?: string;
}
