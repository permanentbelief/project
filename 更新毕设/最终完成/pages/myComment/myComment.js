const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        num: 1,
        list: [],
        shuaxin: false
    },

    // 跳转到新闻详情
    skipNewDetail(e) {
        wx.navigateTo({
            url: '/pages/newDetail/newDetail?id=' + e.currentTarget.dataset.id,
        })
        this.setData({
            shuaxin: true
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function(options) {
        var list = await this.getNews(1, this.data.list);
        this.setData({
            list
        })
    },
    // 异步改为同步 
    checkData: async function(id) {
        let res = await db.collection('news').where({
            _id: id
        }).get()
        console.log(res)
        if (res.data.length > 0) {
            return true;
        } else {
            return false;
        }
    },
    removefromluntan: async function(id) {
        await db.collection('luntan').
        where({
                pid: id
            })
            .remove()
    },
    // 获取数据
    getNews(num, list) {
        return new Promise((reslove, err) => {
            db.collection('luntan').where({
                userId: wx.getStorageSync('user')._id,
                type: 1,
            }).skip((num - 1) * 20).limit(20).get({
                success: async res => {

                    if (res.data.length) {
                        this.setData({
                            num: ++num
                        })
                        console.log("我评论的列表", res);
                        for (let i = 0; i < res.data.length; i++) {
                            // 查询评论过的文章
                            if (res.data[i].pid == undefined) {
                                continue;
                            }
                            let bChk = await this.checkData(res.data[i].pid)
                            if (!bChk) {
                                await this.removefromluntan(res.data[i].pid)
                                continue
                            }
                            var news = await this.getShoucang(res.data[i].pid);
                            // console.log(news);
                            res.data[i].news = news;
                            list.push(res.data[i])
                        }
                        reslove(list);
                        // this.getNews(++num, list).then(res => reslove(res));
                    }
                }
            })
        })
    },

    getShoucang(id) {
        return new Promise((reslove, err) => {
            db.collection('news').doc(id).get({
                success: res => {
                    // console.log(res);
                    res.data.createTime = util.formatTime(new Date(res.data._createTime));
                    reslove(res.data);
                },
                fail: err => {
                    console.log(err);
                }
            })
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: async function() {
        if (this.data.shuaxin) {
            this.setData({
                list: []
            })
            console.log('刷新');
            var list = await this.getNews(1, this.data.list);
            this.setData({
                shuaxin: false,
                list
            })
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: async function() {
        var list = await this.getNews(this.data.num, this.data.list);
        this.setData({
            list
        })
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})