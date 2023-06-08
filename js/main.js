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
        this.toHandle = new Circle(to, this.radius, { stroke: '#fffffff99', strokeWidth: 2 });

        this.a = null;
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
        
    }

    renderBounce(from, to) { 
        let collision = Collision.collide(spline, from, to, this.radius);
        if (!collision) {
            // out
            camera.arrow(from, to, { stroke: '#00ff00', strokeWidth: 2, arrowStartOffset: this.radius, arrowEndOffset: this.radius });

            // out obj
            camera.circle(to, this.radius, { stroke: '#fff', strokeWidth: 2 });
        } else {
            let nextPos = Vec2.add(collision.objPos, collision.outTranslation);

            // in
            camera.arrow(from, collision.objPos, { stroke: '#00ff00', strokeWidth: 2, arrowStartOffset: this.fromHandle.radius, arrowEndOffset: this.radius });

            // normal
            camera.arrow(collision.hitPos, Vec2.add(collision.hitPos, collision.hitNormal), { stroke: '#00ff00', strokeWidth: 2 });

            
            // hit
            camera.circle(collision.hitPos, 0.2, { fill: '#00ff00' });

            // obj
            camera.circle(collision.objPos, this.radius, { stroke: '#00ff00', strokeWidth: 2 });

            
        
            this.renderBounce(collision.objPos, nextPos);
        }
    }

    render(camera) {
        camera.arrow(this.getFrom(), this.getTo(), { stroke: '#ffffff99', strokeWidth: 2, arrowStartOffset: this.fromHandle.radius, arrowEndOffset: this.toHandle.radius });
        this.fromHandle.render(camera);
        this.toHandle.render(camera);
        
        let from = this.getFrom();
        let to = this.getTo();

        this.renderBounce(from, to);
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