import net from 'net';

var socket = {};

socket.start = () => {
    var server = net.createServer();

    server.listen(9999, function () {
        console.log('TCP Server start');
    });

    server.on('connection', function () {
        console.log('TCP get connection')
    });

    server.on('error', function (e) {
        console.log("Socket error:", e);
    });
};

export default socket;

