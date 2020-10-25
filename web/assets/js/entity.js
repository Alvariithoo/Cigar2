import common from './common.js'
export default class Entity {
    constructor(x, y, s, name, skin, color) {
        this.x = this.ox = this.nx = this.ox = x;
        this.y = this.oy = this.ny = this.oy = y;
        this.s = this.os = this.ns = this.os = s;
        this.name = name;
        this.skin = skin;
        this.color = color;
        this.dead = 0;
        
        this.draw();
    }
    draw() {

    }
    update(relativeTime) {
        var dt = Math.max(Math.min((relativeTime - this.updated) / common.settings.animationDelay, 1), 0);
        if (this.destroyed && Date.now() > this.dead + 200)
            cells.list.remove(this);
        else if (this.diedBy && cells.byId.hasOwnProperty(this.diedBy)) {
            this.nx = common.cells.byId[this.diedBy].x;
            this.ny = common.cells.byId[this.diedBy].y;
        }
        this.x = this.ox + (this.nx - this.ox) * dt;
        this.y = this.oy + (this.ny - this.oy) * dt;
        this.s = this.os + (this.ns - this.os) * dt;
        this.nameSize = ~~(~~(Math.max(~~(0.3 * this.ns), 24)) / 3) * 3;
        this.drawNameSize = ~~(~~(Math.max(~~(0.3 * this.s), 24)) / 3) * 3;
    }
    remove() {

    }
}