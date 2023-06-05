class Scene {
    constructor() {
        this.objects = [];
    }

    add(obj) {
        this.objects.push(obj);
    }

    render(camera) {
        for (let obj of this.objects)
            obj.render(camera);
    }
}