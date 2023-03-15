import * as cheerio from 'cheerio';
import axios from 'axios';

var taiko = {};

const TAIKO_SITE_URL = "https://donderhiroba.jp/";
const TAIKO_INDEX_PAGE = "index.php";
const TAIKO_SONG_LIST_PAGE = "score_list.php";
const TAIKO_SCORE_UPDATE_PAGE = "ajax/update_score.php/";

var taikoLoginPage = axios.create({
    baseURL: "https://donderhiroba.jp/login_process.php?mode=exec",
    method: "GET",
    /*validateStatus: function (status) {
        return status >= 200 && status <= 302
    },*/
    headers: {
        'Cookie': "_token_v2=gn0gi2u44jm06s23ltfnb31pv2",
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    },
});

var res = await taikoLoginPage();
console.log(res);

var taikoPage = axios.create({
    baseURL: TAIKO_SITE_URL,
    method: "GET",
    maxRedirects: 0,
    /*validateStatus: function (status) {
        return status >= 200 && status <= 302
    },*/
    headers: {
        'Cookie': "_token_v2=gn0gi2u44jm06s23ltfnb31pv2",
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    },
});

var taikoUpdateScore = axios.create({
    baseURL: `${TAIKO_SITE_URL}${TAIKO_SCORE_UPDATE_PAGE}`,
    method: "POST",
    maxRedirects: 0,
    /*validateStatus: function (status) {
        return status >= 200 && status <= 302
    },*/
    headers: {
        'Cookie': "_token_v2=cd976o6mnpqmir3sji1c51v494",
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        'X-Requested-With': "XMLHttpRequest",
    },
});

const DIFFICULTIES_INFO = [
    {},
    {
        className: "eazy",
        text: "eazy"
    },
    {
        className: "normal",
        text: "normal"
    },
    {
        className: "hard",
        text: "<:hard1:1022899648513462443><:hard2:1022902532936310825>"
    },
    {
        className: "oni",
        text: "<:oni:1022899646571487384>"
    },
    {
        className: "oni_ura",
        text: "<:uraoni:1022899644725993583>"
    },
];

const CROWN_INFO = [
    {
        text: "<:no_crown:1022896254956613714>"
    },
    {
        text: "<:silver_crown:1022896240918274058>"
    },
    {
        text: "<:gold_crown:1022896228813516871>"
    },
    {
        text: "<:rainbow_crown:1022895390137270392>"
    },
];

const SCORE_ICON_INFO = [
    {},{},
    {
        text: "<:white_score:1022897621859315734>"
    },
    {
        text: "<:copper_score:1022897620332589067>"
    },
    {
        text: "<:silver_score:1022897618390622258>"
    },
    {
        text: "<:gold_score:1022897616851304510>"
    },
    {
        text: "<:pink_score:1022897615341375488>"
    },
    {
        text: "<:purple_score:1022897613701382245>"
    },
    {
        text: "<:rainbow_score:1022897612082397286>"
    },
];

const GENRE_INFO = [
    {},
    {
        className: "jpop"
    },
    {
        className: "anime"
    },
    {
        className: "kids"
    },
    {
        className: "vocaloid"
    },
    {
        className: "game"
    },
    {
        className: "namco"
    },
    {
        className: "variety"
    },
    {
        className: "classic"
    },
]

taiko.GetDefficultyText = i => DIFFICULTIES_INFO[i].text;

taiko.GetAchievementText = achv => {
    achv = Number(achv.slice(0, -1));

    if (ACHIEVEMENTS_INFO[0].minAchv <= achv) {
        return ACHIEVEMENTS_INFO[0].text;
    }
    
    for (let i = 1; i < ACHIEVEMENTS_INFO.length; i++) {
        if (ACHIEVEMENTS_INFO[i - 1].minAchv > achv && 
            ACHIEVEMENTS_INFO[i].minAchv <= achv) {
                return ACHIEVEMENTS_INFO[i].text;
            }
    }
}

/*var response = await taikoPage(TAIKO_INDEX_PAGE);
console.log(response)*/

taiko.GetSongRecordsByCookieAndGenre = async (cookie, genre) => {
    var response = await taikoPage(TAIKO_SONG_LIST_PAGE, {
        headers: {
            'Cookie': cookie
        },
        params: {
            'genre': genre,
        }
    });
    if (response.status == 302) {
        throw new Error("GetSongRecordsByCookieAndGenre(): got HTTP 302");
    }

    var $ = cheerio.load(response.data);
    var songURLs = [];
    var songRecords = [];

    $(`.${DIFFICULTIES_INFO[3].className}${GENRE_INFO[genre].className}`).map((index, obj) => {
        var isPlayed = !$(obj).attr('src').includes('none');
        if (isPlayed) {
            songURLs.push($(obj).parent().attr('href'))
        }
    });
    $(`.${DIFFICULTIES_INFO[4].className}${GENRE_INFO[genre].className}`).map((index, obj) => {
        var isPlayed = !$(obj).attr('src').includes('none');
        if (isPlayed) {
            songURLs.push($(obj).parent().attr('href'))
        }
    });
    $(`.${DIFFICULTIES_INFO[5].className}${GENRE_INFO[genre].className}`).map((index, obj) => {
        var isPlayed = !$(obj).attr('src').includes('none');
        if (isPlayed) {
            songURLs.push($(obj).parent().attr('href'))
        }
    });

    songRecords = await Promise.all(songURLs.map(async (url) => {
        var response = await taikoPage(url, {
            headers: {
                'Cookie': cookie
            },
        });
        if (response.status == 302) {
            console.log(response);
            throw new Error("GetSongRecordsByCookieAndGenre(): got HTTP 302");
        }

        var $ = cheerio.load(response.data);

        var difficultyIndex = $('.level').attr('src').split('_')[2];
        var crownIndex = $('.crown').attr('src').split('_')[2];
        var scoreIconIndex = $('.best_score_icon').attr('src')?.split('_')[3];

        return {
            title: $(`.songNameFont${GENRE_INFO[genre].className}`).text().trim(),
            difficulty: DIFFICULTIES_INFO[difficultyIndex].text,
            crown: CROWN_INFO[crownIndex].text,
            scoreIcon: scoreIconIndex >= 2 ? SCORE_ICON_INFO[scoreIconIndex].text : "",
            globalRank: $('.ranking').children().eq(1).text().trim().slice(0, -1),
            score: $('.high_score').children().eq(1).text().trim().slice(0, -1),
            goodCount: $('.good_cnt').children().eq(1).text().trim().slice(0, -1),
            okCount: $('.ok_cnt').children().eq(1).text().trim().slice(0, -1),
            notGoodCount: $('.ng_cnt').children().eq(1).text().trim().slice(0, -1),
            combo: $('.combo_cnt').children().eq(1).text().trim().slice(0, -1),
            poundCount: $('.pound_cnt').children().eq(1).text().trim().slice(0, -1),
            playCount: $('.stage_cnt').children().eq(1).text().trim().slice(0, -1),
            clearCount: $('.clear_cnt').children().eq(1).text().trim().slice(0, -1),
            FCCount: $('.full_combo_cnt').children().eq(1).text().trim().slice(0, -1),
            allGoodCount: $('.dondaful_combo_cnt').children().eq(1).text().trim().slice(0, -1),
        }
    }));

    return songRecords;
};


taiko.GetSongRecordsByCookie = async (cookie) => {
    var songsRecords = [];

    await Promise.all(
        Array.from({ length: 8 }, (_, i) => i + 1).map(async (genre) => 
            taiko.GetSongRecordsByCookieAndGenre(cookie, genre)
        )
    ).then((songs) => {
        songs.forEach(s => {
            songsRecords.push(...s);
        });
    });

    return songsRecords;
};

taiko.GetPlayerProfileByCookie = async (cookie) => {
    var response = await taikoPage(TAIKO_INDEX_PAGE, {
        headers: {
            'Cookie': cookie
        },
    });

    var $ = cheerio.load(response.data);

    return {
        iconURL: $('.customd_mydon').eq(0).attr('src'),
        dojoIconURL: `${TAIKO_SITE_URL}${$('#mydon_area').children().eq(2).children().eq(1).children().eq(0).attr('src')}`,
    };
};



export default taiko;