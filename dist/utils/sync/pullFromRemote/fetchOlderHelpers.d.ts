import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { SupastashError } from "../../errorHandler";
export declare const FetchOlderHelpers: {
    validateBoundaryTs({ boundaryTs, earliestDate, }: {
        boundaryTs: string;
        earliestDate: string;
    }): void;
    getLookbackDays({ table, filters, }: {
        table: string;
        filters?: SupastashFilter[];
    }): Promise<{
        createdAt: any;
        id: any;
    }>;
    fetchData({ table, filters, limit, earliestDate, boundaryTs, earliestId, }: {
        table: string;
        filters?: SupastashFilter[];
        limit: number;
        boundaryTs?: string;
        earliestDate: string;
        earliestId: string;
    }): Promise<any[]>;
    handleError(error: SupastashError): {
        hasMore: boolean;
        data: PayloadData[];
    };
    storeToDb({ table, data }: {
        table: string;
        data: PayloadData[];
    }): Promise<void>;
};
//# sourceMappingURL=fetchOlderHelpers.d.ts.map