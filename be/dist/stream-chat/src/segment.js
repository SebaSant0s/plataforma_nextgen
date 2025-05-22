"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segment = void 0;
class Segment {
    constructor(client, type, id, data) {
        this.client = client;
        this.type = type;
        this.id = id;
        this.data = data;
    }
    async create() {
        const body = {
            name: this.data?.name,
            filter: this.data?.filter,
            description: this.data?.description,
            all_sender_channels: this.data?.all_sender_channels,
            all_users: this.data?.all_users,
        };
        return this.client.createSegment(this.type, this.id, body);
    }
    verifySegmentId() {
        if (!this.id) {
            throw new Error('Segment id is missing. Either create the segment using segment.create() or set the id during instantiation - const segment = client.segment(id)');
        }
    }
    async get() {
        this.verifySegmentId();
        return this.client.getSegment(this.id);
    }
    async update(data) {
        this.verifySegmentId();
        return this.client.updateSegment(this.id, data);
    }
    async addTargets(targets) {
        this.verifySegmentId();
        return this.client.addSegmentTargets(this.id, targets);
    }
    async removeTargets(targets) {
        this.verifySegmentId();
        return this.client.removeSegmentTargets(this.id, targets);
    }
    async delete() {
        this.verifySegmentId();
        return this.client.deleteSegment(this.id);
    }
    async targetExists(targetId) {
        this.verifySegmentId();
        return this.client.segmentTargetExists(this.id, targetId);
    }
    async queryTargets(filter = {}, sort = [], options = {}) {
        this.verifySegmentId();
        return this.client.querySegmentTargets(this.id, filter, sort, options);
    }
}
exports.Segment = Segment;
