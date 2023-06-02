class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.position = Vec2.ZERO;
        this.zoom = 1;
        this.verticalZoom = true;
    }

    clear(color) {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    circle(pos, radius, { fill, stroke }) {
        pos = this.worldPosToCanvas(pos);
        radius = this.worldScaleToCanvas(radius);

        this.#setColors(fill, stroke);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.#draw(fill, stroke);
    }

    rect(pos, size) {
        pos = this.worldPosToCanvas(pos);
        size = this.worldScaleToCanvas(size);

        let start = Vec2.sub(pos, Vec2.mult(size, 0.5));

        this.ctx.beginPath();
        this.ctx.rect(start.x, start.y, size.x, size.y);
    }

    #setColors(fill, stroke) {
        if (fill) this.ctx.fillStyle = fill;
        if (stroke) this.ctx.strokeStyle = stroke;
    }

    #draw(fill, stroke) {
        if (fill) this.ctx.fill();
        if (stroke) this.ctx.stroke();
    }

    worldPosToCanvas(pos) {
        pos = Vec2.mult(Vec2.sub(pos, this.position), 1/this.zoom);

        if (this.verticalZoom) {
            let ratio = this.canvas.width / this.canvas.height;
            return new Vec2(
                Maths.map(-0.5*ratio, 0.5*ratio, 0, this.canvas.width, pos.x),
                Maths.map(-0.5, 0.5, this.canvas.height, 0, pos.y)
            );
        } else {
            let ratio = this.canvas.height / this.canvas.width;
            return new Vec2(
                Maths.map(-0.5, 0.5, 0, this.canvas.width, pos.x),
                Maths.map(-0.5*ratio, 0.5*ratio, this.canvas.height, 0, pos.y)
            );
        }
    }

    worldScaleToCanvas(scale) {
        if (scale instanceof Vec2) {
            return new Vec2(
                this.worldScaleToCanvas(scale.x),
                this.worldScaleToCanvas(scale.y)
            );
        }

        let unit = this.verticalZoom ? this.canvas.height : this.canvas.width;
        return Maths.map(0, this.zoom, 0, unit, scale);
    }
}