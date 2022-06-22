const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

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

    skipReport(e) {
        var td = e.currentTarget.dataset.td;
        console.log("td是什么 ", td)
        if (td) {
            this.setData({
                sshow: true
            })
            return;
        }
        wx.navigateTo({
            url: '/pages/hsResult/hsResult?id=' + id,
        })
    },

    deleteOrder(e) {
        console.log("删除订单deleteOrder", e);
        wx.showModal({
            title: '注意',
            content: '确认删除此订单吗?',
            success: res => {
                if (res.cancel) {
                    return;
                }
                var order_id = e.currentTarget.dataset.order_id;
                var st = e.currentTarget.dataset.st;
                console.log("st", st);
                //这里直接全部更改isdelete.
                db.collection('order').doc(order_id).update({
                        data: {
                            isdeleted: true,
                        },
                        success: res => {
                            wx.showToast({
                                title: '删除成功',
                            })
                            wx.navigateBack({
                                    delta: 1,
                            })
                        }
                    })
            }
        })
    }
})