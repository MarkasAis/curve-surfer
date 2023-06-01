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
        CTX.beginPath();
        CTX.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.#draw(fill, stroke);
    }

    #setColors(fill, stroke) {
        if (fill) CTX.fillStyle = fill;
        if (stroke) CTX.strokeStyle = stroke;
    }

    #draw(fill, stroke) {
        if (fill) CTX.fill();
        if (stroke) CTX.stroke();
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
        let unit = this.verticalZoom ? this.canvas.height : this.canvas.width;
        return Maths.map(0, this.zoom, 0, unit, scale);
    }
}