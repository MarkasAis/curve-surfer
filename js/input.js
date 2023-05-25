class Input {
    static #keyStates = {};
    static #mouseStates = {};
    static #mouseClientPos = Vec2.zero;
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
        })

        document.addEventListener('mouseup', e => {
            let state = Input.#getMouseState(e.button);
            state.isDown = false;
            state.upFrame = Input.#currentFrame+1;
        })
    }

    static update() {
        Input.#currentFrame++;
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
}

Input.MouseButton = {
    LEFT: 0,
    RIGHT: 2
}