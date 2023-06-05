class EditorCameraController {
    constructor(camera) {
        this.camera = camera;
    }

    update(deltaTime) {
        let move = Vec2.mult(Input.getGesture(Input.Gesture.MOVE), 0.01);
        camera.position.add(move);

        let zoom = Input.getGesture(Input.Gesture.ZOOM) * 0.1;
        camera.zoom += zoom;
        if (camera.zoom < 0.1) camera.zoom = 0.1;
    }
}