class Line {
    constructor(from, to) {
        this.from = from;
        this.to = to;

        this.dir = Vec2.sub(to, from);
        this.length = this.dir.magnitude;
        if (this.length > 0)
            this.dir.divide(this.length);
    }

    get reversed() {
        return new Line(this.to, this.from);
    }

    render(camera) {
        camera.line(this.from, this.to, { stroke: '#00ff00', strokeWidth: 2 });
    }
}

class SplineLine extends Line {
    constructor(segment, fromPos, toPos, fromT, toT) {
        super(fromPos, toPos);
        this.segment = segment;
        this.fromT = fromT;
        this.toT = toT;
    }

    toSegmentT(t) {
        return Maths.lerp(this.fromT, this.toT, t);
    }

    toSplineT(t) {
        let segmentT = this.toSegmentT(t);
        return this.segment.toSplineT(segmentT);
    }

    get reversed() {
        return new SplineLine(this.segment, this.to, this.from, this.toT, this.fromT);
    }

    isLeaf() { return true; }
}

class Segment {
    constructor(spline, fromPos, toPos, fromT, toT) {
        this.from = fromPos;
        this.to = toPos;

        this.spline = spline;
        this.fromT = fromT;
        this.toT = toT;

        this.aabb = null;
        this.coefficients = null;
        this.lines = [];

        this.nearCheck = false;

        this.update();
    }

    toSplineT(t) {
        return Maths.lerp(this.fromT, this.toT, t);
    }

    isLeaf() { return false; }
    getChildren() { return this.lines; }

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
        let prevT = 0;
        let prevPos = this.evaluate(prevT);

        for (let i = 1; i <= NUM_LINES; i++) {
            let t = i / NUM_LINES;
            let pos = this.evaluate(t);

            let line = new SplineLine(this, prevPos, pos, prevT, t);
            this.lines.push(line);

            prevT = t;
            prevPos = pos;
        }
    }

    evaluate(t) {
        let position = Vec2.addAll(
            this.coefficients[0],
            Vec2.mult(this.coefficients[1], t),
            Vec2.mult(this.coefficients[2], t*t),
            Vec2.mult(this.coefficients[3], t*t*t)
        );

        return position;
    }

    evaluateFirstDerivative(t) {
        let result = Vec2.addAll(
            this.coefficients[1],
            Vec2.mult(this.coefficients[2], 2*t),
            Vec2.mult(this.coefficients[3], 3*t*t)
        );

        return result;
    }

    tangent(t) {
        return this.evaluateFirstDerivative(t).normalized;
    }

    normal(t) {
        let res = this.tangent(t);
        let temp = res.x;
        res.x = -res.y;
        res.y = temp;

        return res;
    }

    render(camera) {
        if (Debug.SPLINE_ORDER)
            this.renderArrow(camera);

        this.renderCurve(camera);

        if (Debug.COLLISION_LINES)
            this.renderLines(camera);

        if (Debug.COLLISION_AABB)
            this.aabb.render(camera, this.nearCheck, false);
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

    renderLines(camera) {
        for (let l of this.lines)
            l.render(camera);
    }

    renderArrow(camera) {
        let from = this.from._position;
        let to = this.to._position;
        camera.arrow(from, to, { stroke: '#FDFFFC33', strokeWidth: 2, arrowOffset: 0.2625 });
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

    isEndPoint(t) {
        if (this.isClosed) return false;
        return (t == 0 || t == this.segments.length)
    }

    isLeaf() { return false; }
    getChildren() { return this.segments; }

    #updateSegments() {
        this.segments = [];
        let segmentCount = this.isClosed ? this.nodes.length : this.nodes.length-1;

        for (let i = 0; i < segmentCount; i++) {
            let fromPos = this.getNode(i, true);
            let toPos = this.getNode(i+1, true);
            let segment = new Segment(this, fromPos, toPos, i, i+1);
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
        if (dist == Number.MAX_VALUE) dist = 5;

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

    tangent(t) {
        let res = this.#toSegment(t);
        return res.segment.tangent(res.t);
    }

    normal(t) {
        let res = this.#toSegment(t);
        return res.segment.normal(res.t);
    }

    select(pos) {
        for (let n of this.nodes) {
            let selected = n.select(pos);
            if (selected) return selected;
        }
        return null;
    }

    renderPathInfo(camera, t) {
        let pos = this.evaluate(t);
        let tangent = this.tangent(t);
        let normal = this.normal(t);

        let tangentTo = Vec2.add(pos, Vec2.mult(tangent, 2));
        let normalTo = Vec2.add(pos, Vec2.mult(normal, 2));
        
        camera.arrow(pos, tangentTo, { stroke: '#e4be00', strokeWidth: 2 });
        camera.arrow(pos, normalTo, { stroke: '#00afe4', strokeWidth: 2 });
        camera.circle(pos, 0.125, { fill: '#fff' });
    }

    render(camera) {
        for (let i = 0; i < this.nodes.length-1; i++) {
            let segment = this.segments[i];
            segment.render(camera);
        }

        if (this.isClosed) {
            let segment = this.segments[this.nodes.length-1];
            segment.render(camera);
        }
    }

    renderEditor(camera) {
        this.render(camera);

        if (Debug.COLLISION_AABB)
            this.aabb.render(camera, true, true);

        for (let n of this.nodes)
            n.render(camera);
    }
}

class MultiSpline extends GameObject {
    splines = [];
    aabb = null;

    isLeaf() { return false; }
    getChildren() { return this.splines; }

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

    renderPathInfo(camera, spline, t) {
        spline.renderPathInfo(camera, t);
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

    render(camera) {
        for (let s of this.splines)
            s.render(camera);
    }

    renderEditor(camera) {
        for (let s of this.splines)
            s.renderEditor(camera);
    }
}

class ControlNode extends Circle {
    constructor(pos, handleDir=Vec2.LEFT, handleDist=5) {
        super(pos, 0.375);
        this.customEditor = Editor.ContextType.SPLINE;

        this.spline = null;

        this.isFirst = false;
        this.isLast = false;

        let handlePrevPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, -handleDist));
        let handleNextPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, handleDist));
        this.handlePrev = new Handle(this, handlePrevPos);
        this.handleNext = new Handle(this, handleNextPos);
        
        this.showHandles = false;
    }

    isInner() {
        return !this.isFirst && !this.isLast;
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

        other._position = (Vec2.mirror(handle._position, this._position));
        this.spline.onNodeUpdated(this);
    }

    render(camera) {
        let style = { fill: '#FDFFFC' };
        if (this.showHandles) style.stroke = '#e40066';
        camera.circle(this._position, this.radius*0.7, style);

        if (this.showHandles) {
            if (!this.isFirst) this.handlePrev.render(camera);
            if (!this.isLast) this.handleNext.render(camera); 
        }
    }
}

class Handle extends Circle {
    constructor(control, pos) {
        super(pos, 0.375);
        this.customEditor = Editor.ContextType.SPLINE;

        this.control = control;
    }

    setPosition(pos) {
        this._position = pos;
        this.control.onHandleMove(this);
    }

    render(camera) {
        camera.circle(this._position, this.radius * 0.5, { stroke: '#e40066', strokeWidth: 2 });
        camera.line(this._position, this.control._position, { stroke: '#e40066', strokeWidth: 1 });
    }
}