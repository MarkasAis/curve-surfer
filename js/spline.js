class Spline {
    multispline = null;
    nodes = [];
    isClosed = false;
    aabb = null;
    segmentAABB = [];

    constructor (nodes=[]) {
        this.nodes = nodes;

        for (let n of this.nodes) {
            n.spline = this;
            n.isFirst = false;
            n.isLast = false;
        }

        if (this.nodes.length > 0) {
            this.nodes[0].isFirst = true;
            this.nodes[this.nodes.length-1].isLast = true;
        }

        this.updateAllSegmentAABB();
    }

    #getNode(index, loop=false) {
        if (this.isClosed || loop) index = Maths.wrap(index, 0, this.nodes.length-1);
        if (index < 0 || index >= this.nodes.length) return null;
        return this.nodes[index];
    }

    addNode(pos, index) {
        
        let prev = this.#getNode(index-1);
        let next = this.#getNode(index);

        let prevPos = prev ? prev._position : pos;
        let nextPos = next ? next._position : pos;

        let dir;
        if (prevPos == nextPos) dir = Vec2.LEFT;
        else dir = Vec2.sub(nextPos, prevPos).normalized;

        let dist = Number.MAX_VALUE;
        if (prev) dist = Math.min(dist, Vec2.dist(prev._position, pos) * 0.5);
        if (next) dist = Math.min(dist, Vec2.dist(next._position, pos) * 0.5);
        if (dist == Number.MAX_VALUE) dist = 100;

        let node = new ControlNode(pos, dir, dist);
        node.spline = this;

        if (index == 0) {
            node.isFirst = true;
            if (this.nodes.length > 0) this.nodes[0].isFirst = false;
        }

        if (index == this.nodes.length) {
            node.isLast = true;
            if (this.nodes.length > 0) this.nodes[this.nodes.length-1].isLast = false;
        }

        this.nodes.splice(index, 0, node);
        this.updateAllSegmentAABB();
        return node;
    }

    removeNode(node) {
        this.nodes = this.nodes.filter(n => n != node);
        this.updateAllSegmentAABB();
    }

    close() {
        if (this.nodes.length < 2) return;
        this.isClosed = true;
        this.nodes[0].isFirst = false;
        this.nodes[this.nodes.length-1].isLast = false;
    }

    computeSegmentAABB(index) {
        let from = this.#getNode(index, true);
        let to = this.#getNode(index+1, true);

        let positions = [from._position, from.handleNext._position, to.handlePrev._position, to._position];
        return AABB.fromPositions(positions);
    }

    updateAllSegmentAABB() {
        this.segmentAABB = [];
        for (let i = 0; i < this.nodes.length; i++)
            this.segmentAABB.push(this.computeSegmentAABB(i));

        this.updateAABB();
    }

    updateAABB() {
        this.aabb = AABB.fromAABB(this.segmentAABB);
    }

    sampleSegmentNearest(pos, index) {
        const SAMPLE_COUNT = 10;

        let from = this.#getNode(index, true);
        let to = this.#getNode(index+1, true);

        let best = {
            distance: Number.MAX_VALUE,
            pos: null,
            t: 0
        };

        for (let i = 0; i < SAMPLE_COUNT; i++) {
            let t = i / (SAMPLE_COUNT-1);
            let target = this.evaluateBetween(from, to, t);

            let dist =  Vec2.dist(pos, target);
            if (dist < best.distance) {
                best.distance = dist;
                best.pos = target;
                best.t = index + t;
            }
        }

        return best;
    }

    fineTuneNearest(pos, guess) {
        return guess; // TODO: newton's method
    }

    nearest(pos, maxDist=Number.MAX_VALUE) {
        if (this.aabb.distance(pos) > maxDist) return null;

        let best = null;
        let segmentCount = this.isClosed ? this.nodes.length : this.nodes.length-1;

        for (let i = 0; i < segmentCount; i++) {
            if (this.segmentAABB[i].distance(pos) > maxDist) continue;

            let res = this.sampleSegmentNearest(pos, i);
            if (res.distance < maxDist) {
                best = res;
                maxDist = res.distance;
            }
        }

        return this.fineTuneNearest(pos, best);
    }

    evaluate(t) {
        let n = this.nodes.length;

        if (this.isClosed) t = Maths.wrap(t, 0, n);
        else t = Maths.clamp(t, 0, n-1);

        let i = Math.trunc(t);
        let frac = t % 1;

        let from = this.#getNode(i, true)
        let to = this.#getNode(i+1, true);

        return this.evaluateBetween(from, to, frac);
    }

    evaluateBetween(from, to, t) {
        let p0 = from._position;
        let p1 = from.handleNext._position;
        let p2 = to.handlePrev._position;
        let p3 = to._position;

        let position = Vec2.addAll( // TODO: cache
            p0,
            Vec2.mult(Vec2.add(Vec2.mult(p0, -3), Vec2.mult(p1, 3)), t),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, 3), Vec2.mult(p1, -6), Vec2.mult(p2, 3)), t*t),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, -1), Vec2.mult(p1, 3), Vec2.mult(p2, -3), p3), t*t*t)
        )

        return position;
    }

    select(pos) {
        for (let n of this.nodes) {
            let selected = n.select(pos);
            if (selected) return selected;
        }
        return null;
    }

    renderArrow(from, to, dashed=false) {
        // line
        CTX.beginPath();
        CTX.strokeStyle = '#FDFFFC33';
        CTX.lineWidth = 2;

        CTX.moveTo(from.x, from.y);

        if (dashed) {
            const DASH_LENGTH = 20;
            const GAP_LENGTH = 10;

            let totalDist = Vec2.dist(from, to);
            let dir = Vec2.sub(to, from).normalized;

            let cur = from;

            function step(length) {
                let stepLength = Math.min(length, totalDist);
                totalDist -= stepLength;
                cur = Vec2.add(cur, Vec2.mult(dir, stepLength));
            }

            while (totalDist > 0) {
                step(DASH_LENGTH);
                CTX.lineTo(cur.x, cur.y);
                step(GAP_LENGTH);
                CTX.moveTo(cur.x, cur.y);
            }

        } else {
            CTX.lineTo(to.x, to.y);
        }
        
        
        CTX.stroke();

        // arrow
        let dir = Vec2.sub(from, to).normalized;
        let offset = Vec2.mult(dir, 10 + 10);
        let mid = Vec2.add(to, Vec2.mult(dir, 10));
        let left = Vec2.add(to, Vec2.rotateByDeg(offset, 20));
        let right = Vec2.add(to, Vec2.rotateByDeg(offset, -20));

        CTX.beginPath();
        CTX.strokeStyle = '#FDFFFC33';
        CTX.lineWidth = 2;
        CTX.moveTo(left.x, left.y);
        CTX.lineTo(mid.x, mid.y);
        CTX.lineTo(right.x, right.y);
        CTX.stroke();
    }

    renderCurve(from, to) {
        const SEGMENT_COUNT = 30;
        CTX.beginPath();
        CTX.strokeStyle = '#FDFFFC';
        CTX.lineWidth = 2;
        CTX.moveTo(from.x, from.y);

        for (let i = 0; i <= SEGMENT_COUNT; i++) {
            let t = i / SEGMENT_COUNT;
            let pos = this.evaluateBetween(from, to, t);
            CTX.lineTo(pos.x, pos.y);
        }

        CTX.stroke();
    }

    renderAABB(aabb, highlight=false) {
        if (!aabb) return;
        CTX.strokeStyle = "#00ff00";
        CTX.lineWidth = highlight ? 2 : 1;
        let width = aabb.max.x - aabb.min.x;
        let height = aabb.max.y - aabb.min.y;
        CTX.strokeRect(aabb.min.x, aabb.min.y, width, height);
    }

    renderPathInfo(t) {
        let pos = this.evaluate(t);

        CTX.beginPath();
        CTX.fillStyle = "#00ff00";
        CTX.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        CTX.fill();
    }

    render(deltaTime) {
        for (let i = 0; i < this.nodes.length-1; i++) {
            let from = this.nodes[i];
            let to = this.nodes[i+1];
            // this.renderArrow(from._position, to._position);
            this.renderCurve(from, to);
        }

        if (this.isClosed) {
            let from = this.nodes[this.nodes.length-1];
            let to = this.nodes[0];
            // this.renderArrow(from._position, to._position, true);
            this.renderCurve(from, to);
        }

        let segmentCount = this.isClosed? this.nodes.length : this.nodes.length-1;
        for (let i = 0; i < segmentCount; i++)
            this.renderAABB(this.segmentAABB[i]);

        this.renderAABB(this.aabb, true);

        for (let n of this.nodes)
            n.render(deltaTime);
    }
}

class MultiSpline {
    splines = [];
    aabb = null;

    addNode(pos) {
        let spline = new Spline();
        spline.multispline = this;
        let node = spline.addNode(pos, 0);
        this.splines.push(spline);
        return node;
    }

    addNodeConnected(pos, other) {
        if (other.isLast) return other.spline.addNode(pos, other.spline.nodes.length);
        else if (other.isFirst) return other.spline.addNode(pos, 0);
    }

    removeNode(node) {
        node.spline.removeNode(node);
    }

    removeSpline(spline) {
        this.splines = this.splines.filter(s => s != spline);
    }

    nearest(pos, maxDist=Number.MAX_VALUE) {
        let best = null;
        for (let s of this.splines) {
            let res = s.nearest(pos, maxDist);
            if (res) {
                maxDist = res.distance;
                best = res;
                best.spline = s;
            }
        }

        return best;
    }

    renderPathInfo(spline, t) {
        spline.renderPathInfo(t);
    }

    connectNodes(from, to) {
        if (from.isInner() || to.isInner() || from == to) return;
        if (from.spline == to.spline) {
            from.spline.close();
            return;
        }

        this.removeSpline(from.spline);
        this.removeSpline(to.spline);

        let toNodes = to.isLast ? to.spline.nodes.reverse() : to.spline.nodes;
        let combinedNodes = from.spline.nodes.concat(toNodes);
        let combinedSpline = new Spline(combinedNodes);
        combinedSpline.multispline = this;
        
        this.splines.push(combinedSpline);
    }

    select(pos) {
        for (let s of this.splines) {
            let selected = s.select(pos);
            if (selected) return selected;
        }
        return null;
    }

    render(deltaTime) {
        for (let s of this.splines)
            s.render(deltaTime);
    }
}

class ControlNode extends Circle {
    constructor(pos, handleDir=Vec2.LEFT, handleDist=100) {
        super(pos, 10);

        this.spline = null;

        let handlePrevPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, -handleDist));
        let handleNextPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, handleDist));
        this.handlePrev = new Handle(this, handlePrevPos);
        this.handleNext = new Handle(this, handleNextPos);
        
        this.showHandles = false;
    }

    isInner() {
        return this.nodePrev && this.nodeNext;
    }

    setPosition(pos) {
        let offset = Vec2.sub(pos, this._position);
        this._position = pos;
        
        this.handlePrev._position = Vec2.add(this.handlePrev._position, offset);
        this.handleNext._position = Vec2.add(this.handleNext._position, offset);
        this.spline.updateAllSegmentAABB();
    }

    select(pos) {
        if (this.showHandles) {
            let selectPoint = this.handleNext.select(pos);
            if (selectPoint) return selectPoint;

            selectPoint = this.handlePrev.select(pos);
            if (selectPoint) return selectPoint;
        }

        return super.select(pos);
    }

    onHandleMove(handle) {
        let other = (handle == this.handlePrev) ? this.handleNext : this.handlePrev;

        other._position = (Vec2.reflect(handle._position, this._position));
        this.spline.updateAllSegmentAABB();
    }

    render() {
        CTX.beginPath();
        CTX.strokeStyle = '#e40066';
        CTX.lineWidth = 3;
        CTX.arc(this._position.x, this._position.y, this.radius*0.7, 0, Math.PI * 2);
        CTX.fillStyle = '#FDFFFC';
        CTX.fill();

        if (this.showHandles) CTX.stroke(); 

        if (this.showHandles) {
            if (!this.isFirst) this.handlePrev.render(true);
            if (!this.isLast) this.handleNext.render(true); 
        }
    }
}

class Handle extends Circle {
    constructor(control, pos) {
        super(pos, 10);
        this.control = control;
    }

    setPosition(pos) {
        this._position = pos;
        this.control.onHandleMove(this);
    }

    render(highlight) {
        CTX.beginPath();
        CTX.strokeStyle = highlight ? '#e40066' : '#FDFFFC';
        CTX.lineWidth = 2;
        CTX.arc(this._position.x, this._position.y, this.radius*0.5, 0, Math.PI * 2);
        CTX.stroke();

        CTX.beginPath();
        CTX.lineWidth = 1;
        CTX.moveTo(this._position.x, this._position.y);
        CTX.lineTo(this.control._position.x, this.control._position.y);
        CTX.stroke();
    }
}