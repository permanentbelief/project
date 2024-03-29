// 获取时间
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}
const wxuuid = function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid

}


function timestampToTime(timestamp) {
    var date = new Date(timestamp); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
    var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    var s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

    let strDate = Y + M + D + h + m + s;　
    console.log(strDate) //2020-05-08 17:44:56　
    return strDate;
}

// 获取日期
const formatDate = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    return `${[year, month, day].map(formatNumber).join('-')}`
}

const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : `0${n}`
}

const db = wx.cloud.database();

function checkData(id) {
    db.collection('news').where({
            _id: id
        })
        .get()
        .then(res => {
            console.log(res)
            if (res.data.length > 0) {
                console.log("大于0", id)
                return true;
            } else {
                console.log("不大于0", id)
                return false;
            }
        })
    return false;
}


//   ------- 从缓存中去拿 数据 ------------------------


//  设置时效缓存，time为有效时间，（单位：小时，不填则默认24小时）
function setStorageSyncHour(key, value, time) {
    wx.setStorageSync(key, value)
    var t = time ? time : 24;
    var seconds = parseInt(t * 3600);
    if (seconds > 0) {
        var timestamp = Date.parse(new Date());
        timestamp = timestamp / 1000 + seconds;
        wx.setStorageSync(key + 'dtime', timestamp + "")
    } else {
        wx.removeStorageSync(key + 'dtime')
    }
}

//设置时效缓存，time为有效时间，（单位：秒，不填则默认3600s）
function setStorageSyncSecond(key, value, time) {
    wx.setStorageSync(key, val)
    var t = time ? time : 3600;
    var seconds = parseInt(t);
    if (seconds > 0) {
        var timestamp = Date.parse(new Date());
        timestamp = timestamp / 1000 + seconds;
        wx.setStorageSync(k + 'dtime', timestamp + "")
    } else {
        wx.removeStorageSync(k + 'dtime')
    }
}

// 读取缓存，若缓存不存在，返回def，def为可选参数，表示无缓存数据时返回值
function getStorageSyncTime(key, def) {
    var deadtime = parseInt(wx.getStorageSync(key + 'dtime'))
    if (deadtime) {
        if (parseInt(deadtime) < Date.parse(new Date()) / 1000) {
            wx.removeStorageSync(key);
            wx.removeStorageSync(key + 'dtime');
            if (def) { return def; } else { return; }
        }
    }
    var res = wx.getStorageSync(key);
    if (res) {
        return res;
    } else {
        return def
    }


}



module.exports = {
    formatTime,
    formatDate,
    wxuuid: wxuuid,
    timestampToTime,
    checkData,
    setStorageSyncHour: setStorageSyncHour,
    setStorageSyncSecond: setStorageSyncSecond,
    getStorageSyncTime: getStorageSyncTime
}