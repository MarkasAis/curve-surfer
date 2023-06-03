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

    render(camera) {
        camera.circle(this._position, this.radius, { fill: '#e40066' });
    }
}