class AABB {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    distance(pos) {
        var dx = Math.max(this.min.x - pos.x, 0, pos.x - this.max.x);
        var dy = Math.max(this.min.y - pos.y, 0, pos.y - this.max.y);
        return Math.sqrt(dx*dx + dy*dy);
    }

    static fromPositions(positions) {
        let min = Vec2.MAX_VALUE;
        let max = Vec2.MIN_VALUE;

        for (let p of positions) {
            min = Vec2.min(min, p);
            max = Vec2.max(max, p);
        }

        return new AABB(min, max);
    }

    static fromAABB(aabbs) {
        let min = Vec2.MAX_VALUE;
        let max = Vec2.MIN_VALUE;

        for (let s of aabbs) {
            min = Vec2.min(min, s.min);
            max = Vec2.max(max, s.max);
        }

        return new AABB(min, max);
    }
}