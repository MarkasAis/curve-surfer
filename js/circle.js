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

    render(deltaTime) {
        CTX.beginPath();
        CTX.fillStyle = '#e40066';
        CTX.lineWidth = 3;
        CTX.arc(this._position.x, this._position.y, this.radius*0.7, 0, Math.PI * 2);
        CTX.fill();
    }
}