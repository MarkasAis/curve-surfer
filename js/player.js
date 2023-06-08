class Player extends Circle {
    constructor(pos) {
        super(pos, 0.5, { fill: '#e40066' });
        this.velocity = Vec2.ZERO;

        this.active = false;
    }

    update(deltaTime) {
        if (Input.getKeyDownThisFrame('s')) {
            this.active = !this.active;
            this.velocity = Vec2.ZERO;
        }

        if (!this.active) return;
        this.velocity.subY(0.1 * deltaTime);

        if (Input.getKeyDown(' ')) this.velocity.subY(0.5 * deltaTime);

        let res = Collision.move(spline, this._position, this.velocity, this.radius, 0.9);
        this.velocity = res.velocity;
        this._position = res.pos;

        // this._position.add(this.velocity);
    }
}