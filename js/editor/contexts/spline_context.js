class SplineContext extends DefaultContext {

    selectedControl = null;

    setSelectedControl(control) {
        if (this.selectedControl) this.selectedControl.showHandles = false;
        this.selectedControl = control;
        if (this.selectedControl) this.selectedControl.showHandles = true;
    }

    primaryAction() {
        if (this.selectedControl && Input.getKeyDown('Shift')) {
            if (this.attemptExtendSpline()) return;
        } 

        this.attemptSelect();
    }

    secondaryAction() {
        let mousePos = this.editor.getMouseWorldPos();
        this.select(null);

        let target = this.editor.select(mousePos, false);
        if (target instanceof ControlNode) {
            target.spline.multispline.removeNode(target);
        }
    }

    getCurrentSpline() {
        if (!this.selectedControl) return null;
        return this.selectedControl.spline.multispline;
    }

    attemptExtendSpline() {
        let mousePos = this.editor.getMouseWorldPos();
        let target = this.editor.select(mousePos, false);

        let spline = this.getCurrentSpline();

        if (target && target instanceof ControlNode) {
            if (!this.selectedControl.isInner() && !target.isInner()) {
                spline.connectNodes(this.selectedControl, target);
                this.select(target);
                return true;
            }
        } else if (!this.selectedControl.isInner()) {
            let newNode = spline.addNodeConnected(mousePos, this.selectedControl);
            this.select(newNode);
            return true;
        }
        
        return false;
    }

    select(obj) {
        super.select(obj);

        if (!obj) this.setSelectedControl(null);
        else if (obj instanceof ControlNode) this.setSelectedControl(obj);
    }

    onEnd() {
        this.setSelectedControl(null);
    }

}