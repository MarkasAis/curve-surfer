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

        this.a = null;
        this.b = null;
        this.c = null;

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
        let from = this.getFrom();
        let to = this.getTo();

        this.a = spline.nearest(from, to, this.radius);
        this.b = spline.nearest2(from, to, this.radius);
        // this.c = spline.nearest3(from, to);
    }

    updateC() {
        let from = this.getFrom();
        let to = this.getTo();

        this.c1 = null;
        this.c2 = null;
        
        let res = spline.nearest3(from, to, this.radius);
        if (res) {
            this.c1 = res.pos;
            this.c2 = res.p;

            this.test = res.test;
        }
    }

    render(camera) {
        camera.arrow(this.getFrom(), this.getTo(), { stroke: '#fff', strokeWidth: 2, arrowOffset: 0.3 });
        this.fromHandle.render(camera);
        this.toHandle.render(camera);
        
        let from = this.getFrom();
        let to = this.getTo();

        let toPos = (t) => {
            let dir = Vec2.sub(to, from);
            return Vec2.add(from, Vec2.mult(dir, t));
        }

        let ren = (p, col) => {
            if (p) {
                camera.circle(p.hitPos, 0.2, { fill: col });
                camera.circle(toPos(p.t), this.radius, { stroke: col, strokeWidth: 2 });
            }
        }

        ren(this.a, '#ff0000');
        ren(this.b, '#00ff00');
        ren(this.c, '#0000ff');
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