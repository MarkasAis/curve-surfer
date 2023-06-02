class Line {
    constructor(from, to) {
        this.from = from;
        this.to = to;

        this.dir = Vec2.sub(to, from);
        this.length = this.dir.magnitude;
        if (this.length > 0)
            this.dir.divide(this.length);
    }

    nearest(pos) {
        let v = Vec2.sub(pos, this.from);
        let d = Vec2.dot(v, this.dir);
        d = Maths.clamp(d, 0, this.length);

        let target = Vec2.add(this.from, Vec2.mult(this.dir, d));
        let t = d / this.length;
        let distSq = Vec2.squareDistance(pos, target);

        return {
            pos: target,
            t: t,
            distSq: distSq
        }
    }

    render() {
        CTX.beginPath();
        CTX.strokeStyle = '#00ff00';
        CTX.lineWidth = 2;
        CTX.moveTo(this.from.x, this.from.y);
        CTX.lineTo(this.to.x, this.to.y);
        CTX.stroke();
    }
}

class Segment {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.aabb = null;
        this.coefficients = null;
        this.lines = [];

        this.nearCheck = false;

        this.update();
    }

    update() {
        this.updateAABB();
        this.updateCoefficients();
        this.updateLines();
    }

    updateAABB() {
        this.aabb = AABB.fromPositions([this.from._position, this.from.handleNext._position,
                                        this.to.handlePrev._position, this.to._position]);
    }

    updateCoefficients() {
        let p0 = this.from._position;
        let p1 = this.from.handleNext._position;
        let p2 = this.to.handlePrev._position;
        let p3 = this.to._position;
        
        this.coefficients = [
            p0,
            Vec2.add(Vec2.mult(p0, -3), Vec2.mult(p1, 3)),
            Vec2.addAll(Vec2.mult(p0, 3), Vec2.mult(p1, -6), Vec2.mult(p2, 3)),
            Vec2.addAll(Vec2.mult(p0, -1), Vec2.mult(p1, 3), Vec2.mult(p2, -3), p3)
        ];
    }

    updateLines() {
        const NUM_LINES = 10;

        this.lines = [];
        let prevPos = this.evaluate(0);

        for (let i = 1; i <= NUM_LINES; i++) {
            let t = i / NUM_LINES;
            let pos = this.evaluate(t);

            let line = new Line(prevPos, pos);
            this.lines.push(line);

            prevPos = pos;
        }
    }

    evaluate(t) {
        let position = Vec2.addAll(
            this.coefficients[0],
            Vec2.mult(this.coefficients[1], t),
            Vec2.mult(this.coefficients[2], t*t),
            Vec2.mult(this.coefficients[3], t*t*t)
        )

        return position;
    }

    nearest(pos) {
        let best = {
            distSq: Number.MAX_VALUE,
            pos: null,
            t: 0
        };

        for (let i = 0; i < this.lines.length; i++) {
            let tOffset = i / this.lines.length;
            let res = this.lines[i].nearest(pos);

            if (res.distSq < best.distSq) {
                res.t = tOffset + res.t/this.lines.length;
                best = res;
            }
        }

        return best;
    }

    render(camera, deltaTime) {
        // this.renderArrow();
        this.renderCurve(camera);
        // if (this.nearCheck) this.renderLines();
        // this.aabb.render(this.nearCheck, false);
    }

    renderCurve(camera) {
        const SEGMENT_COUNT = 30;

        let positions = [];
        positions.push(this.from);

        for (let i = 0; i <= SEGMENT_COUNT; i++) {
            let t = i / SEGMENT_COUNT;
            let pos = this.evaluate(t);
            positions.push(pos);
        }

        camera.poly(positions, false, { stroke: '#FDFFFC', strokeWidth: 2 });
    }

    renderLines() {
        for (let l of this.lines)
            l.render();
    }

    renderArrow(dashed=false) {
        let from = this.from._position;
        let to = this.to._position;

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
}

class Spline {
    multispline = null;
    nodes = [];
    segments = [];
    isClosed = false;
    aabb = null;

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

        this.#updateSegments();
    }

    #updateSegments() {
        this.segments = [];
        let segmentCount = this.isClosed ? this.nodes.length : this.nodes.length-1;

        for (let i = 0; i < segmentCount; i++) {
            let from = this.getNode(i, true);
            let to = this.getNode(i+1, true);
            let segment = new Segment(from, to);
            this.segments.push(segment);
        }

        this.updateAABB();
    }

    getNode(index, loop=false) {
        if (this.isClosed || loop) index = Maths.wrap(index, 0, this.nodes.length-1);
        if (index < 0 || index >= this.nodes.length) return null;
        return this.nodes[index];
    }

    addNode(pos, index) {
        
        let prev = this.getNode(index-1);
        let next = this.getNode(index);

        let prevPos = prev ? prev._position : pos;
        let nextPos = next ? next._position : pos;

        let dir;
        if (prevPos == nextPos) dir = Vec2.LEFT;
        else dir = Vec2.sub(nextPos, prevPos).normalized;

        let dist = Number.MAX_VALUE;
        if (prev) dist = Math.min(dist, Vec2.dist(prev._position, pos) * 0.5);
        if (next) dist = Math.min(dist, Vec2.dist(next._position, pos) * 0.5);
        if (dist == Number.MAX_VALUE) dist = 1;

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
        this.#updateSegments();
        return node;
    }

    removeNode(node) {
        let index = this.nodes.indexOf(node);

        this.nodes.splice(index, 1);
        if (this.nodes.length <= 1) this.open();

        if (!this.isClosed && this.nodes.length > 0) {
            if (index == 0) this.nodes[0].isFirst = true;
            if (index == this.nodes.length) this.nodes[this.nodes.length-1].isLast = true;
        }
        
        this.#updateSegments();
    }

    close() {
        if (this.nodes.length < 2) return;
        this.isClosed = true;
        this.nodes[0].isFirst = false;
        this.nodes[this.nodes.length-1].isLast = false;
        this.#updateSegments();
    }

    open() {
        this.isClosed = false;
        if (this.nodes.length > 0) {
            this.nodes[0].isFirst = true;
            this.nodes[this.nodes.length-1].isLast = true;
        }
        this.#updateSegments();
    }

    onNodeUpdated(node) {
        let index = this.nodes.indexOf(node);

        let from = this.#toSegment(index);
        let to = this.#toSegment(index-1);

        if (from) from.segment.update();
        if (to) to.segment.update();

        this.updateAABB();
    }

    updateAABB() {
        let segmentAABB = this.segments.map(s => s.aabb);
        this.aabb = AABB.fromAABB(segmentAABB);
    }

    nearest(pos) {
        let segmentCount = this.isClosed ? this.nodes.length : this.nodes.length-1;
        let candidates = [];

        for (let i = 0; i < segmentCount; i++) {
            let segment = this.segments[i];
            segment.nearCheck = false;
            let distSq = segment.aabb.distanceSquared(pos);
            candidates.push({distSq, segment, index: i});
        }

        let best = null;
        let maxDistSq = Number.MAX_VALUE;

        candidates.sort((l, r) => l.distSq - r.distSq);
        for (let c of candidates) {
            if (c.distSq >= maxDistSq) continue;

            let res = c.segment.nearest(pos);
            c.segment.nearCheck = true;
            if (res.distSq < maxDistSq) {
                maxDistSq = res.distSq;
                res.t += c.index;
                best = res;
            }
        }

        return best;
    }

    #constrain(t) {
        if (this.isClosed) return Maths.wrap(t, 0, this.nodes.length-1);
        return Maths.clamp(t, 0, this.nodes.length-1);
    }

    #toSegment(t) {
        t = this.#constrain(t);
        let i = Math.trunc(t);
        let frac = t % 1;

        if (!this.isClosed && i == this.nodes.length-1) {
            if (this.nodes.length <= 1) return null;
            i = this.segments.length-1;
            frac = 1;
        }
        
        return { segment: this.segments[i], t: frac };
    }

    evaluate(t) {
        let res = this.#toSegment(t);
        return res.segment.evaluate(res.t);
    }

    select(pos) {
        for (let n of this.nodes) {
            let selected = n.select(pos);
            if (selected) return selected;
        }
        return null;
    }

    renderPathInfo(t) {
        let pos = this.evaluate(t);

        CTX.beginPath();
        CTX.fillStyle = "#00ff00";
        CTX.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        CTX.fill();
    }

    render(camera, deltaTime) {
        for (let i = 0; i < this.nodes.length-1; i++) {
            let segment = this.segments[i];
            segment.render(camera, deltaTime);
        }

        if (this.isClosed) {
            let segment = this.segments[this.nodes.length-1];
            segment.render(camera, deltaTime);
        }

        // this.aabb.render(true, true);

        for (let n of this.nodes)
            n.render(camera, deltaTime);
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

    nearest(pos) {
        let candidates = [];

        for (let i = 0; i < this.splines.length; i++) {
            let spline = this.splines[i];
            spline.nearCheck = false;
            let distSq = spline.aabb.distanceSquared(pos);
            candidates.push({distSq, spline});
        }

        let best = null;
        let maxDistSq = Number.MAX_VALUE;

        candidates.sort((l, r) => l.distSq - r.distSq);
        for (let c of candidates) {
            if (c.distSq >= maxDistSq) continue;

            let res = c.spline.nearest(pos);
            c.spline.nearCheck = true;
            if (res && res.distSq < maxDistSq) {
                maxDistSq = res.distSq;
                res.spline = c.spline;
                best = res;
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

    render(camera, deltaTime) {
        for (let s of this.splines)
            s.render(camera, deltaTime);
    }
}

class ControlNode extends Circle {
    constructor(pos, handleDir=Vec2.LEFT, handleDist=1) {
        super(pos, 0.075);

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
        this.spline.onNodeUpdated(this);
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
        this.spline.onNodeUpdated(this);
    }

    render(camera, deltaTime) {
        camera.circle(this._position, this.radius*0.7, { fill: '#FDFFFC' });
        // CTX.beginPath();
        // CTX.strokeStyle = '#e40066';
        // CTX.lineWidth = 3;
        // CTX.arc(this._position.x, this._position.y, this.radius*0.7, 0, Math.PI * 2);
        // CTX.fillStyle = '#FDFFFC';
        // CTX.fill();

        // if (this.showHandles) CTX.stroke(); 

        // if (this.showHandles) {
        //     if (!this.isFirst) this.handlePrev.render(true);
        //     if (!this.isLast) this.handleNext.render(true); 
        // }
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