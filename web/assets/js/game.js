import Network from './connection/network.js';
import common from './common.js'

class Game {
    constructor() {
        common.game = this;
        this.init();
        this.network = new Network();
    }
    init() {
        requestAnimationFrame(this.update.bind(this));
    }
    update(relativeTime) {
        requestAnimationFrame(this.update.bind(this));
    }
    updateCamera() {

    }
    updateEntities(relativeTime) {
        common.cells.list.forEach(cell => {
            cell.update(relativeTime);
        })
    }
    reset() {
        cleanupObject(common.cells);
        cleanupObject(common.border);
        cleanupObject(common.leaderboard);
        cleanupObject(common.chat);
        cleanupObject(common.stats);
        chat.messages = [];
        leaderboard.items = [];
        common.cells.mine = [];
        common.cells.byId = { };
        common.cells.list = [];
        common.camera.x = camera.y = camera.target.x = camera.target.y = 0;
        common.camera.scale = camera.target.scale = 1;
        common.mapCenterSet = false;
    }
}

window.game = new Game();