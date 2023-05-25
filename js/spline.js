class Spline {
    #points;

    constructor(pos) {
        this.#points = [];
    }

    addPointFirst(pos) {
        if (this.#points.length == 0) return this.#addPointEmpty(pos);

        let nextPoint = this.#points[0];
        nextPoint.isFirst = false;

        let dir = Vec2.sub(pos, nextPoint._position).normalized;

        let newPoint = new ControlPoint(pos, dir);
        newPoint.isFirst = true;

        this.#points.unshift(newPoint);
        return newPoint;
    }

    #addPointEmpty(pos) {
        if (this.#points.length > 0) return null;

        let newPoint = new ControlPoint(pos);
        newPoint.isFirst = true;
        newPoint.isLast = true;

        this.#points.push(newPoint);
        return newPoint;
    }

    addPointLast(pos) {
        if (this.#points.length == 0) return this.#addPointEmpty(pos);

        let prevPoint = this.#points[this.#points.length-1];
        prevPoint.isLast = false;

        let dir = Vec2.sub(prevPoint._position, pos).normalized;

        let newPoint = new ControlPoint(pos, dir);
        newPoint.isLast = true;

        this.#points.push(newPoint);
        return newPoint;
    }

    positionAt(t) {
        let fromIndex = Math.trunc(t);
        let toIndex = fromIndex + 1;

        let p = t % 1;
        
        let p0 = this.#points[fromIndex]._position;
        let p1 = this.#points[fromIndex].handleNext._position;
        let p2 = this.#points[toIndex].handlePrev._position;
        let p3 = this.#points[toIndex]._position;

        let position = Vec2.addAll(
            p0,
            Vec2.mult(Vec2.add(Vec2.mult(p0, -3), Vec2.mult(p1, 3)), p),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, 3), Vec2.mult(p1, -6), Vec2.mult(p2, 3)), p*p),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, -1), Vec2.mult(p1, 3), Vec2.mult(p2, -3), p3), p*p*p)
        )

        return position;
    }

    select(pos) {
        for (let p of this.#points) {
            let selectPoint = p.select(pos);
            if (selectPoint) return selectPoint;
        }
        return null;
    }

    render(deltaTime) {
        const ITERATIONS_PER_SEGMENT = 30;
        let segmentCount = this.#points.length - 1;
        let iterations = ITERATIONS_PER_SEGMENT * segmentCount;


        if (this.#points.length > 0) {
            CTX.beginPath();
            const start = this.#points[0]._position;
            CTX.moveTo(start.x, start.y);

            for (let i = 1; i < iterations; i++) {
                let t = i/ITERATIONS_PER_SEGMENT;
                let pos = this.positionAt(t);
                CTX.lineTo(pos.x, pos.y);
            }

            const end = this.#points[this.#points.length-1]._position;
            CTX.lineTo(end.x, end.y);
            CTX.strokeStyle = '#FDFFFC';
            CTX.lineWidth = 1;
            CTX.stroke();

            for (let p of this.#points)
                p.render();
        }
    }


}

class Circle {
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

class ControlPoint extends Circle {
    constructor(pos, handleDir=Vec2.left) {
        super(pos, 10);

        
        let handlePrevPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, 100));
        let handleNextPos = Vec2.add(this._position, Vec2.mult(handleDir.normalized, -100));

        this.handlePrev = new Handle(this, handlePrevPos);
        this.handleNext = new Handle(this, handleNextPos);
        
        this.isFirst = false;
        this.isLast = false;
        this.isActive = false;
        this.showHandles = false;
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
        CTX.arc(this._position.x, this._position.y, this.radius*0.7, 0, Math.PI * 2);
        CTX.fillStyle = '#FDFFFC';
        CTX.fill();

        if (this.isActive) {
            CTX.strokeStyle = '#ff9f1c';
            CTX.lineWidth = 3;
            CTX.stroke(); 
        }

        if (this.showHandles) {
            if (!this.isFirst) this.handlePrev.render();
            if (!this.isLast) this.handleNext.render();
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

    render() {
        CTX.beginPath();
        CTX.arc(this._position.x, this._position.y, this.radius*0.5, 0, Math.PI * 2);
        CTX.strokeStyle = '#FDFFFC';
        CTX.lineWidth = 1;
        CTX.stroke();

        CTX.beginPath();
        CTX.moveTo(this._position.x, this._position.y);
        CTX.lineTo(this.control._position.x, this.control._position.y);
        CTX.stroke();
    }
}