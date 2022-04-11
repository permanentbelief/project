const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        num: 0,
        zxNum: 0,
        trNum: 0,
        lastIndex: 0,
        kpIndex: 0,
        kepu: [],
        track: [],
    },

    // 选择最后一个标题栏
    chooseLastNav(e) {
        var index = e.currentTarget.dataset.index;
        console.log("选择标题栏", e)
        console.log("哪个标题栏", e.currentTarget.dataset.index)
        index = Number(index);
        if (index == 0) {
            console.log("zxNum", this.data.zxNum)
            this.getZixun(this.data.zxNum)
        } else if (index == 1) {
            var type = this.data.kpIndex;
            if (type == 0) {
                this.getKepu({}, this.data.num);
            } else {
                this.getKepu({
                    type
                }, this.data.num);
            }
        } else {
            this.getTrack(this.data.trNum)
        }
        this.setData({
            lastIndex: index
        })
    },

    // 跳转到详情
    skipDetail(e) {
        wx.navigateTo({
            url: '/pages/kepuDetail/kepuDetail?id=' + e.currentTarget.dataset.id,
        })
    },

    // 选择疫情科普导航栏
    chooseKp(e) {
        var index = e.currentTarget.dataset.index;
        index = Number(index);
        this.setData({
            kepu: []
        })
        if (index == 0) {
            this.getKepu({}, 0);
        } else if (index == 1) {
            this.getKepu({
                type: 1
            }, 0);
        } else if (index == 2) {
            this.getKepu({
                type: 2
            }, 0);
        } else {
            this.getKepu({
                type: 3
            }, 0);
        }
        this.setData({
            kpIndex: index
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.getZixun(this.data.zxNum)
            // this.getKepu({}, this.data.num);
    },

    // 获取科普数据
    getKepu(tiaojian, num) {
        db.collection('kepu').where(tiaojian).skip(num * 20).limit(20).orderBy('_createTime', 'desc').get({
            success: res => {
                if (res.data.length) {
                    var kepu = this.data.kepu;
                    console.log(kepu);
                    kepu = kepu.concat(res.data);
                    console.log(kepu);
                    this.setData({
                        num: ++num,
                        kepu
                    })
                }
            }
        })
    },

    // 获取实时咨询
    getZixun(num) {
        // 首页只显示三条
        db.collection('zixun').skip(num * 20).limit(20).orderBy('_createTime', 'desc').get({
            success: res => {
                console.log(res);
                var zixun = res.data;
                if (zixun.length) {
                    for (let i = 0; i < zixun.length; i++) {
                        zixun[i].createTime = util.formatTime(new Date(zixun[i]._createTime));
                    }
                    this.setData({
                        zxNum: ++num,
                        zixun
                    })
                }
            }
        })
    },
    getTrack(num) {
        // 首页可以显示多条数据
        db.collection('track').skip(num * 20).limit(20).orderBy('_createTime', 'desc').get({
            success: res => {
                console.log(res);
                var track = res.data;
                if (track.length) {
                    for (let i = 0; i < track.length; i++) {
                        track[i].createTime = util.formatTime(new Date(track[i]._createTime));
                    }
                    this.setData({
                        trNum: ++num,
                        track
                    })
                }
            }
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
    onShow: function() {

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
    onReachBottom: function() {
        var lastIndex = this.data.lastIndex;
        if (lastIndex == 0) {
            this.getZixun(this.data.zxNum);
        } else {
            var index = this.data.kpIndex;
            if (index == 0) {
                this.getKepu({}, 0);
            } else if (index == 1) {
                this.getKepu({
                    type: 1
                }, 0);
            } else if (index == 2) {
                this.getKepu({
                    type: 2
                }, 0);
            } else {
                this.getKepu({
                    type: 3
                }, 0);
            }
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})