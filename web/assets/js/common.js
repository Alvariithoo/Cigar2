export default {
    game: {},
    syncUpdStamp: performance.now(),
    syncAppStamp: performance.now(),
    cells: {
        mine: [],
        byId = {},
        list = []
    },
    border: {
        left: -2000,
        right: 2000,
        top: -2000,
        bottom: 2000,
        width: 4000,
        height: 4000,
        centerX: -1,
        centerY: -1
    },
    camera: {
        x: 0,
        y: 0,
        target: {
            x: 0,
            y: 0,
            scale: 1
        },
        viewportScale: 1,
        userZoom: 1,
        sizeScale: 1,
        scale: 1
    },
    leaderboard: {
        type: NaN,
        items: null,
        canvas: document.createElement("canvas"),
        teams: ["#F33", "#3F3", "#33F"]
    },
    chat: {
        messages: [],
        waitUntil: 0,
        canvas: document.createElement("canvas"),
        visible: false
    },
    stats: {
        fps: 0,
        latency: NaN,
        supports: null,
        info: null,
        pingLoopId: NaN,
        pingLoopStamp: null,
        canvas: document.createElement("canvas"),
        visible: false,
        score: NaN,
        maxScore: 0
    },
    mapCenterSet: false,
    settings: {
        animationDelay: 120,
    }
}