class DefaultContext {

    constructor(editor) {
        this.editor = editor;

        this.selectedObject = null;

        this.dragStart = null;
        this.dragOffset = null;
        this.isDragging = false;
        this.dragThreshold = 0.1;
    }

    update(deltaTime) {
        if (Input.getMouseButtonDownThisFrame(Input.MouseButton.LEFT))
            this.primaryAction();
    
        if (Input.getMouseButtonDown(Input.MouseButton.LEFT))
            this.drag();

        if (Input.getMouseButtonDownThisFrame(Input.MouseButton.RIGHT))
            this.secondaryAction();
    }

    primaryAction() {
        this.attemptSelect();
    }

    secondaryAction() {}

    attemptSelect() {
        let mousePos = this.editor.getMouseWorldPos();
        let res = this.editor.select(mousePos);
        this.select(res);
    }

    select(obj) {
        this.selectedObject = obj;

        if (this.selectedObject) {
            let mousePos = this.editor.getMouseWorldPos();

            this.dragStart = mousePos;
            this.dragOffset = Vec2.sub(this.selectedObject.getPosition(), mousePos);
            this.isDragging = false;
        }
    }

    drag() {
        if (this.selectedObject) {
            let mousePos = this.editor.getMouseWorldPos();
    
            if (!this.isDragging && Vec2.squareDistance(this.dragStart, mousePos) > this.dragThreshold*this.dragThreshold) {
                this.isDragging = true;
            }
    
            if (this.isDragging) {
                this.selectedObject.setPosition(Vec2.add(mousePos, this.dragOffset));
            }
        }
    }

    onBegin(obj) {
        this.select(obj);
    }

    onEnd() {}
}