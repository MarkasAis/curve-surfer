class Editor {
    constructor(scene, camera) {
        this.scene = scene;

        this.contexts = {};
        this.contexts[Editor.ContextType.DEFAULT] = new DefaultContext(this);
        this.contexts[Editor.ContextType.SPLINE] = new SplineContext(this);

        this.currentContext = Editor.ContextType.DEFAULT;

        this.camera = camera;
        this.cameraController = new EditorCameraController(this.camera);
    }

    getCurrentContext() {
        return this.contexts[this.currentContext];
    }

    update(deltaTime) {
        this.getCurrentContext().update(deltaTime);
        this.cameraController.update(deltaTime);
    }

    render() {
        for (let obj of this.scene.objects)
        obj.renderEditor(this.camera);
    }

    getMouseWorldPos() {
        return this.camera.canvasPosToWorld(Input.getMousePos(this.camera.canvas));
    }

    select(pos, shouldSwitchContext=true) {
        for (let obj of this.scene.objects) {
            let res = obj.select(pos);
            if (res) {
                let requiredContext = res.customEditor != undefined ? res.customEditor : Editor.ContextType.DEFAULT;
                if (shouldSwitchContext && this.switchContext(requiredContext, res)) return null;
                return res;
            }
        }

        if (shouldSwitchContext)
            this.switchContext(Editor.ContextType.DEFAULT, null);
        
        return null;
    }

    switchContext(type, obj) {
        if (this.currentContext == type) return false;

        this.getCurrentContext().onEnd();
        this.currentContext = type;
        this.getCurrentContext().onBegin(obj);
        return true;
    }
}

Editor.ContextType = {
    DEFAULT: 0,
    SPLINE: 1
}

/*
context
- onSwitch

defaultContext

splineContext


editor
 - contexts { type: context }
 - switchContext(selection)
 - update() - updates current context


selection
- object
- context

select(pos) {}
*/