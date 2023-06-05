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
        if (Input.getMouseButtonDownThisFrame(Input.MouseButton.LEFT)) {
            let mousePos = this.editor.getMouseWorldPos();
            this.selectedObject = this.editor.select(mousePos);
    
            if (this.selectedObject) {
                this.dragStart = mousePos;
                this.dragOffset = Vec2.sub(this.selectedObject.getPosition(), mousePos);
                this.isDragging = false;
            }
        }
    
        if (Input.getMouseButtonDown(Input.MouseButton.LEFT)) {
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
    }
}