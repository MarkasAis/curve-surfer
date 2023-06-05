class SplineEditor {

    update(deltaTime) {
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
}