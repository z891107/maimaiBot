import maimai from './maimai.js';
import { MessageEmbed } from 'discord.js';

import _config from '../config.json' assert { type: 'json' };
const config = _config.maimai;

var route = {};
route.lineCommandRouter = {};

var playersData = [];

route.Init = async () => {
    var players = config.players;

    await maimai.RefreshCookie();
    playersData = await Promise.all(players.map(async player => {
        var { rating, iconURL } = await maimai.GetPlayerProfileById(player.id, player.isSelf);
        var songRecords = await maimai.GetSongRecordsById(player.id, player.isSelf);

        return {
            ...player,
            rating,
            iconURL,
            songRecords
        };
    }));
};

route.Update = async res => {
    await maimai.RefreshCookie();
    playersData = await Promise.all(playersData.map(async PlayerData => {
        var oldRating = PlayerData.rating;
        var BreakSongRecordList = { new: [], old: [] };
        var oldSongRecords = PlayerData.songRecords;
        var newSongRecords = await maimai.GetSongRecordsById(PlayerData.id, PlayerData.isSelf);
        var { rating: newRating, iconURL } = await maimai.GetPlayerProfileById(PlayerData.id, PlayerData.isSelf);

        /*if (PlayerData.name == "阿咪") {
            for (let i = 0; i < newSongRecords.length; i++) {
                if (newSongRecords[i].title == "バーチャルダム　ネーション") {
                    newSongRecords[i].score = "101.4999%";
                    newSongRecords[i].isDX = false;
                    newRating = 16112;
                    newSongRecords[i].commentForCombo = "<:music_icon_app:968830831802064966>";
                    
                }
            }
        }*/

        if (newSongRecords.length != oldSongRecords.length) {
            return {
                ...PlayerData,
                songRecords: newSongRecords
            };
        }

        for (let i = 0; i < newSongRecords.length; i++) {
            if (newSongRecords[i].score != oldSongRecords[i].score ||
                newSongRecords[i].commentForCombo != oldSongRecords[i].commentForCombo ||
                newSongRecords[i].commentForSync != oldSongRecords[i].commentForSync) {
                BreakSongRecordList.new.push(newSongRecords[i]);
                BreakSongRecordList.old.push(oldSongRecords[i]);
            }
        }

        if (BreakSongRecordList.new.length == 0){
            newRating = oldRating;
        }

        route.OnBreakRecord({
            res,
            playerName: PlayerData.name,
            id: PlayerData.id,
            oldRating,
            newRating,
            iconURL,
            newSongRecords: BreakSongRecordList.new,
            oldSongRecords:BreakSongRecordList.old
        });

        return {
            ...PlayerData,
            rating: newRating,
            songRecords: newSongRecords
        };
    }), { concurrency: 6 });
};

route.OnBreakRecord = ({res, playerName, id, oldRating, newRating, iconURL, newSongRecords, oldSongRecords}) => {
    if (newSongRecords.length == 0) {
        return;
    }

    const message = new MessageEmbed()
	.setColor('#0099ff')
    .setThumbnail(iconURL)
	.setTimestamp();

    var ratingChange = newRating - oldRating == 0 ? "" : `\`+${newRating - oldRating}\``;

    message.setAuthor({ 
        name: playerName, 
        iconURL: iconURL, 
        url: `https://maimaidx-eng.com/maimai-mobile/friend/friendGenreVs/?idx=${id}` 
    });
    message.setDescription(`Rating: \`${newRating}\` ${ratingChange}`);

    for (var i = 0; i < newSongRecords.length; i++) {
        var ambiguousTextes = [
            {
                originRegex: /[" ""　"]/g,
                changed: "_" 
            },
            {
                originRegex: /["["]/g,
                changed: "［" 
            },
            {
                originRegex: /["]"]/g,
                changed: "］" 
            }
        ];
        var changedSongTitle = newSongRecords[i].title;
        for (let ambiguousText of ambiguousTextes) {
            changedSongTitle = changedSongTitle.replaceAll(ambiguousText.originRegex, ambiguousText.changed);
        }
        var songURL = `https://maimai.fandom.com/zh/wiki/${changedSongTitle}`;

        var songTitle = newSongRecords[i].title + (newSongRecords[i].isDX ? " (DX)" : "");

        message.addField("Song", `[**${songTitle}**](${songURL}) ${newSongRecords[i].lv}`);

        if (oldSongRecords[i].score != newSongRecords[i].score) {
            var scoreText = maimai.GetAchievementText(newSongRecords[i].score);
            message.addField("Rank", 
            `\`${oldSongRecords[i].score}\` ➡️ \`${newSongRecords[i].score}\` \n${scoreText}`, 
            true);
        }
	
	let newCommentForCombo;
	let newCommentForSync;
        if (oldSongRecords[i].commentForCombo != newSongRecords[i].commentForCombo) {
	    newCommentForCombo = newSongRecords[i].commentForCombo;
            message.addField("Combo", newSongRecords[i].commentForCombo, true);
        }
        if (oldSongRecords[i].commentForSync != newSongRecords[i].commentForSync) {
	    newCommentForSync = newSongRecords[i].commentForSync;
            message.addField("Sync", newSongRecords[i].commentForSync, true);
        }
	
	for (let broadcast of config.broadcasts) {
	    let isCommentMatched = !broadcast.comment || (newCommentForCombo.includes(broadcast.comment) || newCommentForSync.includes(broadcast.comment));
	    let isDeltaRatingMatched = !broadcast.deltaRating || (broadcast.deltaRating <= newRating - oldRating);
	    
	    if (isCommentMatched && isDeltaRatingMatched) {
	        message.setImage(broadcast.image_url);
                break;
	    }
	}
    }

    console.log(message);

    res.send({ embeds: [ message ] });
};
/*
route.lineCommandRouter['random'] = (req, res) => {
    if (req.argv.length < 4 || 
        !Number(req.argv[3]) || Number(req.argv[3]) > 4) return;

    var minLv = req.argv[1];
    var maxLv = req.argv[2];
    var count = req.argv[3];

    for (let i = 0; i < count; i++) {
        var song = maimai.GetRandomSong(minLv, maxLv);
        if (!song) return;

        var message = "\n";
        var preciseLvText = song.isPreciseLv ? "" : "(不精確)"

        message += song.name + "\n";
        message += maimai.GetDefficultyText(song.lvIndex) + " " + song.lv + preciseLvText + "\n";
        message += song.category + "\n";

        notify.pushForTest(message, song.imageURL);
        console.log(song);
    }
};

route.lineCommandRouter['help'] = (req, res) => {
    var message = "\n";

    message += "random MIN_LV MAX_LV COUNT\n";
    message += "COUNT 最大為 4";

    res.reply(message);
};*/

export default route;
