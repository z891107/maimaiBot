import socket from '../Miscellaneous/socket.js'
import maimaiScoreTracer from '../maimai/app.js';
import taikoScoreTracer from '../taiko/app.js';

export default {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        socket.start();

        //taikoScoreTracer.start(client);
        maimaiScoreTracer.start(client);
    },
};