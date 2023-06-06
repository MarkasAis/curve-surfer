let canvas = document.querySelector('#canvas');
canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

Input.init();

let scene = new Scene();
let camera = new Camera(canvas);
let editor = new Editor(scene, camera);

camera.position = new Vec2(10, 10);
camera.zoom = 20;

class CustomLine extends GameObject {
    constructor(from, to) {
        super();
        this.radius = 1;

        this.fromHandle = new Circle(from, this.radius);
        this.toHandle = new Circle(to, this.radius, { stroke: '#fff', strokeWidth: 2 });

        this.b = null;

        this.adjustedPos = null;
    }

    getFrom() {
        return this.fromHandle._position;
    }

    getTo() {
        return this.toHandle._position;
    }

    select(pos) {
        return this.fromHandle.select(pos) || this.toHandle.select(pos);
    }

    update(deltaTime) {
        let from = this.getFrom();
        let to = this.getTo();

        this.adjustedPos = null;

        let res = spline.nearest(to);
        this.b = res.pos;

        if (res.distSq <= this.radius*this.radius) {

            let dir = Vec2.sub(from, to).normalized;
            let toHit = Vec2.sub(res.pos, to);
            let proj = Vec2.dot(dir, toHit);

            let projected = Vec2.add(to, Vec2.mult(dir, proj));
            let sqProjToHit = Vec2.squareDistance(projected, res.pos);
            let offset = Math.sqrt(this.radius*this.radius - sqProjToHit);

            this.adjustedPos = Vec2.add(projected, Vec2.mult(dir, offset));
        }


    }

    render(camera) {
        camera.arrow(this.getFrom(), this.getTo(), { stroke: '#fff', strokeWidth: 2, arrowOffset: 0.3 });
        this.fromHandle.render(camera);
        this.toHandle.render(camera);
        
        if (this.b) camera.circle(this.b, 0.2, { fill: '#ff0000' });

        if (this.adjustedPos) {
            camera.circle(this.adjustedPos, this.radius, { stroke: '#ff0000', strokeWidth: 2 });
        }
    }
}




let spline = new MultiSpline();
let p1 = spline.addNode(new Vec2(5, 5));
let p2 = spline.addNode(new Vec2(15, 15));
spline.connectNodes(p1, p2);

let player = new Player(new Vec2(10, 15));

let customLine = new CustomLine(new Vec2(7, 15), new Vec2(13, 5));

scene.add(spline);
scene.add(customLine);

let b = null;

function update(deltaTime) {
    Input.update();
    editor.update(deltaTime);
    customLine.update(deltaTime);
}

function render() {
    camera.clear('#011627');
    editor.render();
}

const timer = new Timer(update, render);
timer.start();