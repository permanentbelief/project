const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        order: {},
        sshow: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var id = options.id;
        db.collection('order').doc(id).get({
            success: res => {
                var order = res.data;
                console.log(order);
                order.createTime = util.formatTime(order.createTime);
                if (order.qiandaoTime) {
                    var qiandaoTime = util.formatTime(new Date(order.qiandaoTime))
                    order.qiandaoTime = qiandaoTime;
                }
                this.setData({
                    order
                })
            }
        })
    },

    // 跳转到报告
    skipReport(e) {
        var id = e.currentTarget.dataset.id;
        var td = e.currentTarget.dataset.td;
        console.log("td是什么 ", td)
        if (td) {
            this.setData({
                sshow: true
            })
            return;
        }
        wx.navigateTo({
            url: '/pages/hesuanjieguo/hesuanjieguo?id=' + id,
        })
    },

    // 删除订单
    deleteOrder(e) {
        console.log("删除订单deleteOrder", e);
        console.log("hahh", e.currentTarget.dataset.status);
        wx.showModal({
            title: '温馨提醒',
            content: '确定删除该笔订单吗?',
            success: res => {
                if (res.cancel) {
                    return;
                }
                var id = e.currentTarget.dataset.id;
                var st = e.currentTarget.dataset.status;
                console.log("st", st);
                //这里直接全部更改isdelete.

                db.collection('order').doc(id).update({
                        data: {
                            isdeleted: true,
                        },
                        success: async res => {
                            wx.showToast({
                                title: '删除成功',
                            })
                            setTimeout(() => {
                                wx.navigateBack({
                                    delta: 1,
                                }, 1000);
                            })
                        }
                    })
                    // 非已完成的订单 直接删除 老的逻辑吧
                    // if (st != 4) {
                    //     db.collection('order').doc(id).remove({
                    //         success: async res => {
                    //             wx.showToast({
                    //                 title: '删除成功',
                    //             })
                    //             setTimeout(() => {
                    //                 wx.navigateBack({
                    //                     delta: 1,
                    //                 })
                    //             }, 1000);
                    //         }
                    //     })
                    // } else {
                    //     console.log("hah")
                    // }
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

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})