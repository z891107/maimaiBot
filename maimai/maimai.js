import * as cheerio from 'cheerio';
import axios from 'axios';
import maimaiSongs from './maimaisongs.js';
import pLimit from 'p-limit';

import _config from '../secretConfig.json' assert { type: 'json' };
const { id, password } = _config.maimai.auth;

var maimai = {};

const limit = pLimit(3);

const maimaiLoginPage = "https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/";
const maimaiLogin = {
    url: "https://lng-tgk-aime-gw.am-all.net/common_auth/login/sid/",
    method: "POST",
    headers: {
        'Cookie': "",
    },
    maxRedirects: 0,
    validateStatus: function (status) {
        return status >= 200 && status <= 302
    },
    data: `retention=0&sid=${id}&password=${password}`
}
const maimaiGetAnotherCookie = {
    url: "",
    method: "GET",
    maxRedirects: 0,
    validateStatus: function (status) {
        return status >= 200 && status <= 302
    },
    headers: {
        'Cookie': "",
    },
};

var maimaiPage = axios.create({
    baseURL: "https://maimaidx-eng.com/maimai-mobile/",
    method: "GET",
    maxRedirects: 0,
    validateStatus: function (status) {
        return status >= 200 && status <= 302
    },
    headers: {
        'Cookie': "",
    },
    params: {
        'scoreType': "2",
        'genre': "99",
        'diff': "0",
        'idx': "7050661888883"
    },
});

var maimaiCookies = "";

const DIFFICULTIES_INFO = [
    {
        officialText: "basic",
        text: "basic"
    },
    {
        officialText: "advanced",
        text: "<:diff_advanced1:969502032727797770><:diff_advanced2:969502032685842493><:diff_advanced3:969502032673251338><:diff_advanced4:969502032694231060><:diff_advanced5:969502032618737724>"
    },
    {
        officialText: "expert",
        text: "<:diff_expert1:969210743167803412><:diff_expert2:969210743356543016><:diff_expert3:969210743553679450><:diff_expert4:969210743171973190>"
    },
    {
        officialText: "master",
        text: "<:diff_master1:969209531643072512><:diff_master2:969209531630514206><:diff_master3:969209531479515156><:diff_master4:969209531445952512>"
    },
    {
        officialText: "remaster",
        text: "<:diff_remaster1:968899208423821362><:diff_remaster2:968899208314748979><:diff_remaster3:968901783160225833><:diff_remaster4:968901798431719485><:diff_remaster5:968902398573699112>"
    },
];

const ACHIEVEMENTS_INFO = [
    {
        minAchv: 100.5,
        factor: 22.4,
        text: "<:sss1:969199922299670538><:sss2:969199922345803826><:sssplus3:969199922081591347>"
    }, {
        minAchv: 100,
        factor: 21.6,
        text: "<:sss1:969199922299670538><:sss2:969199922345803826><:sss3:969201603959738388>"
    }, {
        minAchv: 99.5,
        factor: 21.1,
        text: "<:ss1:969203251629162546><:ss2:969203251658489916><:ssplus3:969203251675275314>"
    }, {
        minAchv: 99,
        factor: 20.8,
        text: "<:ss1:969203251629162546><:ss2:969203251658489916><:ss3:969203796074983485>"
    }, {
        minAchv: 98,
        factor: 20.3,
        text: "<:s1:1022892695687020564><:splus2:969204684394987591><:splus3:969204684764110898>"
    }, {
        minAchv: 97,
        factor: 20,
        text: "<:s1:1022892695687020564><:s2:969205596815499335>"
    }, {
        minAchv: 94,
        factor: 16.8,
        text: "AAA"
    }, {
        minAchv: 90,
        factor: 15.2,
        text: "AA"
    }, {
        minAchv: 80,
        factor: 13.6,
        text: "A"
    }, {
        minAchv: 75,
        factor: 12,
        text: "BBB"
    }, {
        minAchv: 70,
        factor: 11.2,
        text: "BB"
    }, {
        minAchv: 60,
        factor: 9.6,
        text: "B"
    }, {
        minAchv: 50,
        factor: 8,
        text: "C"
    }, {
        minAchv: 0,
        factor: 0,
        text: "D"
    }
];

const COMMENT_URL_TO_TEXT = {
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fc.png" : "<:music_icon_fc:1022882660680482816>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fcp.png" : "<:music_icon_fcp:968830814643163167>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_ap.png" : "<:music_icon_ap:968830822872403978>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_app.png" : "<:music_icon_app:968830831802064966>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fs.png" : "<:music_icon_fs:968830839230177310>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fsp.png" : "<:music_icon_fsp:968830846800887822>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fsd.png" : "<:music_icon_fsd:968830861569060885>",
    "https://maimaidx-eng.com/maimai-mobile/img/music_icon_fsdp.png" : "<:music_icon_fsdp:968830874625921046>",
};

maimai.GetDefficultyText = i => DIFFICULTIES_INFO[i].text;

maimai.GetAchievementText = achv => {
    achv = Number(achv.slice(0, -1));
    
    for (let i = 0; i < ACHIEVEMENTS_INFO.length; i++) {
        if (ACHIEVEMENTS_INFO[i].minAchv <= achv) {
                return ACHIEVEMENTS_INFO[i].text;
            }
    }
}

maimai.GetSongByName = name => {
    return maimaiSongs.GetSongByName(name);
};

maimai.GetRandomSong = (minLv, maxLv) => {
    return maimaiSongs.GetRandomSong(minLv, maxLv);
}

maimai.RefreshCookie = async () => {
    var response;

    response = await axios(maimaiLoginPage);
    maimaiLogin.headers['Cookie'] = response.headers['set-cookie'];

    response = await axios(maimaiLogin);
    maimaiGetAnotherCookie.url = response.headers['location'];
    maimaiGetAnotherCookie.headers['Cookie'] = response.headers['set-cookie'];

    response = await axios(maimaiGetAnotherCookie);
    maimaiCookies = response.headers['set-cookie'];
}

maimai.GetSongRecordsByIdAndDifficulty = async (id, isSelf, difficulty) => {
    var response = await limit( () => maimaiPage("/friend/friendGenreVs/battleStart/", {
        headers: {
            'Cookie': maimaiCookies
        },
        params: {
            'diff': difficulty,
            'idx': id,
        }
    }));

    if (response.status == 302) {
        throw new Error("GetSongRecordsByIdAndDifficulty(): got HTTP 302");
    }

    var $ = cheerio.load(response.data);

    return $('.music_' + DIFFICULTIES_INFO[difficulty].officialText + '_score_back').map((index, obj) => {
        var musicKindIconURL = $(obj).find('.music_kind_icon').attr('src');

        var scoreIndex = isSelf ? 0 : 1;

        var commentSelector = isSelf ? ".t_l .h_30" : ".t_r .h_30";
        var commentsIndex = isSelf ? [1, 2] : [1, 0];
        var commentIconURLs = Array.from(
            {length: 2}, 
            (_, i) => $(obj).find(commentSelector).eq(commentsIndex[i]).attr('src').substring(0,$(obj).find(commentSelector).eq(commentsIndex[i]).attr('src').indexOf("?ver"))
        );

        return {
            title: $(obj).find('.music_name_block').text().trim(),
            isDX: !musicKindIconURL.includes("standard"),
            lv: DIFFICULTIES_INFO[difficulty].text + " " + $(obj).find('.music_lv_block').text().trim(),
            score: $(obj).find('.' + DIFFICULTIES_INFO[difficulty].officialText + '_score_label').eq(scoreIndex).text().trim(),
            commentForCombo: COMMENT_URL_TO_TEXT[commentIconURLs[0]],
            commentForSync: COMMENT_URL_TO_TEXT[commentIconURLs[1]],
        }
    }).get();
};


maimai.GetSongRecordsById = async (id, isSelf) => {
    var songsRecords = [];

    for (let difficulty = 2; difficulty <= 4; difficulty++) {
        var s = await maimai.GetSongRecordsByIdAndDifficulty(id, isSelf, difficulty);

        songsRecords.push(...s);
    }

    return songsRecords;
};

maimai.GetPlayerProfileById = async (id, isSelf) => {
    var response = await limit( () => maimaiPage("/friend/friendGenreVs/", {
        headers: {
            'Cookie': maimaiCookies
        },
        params: {
            'idx': id,
        }
    }));

    var $ = cheerio.load(response.data);

    var index = isSelf ? 0 : 1;

    return {
        rating: $('.rating_block').eq(index).text().trim(),
        iconURL: $(".h_55").eq(index).attr('src')
    };
};

export default maimai;