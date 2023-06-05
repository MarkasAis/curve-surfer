class Timer {
    constructor(updateCallback, renderCallback, updatesPerSecond=60, pauseThreshold=1) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.updatesPerSecond = updatesPerSecond;
        this.pauseThreshold = pauseThreshold;

        this.secondsPerUpdate = 1 / this.updatesPerSecond;

        this.loopHandle = null;
        this.lastTime = 0;
        this.accumulator = 0;
    }

    start() {
        this.lastTime = (new Date).getTime();
        this.accumulator = 0;
        this.requestLoop();
    }

    stop() {
        if (!this.loopHandle) return;
        cancelAnimationFrame(this.loopHandle);
        this.loopHandle = null;
    }

    requestLoop() {
        this.loopHandle = requestAnimationFrame(this.loop.bind(this));
    }

    loop(time) {
        const deltaTime = (time - this.lastTime) / 1000;

        if (deltaTime < this.pauseThreshold) {
            this.accumulator += deltaTime;
        
            while (this.accumulator >= this.secondsPerUpdate) {
                this.updateCallback(this.secondsPerUpdate);
                this.accumulator -= this.secondsPerUpdate;
            }
        
            this.renderCallback();
        }

        this.lastTime = time;
        this.requestLoop();
    }
}