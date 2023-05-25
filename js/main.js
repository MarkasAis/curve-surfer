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
// s.addPointLast(new Vec2(100, 100));
s.addPointLast(new Vec2(300, 100));
s.addPointLast(new Vec2(300, 300));
// s.addPoint(new Vec2(600, 300));

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

        dragObject = s.select(mousePos);

        if (dragObject) {
            if (dragObject instanceof ControlPoint)
            setSelectedAnchor(dragObject);

            // setSelectedAnchor(null);
            // setActiveAnchor(null);

            dragOffset = Vec2.sub(dragObject.getPosition(), mousePos);
        } else {

            if (Input.getKeyDown('Control')) {

                if (selectedAnchor && (selectedAnchor.isFirst || selectedAnchor.isLast)) {
                    let newPoint = null;
                    if (selectedAnchor.isFirst) newPoint = s.addPointFirst(mousePos);
                    else newPoint = s.addPointLast(mousePos);
                    
                    setSelectedAnchor(newPoint);
                    // setActiveAnchor(newPoint);
                } else {
                    setSelectedAnchor(null);
                }

            } else {
                setSelectedAnchor(null);
            }
        }
    }

    if (dragObject) {
        let mousePos = Input.getMousePos(CANVAS);

        if (!isDragging && Vec2.squareDistance(dragStart, mousePos) > DRAG_THRESHOLD*DRAG_THRESHOLD) {
            isDragging = true;
            // setSelectedAnchor(dragObject);
        }

        dragObject.setPosition(Vec2.add(mousePos, dragOffset));
    }

    if (Input.getMouseButtonUpThisFrame(Input.MouseButton.LEFT)) {
        // if (dragObject && !isDragging) {
        //     if (dragObject instanceof ControlPoint) {
        //         if (dragObject.isFirst || dragObject.isLast) {
        //             // setActiveAnchor(dragObject);
        //         }
        //     }

        //     // setSelectedAnchor(dragObject);
        // }

        
        
        dragObject = null;
        isDragging = false;
    }

    // if (Input.getMouseButtonDownThisFrame(Input.MouseButton.RIGHT)) {
    //     setSelectedAnchor(null);
    //     // setActiveAnchor(null);
    // }
}

function render(deltaTime) {
    CTX.fillStyle = '#011627';
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
    s.render(deltaTime);
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