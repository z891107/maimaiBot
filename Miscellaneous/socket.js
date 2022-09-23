import net from 'net';

var socket = {};

socket.start = () => {
    var server = net.createServer();

    server.listen(9999, function () {
        console.log('TCP Server start');
    });

    server.on('connection', function (client) {
        console.log('TCP get connection');

        client.on('error', function (e) {
            console.log("Socket error:");
        })
    });
};

export default socket;

