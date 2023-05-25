class Spline {
    #points;

    constructor(pos) {
        this.#points = [];
    }

    addPointLast(pos) {
        let newPoint = new ControlPoint(pos);
        newPoint.isLast = true;

        if (this.#points.length > 0) {
            this.#points[this.#points.length-1].isLast = false;
        } else {
            newPoint.isFirst = true;
        }

        this.#points.push(newPoint);
        return newPoint;
    }

    positionAt(t) {
        let fromIndex = Math.trunc(t);
        let toIndex = fromIndex + 1;

        let p = t % 1;
        
        let p0 = this.#points[fromIndex].position;
        let p1 = this.#points[fromIndex].handleNext.position;
        let p2 = this.#points[toIndex].handlePrev.position;
        let p3 = this.#points[toIndex].position;

        let position = Vec2.addAll(
            p0,
            Vec2.mult(Vec2.add(Vec2.mult(p0, -3), Vec2.mult(p1, 3)), p),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, 3), Vec2.mult(p1, -6), Vec2.mult(p2, 3)), p*p),
            Vec2.mult(Vec2.addAll(Vec2.mult(p0, -1), Vec2.mult(p1, 3), Vec2.mult(p2, -3), p3), p*p*p)
        )

        return position;
    }

    /*
    P0 +
    t * (-3P0 + 3P1) +
    t^2 * (3P0 - 6P1 +3P2) +
    t^3 * (-P0 + 3P1 - 3P2 + P3)
    */

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
            const start = this.#points[0].position;
            CTX.moveTo(start.x, start.y);

            for (let i = 1; i < iterations; i++) {
                let t = i/ITERATIONS_PER_SEGMENT;
                let pos = this.positionAt(t);
                CTX.lineTo(pos.x, pos.y);
            }

            const end = this.#points[this.#points.length-1].position;
            CTX.lineTo(end.x, end.y);
            CTX.strokeStyle = '#000000';
            CTX.stroke();

            for (let p of this.#points)
                p.render();
        }
    }


}

class Circle {
    constructor(pos, radius) {
        this.position = pos;
        this.radius = radius;
        this.isSelected = false;
    }

    select(pos) {
        if (Vec2.squareDistance(this.position, pos) <= this.radius*this.radius)
            return this;

        return null;
    }
}

class ControlPoint extends Circle {
    constructor(pos) {
        super(pos, 10);
        this.handlePrev = new Handle(this, Vec2.add(this.position, Vec2.left.mult(100)));
        this.handleNext = new Handle(this, Vec2.add(this.position, Vec2.right.mult(100)));
        this.isFirst = false;
        this.isLast = false;
    }

    select(pos) {
        let selectPoint = super.select(pos);
        if (selectPoint) return selectPoint;

        selectPoint = this.handlePrev.select(pos);
        if (selectPoint) return selectPoint;

        return this.handleNext.select(pos);
    }

    render() {
        CTX.beginPath();
        CTX.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        CTX.fillStyle = this.isSelected ? '#00dddd' : '#000000';
        CTX.fill();

        this.handlePrev.render();
        this.handleNext.render();
    }
}

class Handle extends Circle {
    constructor(control, pos) {
        super(pos, 10);
        this.control = control;
    }

    render() {
        CTX.beginPath();
        CTX.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        CTX.strokeStyle = this.isSelected ? '#00dddd' : '#000000';
        CTX.stroke();

        CTX.beginPath();
        CTX.moveTo(this.position.x, this.position.y);
        CTX.lineTo(this.control.position.x, this.control.position.y);
        CTX.stroke();
    }
}