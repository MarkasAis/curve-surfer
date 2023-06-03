class Input {
    static #keyStates = {};
    static #mouseStates = {};
    static #mouseClientPos = Vec2.ZERO;
    static #gesture = {
        zoom: 0,
        move: Vec2.ZERO
    };
    static #nextGesture = {
        zoom: 0,
        move: Vec2.ZERO
    };
    static #currentFrame = 0;

    static #getKeyState(key) {
        if (!Input.#keyStates[key]) Input.#keyStates[key] = {
            isDown: false,
            downFrame: -1,
            upFrame: -1
        }

        return Input.#keyStates[key];
    }

    static #getMouseState(button) {
        if (!Input.#mouseStates[button]) Input.#mouseStates[button] = {
            isDown: false,
            downFrame: -1,
            upFrame: -1
        }

        return Input.#mouseStates[button];
    }

    static init() {
        // Setup keyboard
        document.addEventListener('keydown', e => {
            let state = Input.#getKeyState(e.key);
            state.isDown = true;
            state.downFrame = Input.#currentFrame+1;
        });

        document.addEventListener('keyup', e => {
            let state = Input.#getKeyState(e.key);
            state.isDown = false;
            state.upFrame = Input.#currentFrame+1;
        });

        // Setup mouse
        document.addEventListener('mousemove', e => {
            Input.#mouseClientPos = new Vec2(e.clientX, e.clientY);
        });

        document.addEventListener('mousedown', e => {
            let state = Input.#getMouseState(e.button);
            state.isDown = true;
            state.downFrame = Input.#currentFrame+1;
        });

        document.addEventListener('mouseup', e => {
            let state = Input.#getMouseState(e.button);
            state.isDown = false;
            state.upFrame = Input.#currentFrame+1;
        });

        // Setup wheel
        document.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.ctrlKey) {
                Input.#nextGesture.zoom += e.deltaY;
            } else {
                Input.#nextGesture.move.x += e.deltaX;
                Input.#nextGesture.move.y -= e.deltaY;
            }
        }, {passive: false});
    }

    static update() {
        Input.#currentFrame++;

        Input.#gesture.zoom = Input.#nextGesture.zoom;
        Input.#gesture.move.copy(Input.#nextGesture.move);

        Input.#nextGesture.zoom = 0;
        Input.#nextGesture.move.x = 0;
        Input.#nextGesture.move.y = 0;
    }

    static getKeyDown(key) {
        return Input.#getKeyState(key).isDown;
    }

    static getMouseButtonDown(button) {
        return Input.#getMouseState(button).isDown;
    }

    static getKeyDownThisFrame(key) {
        return Input.#getKeyState(key).downFrame == Input.#currentFrame;
    }

    static getKeyUpThisFrame(key) {
        return Input.#getKeyState(key).upFrame == Input.#currentFrame;
    }

    static getMouseButtonDownThisFrame(button) {
        return Input.#getMouseState(button).downFrame == Input.#currentFrame;
    }

    static getMouseButtonUpThisFrame(button) {
        return Input.#getMouseState(button).upFrame == Input.#currentFrame;
    }

    static getMousePos(canvas) {
        return Utils.mousePosOnCanvas(canvas, Input.#mouseClientPos);
    }

    static getMousePosNormalized(canvas) {
        let pos = Utils.mousePosOnCanvas(canvas, Input.#mouseClientPos);
        return new Vec2(
            Maths.map(0, canvas.width, -1, 1, pos[0]),
            Maths.map(0, canvas.height, 1, -1, pos[1])
        );
    }

    static getGesture(type) {
        switch(type) {
            case Input.Gesture.ZOOM:
                return this.#gesture.zoom;
            case Input.Gesture.MOVE:
                return this.#gesture.move;
        }
    }
}

Input.MouseButton = {
    LEFT: 0,
    RIGHT: 2
};

Input.Gesture = {
    ZOOM: 0,
    MOVE: 1
};