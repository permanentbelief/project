const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
    data: {
        active: 0,
        list: [{
                text: '未付款',
                desc: '下单暂时还未支付',

            },
            {
                text: '签到中',
                desc: '要记得签到时间喔',

            },
            {
                text: '检测中',
                desc: '机构还未出结果',

            },
            {
                text: '检测完成',
                desc: '检测结果可以查询',
            },
        ],
        index: 0,
        res: {},
        show: true,

    },
    onLoad: function(options) { // 记载这个页面信息
        var that = this;
        db.collection('order').where({
            userId: wx.getStorageSync('user')._id,
            phone: wx.getStorageSync('user').phone,
            type: 1,
            tuanti: 0,
            status: 4
        }).orderBy('createTime', 'desc').get({
            success: res => {
                console.log("查询到最近的订单信息", res);
                if (res.data.length) {
                    var result = res.data[0];
                    console.log("进入if")
                    if (result.status == undefined) {
                        return;
                    }
                    var ress = {}
                    ress.name = result.realName;
                    ress.groupName = result.group;
                    if (result.orderNum) {
                        ress.orderId = result.orderNum;
                    }
                    if (result.payTime) {
                        ress.payTime = result.payTime;
                    }
                    if (result.qiandaoTime) {
                        // console.log("获取签到time", result.qiandaoTime)
                        // console.log("转换后的日期", this.formatDate(result.qiandaoTime))
                        ress.qiandaoTime = this.formatDate(result.qiandaoTime);
                        // console.log("转换成年月日后的时间", ress.qiandaoTime)
                    }
                    that.setData({
                        index: result.status - 1,
                        active: result.status - 1,
                        // index: 0,
                        // active: 0,
                        res: ress,
                        show: false,
                    })
                }
            }
        })
    },
    formatTen(num) {
        return num > 9 ? (num + "") : ("0" + num);
    },
    formatDate(date) {
        var date = new Date(date)
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();
        return year + "-" + this.formatTen(month) + "-" +
            this.formatTen(day) +
            " " +
            this.formatTen(hour) + ":" +
            this.formatTen(minute) + ":" +
            this.formatTen(second);
    },


});