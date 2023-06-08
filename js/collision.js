class Collision {
    static move(spline, pos, velocity, radius, restitution=1) {
        let to = Vec2.add(pos, velocity);
        return Collision.moveHelper(spline, pos, to, velocity, radius, restitution, velocity);
    }

    static moveHelper(spline, from, to, velocity, radius, restitution) {
        let collision = Collision.collide(spline, from, to, radius, restitution, velocity);
        
        if (!collision) {
            return {
                pos: to,
                velocity: velocity
            };
        } else {
            let newPos = Vec2.add(collision.objPos, collision.outTranslation);
            return Collision.moveHelper(spline, collision.objPos, newPos, collision.outVelocity, radius, restitution);
        }
    }

    static collide(spline, from, to, radius, restitution=1, velocity=Vec2.ZERO) {
        let move = new Line(from, to);

        let traverser = new Traverser(c => c, () => true, line => {
            let res1 = this.collideEnd(line, move, radius);
            let res2 = this.collideIntersect(line, move, radius);
            let res3 = this.collideCorner(line, move, radius);

            let best = res1;
            if (!best || res2 && res2.objT < best.objT) best = res2;
            if (!best || res3 && res3.objT < best.objT) best = res3;
            return best;
        }, (best, res) => {
            return res.objT < best.objT ? res : best;
        });

        let hit = traverser.traverse(spline);
        if (hit) {
            let resolution = this.resolveCollision(hit, move, restitution, velocity);

            return {
                objPos: hit.objPos,
                outTranslation: resolution.outTranslation,
                outVelocity: resolution.outVelocity,

                hitPos: hit.hitPos,
                hitNormal: resolution.hitNormal,


                hitCorner: hit.hitCorner,
                objT: hit.objT
            }
        }

        return null;
        // if (res) {
        //     let collision = {
        //         inPos: from, 2 
        //         objPos: to,  1
        //         inVel:   2
        //         outVel    3

        //         hitPos   1
        //         hitSpline  1
        //         hitT  1
        //         hitNormal 3
        //     }
        // }
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

        let t5 = t4 / line.length;

        return {
            objPos: pr3,
            objT: t3,

            hitLine: line,
            hitPos: pr4,
            hitT: t5 
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

        let t5 = t4 / line.length;

        return {
            objPos: p3,
            objT: t3,

            hitLine: line,
            hitPos: p4,
            hitT: t5
        }
    }

    static collideCorner(line, move, radius) {
        let helper = (line, reversed) => {
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

                let t3 = t2 / line.length;

                return {
                    objPos: adj1,
                    objT: t1,

                    hitLine: line,
                    hitPos: p3,
                    hitT: t3
                }
            }

            let d3 = Math.sqrt(radius*radius-Vec2.squareDistance(p0, line.from));
            let t3 = (t0 - d3) / move.length

            if (t3 < 0 || t3 > 1) return null;

            let adj2 = Vec2.add(move.from, Vec2.mult(v3, t3));

            return {
                objPos: adj2,
                objT: t3,

                hitLine: line,
                hitPos: line.from,
                hitT: 0,
                hitCorner: true
            }
        }

        let res1 = helper(line);
        let res2 = helper(line.reversed);
        if (!res1) return res2;
        if (!res2) return res1;
        return res1.objT < res2.objT ? res1 : res2;
    }

    static resolveCollision(hit, move, restitution, velocity) {
        if (!hit) return null;

        // let spline = hit.hitLine.segment.spline;
        // let t = hit.hitLine.toSplineT(hit.hitT);
        // let isEndPoint = spline.isEndPoint(t);

        let normal = null;
        if (hit.hitCorner) {
            normal = Vec2.sub(hit.objPos, hit.hitPos).normalized;
        } else {
            let dir = hit.hitLine.dir;
            normal = new Vec2(-dir.y, dir.x);
            if (Vec2.dot(normal, move.dir) > 0) normal.negate();
        }

        let outDir = Vec2.reflect(move.dir, normal);
        let outVelocity = Vec2.mult(Vec2.reflect(velocity, normal), restitution);
        let outTranslation = Vec2.mult(outDir, move.length * (1 - hit.objT) * restitution);

        return {
            hitNormal: normal,
            outDir: outDir,
            outTranslation: outTranslation,
            outVelocity: outVelocity
        };
    }

    static resolveEnd(hit, move, spline, t) {
        let normal = Vec2.sub(hit.objPos, hit.hitPos).normalized;
        return {
            hitNormal: normal,
            outDir: normal
        };
    }

    static resolveInner(hit, move, spline, t) {
        let dir = hit.hitLine.dir;
        let normal = new Vec2(-dir.y, dir.x);//spline.normal(t);
        if (Vec2.dot(normal, move.dir) > 0) normal.negate();

        let outDir = Vec2.reflect(move.dir.negated, normal);

        return {
            hitNormal: normal,
            outDir: outDir
        };
    }
}