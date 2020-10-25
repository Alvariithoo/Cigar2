export default class Reader {
    constructor(view, offset, littleEndian) {
        this._e = littleEndian;
        if (view) this.repurpose(view, offset);
    }
    repurpose(view, offset) {
        this.view = view;
        this._o = offset || 0;
    }
    getUint8() {
        return this.view.getUint8(this._o++, this._e);
    }
    getInt8() {
        return this.view.getInt8(this._o++, this._e);
    }
    getUint16() {
        return this.view.getUint16((this._o += 2) - 2, this._e);
    }
    getInt16() {
        return this.view.getInt16((this._o += 2) - 2, this._e);
    }
    getUint32() {
        return this.view.getUint32((this._o += 4) - 4, this._e);
    }
    getInt32() {
        return this.view.getInt32((this._o += 4) - 4, this._e);
    }
    getFloat32() {
        return this.view.getFloat32((this._o += 4) - 4, this._e);
    }
    getFloat64() {
        return this.view.getFloat64((this._o += 8) - 8, this._e);
    }
    getStringUTF8() {
        var s = "",
            b;
        while ((b = this.view.getUint8(this._o++)) !== 0) s += String.fromCharCode(b);

        return decodeURIComponent(escape(s));
    }
}