import { StreamChat } from './client';
import { CampaignData, DefaultGenerics, ExtendableGenerics, GetCampaignOptions } from './types';
export declare class Campaign<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    id: string | null;
    data?: CampaignData;
    client: StreamChat<StreamChatGenerics>;
    constructor(client: StreamChat<StreamChatGenerics>, id: string | null, data?: CampaignData);
    create(): Promise<{
        campaign: import("./types").CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & import("./types").APIResponse>;
    verifyCampaignId(): void;
    start(options?: {
        scheduledFor?: string;
        stopAt?: string;
    }): Promise<{
        campaign: import("./types").CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & import("./types").APIResponse>;
    update(data: Partial<CampaignData>): Promise<{
        campaign: import("./types").CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    }>;
    delete(): Promise<import("./types").APIResponse>;
    stop(): Promise<{
        campaign: import("./types").CampaignResponse;
    }>;
    get(options?: GetCampaignOptions): Promise<{
        campaign: import("./types").CampaignResponse;
        users: {
            next?: string;
            prev?: string;
        };
    } & import("./types").APIResponse>;
}
//# sourceMappingURL=campaign.d.ts.map