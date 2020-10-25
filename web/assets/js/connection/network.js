import Writer from './writer.js';
import Reader from './reader.js';
import common from '../common.js';
import {
    USE_HTTPS,
    SEND_254,
    SEND_255
} from '../constants.js';

export default class Network {
    constructor() {
        this.wsSend = this.wsSend.bind(this);
        this.wsCleanup  = this.wsCleanup.bind(this);
        this.url = 'ws://127.0.0.1:8080/';
    }
    init(url) {
        if (this.ws) {
            console.log("Already connected !");
            this.wsCleanup();
        }
        //byId("connecting").show(0.5);
        this.wsUrl = url;
        this.ws = new WebSocket("ws" + (USE_HTTPS ? "s" : "") + "://" + url);
        this.ws.binaryType = "arraybuffer";
        this.ws.onopen = this.wsOpen.bind(this);
        this.ws.onmessage = this.wsMessage.bind(this);
        this.ws.onerror = this.wsError.bind(this);
        this.ws.onclose = this.wsClose.bind(this);
    }
    wsCleanup() {
        if (!this.ws) return;
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.close();
        this.ws = null;
    }
    wsOpen() {
        this.reconnectDelay = 1000;
        //byId("connecting").hide();
        this.wsSend(SEND_254);
        this.wsSend(SEND_255);
    }
    wsError(error) {
        console.log(error);
    }
    wsClose(e) {
        if (e.currentTarget != ws) return;
        console.log(`WS disconnected ${e.code}, reason : ${e.reason}`);
        this.wsCleanup();
        common.game.reset();
        setTimeout(function () {
            setserver(wsUrl);
        }, reconnectDelay *= 1.5);
    }
    setServer() {
        if (this.wsUrl && this.ws && this.ws.readyState <= WebSocket.OPEN) return;
        this.wsInit(url);
    }
    wsSend(data) {
        if (!this.ws || this.ws.readyState !== 1) return;
        if (data.build) ws.send(data.build());
        else ws.send(data);
    }
    wsMessage(data) {
        common.syncUpdStamp = Date.now();
        var reader = new Reader(new DataView(data.data), 0, true);
        var packetId = reader.getUint8();
        switch (packetId) {
            case 0x10: // update nodes
                var killer, killed, id, node, x, y, s, flags, cell,
                    updColor, updName, updSkin, count, color, name, skin;
    
                // consume records
                count = reader.getUint16();
                for (var i = 0; i < count; i++) {
                    killer = reader.getUint32();
                    killed = reader.getUint32();
                    if (!cells.byId.hasOwnProperty(killer) || !common.cells.byId.hasOwnProperty(killed))
                        continue;
                    /*if (common.settings.playSounds && cells.mine.includes(killer)) {
                        (common.cells.byId[killed].s < 20 ? pelletSound : eatSound).play(parseFloat(soundsVolume.value));
                    }*/
                    common.cells.byId[killed].destroy(killer);
                }
    
                // update records
                while (true) {
                    id = reader.getUint32();
                    if (id === 0) break;
    
                    x = reader.getInt32();
                    y = reader.getInt32();
                    s = reader.getUint16();
    
                    flags = reader.getUint8();
                    updColor = !!(flags & 0x02);
                    updSkin = !!(flags & 0x04);
                    updName = !!(flags & 0x08);
                    color = updColor ? bytesToHex(reader.getUint8(), reader.getUint8(), reader.getUint8()) : null;
                    skin = updSkin ? reader.getStringUTF8() : null;
                    name = updName ? reader.getStringUTF8() : null;
    
                    if (common.cells.byId.hasOwnProperty(id)) {
                        cell = cells.byId[id];
                        cell.update(syncUpdStamp);
                        cell.updated = syncUpdStamp;
                        cell.ox = cell.x;
                        cell.oy = cell.y;
                        cell.os = cell.s;
                        cell.nx = x;
                        cell.ny = y;
                        cell.ns = s;
                        if (color) cell.setColor(color);
                        if (name) cell.setName(name);
                        if (skin) cell.setSkin(skin);
                    } else {
                        cell = new Cell(id, x, y, s, name, color, skin, flags);
                        common.cells.byId[id] = cell;
                        common.cells.list.push(cell);
                    }
                }
                // dissapear records
                count = reader.getUint16();
                for (i = 0; i < count; i++) {
                    killed = reader.getUint32();
                    if (cells.byId.hasOwnProperty(killed) && !cells.byId[killed].destroyed)
                        cells.byId[killed].destroy(null);
                }
                break;
            case 0x11: // update pos
                common.camera.target.x = reader.getFloat32();
                common.camera.target.y = reader.getFloat32();
                common.camera.target.scale = reader.getFloat32();
                common.camera.target.scale *= common.camera.viewportScale;
                common.camera.target.scale *= common.camera.userZoom;
                break;
            case 0x12: // clear all
                for (var i in cells.byId)
                common.cells.byId[i].destroy(null);
            case 0x14: // clear my cells
                common.cells.mine = [];
                break;
            case 0x15: // draw line
                //log.warn("got packet 0x15 (draw line) which is unsupported");
                break;
            case 0x20: // new cell
                common.cells.mine.push(reader.getUint32());
                break;
            case 0x30: // text list
                common.leaderboard.items = [];
                common.leaderboard.type = "text";
    
                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    leaderboard.items.push(reader.getStringUTF8());
                drawLeaderboard();
                break;
            case 0x31: // ffa list
                common.leaderboard.items = [];
                common.leaderboard.type = "ffa";
    
                var count = reader.getUint32();
                for (i = 0; i < count; ++i) {
                    var isMe = !!reader.getUint32();
                    var name = reader.getStringUTF8();
                    common.leaderboard.items.push({
                        //me: isMe,
                        //name: Cell.prototype.parseName(name).name || EMPTY_NAME
                    });
                }
                drawLeaderboard();
                break;
            case 0x32: // pie chart
                common.leaderboard.items = [];
                common.leaderboard.type = "pie";
    
                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    common.leaderboard.items.push(reader.getFloat32());
                //drawLeaderboard();
                break;
            case 0x40: // set border
                common.border.left = reader.getFloat64();
                common.border.top = reader.getFloat64();
                common.border.right = reader.getFloat64();
                common.border.bottom = reader.getFloat64();
                common.border.width = common.border.right - common.border.left;
                common.border.height = common.border.bottom - common.border.top;
                common.border.centerX = (common.border.left + common.border.right) / 2;
                common.border.centerY = (common.border.top + common.border.bottom) / 2;
                if (data.data.byteLength === 33) break;
                if (!common.mapCenterSet) {
                    common.mapCenterSet = true;
                    common.camera.x = common.camera.target.x = common.border.centerX;
                    common.camera.y = common.camera.target.y = common.border.centerY;
                    common.camera.scale = common.camera.target.scale = 1;
                }
                reader.getUint32(); // game type
                if (!/MultiOgar|OgarII/.test(reader.getStringUTF8()) || stats.pingLoopId) break;
                common.stats.pingLoopId = setInterval(() => {
                    this.wsSend(UINT8_CACHE[254]);
                    this.ws.readyState !== stats.pingLoopStamp = Date.now();
                }, 2000);
                break;
            case 0x63: // chat message
                var flags = reader.getUint8();
                var color = bytesToHex(reader.getUint8(), reader.getUint8(), reader.getUint8());
    
                var name = reader.getStringUTF8();
                name = Cell.prototype.parseName(name).name || EMPTY_NAME;
                var message = reader.getStringUTF8();
    
                var server = !!(flags & 0x80),
                    admin = !!(flags & 0x40),
                    mod = !!(flags & 0x20);
    
                if (server && name !== "SERVER") name = "[SERVER] " + name;
                if (admin) name = "[ADMIN] " + name;
                if (mod) name = "[MOD] " + name;
                var wait = Math.max(3000, 1000 + message.length * 150);
                chat.waitUntil = syncUpdStamp - chat.waitUntil > 1000 ? syncUpdStamp + wait : chat.waitUntil + wait;
                chat.messages.push({
                    server: server,
                    admin: admin,
                    mod: mod,
                    color: color,
                    name: name,
                    message: message,
                    time: syncUpdStamp
                });
                if (settings.showChat) drawChat();
                break;
            case 0xFE: // server stat
                stats.info = JSON.parse(reader.getStringUTF8());
                stats.latency = syncUpdStamp - stats.pingLoopStamp;
                drawStats();
                break;
            default:
                // invalid packet
                wsCleanup();
                break;
        }
    }
}