import route from './route.js';
import sleep from '../utilities/sleep.js';

import _config from '../config.json' assert { type: 'json' };
const config = _config.maimai;

var app = {};

const excludeUpdateTimeRange = ['02:55', '06:05'];

var IsMaimaiNETMaintain = (time) => {
    return time >= excludeUpdateTimeRange[0] && time <= excludeUpdateTimeRange[1];
};

app.start = bot => {
    const channel = bot.channels.cache.get(config.pushChannelId);

    route.Init().then(() => {
        var callback = () => setTimeout(async () => {
            var nowTime = new Date().toTimeString().split(' ')[0];
    
            if (!IsMaimaiNETMaintain(nowTime)) {
                try {
                    await route.Update(channel);
                } catch (e) {
                    console.log(e);
                    await sleep(5 * 60 * 1000);
                }
            }
    
            callback();
        }, 180 * 1000);
    
        callback();
    }).catch(async (e) => {
        console.log(e);
        await sleep(5 * 60 * 1000);
        app.start(bot);
    });
}

export default app;

