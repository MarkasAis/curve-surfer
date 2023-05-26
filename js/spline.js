/*
MULTI SPLINE
AddNode
AddNodeConnected
RemoveNode
ConnectNodes
DisconnectNodes

Nearest: {Spline, t, position}

SPLINE
AddNodeFirst
AddNodeLast
RemoveNode: [Spline, Spline]
Loop

*/

class Spline {
    nodes = [];
    isClosed = false;

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
    }

    #getNodeAtIndex(index) {
        if (this.isClosed) index = Maths.wrap(index, 0, this.nodes.length-1);
        if (index < 0 || index >= this.nodes.length) return null;
        return this.nodes[index];
    }

    addNode(pos, index) {
        
        let prev = this.#getNodeAtIndex(index-1);
        let next = this.#getNodeAtIndex(index);

        let prevPos = prev ? prev._position : pos;
        let nextPos = next ? next._position : pos;

        let dir;
        if (prevPos == nextPos) dir = Vec2.left;
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
        return node;
    }

    removeNode(node) {
        this.nodes = this.nodes.filter(n => n != node);
    }

    close() {
        if (this.nodes.length < 2) return;
        this.isClosed = true;
        this.nodes[0].isFirst = false;
        this.nodes[this.nodes.length-1].isLast = false;
    }

    evaluate(t) {
        let n = this.nodes.length;

        if (this.isClosed) t = Maths.wrap(t, 0, n);
        else t = Maths.clamp(t, 0, n-1);

        let i = Math.trunc(t);
        let frac = t % 1;

        let from = this.nodes[i % n]
        let to = this.nodes[(i+1) % n];

        this.evaluateBetween(from, to, frac);
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

    // reverse() {
    //     this.nodes = this.nodes.reverse();
    // }

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

    render(deltaTime) {
        for (let i = 0; i < this.nodes.length-1; i++) {
            let from = this.nodes[i];
            let to = this.nodes[i+1];
            this.renderArrow(from._position, to._position);
            this.renderCurve(from, to);
        }

        if (this.isClosed) {
            let from = this.nodes[this.nodes.length-1];
            let to = this.nodes[0];
            this.renderArrow(from._position, to._position, true);
            this.renderCurve(from, to);
        }

        for (let n of this.nodes)
            n.render(deltaTime);
    }
}

class MultiSpline {
    splines = [];

    addNode(pos) {
        let spline = new Spline();
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

class MultiSplineOld {
    #nodes = [];

    // addNode(pos, handleDir=Vec2.right, handleDist=100) {
    //     let node = new ControlNode(pos, handleDir, handleDist);
    //     this.#nodes.push(node);
    //     return node;
    // }

    addNodeConnected(pos, from) {
        let handleDir = Vec2.sub(from._position, pos).normalized;
        let handleDist = Vec2.dist(pos, from._position) * 0.5;

        let node = this.addNode(pos, handleDir, handleDist);
        this.connectNodes(from, node);
        return node;
    }

    // removeNode(node) {
    //     if (node.nodePrev == node.nodeNext) {
    //         node.nodePrev.nodeNext = null;
    //         node.nodePrev.nodePrev = null;
    //     } else {
    //         if (node.nodePrev) node.nodePrev.nodeNext = node.nodeNext;
    //         if (node.nodeNext) node.nodeNext.nodePrev = node.nodePrev;
    //     }
    //     this.#nodes = this.#nodes.filter(n => n != node);
    // }

    connectNodes(from, to) {
        if (from.isInner() || to.isInner()) return;

        if (from.nodeNext == null) {
            if (to.nodePrev != null) this.invert(to);
            from.nodeNext = to;
            to.nodePrev = from;
        } else {
            if (to.nodeNext != null) this.invert(to);
            from.nodePrev = to;
            to.nodeNext = from;
        }
    }

    disconnectNodes(from, to) {
        if (from.nodeNext == to && to.nodePrev == from) {
            from.nodeNext = null;
            to.nodePrev = null;
        } else if (from.nodePrev == to && to.nodeNext == from) {
            from.nodePrev = null;
            to.nodeNext = null;
        }
    }

    invert(node) {
        let start = node.nodePrev ? node.nodePrev : node;

        while (start != node && start.nodePrev)
            start = start.nodePrev;

        let cur = start;
        do {
            let t = cur.nodePrev;
            cur.nodePrev = cur.nodeNext;
            cur.nodeNext = t;

            cur = cur.nodePrev;
        } while (cur != start && cur != null);
    }

    #positionAt(from, to, t) {
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
        for (let n of this.#nodes) {
            let selectedNode = n.select(pos);
            if (selectedNode) return selectedNode;
        }
        return null;
    }

    render(deltaTime) {
        for (let from of this.#nodes) {
            let to = from.nodeNext;
            if (to) {
                // line
                CTX.beginPath();
                CTX.strokeStyle = '#FDFFFC11';
                CTX.lineWidth = 2;
                CTX.moveTo(from._position.x, from._position.y);
                CTX.lineTo(to._position.x, to._position.y);
                CTX.stroke();

                // arrow
                let dir = Vec2.sub(from._position, to._position).normalized;
                let offset = Vec2.mult(dir, 10 + 10);
                let mid = Vec2.add(to._position, Vec2.mult(dir, 10));
                let left = Vec2.add(to._position, Vec2.rotateByDeg(offset, 20));
                let right = Vec2.add(to._position, Vec2.rotateByDeg(offset, -20));

                CTX.beginPath();
                CTX.strokeStyle = '#FDFFFC11';
                CTX.lineWidth = 2;
                CTX.moveTo(left.x, left.y);
                CTX.lineTo(mid.x, mid.y);
                CTX.lineTo(right.x, right.y);
                CTX.stroke();

                // curve
                const ITERATIONS_PER_SEGMENT = 30;

                CTX.beginPath();
                CTX.strokeStyle = '#FDFFFC';
                CTX.lineWidth = 2;

                CTX.moveTo(from.x, from.y);

                for (let i = 0; i <= ITERATIONS_PER_SEGMENT; i++) {
                    let t = i / ITERATIONS_PER_SEGMENT;
                    let pos = this.#positionAt(from, to, t);
                    CTX.lineTo(pos.x, pos.y);
                }

                CTX.stroke();
            }
        }

        for (let n of this.#nodes)
            n.render();
    }
}

class ControlNode extends Circle {
    constructor(pos, handleDir=Vec2.left, handleDist=100) {
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