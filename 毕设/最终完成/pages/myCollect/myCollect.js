const db = wx.cloud.database();
const util = require('../../utils/util.js');
const regeneratorRuntime = require('../../utils/regeneratorRuntime.js')
Page({

    /**
     * 页面的初始数据
     */
    data: {
        num: 1,
        list: [],
        shuaxin: false,
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
        // 一进入函数的时候 options为空, data.list也为空
        var list = await this.getNews(1, this.data.list);
        this.setData({
                list
            })
            // 还是有问题 一直返回false 有问题的 d4107ab1624a64fb04b10b0f16c2783d news中没有这条数据
            // 没有问题的 数据 
            //efbc6d71623b3435017f23ab43be167c
            // this.checkData("d4107ab1624a64fb04b10b0f16c2783d")
            // console.log("biaoji", this.data.biaoji)

        //d4107ab1624a64fb04b10b0f16c2783d  正确的数据 efbc6d71623b348e017f2b737b6b7ebf
        // if (this.checkData("d4107ab1624a64fb04b10b0f16c2783d")) {
        //     console.log("true")
        // } else {
        //     console.log("false")
        // }

        // var a = 11
        // if (!this.isbig(9)) {
        //     console.log("yes")
        // } else {
        //     console.log("no")
        // }
        // let bChk = await this.checkData("efbc6d71623b348e017f2b737b6b7ebf")
        // console.log("bChk", bChk)
        // if (bChk) {
        //     console.log('true')
        // } else {
        //     console.log('false')
        // }


    },
    // 查看文章的id 是否在里面news表中还存在
    checkData: async function(id) {
        let res = await db.collection('news').where({
            _id: id
        }).get()
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
    getNews(num, list) { // async 这里有问题 等待查询 ！
        return new Promise((reslove, err) => {
            db.collection('luntan').where({
                userId: wx.getStorageSync('user')._id,
                type: 3
            }).skip((num - 1) * 20).limit(20).get({
                success: async res => {
                    // console.log(res);
                    if (res.data.length) {
                        this.setData({
                            num: ++num
                        })
                        console.log("我收藏的内容", res.data)
                        for (let i = 0; i < res.data.length; i++) {
                            // 查询收藏的文章
                            // console.log("让我查看收藏的列表pid", res.data[i].pid)
                            // || !this.CheckData(res.data[i].pid)
                            // 兼容之前的逻辑 有一些调试的脏数据
                            if (res.data[i].pid == undefined) {
                                continue;
                            }
                            let bChk = await this.checkData(res.data[i].pid)
                            if (!bChk) {
                                console.log("收藏列表 要全部清除的文章pid", res.data[i].pid)
                                await this.removefromluntan(res.data[i].pid)
                                continue
                            }
                            // 查看这个选中的news信息  是否被删除  ---- 我想在106行的时候 checkData()一下 
                            // if (res.data[i].pid == "d4107ab1624a64fb04b10b0f16c2783d") {
                            //     continue;
                            // }
                            var news = await this.getShoucang(res.data[i].pid);
                            console.log(news);
                            res.data[i].news = news;
                            list.push(res.data[i])
                        }
                        // oldLogic 
                        //list = list.concat(res.data);
                        // this.getNews(++num, list).then(res => reslove(res));
                        reslove(list);

                    }
                }
            })
        })
    },
    getShoucang(id) {
        // console.log("调用收藏的得id", id)
        return new Promise((reslove, err) => {
            db.collection('news').doc(id).get({
                success: res => {
                    // console.log(res);
                    res.data.createTime = util.formatTime(new Date(res.data._createTime));
                    reslove(res.data);
                },
                fail: err => {
                    // console.log("有错误了")
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
    onHide: function() {},
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {},
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {},

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