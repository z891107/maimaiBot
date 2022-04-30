const route = require('./route.js');
const config = require('../config.json').maimai;
const sleep = require('../utilities/sleep.js');

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
    });
}

module.exports = app;

