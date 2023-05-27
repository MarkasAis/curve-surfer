class Vec2 {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }

  add(vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      this.x += vectorOrScalar.x;
      this.y += vectorOrScalar.y;
    } else {
      this.x += vectorOrScalar;
      this.y += vectorOrScalar;
    }

    return this;
  }

  addX(scalar) {
    this.x += scalar;

    return this;
  }

  addY(scalar) {
    this.y += scalar;

    return this;
  }

  subtract(vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      this.x -= vectorOrScalar.x;
      this.y -= vectorOrScalar.y;
    } else {
      this.x -= vectorOrScalar;
      this.y -= vectorOrScalar;
    }

    return this;
  }

  subtractX(scalar) {
    this.x -= scalar;

    return this;
  }

  subtractY(scalar) {
    this.y -= scalar;

    return this;
  }

  multiply(vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      this.x *= vectorOrScalar.x;
      this.y *= vectorOrScalar.y;
    } else {
      this.x *= vectorOrScalar;
      this.y *= vectorOrScalar;
    }

    return this;
  }

  multiplyX(scalar) {
    this.x *= scalar;

    return this;
  }

  multiplyY(scalar) {
    this.y *= scalar;

    return this;
  }

  divide(vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      this.x /= vectorOrScalar.x;
      this.y /= vectorOrScalar.y;
    } else {
      this.x /= vectorOrScalar;
      this.y /= vectorOrScalar;
    }

    return this;
  }

  divideX(scalar) {
    this.x /= scalar;

    return this;
  }

  divideY(scalar) {
    this.y /= scalar;

    return this;
  }

  reflectX(scalar=0) {
      this.x = 2*scalar - this.x;

    return this;
  }

  reflectY(scalar=0) {
      this.y = 2*scalar - this.y;

    return this;
  }

  reflect(vector = {}) {
    this.reflectX(vector.x);
    this.reflectY(vector.y);

    return this;
  }

  distanceX(vector) {
    return vector.x - this.x;
  }

  distanceY(vector) {
    return vector.y - this.y;
  }

  squareDistance(vector) {
    let dx = this.distanceX(vector);
    let dy = this.distanceY(vector);

    return dx * dx + dy * dy;
  }

  distance(vector) {
    return Math.sqrt(this.squareDistance(vector));
  }

  normalize() {
    let mag = this.magnitude;

    if (mag === 0) {
      this.x = 1;
      this.y = 0;
    } else {
      this.divide(mag);
    }

    return this;
  }

  min(vector) {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);

    return this;
  }

  max(vector) {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);

    return this;
  }

  lerp(vector, t) {
    this.add(vector, this).multiply(t);

    return this;
  }

  angle(vector) {
    if (vector === undefined) {
      return Math.atan2(this.y, this.x)
    } else {
      return Math.atan2(this.distanceY(vector), this.distanceX(vector));
    }
  }

  angleDeg(vector) {
    return Maths.radToDeg(this.angle(vector));
  }

  rotateBy(angle) {
    let rotatedX = (this.x * Math.cos(angle)) - (this.y * Math.sin(angle));
    let rotatedY = (this.x * Math.sin(angle)) + (this.y * Math.cos(angle));

    this.x = rotatedX;
    this.y = rotatedY;

    return this;
  }

  rotateByDeg(angle) {
    this.rotateBy(Maths.degToRad(angle));

    return this;
  }

  rotateTo(angle) {
    let magnitude = this.magnitude;

    this.x = Math.cos(angle) * magnitude;
    this.y = Math.sin(angle) * magnitude;

    return this;
  }

  rotateToDeg(angle) {
    this.rotateTo(Maths.degToRad(angle));

    return this;
  }

  clampX(minX, maxX) {
    this.x = Maths.clamp(this.x, minX, maxX);

    return this;
  }

  clampY(minY, maxY) {
    this.y = Maths.clamp(this.y, minY, maxY);

    return this;
  }

  clamp(min, max) {
    this.clampX(min.x, max.x);
    this.clampY(min.y, min.y);

    return this;
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);

    return this;
  }

  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    return this;
  }

  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);

    return this;
  }

  toInt() {
    this.x = ~~this.x;
    this.y = ~~this.y;

    return this;
  }

  copy(vector) {
    this.x = vector.x;
    this.y = vector.y;

    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  equals(vector) {
    return this.x === vector.x && this.y === vector.y;
  }

  static addX(vector, scalar) {
    return new Vec2(vector.x + scalar, vector.y);
  }

  static addY(vector, scalar) {
    return new Vec2(vector.x, vector.y + scalar);
  }

  static add(vector, vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      return new Vec2(
        vector.x + vectorOrScalar.x,
        vector.y + vectorOrScalar.y
      );
    } else {
      return new Vec2(
        vector.x + vectorOrScalar,
        vector.y + vectorOrScalar
      );
    }
  }

  static subtractX(vector, scalar) {
    return new Vec2(vector.x - scalar, vector.y);
  }

  static subtractY(vector, scalar) {
    return new Vec2(vector.x, vector.y - scalar);
  }

  static subtract(vector, vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      return new Vec2(
        vector.x - vectorOrScalar.x,
        vector.y - vectorOrScalar.y
      );
    } else {
      return new Vec2(
        vector.x - vectorOrScalar,
        vector.y - vectorOrScalar
      );
    }
  }

  static multiplyX(vector, scalar) {
    return new Vec2(vector.x * scalar, vector.y);
  }

  static multiplyY(vector, scalar) {
    return new Vec2(vector.x, vector.y * scalar);
  }

  static multiply(vector, vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      return new Vec2(
        vector.x * vectorOrScalar.x,
        vector.y * vectorOrScalar.y
      );
    } else {
      return new Vec2(
        vector.x * vectorOrScalar,
        vector.y * vectorOrScalar
      );
    }
  }

  static divideX(vector, scalar) {
    return new Vec2(vector.x / scalar, vector.y);
  }

  static divideY(vector, scalar) {
    return new Vec2(vector.x, vector.y / scalar);
  }

  static divide(vector, vectorOrScalar) {
    if (vectorOrScalar instanceof Vec2) {
      return new Vec2(
        vector.x / vectorOrScalar.x,
        vector.y / vectorOrScalar.y
      );
    } else {
      return new Vec2(
        vector.x / vectorOrScalar,
        vector.y / vectorOrScalar
      );
    }
  }

  static distanceX(vectorA, vectorB) {
    return vectorA.distanceX(vectorB);
  }

  static distanceY(vectorA, vectorB) {
    return vectorA.distanceY(vectorB);
  }

  static reflectX (vector, scalar) {
    return vector.clone().reflectX(scalar);
  }

  static reflectY (vector, scalar) {
    return vector.clone().reflectY(scalar);
  }

  static reflect (vectorA, vectorB) {
    return vectorA.clone().reflect(vectorB);
  }

  static squareDistance(vectorA, vectorB) {
    return vectorA.squareDistance(vectorB);
  }

  static distance(vectorA, vectorB) {
    return vectorA.distance(vectorB);
  }

  static normalize(vector) {
    return vector.normalized;
  }

  static min(vectorA, vectorB) {
    return new Vec2(Math.min(vectorA.x, vectorB.x),
                       Math.min(vectorA.y, vectorB.y));
  }

  static max(vectorA, vectorB) {
    return new Vec2(Math.max(vectorA.x, vectorB.x),
                       Math.max(vectorA.y, vectorB.y));
  }

  static lerp (vectorA, vectorB, t) {
    return subtract(vectorB, vectorA).multiply(t).add(vectorA);
  }

  static angle(vectorA, vectorB) {
    return vectorA.angle(vectorB);
  }

  static angleDeg (vectorA, vectorB) {
    return Maths.radToDeg(angle(vectorA, vectorB));
  }

  static rotateBy (vector, angle) {
    return vector.clone().rotateBy(angle);
  }

  static rotateByDeg (vector, angle) {
    return vector.clone().rotateByDeg(angle);
  }

  static rotateTo (vector, angle) {
    return vector.clone().rotateTo(angle);
  }

  static rotateToDeg (vector, angle) {
    return vector.clone().rotateToDeg(angle);
  }

  static fromAngle(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }

  static fromAngleDeg(angle) {
    return fromAngle(Maths.radToDeg(angle));
  }

  static fromPolar(distance, angle) {
    return fromAngle(angle).mult(distance);
  }

  static fromPolarDeg(distance, angle) {
    return fromPolar(distance, Maths.degToRad(angle));
  }

  static randomRotation() {
    return fromAngle(Math.random() * 2*Math.PI);
  }

  static dot(vectorA, vectorB) {
    return vectorA.dot(vectorB);
  }

  static ceil(vector) {
    return vector.clone().ceil();
  }

  static floor(vector) {
    return vector.clone().floor();
  }

  static round(vector) {
    return vector.clone().round();
  }

  static toInt(vector) {
    return vector.clone().toInt();
  }



  static addAll(vector, ...others) {
    if (others.length == 0) return vector;
    let next = others.shift();
    return Vec2.addAll(Vec2.add(vector, next), ...others);
  }
}

Object.defineProperty(Vec2.prototype, "width", {
  get: function() { return this.x; },
  set: function(width) { this.x = width; }
});

Object.defineProperty(Vec2.prototype, "height", {
  get: function() { return this.y; },
  set: function(height) { this.y = height; }
});

Object.defineProperty(Vec2.prototype, "squareMagnitude", {
  get: function() { return this.x * this.x + this.y * this.y; }
});

Object.defineProperty(Vec2.prototype, "sqrMagnitude", {
  get: function() { return this.squareMagnitude; }
});

Object.defineProperty(Vec2.prototype, "magnitude", {
  get: function() { return Math.sqrt(this.squareMagnitude); }
});

Object.defineProperty(Vec2.prototype, "normalized", {
  get: function() { return this.clone().normalize(); }
});

Object.defineProperty(Vec2.prototype, "direction", {
  get: function() { return this.angle(); }
});

Object.defineProperty(Vec2.prototype, "directionDeg", {
  get: function() { return this.angleDeg(); }
});

Vec2.prototype.sub = Vec2.prototype.subtract;
Vec2.prototype.subX = Vec2.prototype.subtractX;
Vec2.prototype.subY = Vec2.prototype.subtractY;

Vec2.prototype.mult = Vec2.prototype.multiply;
Vec2.prototype.multX = Vec2.prototype.multiplyX;
Vec2.prototype.multY = Vec2.prototype.multiplyY;

Vec2.prototype.div = Vec2.prototype.divide;
Vec2.prototype.divX = Vec2.prototype.divideX;
Vec2.prototype.divY = Vec2.prototype.divideY;

Vec2.prototype.distX = Vec2.prototype.distanceX;
Vec2.prototype.distY = Vec2.prototype.distanceY;
Vec2.prototype.sqrDistance = Vec2.prototype.squareDistance;
Vec2.prototype.sqrDist = Vec2.prototype.squareDistance;
Vec2.prototype.dist = Vec2.prototype.distance;

Vec2.prototype.rotate = Vec2.prototype.rotateBy;
Vec2.prototype.rotateDeg = Vec2.prototype.rotateByDeg;

Vec2.sub = Vec2.subtract;
Vec2.subX = Vec2.subtractX;
Vec2.subY = Vec2.subtractY;

Vec2.mult = Vec2.multiply;
Vec2.multX = Vec2.multiplyX;
Vec2.multY = Vec2.multiplyY;

Vec2.div = Vec2.divide;
Vec2.divX = Vec2.divideX;
Vec2.divY = Vec2.divideY;

Vec2.distX = Vec2.distanceX;
Vec2.distY = Vec2.distanceY;
Vec2.distSquared = Vec2.distanceSquared;
Vec2.distSq = Vec2.distanceSquared;
Vec2.dist = Vec2.distance;

Vec2.rotate = Vec2.rotateBy;
Vec2.rotateDeg = Vec2.rotateByDeg;

Object.defineProperty(Vec2, "ZERO", {
  get: function() { return new Vec2(0, 0); }
});

Object.defineProperty(Vec2, "ONE", {
  get: function() { return new Vec2(1, 1); }
});

Object.defineProperty(Vec2, "UP", {
  get: function() { return new Vec2(0, 1); }
});

Object.defineProperty(Vec2, "RIGHT", {
  get: function() { return new Vec2(1, 0); }
});

Object.defineProperty(Vec2, "DOWN", {
  get: function() { return new Vec2(0, -1); }
});

Object.defineProperty(Vec2, "LEFT", {
  get: function() { return new Vec2(-1, 0); }
});

Object.defineProperty(Vec2, "MAX_VALUE", {
  get: function() { return new Vec2(Number.MAX_VALUE, Number.MAX_VALUE); }
});

Object.defineProperty(Vec2, "MIN_VALUE", {
  get: function() { return new Vec2(Number.MIN_VALUE, Number.MIN_VALUE); }
});
