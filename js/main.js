let canvas = document.querySelector('#canvas');
canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }
let camera = new Camera(canvas);

Input.init();

const DRAG_THRESHOLD = 3;

let isDragging;
let dragStart;
let dragOffset;
let dragObject = null;

let selectedAnchor = null;

let s = new MultiSpline();
let a = s.addNode(new Vec2(1, 1));
let b = s.addNode(new Vec2(3, 3));
s.connectNodes(a, b);

let player = new Player(new Vec2(300, 100));

function setSelectedAnchor(anchor) {
    if (selectedAnchor) selectedAnchor.showHandles = false;
    selectedAnchor = anchor;
    if (selectedAnchor) selectedAnchor.showHandles = true;
}

function update(deltaTime) {
    Input.update();

    let move = Vec2.mult(Input.getGesture(Input.Gesture.MOVE), 0.01);
    camera.position.add(move);

    let zoom = Input.getGesture(Input.Gesture.ZOOM) * 0.01;
    camera.zoom += zoom;
    if (camera.zoom < 0.1) camera.zoom = 0.1;

    if (Input.getMouseButtonDownThisFrame(Input.MouseButton.LEFT)) {
        let mousePos = camera.canvasPosToWorld(Input.getMousePos(canvas));

        dragStart = mousePos;
        isDragging = false;

        dragObject = player.select(mousePos);
        if (!dragObject) dragObject = s.select(mousePos);

        if (selectedAnchor && Input.getKeyDown('Shift')) {

            if (dragObject) {
                if (dragObject instanceof ControlNode && !selectedAnchor.isInner() && !dragObject.isInner()) {
                    s.connectNodes(selectedAnchor, dragObject);
                    setSelectedAnchor(dragObject);
                } else {
                    setSelectedAnchor(null);
                }
                dragObject = null;
            } else if (!selectedAnchor.isInner()) {
                let newNode = s.addNodeConnected(mousePos, selectedAnchor);
                setSelectedAnchor(newNode);
            } else {
                setSelectedAnchor(null);
            }

        }

        else if (dragObject) {
            if (dragObject instanceof ControlNode) {
                setSelectedAnchor(dragObject);
            } else if (!(dragObject instanceof Handle)) {
                setSelectedAnchor(null);
            }


            dragOffset = Vec2.sub(dragObject.getPosition(), mousePos);
        } else {
            setSelectedAnchor(null);
        }
    }

    if (dragObject) {
        let mousePos = camera.canvasPosToWorld(Input.getMousePos(canvas));

        if (!isDragging && Vec2.squareDistance(dragStart, mousePos) > DRAG_THRESHOLD*DRAG_THRESHOLD) {
            isDragging = true;
        }

        dragObject.setPosition(Vec2.add(mousePos, dragOffset));
    }

    if (Input.getMouseButtonUpThisFrame(Input.MouseButton.LEFT)) {
        dragObject = null;
        isDragging = false;
    }

    if (Input.getMouseButtonDownThisFrame(Input.MouseButton.RIGHT)) {
        let mousePos = camera.canvasPosToWorld(Input.getMousePos(canvas));
        setSelectedAnchor(null);

        let selected = s.select(mousePos);
        if (selected instanceof ControlNode)
            s.removeNode(selected);
    }
}

camera.position = new Vec2(2, 2);
camera.zoom = 3;

function render(deltaTime) {
    camera.clear('#011627');
    s.render(camera, deltaTime);

    let mousePos = Input.getMousePos(canvas);
    mousePos = camera.canvasPosToWorld(mousePos);
    let res = s.nearest(mousePos);
    if (res) s.renderPathInfo(camera, res.spline, res.t);

    // player.render(deltaTime);
}

const UPDATES_PER_SECOND = 60;
const PAUSE_THRESHOLD = 1;
let secondsPerUpdate = 1 / UPDATES_PER_SECOND;
let lastTime = null;
let accumulator = 0;

function gameLoop(time) {
    const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;

    if (deltaTime >= PAUSE_THRESHOLD) {
        requestAnimationFrame(gameLoop);
        return;
    }

    accumulator += deltaTime;

    while (accumulator >= secondsPerUpdate) {
        update(secondsPerUpdate);
        accumulator -= secondsPerUpdate;
    }

    render(deltaTime);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);