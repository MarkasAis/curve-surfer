let canvas = document.querySelector('#canvas');
canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

Input.init();

let scene = new Scene();
let camera = new Camera(canvas);
let editor = new Editor(scene, camera);

camera.position = new Vec2(10, 10);
camera.zoom = 20;

class CustomLine {
    constructor(from, to) {
        this.from = new Circle(from, 0.3);
        this.to = new Circle(to, 0.3, { stroke: '#fff', strokeWidth: 2 });
    }

    select(pos) {
        return this.from.select(pos) || this.to.select(pos);
    }

    render(camera) {
        camera.arrow(this.from._position, this.to._position, { stroke: '#fff', arrowOffset: 0.3 });
        this.from.render(camera);
        this.to.render(camera);
    }
}




let spline = new MultiSpline();
let a = spline.addNode(new Vec2(5, 5));
let b = spline.addNode(new Vec2(15, 15));
spline.connectNodes(a, b);

let player = new Player(new Vec2(10, 15));

let customLine = new CustomLine(new Vec2(7, 15), new Vec2(13, 5));

scene.add(spline);
scene.add(customLine);

function update(deltaTime) {
    Input.update();
    editor.update(deltaTime);
}

function render() {
    camera.clear('#011627');
    scene.render(camera);
}

const timer = new Timer(update, render);
timer.start();