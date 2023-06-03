class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');

        this.position = Vec2.ZERO;
        this.zoom = 1;
        this.verticalZoom = true;

        this.fill = false;
        this.stroke = false;
    }

    setFillColor(color) {
        if (color) {
            this.fill = true;
            this.ctx.fillStyle = color;
        } else {
            this.fill = false;
        }
    }

    setStrokeColor(color) {
        if (color) {
            this.stroke = true;
            this.ctx.strokeStyle = color;
        } else {
            this.stroke = false;
        }
    }

    setStrokeWidth(width) {
        this.ctx.lineWidth = width;
    }

    setStyle(style) {
        if (!style) return;

        this.setFillColor(style.fill);
        this.setStrokeColor(style.stroke);
        if (style.strokeWidth != undefined) this.setStrokeWidth(style.strokeWidth);
    }

    clear(color) {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    circle(pos, radius, style) {
        pos = this.worldPosToCanvas(pos);
        radius = this.worldScaleToCanvas(radius);

        this.setStyle(style);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.#draw();
    }

    rect(pos, size, style) {
        pos = this.worldPosToCanvas(pos);
        size = this.worldScaleToCanvas(size);

        let start = Vec2.sub(pos, Vec2.mult(size, 0.5));

        this.setStyle(style);
        this.ctx.beginPath();
        this.ctx.rect(start.x, start.y, size.x, size.y);
        this.#draw();
    }

    bounds(min, max, style) {
        let pos = Vec2.mult(Vec2.add(min, max), 0.5);
        let size = Vec2.sub(max, min);
        this.rect(pos, size, style);
    }

    arrow(from, to, style) {
        this.setStyle(style);
        this.line(from, to);

        let offset = style.arrowOffset != undefined ? style.arrowOffset : 0;
        let angle = style.arrowAngle != undefined ? style.arrowAngle : 30;
        let length = style.arrowLength != undefined ? style.arrowLength : 0.3;
        
        let dir = Vec2.sub(from, to).normalized;
        let side = Vec2.mult(dir, length);
        let mid = Vec2.add(to, Vec2.mult(dir, offset));
        let left = Vec2.add(mid, Vec2.rotateByDeg(side, angle));
        let right = Vec2.add(mid, Vec2.rotateByDeg(side, -angle));

        this.poly([left, mid, right], false);
    }

    poly(positions, loop, style) {
        this.setStyle(style);
        this.ctx.beginPath();

        let start = this.worldPosToCanvas(positions[0]);
        this.ctx.moveTo(start.x, start.y);

        for (let i = 1; i < positions.length; i++) {
            let pos = this.worldPosToCanvas(positions[i]);
            this.ctx.lineTo(pos.x, pos.y);
        }

        if (loop) this.ctx.lineTo(start.x, start.y);
        this.#draw();
    }

    line(from, to, style) {
        from = this.worldPosToCanvas(from);
        to = this.worldPosToCanvas(to);

        this.setStyle(style);
        this.ctx.beginPath();

        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.#draw();
    }

    #draw() {
        if (this.fill) this.ctx.fill();
        if (this.stroke) this.ctx.stroke();
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

    canvasPosToWorld(pos) {
        if (this.verticalZoom) {
            let ratio = this.canvas.width / this.canvas.height;
            pos = new Vec2(
                Maths.map(0, this.canvas.width, -0.5*ratio, 0.5*ratio, pos.x),
                Maths.map(this.canvas.height, 0, -0.5, 0.5, pos.y)
            );
        } else {
            let ratio = this.canvas.height / this.canvas.width;
            pos = new Vec2(
                Maths.map(0, this.canvas.width, -0.5, 0.5, pos.x),
                Maths.map(this.canvas.height, 0, -0.5*ratio, 0.5*ratio, pos.y)
            );
        }

        pos = Vec2.add(Vec2.mult(pos, this.zoom), this.position)
        return pos;
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