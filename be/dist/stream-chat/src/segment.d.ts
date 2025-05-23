import { StreamChat } from './client';
import { DefaultGenerics, ExtendableGenerics, QuerySegmentTargetsFilter, SegmentData, SegmentResponse, SortParam } from './types';
type SegmentType = 'user' | 'channel';
type SegmentUpdatableFields = {
    description?: string;
    filter?: {};
    name?: string;
};
export declare class Segment<StreamChatGenerics extends ExtendableGenerics = DefaultGenerics> {
    type: SegmentType;
    id: string | null;
    client: StreamChat<StreamChatGenerics>;
    data?: SegmentData | SegmentResponse;
    constructor(client: StreamChat<StreamChatGenerics>, type: SegmentType, id: string | null, data?: SegmentData);
    create(): Promise<{
        segment: SegmentResponse;
    }>;
    verifySegmentId(): void;
    get(): Promise<{
        segment: SegmentResponse;
    } & import("./types").APIResponse>;
    update(data: Partial<SegmentUpdatableFields>): Promise<{
        segment: SegmentResponse;
    }>;
    addTargets(targets: string[]): Promise<import("./types").APIResponse>;
    removeTargets(targets: string[]): Promise<import("./types").APIResponse>;
    delete(): Promise<import("./types").APIResponse>;
    targetExists(targetId: string): Promise<import("./types").APIResponse>;
    queryTargets(filter?: QuerySegmentTargetsFilter | null, sort?: SortParam[] | null | [], options?: {}): Promise<{
        targets: import("./types").SegmentTargetsResponse[];
        next?: string;
    } & import("./types").APIResponse>;
}
export {};
//# sourceMappingURL=segment.d.ts.map