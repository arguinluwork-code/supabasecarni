import type { DashboardStats } from '../../types/database';
import type { ApiResponse } from './sync';

export type DashboardStatsPayload = DashboardStats;
export type DashboardStatsResponse = ApiResponse<DashboardStatsPayload>;