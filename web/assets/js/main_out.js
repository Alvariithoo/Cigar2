(function () {
    'use strict';

    if (typeof WebSocket === 'undefined' || typeof DataView === 'undefined' ||
        typeof ArrayBuffer === 'undefined' || typeof Uint8Array === 'undefined') {
        alert('Your browser does not support required features, please update your browser or get a new one.');
        window.stop();
    }

    function byId(id) {
        return document.getElementById(id);
    }

    class Sound {
        constructor(src, volume, maximum) {
            this.src = src;
            this.volume = typeof volume === 'number' ? volume : 0.5;
            this.maximum = typeof maximum === 'number' ? maximum : Infinity;
            this.elms = [];
        }
        play(vol) {
            if (typeof vol === 'number') this.volume = vol;
            const toPlay = this.elms.find((elm) => elm.paused) ?? this.add();
            toPlay.volume = this.volume;
            toPlay.play();
        }
        add() {
            if (this.elms.length >= this.maximum) return this.elms[0];
            const elm = new Audio(this.src);
            this.elms.push(elm);
            return elm;
        }
    }

    const LOAD_START = Date.now();

    Array.prototype.remove = function (a) {
        const i = this.indexOf(a);
        return i !== -1 && this.splice(i, 1);
    }

    Element.prototype.hide = function () {
        this.style.display = 'none';
        if (this.style.opacity === 1) this.style.opacity = 0;
    }

    Element.prototype.show = function (seconds) {
        this.style.display = '';
        if (!seconds) return;
        this.style.transition = `opacity ${seconds}s ease 0s`;
        this.style.opacity = 1;
    }

    PIXI.settings.scaleMode = PIXI.SCALE_MODES.NEAREST;

    class Color {
        static fromHex(color) {
            let hex = color;
            if (color.startsWith('#')) hex = color.slice(1);
            if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
            if (hex.length !== 6) throw new Error(`Invalid color ${color}`);
            const v = parseInt(hex, 16);
            return new Color(v >>> 16 & 255, v >>> 8 & 255, v & 255, `#${hex}`);
        }
        constructor(r, g, b, hex) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.hexCache = hex;
        }
        clone() {
            return new Color(this.r, this.g, this.b);
        }
        toHex() {
            if (this.hexCache) return this.hexCache;
            return this.hexCache = `0x${(1 << 24 | this.r << 16 | this.g << 8 | this.b).toString(16).slice(1)}`;
        }
    }

    function cleanupObject(object) {
        for (const i in object) delete object[i];
    }

    class Writer {
        constructor(littleEndian) {
            this.writer = true;
            this.tmpBuf = new DataView(new ArrayBuffer(8));
            this._e = littleEndian;
            this.reset();
            return this;
        }
        reset(littleEndian = this._e) {
            this._e = littleEndian;
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
            this.tmpBuf.setUint16(0, a, this._e);
            this._move(2);
            return this;
        }
        setInt16(a) {
            this.tmpBuf.setInt16(0, a, this._e);
            this._move(2);
            return this;
        }
        setUint32(a) {
            this.tmpBuf.setUint32(0, a, this._e);
            this._move(4);
            return this;
        }
        setInt32(a) {
            this.tmpBuf.setInt32(0, a, this._e);
            this._move(4);
            return this;
        }
        setFloat32(a) {
            this.tmpBuf.setFloat32(0, a, this._e);
            this._move(4);
            return this;
        }
        setFloat64(a) {
            this.tmpBuf.setFloat64(0, a, this._e);
            this._move(8);
            return this;
        }
        _move(b) {
            for (let i = 0; i < b; i++) this._b.push(this.tmpBuf.getUint8(i));
        }
        setStringUTF8(s) {
            const bytesStr = unescape(encodeURIComponent(s));
            for (let i = 0, l = bytesStr.length; i < l; i++) this._b.push(bytesStr.charCodeAt(i));
            this._b.push(0);
            return this;
        }
        build() {
            return new Uint8Array(this._b);
        }
    }

    class Reader {
        constructor(view, offset, littleEndian) {
            this.reader = true;
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
            let s = '',
                b;
            while ((b = this.view.getUint8(this._o++)) !== 0) s += String.fromCharCode(b);
            return decodeURIComponent(escape(s));
        }
    }

    class Logger {
        static get verbosity() {
            return 2;
        }
        static error() {
            if (Logger.verbosity > 0) console.error.apply(null, arguments);
        }
        static warn() {
            if (Logger.verbosity > 1) console.warn.apply(null, arguments);
        }
        static info() {
            if (Logger.verbosity > 2) console.info.apply(null, arguments);
        }
        static debug() {
            if (Logger.verbosity > 3) console.debug.apply(null, arguments);
        }
    }

    const WEBSOCKET_URL = null;
    const SKIN_URL = './skins/';
    const USE_HTTPS = 'https:' === window.location.protocol;
    const EMPTY_NAME = 'An unnamed cell';
    const PI_2 = Math.PI * 2;
    const SEND_254 = new Uint8Array([254, 6, 0, 0, 0]);
    const SEND_255 = new Uint8Array([255, 1, 0, 0, 0]);
    const UINT8_CACHE = {
        1: new Uint8Array([1]),
        17: new Uint8Array([17]),
        21: new Uint8Array([21]),
        18: new Uint8Array([18]),
        19: new Uint8Array([19]),
        22: new Uint8Array([22]),
        23: new Uint8Array([23]),
        24: new Uint8Array([24]),
        25: new Uint8Array([25]),
        254: new Uint8Array([254]),
    };
    const KEY_TO_OPCODE = {
        ' ': UINT8_CACHE[17],
        w: UINT8_CACHE[21],
        q: UINT8_CACHE[18],
        e: UINT8_CACHE[22],
        r: UINT8_CACHE[23],
        t: UINT8_CACHE[24],
        p: UINT8_CACHE[25],
    };
    const IE_KEYS = {
        spacebar: ' ',
        esc: 'escape',
    };
    const CODE_TO_KEY = {
        Space: ' ',
        KeyW: 'w',
        KeyQ: 'q',
        KeyE: 'e',
        KeyR: 'r',
        KeyT: 't',
        KeyP: 'p',
    };

    function wsCleanup() {
        if (!ws) return;
        Logger.debug('WebSocket cleanup');
        ws.onopen = null;
        ws.onmessage = null;
        ws.close();
        ws = null;
        while (cellContainer.children[0]) {
            cellContainer.removeChild(cellContainer.children[0]);
        }
    }

    function wsInit(url) {
        if (ws) {
            Logger.debug('WebSocket init on existing connection');
            wsCleanup();
        }
        byId('connecting').show(0.5);
        wsUrl = url;
        ws = new WebSocket(`ws${USE_HTTPS ? 's' : ''}://${url}`);
        ws.binaryType = 'arraybuffer';
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = wsError;
        ws.onclose = wsClose;
    }

    function wsOpen() {
        reconnectDelay = 1000;
        byId('connecting').hide();
        wsSend(SEND_254);
        wsSend(SEND_255);
    }

    function wsError(error) {
        Logger.warn(error);
    }

    function wsClose(e) {
        if (e.currentTarget !== ws) return;
        Logger.debug(`WebSocket disconnected ${e.code} (${e.reason})`);
        wsCleanup();
        gameReset();
        drawLeaderboard();
        setTimeout(() => window.setserver(wsUrl), reconnectDelay *= 1.5);
    }

    function wsSend(data) {
        if (!ws) return;
        if (ws.readyState !== 1) return;
        if (data.build) ws.send(data.build());
        else ws.send(data);
    }

    function wsMessage(data) {
        syncUpdStamp = Date.now();
        const reader = new Reader(new DataView(data.data), 0, true);
        const packetId = reader.getUint8();
        switch (packetId) {
            case 0x10: { // update nodes
                // consume records
                let killed, killer, count;
                count = reader.getUint16();
                for (var i = 0; i < count; i++) {
                    killer = reader.getUint32();
                    killed = reader.getUint32();
                    if (!cells.byId.hasOwnProperty(killer) || !cells.byId.hasOwnProperty(killed))
                        continue;
                    if (settings.playSounds && cells.mine.includes(killer)) {
                        (cells.byId[killed].s < 20 ? pelletSound : eatSound).play(parseFloat(soundsVolume.value));
                    }
                    cells.byId[killed].destroy(killer);
                }
                // update records
                while (true) {
                    const id = reader.getUint32();
                    if (id === 0) break;

                    const x = reader.getInt32();
                    const y = reader.getInt32();
                    const s = reader.getUint16();

                    const flagMask = reader.getUint8();
                    const flags = {
                        updColor: !!(flagMask & 0x02),
                        updSkin: !!(flagMask & 0x04),
                        updName: !!(flagMask & 0x08),
                        jagged: !!(flagMask & 0x01) || !!(flagMask & 0x10),
                        ejected: !!(flagMask & 0x20),
                    };

                    const color = flags.updColor ? new Color(reader.getUint8(), reader.getUint8(), reader.getUint8()) : null;
                    const skin = flags.updSkin ? reader.getStringUTF8() : null;
                    const name = flags.updName ? reader.getStringUTF8() : null;

                    if (cells.byId.hasOwnProperty(id)) {
                        const cell = cells.byId[id];
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
                        cell.drawTick();
                    } else {
                        const cell = new Cell(id, x, y, s, name, color, skin, flags);
                        cells.byId[id] = cell;
                        cells.list.push(cell);
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
            }
            case 0x11: { // update pos
                camera.target.x = reader.getFloat32();
                camera.target.y = reader.getFloat32();
                camera.target.scale = reader.getFloat32();
                camera.target.scale *= camera.viewportScale;
                camera.target.scale *= camera.userZoom;
                break;
            }
            case 0x12: { // clear all
                for (var i in cells.byId)
                    cells.byId[i].destroy(null);
                break;
            }
            case 0x14: { // clear my cells
                cells.mine = [];
                break;
            }
            case 0x15: { // draw line
                Logger.warn('got packet 0x15 (draw line) which is unsupported');
                break;
            }
            case 0x20: { // new cell
                cells.mine.push(reader.getUint32());
                break;
            }
            case 0x30: { // text list
                leaderboard.items = [];
                leaderboard.type = 'text';

                const lbCount = reader.getUint32();
                for (let i = 0; i < lbCount; ++i) {
                    leaderboard.items.push(reader.getStringUTF8());
                }
                drawLeaderboard();
                break;
            }
            case 0x31: { // ffa list
                leaderboard.items = [];
                leaderboard.type = 'ffa';

                const count = reader.getUint32();
                for (let i = 0; i < count; ++i) {
                    const isMe = !!reader.getUint32();
                    const lbName = reader.getStringUTF8();
                    leaderboard.items.push({
                        me: isMe,
                        name: Cell.parseName(lbName).name || EMPTY_NAME
                    });
                }
                drawLeaderboard();
                break;
            }
            case 0x32: { // pie chart
                leaderboard.items = [];
                leaderboard.type = 'pie';

                const teamsCount = reader.getUint32();
                for (let i = 0; i < teamsCount; ++i) {
                    leaderboard.items.push(reader.getFloat32());
                }
                drawLeaderboard();
                break;
            }
            case 0x40: { // set border
                border.left = reader.getFloat64();
                border.top = reader.getFloat64();
                border.right = reader.getFloat64();
                border.bottom = reader.getFloat64();
                border.width = border.right - border.left;
                border.height = border.bottom - border.top;
                border.centerX = (border.left + border.right) / 2;
                border.centerY = (border.top + border.bottom) / 2;
                if (data.data.byteLength === 33) break;
                if (!mapCenterSet) {
                    mapCenterSet = true;
                    camera.x = camera.target.x = border.centerX;
                    camera.y = camera.target.y = border.centerY;
                    camera.scale = camera.target.scale = 1;
                }
                reader.getUint32(); // game type
                if (!/MultiOgar|OgarII/.test(reader.getStringUTF8()) || stats.pingLoopId) break;
                stats.pingLoopId = setInterval(() => {
                    wsSend(UINT8_CACHE[254]);
                    stats.pingLoopStamp = Date.now();
                }, 2000);
                break;
            }
            case 0x63: { // chat message
                const flagMask = reader.getUint8();
                const flags = {
                    server: !!(flagMask & 0x80),
                    admin: !!(flagMask & 0x40),
                    mod: !!(flagMask & 0x20),
                };
                const color = new Color(reader.getUint8(), reader.getUint8(), reader.getUint8());
                const rawName = reader.getStringUTF8();
                const message = reader.getStringUTF8();

                let name = Cell.parseName(rawName).name || EMPTY_NAME;

                if (flags.server && name !== 'SERVER') name = `[SERVER] ${name}`;
                if (flags.admin) name = `[ADMIN] ${name}`;
                if (flags.mod) name = `[MOD] ${name}`;

                const wait = Math.max(3000, 1000 + message.length * 150);
                chat.waitUntil = syncUpdStamp - chat.waitUntil > 1000 ? syncUpdStamp + wait : chat.waitUntil + wait;
                chat.messages.push({
                    color,
                    name,
                    message,
                    time: syncUpdStamp,
                    server: flags.server,
                    admin: flags.admin,
                    mod: flags.mod,
                });
                drawChat(name, message, color);
                break;
            }
            default: { // invalid packet
                break;
            }
        }
    }

    function sendMouseMove(x, y) {
        const writer = new Writer(true);
        writer.setUint8(0x10);
        writer.setUint32(x);
        writer.setUint32(y);
        writer._b.push(0, 0, 0, 0);
        wsSend(writer);
    }

    function sendPlay(name) {
        const writer = new Writer(true);
        writer.setUint8(0x00);
        writer.setStringUTF8(name);
        wsSend(writer);
    }

    function sendChat(text) {
        const writer = new Writer();
        writer.setUint8(0x63);
        writer.setUint8(0);
        writer.setStringUTF8(text);
        wsSend(writer);
    }

    function gameReset() {
        cleanupObject(cells);
        cleanupObject(border);
        cleanupObject(leaderboard);
        cleanupObject(chat);
        cleanupObject(stats);
        chat.messages = [];
        leaderboard.items = [];
        cells.mine = [];
        cells.byId = new Map();
        cells.list = [];
        camera.x = camera.y = camera.target.x = camera.target.y = 0;
        camera.scale = camera.target.scale = 1;
        mapCenterSet = false;
    }

    const cells = {
        mine: [],
        byId: new Map(),
        list: [],
    };
    const border = {
        left: -2000,
        right: 2000,
        top: -2000,
        bottom: 2000,
        width: 4000,
        height: 4000,
        centerX: -1,
        centerY: -1
    };
    const leaderboard = Object.create({
        type: null,
        items: null,
        canvas: document.createElement('canvas'),
        teams: ['#F33', '#3F3', '#33F']
    });
    const chat = Object.create({
        messages: [],
        waitUntil: 0,
        canvas: document.createElement('canvas'),
        visible: false,
    });
    const stats = Object.create({
        fps: 0,
        supports: null,
        info: null,
        pingLoopId: NaN,
        pingLoopStamp: null,
        canvas: document.createElement('canvas'),
        visible: false,
        score: NaN,
        maxScore: 0
    });

    const knownSkins = new Map();
    const loadedSkins = new Map();
    const macroCooldown = 1000 / 7;
    const camera = {
        x: 0,
        y: 0,
        nx: 0,
        ny: 0,
        target: {
            x: 0,
            y: 0,
            scale: 1
        },
        viewportScale: 1,
        userZoom: 1,
        sizeScale: 1,
        scale: 1,
        updated: 0,
        oldPos: {
            x: 0,
            y: 0
        }
    };

    class drawMap {
        constructor(game) {
            this.game = game;
            this.container = new PIXI.Container();
            this.width = border.width;
            this.height = border.height;
            this.bg = new PIXI.TilingSprite(PIXI.Texture.from('./assets/img/background.png'), this.width, this.height);
            this.bg.anchor.set(0.5);
            this.initializate();
        }
        initializate() {
            if (border.centerX !== 0 || border.centerY !== 0) return;
            this.container.addChild(this.bg)
            bgContainer.addChild(this.container);
        }
        redraw() {
            if (border.centerX !== 0 || border.centerY !== 0) return;
            this.container.destroy();
        }
    }

    let wsUrl = WEBSOCKET_URL;
    let ws = null;
    let reconnectDelay = 1000;
    let syncUpdStamp = Date.now();
    let syncAppStamp = Date.now();
    let view = null;
    let application = null;
    let cellContainer = null;
    let bgContainer = null;

    const textures = {
        cell: null,
        pellet: null,
        w: null
    }

    let soundsVolume;
    let escOverlayShown = false;
    let isTyping = false;
    let chatBox = null;
    let chatArea = null;
    let mapCenterSet = false;
    let mouseX = NaN;
    let mouseY = NaN;
    let macroIntervalID;

    const settings = {
        nick: '',
        skin: '',
        gamemode: '',
        showSkins: true,
        showNames: true,
        darkTheme: false,
        showMass: false,
        _showChat: true,
        showMinimap: true,
        get showChat() {
            return this._showChat;
        },
        set showChat(a) {
            this._showChat = a;
            if (!chatBox) return;
            a ? chatArea.show() : chatArea.hide();
        },
        playSounds: false,
        soundsVolume: 0.5,
    };
    const pressed = {
        ' ': false,
        w: false,
        e: false,
        r: false,
        t: false,
        p: false,
        q: false,
        enter: false,
        escape: false,
    };

    const eatSound = new Sound('./assets/sound/eat.mp3', 0.5, 10);
    const pelletSound = new Sound('./assets/sound/pellet.mp3', 0.5, 10);

    fetch('skinList.txt').then(resp => resp.text()).then(data => {
        const skins = data.split(',').filter(name => name.length > 0);
        if (skins.length === 0) return;
        byId('gallery-btn').style.display = 'inline-block';
        const stamp = Date.now();
        for (const skin of skins) knownSkins.set(skin, stamp);
        for (const i of knownSkins.keys()) {
            if (knownSkins.get(i) !== stamp) knownSkins.delete(i);
        }
    });

    function hideESCOverlay() {
        escOverlayShown = false;
        byId('overlays').hide();
    };

    function showESCOverlay() {
        escOverlayShown = true;
        byId('overlays').show(0.5);
    };

    function toCamera(obj) {
        obj.pivot.set(camera.x, camera.y);
        scaleForth(obj);
        obj.position.set(window.innerWidth / 2, window.innerHeight / 2);
    };

    function scaleForth(obj) {
        obj.scale.set(1 / camera.scale);
    };

    function scaleBack(obj) {
        obj.scale.set(camera.scale);
    };

    function fromCamera(obj) {
        obj.position.set(camera.x, camera.y);
        scaleBack(obj);
        obj.position.set(window.innerWidth / 2, window.innerHeight / 2);
    };

    function initSetting(id, elm) {
        function simpleAssignListen(id, elm, prop) {
            if (settings[id] !== '') elm[prop] = settings[id];
            elm.addEventListener('change', () => {
                settings[id] = elm[prop];
            });
        }
        switch (elm.tagName.toLowerCase()) {
            case 'input':
                switch (elm.type.toLowerCase()) {
                    case 'range':
                    case 'text':
                        simpleAssignListen(id, elm, 'value');
                        break;
                    case 'checkbox':
                        simpleAssignListen(id, elm, 'checked');
                        break;
                }
                break;
            case 'select':
                simpleAssignListen(id, elm, 'value');
                break;
        }
    }

    function loadSettings() {
        const text = localStorage.getItem('settings');
        const obj = text ? JSON.parse(text) : settings;
        for (const prop in settings) {
            const elm = byId(prop.charAt(0) === '_' ? prop.slice(1) : prop);
            if (elm) {
                if (Object.hasOwnProperty.call(obj, prop)) settings[prop] = obj[prop];
                initSetting(prop, elm);
            } else Logger.info(`setting ${prop} not loaded because there is no element for it.`);
        }
    }

    function storeSettings() {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    function buildGallery() {
        const sortedSkins = Array.from(knownSkins.keys()).sort();
        let c = '';
        for (const skin of sortedSkins) {
            c += `<li class="skin" onclick="changeSkin('${skin}')">`;
            c += `<img class="circular" src="./skins/${skin}.png">`;
            c += `<h4 class="skinName">${skin}</h4>`;
            c += '</li>';
        }
        byId('gallery-body').innerHTML = `<ul id="skinsUL">${c}</ul>`;
    }

    function drawLeaderboard() {
        if (leaderboard.type === null) return leaderboard.visible = false;
        let last = 0;
        $("#lb_detail").html('');
        for (let i = 0; i < leaderboard.items.length; i++) {
            last++;
            if (leaderboard.items[i].me == true) {
                $("#lb_detail").append(`<div style="color:#faa">${last}. ${leaderboard.items[i].name}</div>`);
            } else {
                $("#lb_detail").append(`<div>${last}. ${leaderboard.items[i].name}</div>`);
            }
        }
    };

    function drawChat(name, message, color) {
        $("#chatRoom").append(`<div><span style="color:rgb(${color.r}, ${color.g}, ${color.b})" class='sender'>${name}</span>: <span class='msg'>${message}</span></div>`)
        if (parseInt($("#chatRoom").css('height')) >= 150) {
            $("#chatRoom").css('overflow-y', 'auto').animate({
                scrollTop: 100000 * 100000
            }, 2000);
        } else return $("#chatRoom").css('overflow-y', 'none');
    }

    function drawGame() {
        stats.fps += (1000 / Math.max(Date.now() - syncAppStamp, 1) - stats.fps) / 10;
        syncAppStamp = Date.now();
        if (settings.showMinimap) mapsector.alpha = 1, mapsquare.alpha = 1, mapplayer.alpha = 1;
        else mapsector.alpha = 0, mapsquare.alpha = 0, mapplayer.alpha = 0;
        settings.darkTheme ? application.renderer.backgroundColor = 0x111111 : application.renderer.backgroundColor = 0xf7f7f7;
        window.fancyGrid = false;        
        for (const cell of cells.list) cell.update(syncAppStamp);
        cameraUpdate();
        for (const cell of cells.list) cell.updatePlayerPosition();
        clearPlayers();
        drawGrid();
        window.requestAnimationFrame(drawGame);
    };

    function drawStats() {
        var string = [];
        if (0 != stats.score) {
            string.push(`Score: ${stats.score}`);
        }
        if (0 != stats.fps) {
            let json = stats.fps;
            if (50 >= json) {
                json += 8;
            } else {
                if (45 >= json) {
                    json += 10;
                } else {
                    if (40 >= json) {
                        json += 15;
                    }
                }
            string.push(`FPS: ${~~json}`);   
            }
        }
        if (0 < string.length) {
            if (!$("#div_score").is(":visible")) {
                $("#div_score").show();
            }
            document.getElementById("div_score").innerHTML = string.join("&nbsp;&nbsp;&nbsp;").trim();
        } else {
            $("#div_score").hide();
        }
        setTimeout(drawStats, 500);
    };

    function cameraUpdate() {
        const dt = Math.max(Math.min((syncAppStamp - camera.updated) / 40, 1), 0);
        const myCells = [];
        for (const id of cells.mine) {
            const cell = cells.byId[id];
            if (cell) myCells.push(cell);
        }
        if (myCells.length > 0) {
            let x = 0;
            let y = 0;
            let s = 0;
            let score = 0;
            for (const cell of myCells) {
                score += ~~(cell.ns * cell.ns / 100);
                x += cell.x;
                y += cell.y;
                s += cell.s;
            }
            camera.target.x = x / myCells.length;
            camera.target.y = y / myCells.length;
            camera.sizeScale = 1; // Math.pow(Math.min(64 / s, 1), 0.4);
            camera.target.scale = camera.sizeScale;
            camera.target.scale *= camera.viewportScale * camera.userZoom;
            camera.nx = (camera.target.x + camera.x) / 2;
            camera.ny = (camera.target.y + camera.y) / 2;
            stats.score = score;
            stats.maxScore = Math.max(stats.maxScore, score);
        } else {
            stats.score = NaN;
            stats.maxScore = 0;
            camera.nx += (camera.target.x - camera.x) / 20;
            camera.ny += (camera.target.y - camera.y) / 20;
        }
        camera.scale += (camera.target.scale - camera.scale) / 9;

        camera.x = camera.oldPos.x + (camera.nx - camera.oldPos.x) * dt;
        camera.y = camera.oldPos.y + (camera.ny - camera.oldPos.y) * dt;

        camera.oldPos.x = camera.x;
        camera.oldPos.y = camera.y;

        toCamera(cellContainer);
        fromCamera(cellContainer);
        toCamera(bgContainer);
        fromCamera(bgContainer);
        camera.updated = Date.now();
    };

    class Cell {
        static parseName(value) { // static method
            let [, skin, name] = /^(?:\<([^}]*)\>)?([^]*)/.exec(value || '');
            name = name.trim();
            return {
                name: name,
                skin: (skin || '').trim() || name,
            };
        }

        static nickList = {};
        static skinList = {};
        static massList = {};

        constructor(id, x, y, s, name, color, skin, flags) {
            this.destroyed = false;
            this.diedBy = 0;
            this.nameSize = 0;
            this.updated = null;
            this.dead = null;
            this.id = id;
            this.ox = x;
            this.x = x;
            this.nx = x;
            this.oy = y;
            this.y = y;
            this.ny = y;
            this.os = s;
            this.s = s;
            this.ns = s;
            this.setColor(color);
            this.setName(name);
            this.setSkin(skin);
            this.jagged = flags.jagged;
            this.ejected = flags.ejected;
            this.born = syncUpdStamp;
            this.filter = new PIXI.filters.ColorMatrixFilter();
            this.draw();
        }
        destroy(killerId) {
            delete cells.byId[this.id];
            if (cells.mine.remove(this.id) && cells.mine.length === 0) showESCOverlay();
            this.destroyed = true;
            this.dead = syncUpdStamp;
            if (killerId && !this.diedBy) {
                this.diedBy = killerId;
                this.updated = syncUpdStamp;
            }
        }
        update(relativeTime) {
            if (cells.mine.length != 0);
            const dt = Math.max(Math.min((relativeTime - this.updated) / 120, 1), 0);
            let diedBy;
            if (this.destroyed && Date.now() > this.dead + 240) {
                cells.list.remove(this);
                if (this.massContainer) {
                    return this.entity.destroy(), this.massContainer.destroy();
                } else {
                    return this.entity.destroy();
                }
            } else if (this.diedBy && cells.byId.hasOwnProperty(this.diedBy)) {
                this.nx = cells.byId[this.diedBy].x;
                this.ny = cells.byId[this.diedBy].y;
            }
            this.x = this.ox + (this.nx - this.ox) * dt;
            this.y = this.oy + (this.ny - this.oy) * dt;
            this.s = this.os + (this.ns - this.os) * dt;

            if (this.destroyed) {
                this.entity.alpha = Math.max(140 - Date.now() + this.dead, 0) / 140;
                if (this.outContainer) this.outContainer.alpha = Math.max(120 - Date.now() + this.dead, 0) / 120;
            }
        }
        updatePlayerPosition() {
            if (this.skinSprite) settings.showSkins ? this.reDraw() : this.reDraw();
            if (this.nameSprite) {
                this.nameSprite.scale = new PIXI.Point(this.s / 200, this.s / 200);
                this.nameSprite.alpha = settings.showNames && (this.s * camera.scale > 30 && this.jagged != true) ? 1 : 0;
            }
            if (this.massSprite) {
                if (settings.showMass) {
                    this.entity.removeChild(this.massSprite), this.massSprite = null;
                    this.massSprite = this.drawMass();
                    let y = Math.max(this.s / 2.4, this.nameSize / 1);
                    this.massSprite.scale = new PIXI.Point(this.s / 200, this.s / 200);
                    this.massSprite.y = y;
                    this.massSprite.alpha = (this.s * camera.scale > 30 && this.jagged != true) ? 1 : 0;
                    this.entity.addChild(this.massSprite);
                } else {
                    this.massSprite.scale = new PIXI.Point(this.s / 200, this.s / 200);
                    this.massSprite.alpha = 0;
                }
            }
            if (this.entity) {
                this.entity.x = this.x;
                this.entity.y = this.y;
                this.entity.zIndex = this.os;
            }
            if (this.skinSprite) {
                this.skinSprite.width = this.skinSprite.height = this.s * 2;
            }
            if (this.cellSprite) {
                this.cellSprite.width = this.cellSprite.height = this.s * 2;
            }
        }
        drawTick() {}
        setName(rawName) {
            const {name, skin} = Cell.parseName(rawName);
            this.name = name || EMPTY_NAME;
            this.setSkin(skin);
        }
        setSkin(value) {
            this.skin = (value && value[0] === '%' ? value.slice(1) : value) || this.skin;
            if (this.skin === null || !knownSkins.has(this.skin) || loadedSkins.has(this.skin)) {
                return;
            }
            const skin = new Image();
            skin.src = `${SKIN_URL}${this.skin}.png`;
            loadedSkins.set(this.skin, skin);
        }
        setColor(value) {
            if (!value) {
                Logger.warn('Got no color');
                return;
            }
            this.color = value;
        }
        draw() {
            this.skinSprite = this.skin ? this.drawSkin() : null;
            this.cellSprite = this.drawCell();
            this.entity = new PIXI.Container();
            this.entity.addChild(this.cellSprite);
            if (this.skin && settings.showSkins) this.entity.addChild(this.skinSprite)            
            if (this.name && settings.showNames) {
                this.nameSprite = this.drawName();
                this.nameSprite.scale = new PIXI.Point(this.s / 200, this.s / 200);
                this.entity.addChild(this.nameSprite);
            }
            if (this.name && settings.showMass) {
                this.massSprite = this.drawMass();
                this.massSprite.scale = new PIXI.Point(this.s / 200, this.s / 200);
                this.entity.addChild(this.massSprite);
            }
            this.entity.position.x = this.x;
            this.entity.position.y = this.y;
            cellContainer.addChild(this.entity);
        }
        drawCell() {
            if (this.jagged == true) {
                this.cellSprite = new PIXI.Sprite(textures.virus);
                this.cellSprite.texture.baseTexture.mipmap = true;
                this.cellSprite.anchor.set(.5);
                this.cellSprite.width = this.cellSprite.height = this.s * 2;
                this.cellSprite.tint = this.color.toHex();
                return this.cellSprite;
            } else {
                if (this.ejected) {
                    this.cellSprite = new PIXI.Sprite(textures.w);
                    this.cellSprite.texture.baseTexture.mipmap = true;
                    this.cellSprite.anchor.set(.5);
                    this.cellSprite.width = this.cellSprite.height = this.s * 2;
                    this.cellSprite.tint = this.color.toHex();
                    return this.cellSprite;
                } else {
                    this.cellSprite = new PIXI.Sprite(textures.cell);
                    this.cellSprite.texture.baseTexture.mipmap = true;
                    this.cellSprite.anchor.set(.5);
                    this.cellSprite.width = this.cellSprite.height = this.s * 2;
                    this.cellSprite.tint = this.color.toHex();
                    return this.cellSprite;
                }
            }
        }
        reDraw() {
            if (this.destroyed) return;
            this.entity.destroy();
            this.draw();
        }
        drawSkin() {
            if (this.skin.length <= 10) {
                var texture = this.drawSkinTexture(`${SKIN_URL}${this.skin}.png`);
            } else {
                isNonSkin = true;
            }

            let isNonSkin = false;

            if (texture.then || texture == "not_loaded") {
                texture = settings.cellquality ? textures.cell : textures.low;
                isNonSkin = true;
            }

            var skinSprite = new PIXI.Sprite(texture);
            skinSprite.texture.baseTexture.mipmap = true;
            skinSprite.anchor.set(.5);
            skinSprite.width = skinSprite.height = this.s * 2;
            if (isNonSkin) skinSprite.tint = true ? (this.color ? this.color.toHex() : '0xFFFFFF') : '0xFFFFFF'
            return skinSprite;
        }
        drawSkinTexture(image) {
            if (Cell.skinList[image]) {
                return Cell.skinList[image];
            } else {
                return new Promise(resolve => {
                    let n = new Image;
                    n.crossOrigin = "Anonymous";
                    n.onload = () => {
                        let o = new PIXI.Texture(new PIXI.BaseTexture(n));
                        let skin = new PIXI.Graphics()
                            .beginTextureFill({
                                texture: o,
                                matrix: new PIXI.Matrix().scale(4, 4).translate(-1024, -1024),
                            })
                            .drawCircle(0, 0, 1024)
                            .endFill();
                        let texture = application.renderer.generateTexture(skin);
                        Cell.skinList[image] = texture;
                        this.reDraw();
                        resolve(texture);
                    }
                    n.onerror = function() {
                        Cell.skinList[image] = "not_loaded";
                    }
                    n.src = image;
                });
            }
        }
        drawName() {
            if (Cell.nickList[this.name]) {
                this.nameSprite = new PIXI.Sprite(Cell.nickList[this.name])
                this.nameSprite.anchor.set(.5);
                return this.nameSprite;
            }
            let text = new PIXI.Text(this.name, {
                fontFamily: 'Ubuntu',
                fontSize: 60,
                fill: 0xffffff,
                strokeThickness: 10,
            });
            text.resolution = 1;
            text.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
            let texture = application.renderer.generateTexture(text);
            this.nameSprite = new PIXI.Sprite(texture);
            this.nameSprite.texture.baseTexture.mipmap = true;
            this.nameSprite.anchor.set(.5);
            Cell.nickList[this.name] = texture;
            return this.nameSprite;
        }
        drawMass() {
            this.mass = (~~(this.s * this.s / 100));
            if (Cell.massList[this.mass]) {
                this.massSprite = new PIXI.Sprite(Cell.massList[this.mass])
                this.massSprite.anchor.set(.5);
                return this.massSprite;
            }
            let texture = application.renderer.generateTexture(new PIXI.Text(this.mass, {
                fontFamily: 'Ubuntu',
                fontSize: 45,
                fill: 0xffffff,
                strokeThickness: 5,
            }));
            // prettyMass(texture);
            this.massSprite = new PIXI.Sprite(texture);
            this.massSprite.texture.baseTexture.mipmap = true;
            this.massSprite.anchor.set(.5);
            Cell.massList[this.mass] = texture;
            return this.massSprite;
        }
    }

    function processKey(event) {
        let key = CODE_TO_KEY[event.code] || event.key.toLowerCase();
        if (Object.hasOwnProperty.call(IE_KEYS, key)) key = IE_KEYS[key]; // IE fix
        return key;
    }

    function keydown(event) {
        const key = processKey(event);
        if (pressed[key]) return;
        if (Object.hasOwnProperty.call(pressed, key)) pressed[key] = true;
        if (key === 'enter') {
            if (escOverlayShown || !settings.showChat) return;
            if (isTyping) {
                chatBox.blur();
                if (chatBox.value.length > 0) sendChat(chatBox.value);
                chatBox.value = '';
            } else {
                chatBox.focus();
            }
        } else if (key === 'escape') {
            escOverlayShown ? hideESCOverlay() : showESCOverlay();
        } else {
            if (isTyping || escOverlayShown) return;
            const code = KEY_TO_OPCODE[key];
            if (code !== undefined) wsSend(code);
            if (key === 'w') macroIntervalID = setInterval(() => wsSend(code), macroCooldown);
            if (key === 'q') minionControlled = !minionControlled;
        }
    }

    function keyup(event) {
        const key = processKey(event);
        if (Object.hasOwnProperty.call(pressed, key)) pressed[key] = false;
        if (key === 'q') wsSend(UINT8_CACHE[19]);
        else if (key === 'w') clearInterval(macroIntervalID);
    }

    function handleScroll(event) {
        if (event.target != document.getElementById('overlays2')) return;
        camera.userZoom *= event.deltaY > 0 ? 0.8 : 1.2;
        camera.userZoom = Math.max(camera.userZoom, .01);
        camera.userZoom = Math.min(camera.userZoom, 4);
    }

    function generateTextures() {
        let low = new PIXI.Graphics();
        low.beginFill(0xffffff);
        low.drawCircle(0, 0, 256);
        low.endFill();
        textures.low = application.renderer.generateTexture(low);

        let cell = new PIXI.Graphics();
        cell.beginFill(0xffffff);
        cell.drawCircle(0, 0, 256);
        cell.endFill();
        textures.cell = application.renderer.generateTexture(cell);

        let w = new PIXI.Graphics();
        w.beginFill(0xffffff);
        w.drawCircle(0, 0, 64);
        w.endFill();
        textures.w = application.renderer.generateTexture(w);

        let virus = new PIXI.Graphics();
        virus.beginTextureFill({
            texture: PIXI.utils.TextureCache['./assets/img/virus.png'],
            matrix: new PIXI.Matrix().scale(1, 1).translate(-256, -256),
        })
        virus.drawCircle(0, 0, 256);
        virus.endFill();
        textures.virus = application.renderer.generateTexture(virus);

        let pellet = new PIXI.Graphics();
        pellet.beginFill(0xffffff);
        pellet.drawCircle(0, 0, 256);
        pellet.endFill();
        textures.pellet = application.renderer.generateTexture(pellet);
    }

    let mapsquare = new PIXI.Container();
    let mapsector = new PIXI.Container();
    let mapplayer = new PIXI.Container();
    let drawpl = new PIXI.Graphics();
    let square = new PIXI.Graphics();

    function clearSquare() {
        square.clear();
        while (mapsector.children[0]) {
            mapsector.removeChild(mapsector.children[0]);
        }
        drawSquare();
    }

    function drawSquare() {
        const targetSize = 200;
        const borderAR = border.width / border.height; // aspect ratio
        const width = targetSize * borderAR * camera.viewportScale;
        const height = targetSize / borderAR * camera.viewportScale;
        const beginX = view.width - width - 5;
        const beginY = view.height - height - 5;
        
        square.beginFill(0x000000);
        square.drawRect(beginX, beginY, width, height);
        square.alpha = 0.4;
        mapsquare.addChild(square);
    }

    function clearPlayers() {
        drawpl.clear();
        updatePlayers();
    }

    function updatePlayers() {
        if (border.centerX !== 0 || border.centerY !== 0) return;
        const targetSize = 200;
        const borderAR = border.width / border.height; // aspect ratio
        const width = targetSize * borderAR * camera.viewportScale;
        const height = targetSize / borderAR * camera.viewportScale;
        const beginX = view.width - width - 5;
        const beginY = view.height - height - 5;
        const xScaler = width / border.width;
        const yScaler = height / border.height;
        const halfWidth = border.width / 2;
        const halfHeight = border.height / 2;
        const myPosX = beginX + (camera.x + halfWidth) * xScaler;
        const myPosY = beginY + (camera.y + halfHeight) * yScaler;

        if (cells.mine.length) {
            for (var i = 0; i < cells.mine.length; i++) {
                var cell = cells.byId[cells.mine[i]];
                if(cell) {
                    drawpl.beginFill(cell.color.toHex());
                    drawpl.arc(myPosX, myPosY, 5, 0, PI_2);
                    mapplayer.addChild(drawpl);
                }
            }
        } else {
            drawpl.beginFill(0xFAAFFF);
            drawpl.arc(myPosX, myPosY, 5, 0, PI_2);
            mapplayer.addChild(drawpl);
        }

        var cell = null;
        for (var i = 0, l = cells.mine.length; i < l; i++)
            if (cells.byId.hasOwnProperty(cells.mine[i])) {
                cell = cells.byId[cells.mine[i]];
                break;
            }
    }

    function drawGrid() {
        if (window.fancyGrid == true) return;
        window.fancyGrid = true;
        if (window.mapBackground) window.mapBackground.container.destroy();
        window.mapBackground = new drawMap(application)
    }

    function init() {
        view = document.getElementById('canvas');
        application = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: true,
            resolution: 1,
            view: view,
        })

        bgContainer = new PIXI.Container();
        bgContainer.sortableChildren = true;
        cellContainer = new PIXI.Container();
        cellContainer.sortableChildren = true;

        application.stage.addChild(bgContainer)
        application.stage.addChild(cellContainer)
        application.stage.addChild(mapsquare);
        application.stage.addChild(mapsector);
        application.stage.addChild(mapplayer);
        chatArea = byId('chatboxArea2');
        chatBox = byId('input_box2');
        soundsVolume = byId('soundsVolume');
        view.focus();
        loadSettings();
        window.addEventListener('beforeunload', storeSettings);
        document.addEventListener('wheel', handleScroll, {
            passive: true
        });
        byId('play-btn').addEventListener('click', () => {
            const skin = settings.skin;
            sendPlay((skin ? `<${skin}>` : '') + settings.nick);
            hideESCOverlay();
        });
        window.onkeydown = keydown;
        window.onkeyup = keyup;
        document.getElementById("overlays2").onmousemove = (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
        };
        chatBox.onblur = () => {
            isTyping = false;
            drawChat();
        };
        chatBox.onfocus = () => {
            isTyping = true;
            drawChat();
        };
        setInterval(() => {
            let myCells = [];
            let x = 0;
            let y = 0;
            for (let i = 0; i < cells.mine.length; i++) {
                if (cells.byId.hasOwnProperty(cells.mine[i])) {
                    myCells.push(cells.byId[cells.mine[i]]);
                }
            }

            for (let i = 0; i < myCells.length; i++) {
                x += myCells[i].x
                y += myCells[i].y;
            }

            x /= myCells.length;
            y /= myCells.length;

            sendMouseMove(
                (mouseX - window.innerWidth / 2) / camera.scale + camera.x,
                (mouseY - window.innerHeight / 2) / camera.scale + camera.y
            );
        }, 40);
        window.onresize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.viewportScale = Math.max(width / width, height / height);
            application.renderer.resize(width, height);
            clearSquare();
        };
        window.onresize();

        gameReset();
        showESCOverlay();

        Logger.info(`Init done in ${Date.now() - LOAD_START}ms`);
        preloadBullShit();
        drawGame();
        drawSquare();
    }
    window.setserver = (url) => {
        wsInit(url);
    };
    window.spectate = ( /* a */ ) => {
        wsSend(UINT8_CACHE[1]);
        stats.maxScore = 0;
        hideESCOverlay();
    };
    window.changeSkin = (a) => {
        byId('skin').value = a;
        settings.skin = a;
        byId('gallery').hide();
    };
    window.openSkinsList = () => {
        if (byId('gallery-body').innerHTML === '') buildGallery();
        byId('gallery').show(0.5);
    };
    window.preloadBullShit = () => {
        window.skinsLoader.add('./assets/img/virus.png');
        window.skinsLoader.load().onError.add(() => {
            console.log("error");
        });
        window.skinsLoader.onComplete.add(() => {
            generateTextures();
            drawStats();
        })
    };
    window.skinsLoader = PIXI.Loader.shared;
    window.addEventListener('DOMContentLoaded', init);
})();   