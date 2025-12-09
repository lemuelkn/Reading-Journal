export enum EntryType {
  BOOK = 'Book',
  ARTICLE = 'Article',
  SUBSTACK = 'Substack',
  PAPER = 'Research Paper',
  OTHER = 'Other'
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  type: EntryType;
  content: string;
  url?: string;
  tags: string[];
  ai_summary?: string;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface EntryFormData {
  title: string;
  author: string;
  type: EntryType;
  content: string;
  url: string;
  tags: string[];
  ai_summary: string;
  cover_image?: string;
}

export interface AiAnalysisResult {
  summary: string;
  tags: string[];
}