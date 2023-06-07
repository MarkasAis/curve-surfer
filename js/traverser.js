/*
nearestToPoint
- aabbTest: point to aabb distance
- lineTest: point to line distance

nearestToLine
- aabbTest: construct aabb around line + radius
            aabb vs aabb test
- lineTest: closest offset from point to each endpoint intersection

nearestIntersect
- aabbTest: aabb vs aabb
- lineTest: nearest intersection 


*/

class Traverser {
    constructor(selectCandidates, discriminator, computeLeaf, chooseBest) {
        this.selectCandidates = selectCandidates;
        this.discriminator = discriminator;
        this.computeLeaf = computeLeaf;
        this.chooseBest = chooseBest;
    }

    traverse(obj) {
        if (obj.isLeaf()) return this.computeLeaf(obj);

        let candidates = this.selectCandidates(obj.getChildren());
        let best = null;
        for (let i = 0; i < candidates.length; i++) {
            let c = candidates[i];
            if (!this.discriminator(c)) continue;

            let res = this.traverse(c);
            if (!best) best = res;
            else if (res) best = this.chooseBest(best, res);
        }

        return best;
    }
}