// Store for table filters

import { SupastashFilter } from "../types/realtimeData.types";

export const tableFiltersUsed = new Set<string>();
export const filterTracker = new Map<string, SupastashFilter[]>();

export const tableFilters = new Map<string, SupastashFilter[]>();
