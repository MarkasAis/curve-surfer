const CANVAS = document.querySelector('#canvas');
const CTX = CANVAS.getContext('2d');

const DRAG_THRESHOLD = 5;

let pos = {x: 0, y: 0};
let selected = null;
let selectOffset;
let dragStart;
let activeAnchor = null;

let s = new Spline();
// s.addPointLast(new Vec2(100, 100));
s.addPointLast(new Vec2(300, 100));
s.addPointLast(new Vec2(300, 300));
// s.addPoint(new Vec2(600, 300));

CANVAS.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

Input.init();

function update(deltaTime) {
    Input.update();

    if (Input.getMouseButtonDownThisFrame(Input.MouseButton.LEFT)) {
        let mousePos = Input.getMousePos(CANVAS);
        dragStart = mousePos;

        selected = s.select(mousePos);
        if (selected) {
            selectOffset = Vec2.sub(selected.position, mousePos);

            if (activeAnchor) {
                activeAnchor.isSelected = false;
                activeAnchor = null;
            }

            if (selected instanceof ControlPoint) {
                activeAnchor = selected;
                activeAnchor.isSelected = true;
            }

        } else {
            if (activeAnchor && activeAnchor.isLast) {
                activeAnchor.isSelected = false;
                activeAnchor = s.addPointLast(mousePos);
                activeAnchor.isSelected = true;
            }
        }


        
        

        
    }

    

    if (selected) {
        let mousePos = Input.getMousePos(CANVAS);
        if (Vec2.squareDistance(dragStart, mousePos) > DRAG_THRESHOLD*DRAG_THRESHOLD) {
            if (activeAnchor) {
                activeAnchor.isSelected = false;
                activeAnchor = false;
            }
        }

        selected.position = Vec2.add(mousePos, selectOffset);
    }

    if (Input.getMouseButtonUpThisFrame(Input.MouseButton.LEFT)) {
        if (selected) {
            selected = null;
        }
    }

    if (Input.getMouseButtonUpThisFrame(Input.MouseButton.RIGHT)) {
        if (activeAnchor) {
            activeAnchor.isSelected = false;
            activeAnchor = null;
        }
    }
}

function render(deltaTime) {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    s.render(deltaTime);
}

const UPDATES_PER_SECOND = 30;
const PAUSE_THRESHOLD = 1;
let secondsPerUpdate = 1 / UPDATES_PER_SECOND;
let lastTime = null;
let accumulator = 0;

function gameLoop(time) {
    const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;

    if (deltaTime >= PAUSE_THRESHOLD) return;
    accumulator += deltaTime;

    while (accumulator >= secondsPerUpdate) {
        update(secondsPerUpdate);
        accumulator -= secondsPerUpdate;
    }

    render(deltaTime);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);