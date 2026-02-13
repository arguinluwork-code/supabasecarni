import type { SyncLog } from '../../types/database';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncPullPayload {
  elapsed: number;
  counts: {
    taxes: number;
    categories: number;
    posCategories: number;
    products: number;
  };
  message: string;
}

export interface SyncPushPayload {
  successCount: number;
  errorCount: number;
  message: string;
}

export type SyncLogEntry = SyncLog;