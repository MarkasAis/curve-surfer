function assert(condition, message) {
    console.assert(condition, message);
}

class Utils {
    static regexIndexOf(str, regex, offset=0) {
        let index = str.substr(offset).search(regex);
        if (index >= 0) index += offset;
        return index;
    }

    // Adapted from: https://stackoverflow.com/a/17130415/16787998
    static mousePosOnCanvas(canvas, pos) {
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;

        return new Vec2(
            (pos.x - rect.left) * scaleX,
            (pos.y - rect.top) * scaleY
        );
    }

    static initArray(value, ...dimensions) {
        if (dimensions.length == 0) return value;

        let arr = new Array(dimensions[0]);
        for (let i = 0; i < arr.length; i++)
            arr[i] = this.initArray(value, ...dimensions.slice(1));

        return arr;
    }

    static randomSample(arr, n) {
        let shuffled = [...arr];
        shuffled.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    }
}