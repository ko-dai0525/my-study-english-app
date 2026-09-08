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

// クイズの自己判定 1 回分の記録
export interface QuizResult {
  id: string;
  wordId: string;
  direction: Direction;
  correct: boolean;
  answeredAt: number;
}
