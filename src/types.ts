export interface WordEntry {
  id: string;
  term: string;
  meaning: string;
  example?: string;
  createdAt: number;
  quizCount: number;
  correctCount: number;
  archived?: boolean;
}

export type Direction = 'enToJa' | 'jaToEn';
