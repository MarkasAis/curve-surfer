class Collision {
    static collide(spline, from, to, radius) {
        let move = new Line(from, to);

        let traverser = new Traverser(c => c, () => true, line => {
            let res1 = this.collideEnd(line, move, radius);
            let res2 = this.collideIntersect(line, move, radius);
            let res3 = this.collideCorner(line, move, radius);

            let best = res1;
            if (!best || res2 && res2.t < best.t) best = res2;
            if (!best || res3 && res3.t < best.t) best = res3;
            return best;
        }, (best, res) => {
            return res.t < best.t ? res : best;
        });

        return traverser.traverse(spline);
    }

    static collideEnd(line, move, radius) {
        let v1 = Vec2.sub(move.to, line.from);
        let t1 = Vec2.dot(v1, line.dir);

        let pr1 = Vec2.add(line.from, Vec2.mult(line.dir, t1));
        let d1 = Vec2.dist(move.to, pr1);

        if (d1 > radius) return null;

        let v2 = Vec2.sub(move.from, line.from);
        let t2 = Vec2.dot(v2, line.dir);
        let pr2 = Vec2.add(line.from, Vec2.mult(line.dir, t2));
        let d2 = Vec2.dist(move.from, pr2);

        let t3 = Maths.inverseLerp(d2, d1, radius);

        if (t3 < 0 || t3 > 1) return null;

        let v3 = Vec2.sub(move.to, move.from);
        let pr3 = Vec2.add(move.from, Vec2.mult(v3, t3));

        let v4 = Vec2.sub(pr3, line.from);
        let t4 = Vec2.dot(v4, line.dir);

        if (t4 < 0 || t4 > line.length) return null;

        let pr4 = Vec2.add(line.from, Vec2.mult(line.dir, t4));

        return {
            t: t3,
            hitPos: pr4
        }
    }

    static collideIntersect(line, move, radius) {
        let v1 = Vec2.sub(move.to, move.from);
        let v2 = Vec2.sub(line.to, line.from);

        let t1 = (-v1.y * (move.from.x - line.from.x) + v1.x * (move.from.y - line.from.y)) / (-v2.x * v1.y + v1.x * v2.y);
        let t2 = (v2.x * (move.from.y - line.from.y) - v2.y * (move.from.x - line.from.x)) / (-v2.x * v1.y + v1.x * v2.y);

        if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) return null;
        let p1 = Vec2.add(move.from, Vec2.mult(v1, t2));

        let v3 = Vec2.sub(move.from, line.from);
        let p2 = Vec2.add(line.from, Vec2.mult(line.dir, Vec2.dot(line.dir, v3)));

        let d1 = Vec2.dist(move.from, p1);
        let d2 = Vec2.dist(move.from, p2);

        let t3 = t2 - (radius * d1/d2) / move.length;
        if (t3 < 0) return null;

        let v4 = Vec2.sub(move.to, move.from);
        let p3 = Vec2.add(move.from, Vec2.mult(v4, t3));

        let v5 = Vec2.sub(p3, line.from);
        let t4 = Vec2.dot(v5, line.dir);

        if (t4 < 0 || t4 > line.length) return null;

        let p4 = Vec2.add(line.from, Vec2.mult(line.dir, t4)); 

        return {
            t: t3,
            hitPos: p4
        }
    }

    static collideCorner(line, move, radius) {
        let helper = (line) => {
            let v0 = Vec2.sub(line.from, move.from);
            let t0 = Vec2.dot(move.dir, v0);
            let p0 = Vec2.add(move.from, Vec2.mult(move.dir, t0));

            if (Vec2.dist(line.from, p0) > radius || t0 < 0 || t0 > move.length + radius) return null;

            let v1 = Vec2.sub(p0, line.from);
            let p1 = Vec2.add(line.from, Vec2.mult(line.dir, Vec2.dot(line.dir, v1)));

            let v2 = Vec2.sub(move.from, line.from);
            let p2 = Vec2.add(line.from, Vec2.mult(line.dir, Vec2.dot(line.dir, v2)));

            let d1 = Vec2.dist(p0, p1);
            let d2 = Vec2.dist(move.from, p2);

            let t1 = Maths.inverseLerp(d2, d1, radius) * (t0 / move.length);

            let v3 = Vec2.sub(move.to, move.from);
            let adj1 = Vec2.add(move.from, Vec2.mult(v3, t1));

            let v4 = Vec2.sub(adj1, line.from);
            let t2 = Vec2.dot(line.dir, v4);

            if (t2 > 0 && t2 < line.length && d1 < d2) {
                if (t1 < 0 || t1 > 1) return null;

                let p3 = Vec2.add(line.from, Vec2.mult(line.dir, t2));

                return {
                    hitPos: p3,
                    t: t1
                }
            }

            let d3 = Math.sqrt(radius*radius-Vec2.squareDistance(p0, line.from));
            let t3 = (t0 - d3) / move.length

            if (t3 < 0 || t3 > 1) return null;

            return {
                hitPos: line.from,
                t: t3
            }
        }

        let res1 = helper(line);
        let res2 = helper(line.reversed);
        if (!res1) return res2;
        if (!res2) return res1;
        return res1.t < res2.t ? res1 : res2;
    }
}