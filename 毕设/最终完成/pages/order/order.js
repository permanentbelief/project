const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({
    data: {
        index: 0, 
        dshow: false,
        toastsuccess: false,
        deleteshow: false,
        deletesuccess: false,
        active: 0,
        list: [], 
        orderId: "", 
    },
    onChange(event) {
        console.log(event)
        // 标记
        // wx.showToast({
        //   title: `切换到标签 ${event.detail.name}`,
        //   icon: 'none',
        // });
        var index = event.detail.index;
        var condition = {
            userId: wx.getStorageSync('user')._id,
        };
    
        if (index == 0) {

        } else if (index == 1) {
            condition.status = 1;
            condition.isdeleted = false;
        } else if (index == 2) {
            condition.status = 2;
            condition.isdeleted = false;
        } else if (index == 3) {
            condition.status = 3;
            condition.isdeleted = false;
        } else  {
            condition.status = 4;
            condition.isdeleted = false;
        }
        this.setData({
            condition,
            index
        })
        this.refresh();
    },
    goSM(e) {
        var index = e.currentTarget.dataset.index;
        var list = this.data.list;
        var curTimes = new Date().getTime();
        var times = list[index].yuyueTime.split('-');
        var rangeStart = new Date(list[index].yuyueDate + ' ' + times[0] + ':00').getTime();
        var rangeEnd = new Date(list[index].yuyueDate + ' ' + times[1] + ':00').getTime();
        // console.log("三个时间戳", times, rangeStart, rangeEnd);
        if (curTimes >= rangeStart && curTimes <= rangeEnd) {
            wx.scanCode({
                success: res => {
                    console.log(res);
                    var id = res.result;
                    if (!id) {
                        setTimeout(() => {
                            return wx.showToast({
                                title: '无效码',
                                icon: 'error'
                            })
                        }, 2000);
                    } else if (list[index].groupId != id) {
                        // console.log('订单里的id', list[index].groupId);
                        setTimeout(() => {
                            return wx.showToast({
                                title: '无效码',
                                icon: 'error'
                            })
                        }, 2000);
                    } else {
                        console.log('签到成功');
                        db.collection('order').doc(list[index]._id).update({
                            data: {
                                status: list[index].type == 1 ? 3 : 4,
                                qiandaoTime: new Date(), 
                            },
                            success: res => {
                                setTimeout(() => {
                                    wx.showToast({
                                        title: '签到成功',
                                    })
                                }, 1000);
                                setTimeout(() => {
                                    this.refresh();
                                }, 500);
                            }
                        })
                    }
                },
                fail: err => {
                    wx.showToast({
                        title: '未知异常',
                        icon: 'error'
                    })
                }
            })
        } else {
            return wx.showToast({
                title: '不在打卡时间段内',
                icon: 'none'
            })
        }
    },
    getOrderList(condition) {
        console.log("conditions", condition)
        var list = [];
        db.collection('order').where(condition).limit(20).get({
                success: res => {
                    console.log("res.data.length", res)
                    if (res.data.length) {
                        for (let i = 0; i < res.data.length; i++) {
                            var createTime = this.formatDate(res.data[i].createTime);
                            res.data[i].createTime = createTime;
                            if (res.data[i].qiandaoTime) {
                                var qiandaoTime = this.formatDate(res.data[i].qiandaoTime);
                                res.data[i].qiandaoTime = qiandaoTime;
                            }
                            list.push(res.data[i])
                        }
                    }
                    this.setData({
                        list:list
                    }) 
                }
        })
    },
    skipDetail(e) {
        var id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/orderDetail/orderDetail?id=' + id,
        })
    },

    onLoad: function(options) {
        console.log('进入onLoad');
        var condition = {};
        condition.isdeleted = false;
        condition.userId = wx.getStorageSync('user')._id;
       this.getOrderList(condition);
        this.setData({
            condition, 
        })
        console.log("onLoad", this.data.list); 
    },
    onShow: function() {
        if (wx.getStorageSync('Oindex')) {
            index = wx.getStorageSync('Oindex')
            this.setData({
                active: index
            })
            wx.removeStorageSync('Oindex');
        }
        db.collection('order').where({
            userId: wx.getStorageSync('user')._id,
            type: 1, 
            status: 3, 
        }).get({
            success: res => {
                var list = res.data;
                for (let i = 0; i < list.length; i++) {
                    db.collection('group').doc(list[i].groupId).get({
                        success: res => {
                            var hour = 2;
                            if (list[i].qiandaoTime) {
                                var start = list[i].qiandaoTime.getTime();
                                var end = new Date().getTime();
                                var xc = end - start;
                                var h = xc / (1000 * 60 * 60);
                                if (h > hour) {
                                    db.collection('order').doc(list[i]._id).update({
                                        data: {
                                            status: 4
                                        },
                                    })
                                }
                            }
                        }
                    })
                }
            }
        })
        this.refresh();
    },
    // 删除订单  这里不应该是删除订单，而应该是伪删除 改为状态-1
    deleteOrder(e) {
        console.log("走进删除订单", e)
        this.setData({
            dshow: true, 
            orderId: e.currentTarget.dataset.id
        })
    },
    delete(){
        var id = this.data.orderId
        // 新的删除逻辑
        db.collection('order').doc(id).update({
            data: {
                  isdeleted: true,
             },
            success: res => {
                var condition = this.data.condition;
                this.setData({
                    condition
                })
                console.log("删除的数据", res)
                console.log("删除后的condi", this.data.condition)
                this.setData({
                    toastsuccess: true
                })
                this.refresh();
       
            }
        })
    }, 
     refresh() {
        console.log("重新点击 进入刷新")
        this.setData({
            list: []
        })
        console.log("点击刷新后的condition", this.data.condition);
        //condition 要加上 isdeleted为false 
        var condition = this.data.condition;
        condition.isdeleted = false;
        this.getOrderList(this.data.condition);
    },
    GoPay(e) {
        var groupIndex = e.currentTarget.dataset.index;
        this.setData({
            groupIndex: groupIndex,
            deleteshow: true
        })
    },
    goPay(){
        var groupIndex = this.data.groupIndex;
        var groups = this.data.list;
        db.collection('order').doc(groups[groupIndex]._id).update({
            data: {
                status: 2,
                payTime: this.formatDate(new Date()), 
                payNum: 'TH' + util.getRandomString(12)
            },
            success: res => {
                this.setDate({
                    deletesuccess:true
                })
               
            }
        })
        this.refresh();
    },
     formatTen(num) { 
        return num > 9 ? (num + "") : ("0" + num); 
    } ,
     formatDate(date) { 
        var date = new Date(date)
        var year = date.getFullYear(); 
        var month = date.getMonth() + 1; 
        var day = date.getDate(); 
        var hour = date.getHours(); 
        var minute = date.getMinutes(); 
        var second = date.getSeconds(); 
        return year + "-" + this.formatTen(month) + "-" + this.formatTen(day)+ " " +this.formatTen(hour)+ ":" +
        this.formatTen(minute)+ ":" + this.formatTen(second); 
    },

})