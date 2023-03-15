import route from './route.js';
import sleep from '../utilities/sleep.js';

import _config from '../config.json' assert { type: 'json' };
const config = _config.taiko;

var app = {};

const excludeUpdateTimeRange = ['00:55', '06:05'];

var IsTaikoNETMaintain = (time) => {
    return time >= excludeUpdateTimeRange[0] && time <= excludeUpdateTimeRange[1];
};

app.start = bot => {
    const channel = bot.channels.cache.get(config.pushChannelId);

    console.log("Taiko: Init Start");
    route.Init().then(() => {
        console.log("Taiko: Init OK");

        var callback = () => setTimeout(async () => {
            var nowTime = new Date().toTimeString().split(' ')[0];

            if (!IsTaikoNETMaintain(nowTime)) {
                try {
                    console.log("Taiko: Update Start");
                    await route.Update(channel);
                    console.log("Taiko: Update OK");
                } catch (e) {
                    console.log("Taiko: ", e);
                    await sleep(5 * 60 * 1000);
                }
            }

            callback();
        }, 1);

        callback();
    }).catch(async (e) => {
        console.log("Maimai: ", e);
        await sleep(5 * 60 * 1000);
        app.start(bot);
    });
}

export default app;

