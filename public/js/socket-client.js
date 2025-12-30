/**
 * Socket.IO 客户端
 * WebSocket 客户端库
 */

// 创建Socket.IO连接
const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    timeout: 10000
});

// 事件监听器存储
const eventListeners = new Map();

// 注册事件监听器
function on(event, callback) {
    socket.on(event, callback);

    if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
}

// 移除事件监听器
function off(event, callback) {
    socket.off(event, callback);
}

// 发送事件
function emit(event, data) {
    socket.emit(event, data);
}

// 注册客户端类型
function registerClient(clientType) {
    emit('register_client', clientType);
}

// 获取连接状态
function isConnected() {
    return socket.connected;
}

// 导出API
window.socketClient = {
    socket,
    on,
    off,
    emit,
    registerClient,
    isConnected
};
