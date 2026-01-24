export interface ThreadReport {
  id: number;
  thread_id: number;
  reporter_id: number;
  reason: string | null;
  status: 'open' | 'reviewed' | 'dismissed' | 'actioned';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  resolution_note: string | null;
  thread_title?: string | null;
  thread_author_name?: string | null;
}
