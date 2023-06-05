class Circle {
    constructor(pos, radius=0.4, style={ fill: '#fff' }) {
        this._position = pos;
        this.radius = radius;
        this.style = style;
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
        camera.circle(this._position, this.radius, this.style);
    }
}