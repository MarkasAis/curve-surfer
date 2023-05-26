class Spline {
    #nodes = [];

    addNode(pos) {
        let node = new ControlNode(pos);
        this.#nodes.push(node);
        return node;
    }

    removeNode(node) {
        if (node.nodePrev) node.nodePrev.nodeNext = node.nodeNext;
        if (node.nodeNext) node.nodeNext.nodePrev = node.nodePrev;
        this.#nodes = this.#nodes.filter(n => n != node);
    }

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

    // addPointFirst(pos) {
    //     if (this.#points.length == 0) return this.#addPointEmpty(pos);

    //     let nextPoint = this.#points[0];
    //     nextPoint.isFirst = false;

    //     let handleDir = Vec2.sub(pos, nextPoint._position).normalized;
    //     let handleDist = Vec2.dist(pos, nextPoint._position) * 0.5;

    //     let newPoint = new ControlNode(pos, handleDir, handleDist);
    //     newPoint.isFirst = true;

    //     this.#points.unshift(newPoint);
    //     return newPoint;
    // }

    // #addPointEmpty(pos) {
    //     if (this.#points.length > 0) return null;

    //     let newPoint = new ControlNode(pos);
    //     newPoint.isFirst = true;
    //     newPoint.isLast = true;

    //     this.#points.push(newPoint);
    //     return newPoint;
    // }

    // addPointLast(pos) {
    //     if (this.#points.length == 0) return this.#addPointEmpty(pos);

    //     let prevPoint = this.#points[this.#points.length-1];
    //     prevPoint.isLast = false;

    //     let handleDir = Vec2.sub(prevPoint._position, pos).normalized;
    //     let handleDist = Vec2.dist(pos, prevPoint._position) * 0.5;

    //     let newPoint = new ControlNode(pos, handleDir, handleDist);
    //     newPoint.isLast = true;

    //     this.#points.push(newPoint);
    //     return newPoint;
    // }

    // close() {
    //     this.isClosed = true;
    //     if (this.#points.length > 0) {
    //         this.#points[0].isFirst = false;
    //         this.#points[this.#points.length-1].isLast = false;
    //     }
    // }

    // positionAt(t) {
    //     let fromIndex = Math.trunc(t);
    //     let toIndex = (fromIndex + 1) % this.#points.length;

    //     let p = t % 1;
        
    //     let p0 = this.#points[fromIndex]._position;
    //     let p1 = this.#points[fromIndex].handleNext._position;
    //     let p2 = this.#points[toIndex].handlePrev._position;
    //     let p3 = this.#points[toIndex]._position;

    //     let position = Vec2.addAll(
    //         p0,
    //         Vec2.mult(Vec2.add(Vec2.mult(p0, -3), Vec2.mult(p1, 3)), p),
    //         Vec2.mult(Vec2.addAll(Vec2.mult(p0, 3), Vec2.mult(p1, -6), Vec2.mult(p2, 3)), p*p),
    //         Vec2.mult(Vec2.addAll(Vec2.mult(p0, -1), Vec2.mult(p1, 3), Vec2.mult(p2, -3), p3), p*p*p)
    //     )

    //     return position;
    // }

    select(pos) {
        for (let n of this.#nodes) {
            let selectedNode = n.select(pos);
            if (selectedNode) return selectedNode;
        }
        return null;
    }

    render(deltaTime) {
        // const ITERATIONS_PER_SEGMENT = 30;
        // let segmentCount = this.#points.length - 1;
        // if (this.isClosed) segmentCount++;
        // let iterations = ITERATIONS_PER_SEGMENT * segmentCount;


        // if (this.#nodes.length > 0) {
            // CTX.beginPath();
            // CTX.strokeStyle = '#FDFFFC';
            // CTX.lineWidth = 2;

            // const start = this.#points[0]._position;
            // CTX.moveTo(start.x, start.y);

            // for (let i = 1; i < iterations; i++) {
            //     let t = i/ITERATIONS_PER_SEGMENT;
            //     let pos = this.positionAt(t);
            //     CTX.lineTo(pos.x, pos.y);
            // }

            // const end = this.isClosed ? start : this.#points[this.#points.length-1]._position;
            // CTX.lineTo(end.x, end.y);
            // CTX.stroke();

            
        // }

        for (let from of this.#nodes) {
            let to = from.nodeNext;
            if (to) {
                // line
                CTX.beginPath();
                CTX.strokeStyle = '#FDFFFC';
                CTX.lineWidth = 2;
                CTX.moveTo(from._position.x, from._position.y);
                CTX.lineTo(to._position.x, to._position.y);
                CTX.stroke();

                //arrow
                let dir = Vec2.sub(from._position, to._position).normalized;
                let offset = Vec2.mult(dir, 10 + 10);
                let mid = Vec2.add(to._position, Vec2.mult(dir, 10));
                let left = Vec2.add(to._position, Vec2.rotateByDeg(offset, 20));
                let right = Vec2.add(to._position, Vec2.rotateByDeg(offset, -20));

                CTX.beginPath();
                CTX.strokeStyle = '#FDFFFC';
                CTX.lineWidth = 2;
                CTX.moveTo(left.x, left.y);
                CTX.lineTo(mid.x, mid.y);
                CTX.lineTo(right.x, right.y);
                CTX.stroke();
            }
        }

        for (let n of this.#nodes)
            n.render();
    }


}

class Node {
    constructor(pos, radius) {
        this._position = pos;
        this.radius = radius;
    }

    getPosition() {
        return this._position;
    }

    setPosition(pos) {
        this._position = pos;
    }

    select(pos) {
        if (Vec2.squareDistance(this._position, pos) <= this.radius*this.radius)
            return this;

        return null;
    }
}

class ControlNode extends Node {
    constructor(pos, handleDir=Vec2.right, handleDist=100) {
        super(pos, 10);

        this.nodePrev = null;
        this.nodeNext = null;

        let handlePrevPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, handleDist));
        let handleNextPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, -handleDist));
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
        CTX.strokeStyle = '#f71735';
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

class Handle extends Node {
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
        CTX.strokeStyle = highlight ? '#f71735' : '#FDFFFC';
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