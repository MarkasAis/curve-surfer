class Player extends Circle {
    constructor(pos) {
        super(pos, 0.5);
        this.velocity = Vec2.ZERO;
    }

    update(deltaTime) {
        this.velocity.subY(0.25 * deltaTime);
        this._position.add(this.velocity);
    }
}