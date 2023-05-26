const CANVAS = document.querySelector('#canvas');
const CTX = CANVAS.getContext('2d');

const DRAG_THRESHOLD = 3;

let isDragging;
let dragStart;
let dragOffset;
let dragObject = null;

let selectedAnchor = null;
// let activeAnchor = null;

let s = new Spline();
let a = s.addNode(new Vec2(100, 100));
let b = s.addNode(new Vec2(300, 300));
s.connectNodes(a, b);

let player = new Player(new Vec2(300, 100));

CANVAS.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

Input.init();

// function setActiveAnchor(anchor) {
//     if (activeAnchor) activeAnchor.isActive = false;
//     activeAnchor = anchor;
//     if (activeAnchor) activeAnchor.isActive = true;
// } 

function setSelectedAnchor(anchor) {
    if (selectedAnchor) selectedAnchor.showHandles = false;
    selectedAnchor = anchor;
    if (selectedAnchor) selectedAnchor.showHandles = true;
}



function update(deltaTime) {
    Input.update();

    if (Input.getMouseButtonDownThisFrame(Input.MouseButton.LEFT)) {
        let mousePos = Input.getMousePos(CANVAS);

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
        let mousePos = Input.getMousePos(CANVAS);

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
        let mousePos = Input.getMousePos(CANVAS);
        setSelectedAnchor(null);

        let selected = s.select(mousePos);
        if (selected instanceof ControlNode)
            s.removeNode(selected);
    }
}

function render(deltaTime) {
    CTX.fillStyle = '#011627';
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
    s.render(deltaTime);

    player.render(deltaTime);
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