
export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'legendary';

export interface LocalAnalysis {
  entropy: number;
  crackingTime: string;
  tips: string[];
}

export interface PasswordHistoryItem {
  id: string;
  value: string;
  createdAt: number;
}
