// Store for table filters

import { RealtimeFilter } from "../types/realtimeData.types";

export const tableFiltersUsed = new Set<string>();
export const filterTracker = new Map<string, RealtimeFilter[]>();

export const tableFilters = new Map<string, RealtimeFilter[]>();
