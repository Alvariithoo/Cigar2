export default class Writer {
    constructor(littleEndian) {
        this.__buf = new DataView(new ArrayBuffer(8));
        this._e = littleEndian;
        this.reset();
    }
    reset() {
        this._b = [];
        this._o = 0;
    }
    setUint8(a) {
        if (a >= 0 && a < 256) this._b.push(a);
        return this;
    }
    setInt8(a) {
        if (a >= -128 && a < 128) this._b.push(a);
        return this;
    }
    setUint16(a) {
        this.__buf.setUint16(0, a, this._e);
        this._move(2);
        return this;
    }
    setInt16(a) {
        this.__buf.setInt16(0, a, this._e);
        this._move(2);
        return this;
    }
    setUint32(a) {
        this.__buf.setUint32(0, a, this._e);
        this._move(4);
        return this;
    }
    setInt32(a) {
        this.__buf.setInt32(0, a, this._e);
        this._move(4);
        return this;
    }
    setFloat32(a) {
        this.__buf.setFloat32(0, a, this._e);
        this._move(4);
        return this;
    }
    setFloat64(a) {
        this.__buf.setFloat64(0, a, this._e);
        this._move(8);
        return this;
    }
    _move(b) {
        for (var i = 0; i < b; i++) this._b.push(this.__buf.getUint8(i));
    }
    setStringUTF8(s) {
        var bytesStr = unescape(encodeURIComponent(s));
        for (var i = 0, l = bytesStr.length; i < l; i++) this._b.push(bytesStr.charCodeAt(i));
        this._b.push(0);
        return this;
    }
    build() {
        return new Uint8Array(this._b);
    }
}