// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数 异步
exports.main = async(event, context) => {
    console.log("到达与云函数", event)
        // 收藏功能
    if (event.action == "shoucang") {
        return await cloud.database().collection('forumlist').doc(event.id)
            .update({
                data: {
                    shoucang: event.shoucang
                }
            })
            .then(res => {
                console.log("通过cloud收藏成功", res)
                return res
            })
            .catch(res => {
                console.log("通过cloud收藏失败", res)
                return res
            })
    } else if (event.action == "fabiao") {
        return await cloud.database().collection('forumlist').doc(event.id)
            .update({
                data: {
                    pinglun: event.pinglun
                }
            })
            .then(res => {
                console.log("通过cloud评论成功", res)
                return res
            })
            .catch(res => {
                console.log("通过cloud评论失败", res)
                return res
            })
    } else { //点赞
        return await cloud.database().collection('forumlist').doc(event.id)
            .update({
                data: {
                    dianzan: event.dianzan
                }
            })
            .then(res => {
                console.log("通过cloud点赞成功", res)
                return res
            })
            .catch(res => {
                console.log("通过cloud点赞失败", res)
                return res
            })
    }
}