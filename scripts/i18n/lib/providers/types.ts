export type TranslationUnit = {
  key: string;
  source: string;
  /** Optional context for providers */
  context?: string;
};

export type TranslationBatch = {
  locale: string;
  units: TranslationUnit[];
};

export type TranslatedUnit = {
  key: string;
  source: string;
  target: string;
};

export type TranslationBatchResult = {
  locale: string;
  units: TranslatedUnit[];
  provider: string;
  estimatedCostUsd?: number;
};

export type TranslationProvider = {
  readonly id: string;
  readonly configured: boolean;
  translateBatch(input: TranslationBatch): Promise<TranslationBatchResult>;
  estimateCostUsd?(charCount: number): number | undefined;
};
