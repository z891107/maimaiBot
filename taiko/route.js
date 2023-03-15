import taiko from './taiko.js';
import { MessageEmbed } from 'discord.js';

import _config from '../config.json' assert { type: 'json' };
const config = _config.taiko;

var route = {};

var playersData = [];

route.Init = async () => {
    var players = config.players;

    playersData = await Promise.all(players.map(async player => {
        var { iconURL, dojoIconURL } = await taiko.GetPlayerProfileByCookie(player.loginCookie);
        var songRecords = await taiko.GetSongRecordsByCookie(player.loginCookie);
        console.log(songRecords);

        return {
            ...player,
            iconURL,
            dojoIconURL,
            songRecords
        };
    }));
};

route.Update = async res => {
    //await taiko.RefreshCookie();
    playersData = await Promise.all(playersData.map(async playerData => {
        var BreakSongRecordList = { new: [], old: [] };
        var oldSongRecords = playerData.songRecords;
        var newSongRecords = await taiko.GetSongRecordsByCookie(playerData.loginCookie);

        for (let i = 0; i < newSongRecords.length; i++) {
            if (newSongRecords[i].title == "さいたま2000" || 
                newSongRecords[i].title == "キミと響くハーモニー" ||
                newSongRecords[i].title == "Coquette") {
                newSongRecords[i].score = "1000000";
            }
        }


        if (newSongRecords.length != oldSongRecords.length) {
            return {
                ...playerData,
                songRecords: newSongRecords
            };
        }

        for (let i = 0; i < newSongRecords.length; i++) {
            if (newSongRecords[i].score != oldSongRecords[i].score ||
                newSongRecords[i].crown != oldSongRecords[i].crown) {
                BreakSongRecordList.new.push(newSongRecords[i]);
                BreakSongRecordList.old.push(oldSongRecords[i]);
            }
        }

        route.OnBreakRecord({
            res,
            playerData,
            newSongRecords: BreakSongRecordList.new,
            oldSongRecords: BreakSongRecordList.old
        });

        return {
            ...playerData,
            songRecords: newSongRecords
        };
    }));
};

route.OnBreakRecord = ({ res, playerData, newSongRecords, oldSongRecords }) => {
    if (newSongRecords.length == 0) {
        return;
    }

    const message = new MessageEmbed()
        .setColor('#e83126')
        .setThumbnail(playerData.iconURL)
        .setTimestamp();

    message.setAuthor({
        name: playerData.name,
        iconURL: playerData.dojoIconURL,
    });

    for (var i = 0; i < newSongRecords.length; i++) {
        var regex = /[" ""　"]/g;
        var songURL = `https://maimai.fandom.com/zh/wiki/${newSongRecords[i].title.replaceAll(regex, "_")}`;

        message.addField("Song", `${newSongRecords[i].title} ${newSongRecords[i].difficulty}`);

        if (oldSongRecords[i].score != newSongRecords[i].score) {
            message.addField("Score",
                `\`${oldSongRecords[i].score}\` ➡️ \`${newSongRecords[i].score}\``,
                true);
        }
        message.addField("Crown", newSongRecords[i].crown, true);
        message.addField("Rank", newSongRecords[i].scoreIcon, true);

        message.addField("Good:", newSongRecords[i].goodCount, true);
        message.addField("Ok:", newSongRecords[i].okCount, true);
        message.addField("Suck:", newSongRecords[i].notGoodCount, true);

        message.addField('\u200b', '\u200b');
    }

    console.log(message);

    res.send({ embeds: [message] });
};

export default route;