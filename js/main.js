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

        this.a1 = null;
        this.a2 = null;

        this.b1 = null;
        this.b2 = null;

        this.test = null;
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
        this.updateA();
        this.updateB();
        this.updateC();
    }

    updateA() {
        let from = this.getFrom();
        let to = this.getTo();

        let res = spline.nearest2(from, to);
        this.a1 = res ? res.pos : null;
        this.a2 = null;

        if (res) {
            let otherDir = Vec2.sub(res.other.to, res.other.from).normalized
            let fc = Vec2.sub(from, res.other.from);
            let pr = Vec2.add(res.other.from, Vec2.mult(otherDir, Vec2.dot(otherDir, fc)));

            let ac = Vec2.dist(from, res.pos);
            let pc = Vec2.dist(from, pr);

            let v = Vec2.sub(to, from).normalized;

            this.a2 = Vec2.sub(res.pos, Vec2.mult(v, this.radius * ac/pc));
        }
    }

    updateB() {
        let from = this.getFrom();
        let to = this.getTo();
        
        let res = spline.nearest(to);
        this.b1 = res.pos;
        this.b2 = null;

        // if (res.distSq <= this.radius*this.radius) {

        //     let dir = Vec2.sub(from, to).normalized;
        //     let toHit = Vec2.sub(res.pos, to);
        //     let proj = Vec2.dot(dir, toHit);

        //     let projected = Vec2.add(to, Vec2.mult(dir, proj));
        //     let sqProjToHit = Vec2.squareDistance(projected, res.pos);
        //     let offset = Math.sqrt(this.radius*this.radius - sqProjToHit);

        //     this.b2 = Vec2.add(projected, Vec2.mult(dir, offset));
        // }

        if (res.distSq <= this.radius*this.radius) {
            let otherDir = Vec2.sub(res.other.to, res.other.from).normalized
            let fe = Vec2.sub(to, res.other.from);
            let pr2 = Vec2.add(res.other.from, Vec2.mult(otherDir, Vec2.dot(otherDir, fe)));

            let fs = Vec2.sub(from, res.other.from);
            let pr1 = Vec2.add(res.other.from, Vec2.mult(otherDir, Vec2.dot(otherDir, fs)));

            let d1 = Vec2.dist(from, pr1);
            let d2 = Vec2.dist(to, pr2);

            let t = Maths.inverseLerp(d2, d1, this.radius);

            let v = Vec2.sub(to, from);

            this.b2 = Vec2.sub(to, Vec2.mult(v, t));

            this.test = pr1;
        }
    }

    updateC() {

    }

    render(camera) {
        camera.arrow(this.getFrom(), this.getTo(), { stroke: '#fff', strokeWidth: 2, arrowOffset: 0.3 });
        this.fromHandle.render(camera);
        this.toHandle.render(camera);
        
        if (this.a1) camera.circle(this.a1, 0.2, { fill: '#00ff00' });
        if (this.b1) camera.circle(this.b1, 0.2, { fill: '#ff0000' });
        if (this.test) camera.circle(this.test, 0.2, { fill: '#ffff00' });

        if (this.a2) camera.circle(this.a2, this.radius, { stroke: '#00ff00', strokeWidth: 2 });
        if (this.b2) camera.circle(this.b2, this.radius, { stroke: '#ff0000', strokeWidth: 2 });
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