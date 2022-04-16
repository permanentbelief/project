const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        index: 0, // 当前页面的索引
        navs: [{
                name: '全部',
                isActive: true
            },
            {
                name: '待付款',
                isActive: false
            },
            {
                name: '待签到',
                isActive: false
            },
            {
                name: '检测中',
                isActive: false
            },
            {
                name: '已完成',
                isActive: false
            },
            {
                name: '退款',
                isActive: false
            },
        ],

        list: [], // 订单列表
        pageNum: 1, // 当前页数
    },

    // 点击切换导航栏 并调用数据
    chooseNav(e) {
        var index;
        if (e.index) {
            index = e.index;
        } else {
            index = e.currentTarget.dataset.index;
        }
        var navs = this.data.navs;
        navs.forEach((v, i) => {
            i == index ? v.isActive = true : v.isActive = false
        })
        this.setData({
            navs
        })
        var comm = {
            userId: wx.getStorageSync('user')._id,
        };
        // var condition = this.data.condition;
        var condition = comm;
        if (index == 0) {

        } else if (index == 1) {
            // 待付款
            condition.status = 1;
            condition.isdeleted = false;
        } else if (index == 2) {
            // 待签到
            condition.status = 2;
            condition.isdeleted = false;
        } else if (index == 3) {
            // 检测中   
            condition.status = 3;
            condition.isdeleted = false;
        } else if (index == 4) {
            // 已完成
            condition.status = 4;
            condition.isdeleted = false;


        } else {
            // 已退款
            condition.status = 5;
        }
        this.setData({
            condition,
            index
        })
        this.refresh();
    },

    // 扫码签到
    qiandao(e) {
        var index = e.currentTarget.dataset.index;
        var list = this.data.list;
        // 判断是否到了预约时间
        var start = new Date().getTime();
        var times = list[index].yuyueTime.split('-');
        var endStart = new Date(list[index].yuyueDate + ' ' + times[0] + ':00').getTime();
        var endEnd = new Date(list[index].yuyueDate + ' ' + times[1] + ':00').getTime();
        console.log(start, endStart, endEnd);
        if (start >= endStart && start <= endEnd) {
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
                        console.log('订单里的id', list[index].groupId);
                        setTimeout(() => {
                            return wx.showToast({
                                title: '无效码',
                                icon: 'error'
                            })
                        }, 2000);
                    } else {
                        console.log('签到成功');
                        // 订单状态改为检测中
                        db.collection('order').doc(list[index]._id).update({
                            data: {
                                status: list[index].type == 1 ? 3 : 4, // 疫苗服务不需要检测
                                qiandaoTime: new Date(), // 签到时间
                            },
                            success: res => {
                                setTimeout(() => {
                                    wx.showToast({
                                        title: '签到成功',
                                    })
                                }, 1000);
                                // 刷新数据
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

    // 递归获取订单数据
    getOrderData(condition, num, list) {
        console.log("conditions", condition)
        console.log("num页数", num)
        wx.showLoading({
            title: '正在加载',
            mask: true
        })
        return new Promise((reslove, err) => {
            db.collection('order').where(condition).skip((num - 1) * 20).limit(20).get({
                success: res => {
                    console.log("res.data.length", res)
                    if (res.data.length) {
                        for (let i = 0; i < res.data.length; i++) {
                            var createTime = util.formatTime(res.data[i].createTime);
                            res.data[i].createTime = createTime;
                            if (res.data[i].qiandaoTime) {
                                var qiandaoTime = util.formatTime(res.data[i].qiandaoTime);
                                res.data[i].qiandaoTime = qiandaoTime;
                            }
                        }
                        this.setData({
                            pageNum: res.data.length ? ++num : num,
                        })
                        list = list.concat(res.data);
                        //原来是 ++num
                        this.getOrderData(condition, num, list).then(res => reslove(res))
                    } else {
                        reslove(list);
                        wx.hideLoading({
                            success: (res) => {},
                        })
                    }
                }
            })
        })
    },

    // 跳转到订单详情
    skipDetail(e) {
        var id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/orderDetail/orderDetail?id=' + id,
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function(options) {
        console.log('进入onLoad');
        // 构建条件
        var condition = {};
        condition.isdeleted = false; // !! 这里是显示没有 删除标记的数据
        condition.userId = wx.getStorageSync('user')._id;
        var list = await this.getOrderData(condition, 1, []);
        this.setData({
            list,
            condition, // 查询条件
        })
        console.log("onLoad", this.data.list); // num++更改以后。onshow现在的list可以完全加载进去。
    },

    // 申请退款
    tuikuan(e) {
        var id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '请填写退款原因',
            editable: true,
            success: res => {
                console.log(res);
                var yuanyin = res.content;
                if (res.confirm) {
                    if (!yuanyin) {
                        return wx.showToast({
                            title: '退款原因不能为空',
                            icon: 'none'
                        })
                    } else {
                        db.collection('order').doc(id).update({
                            data: {
                                status: 5,
                                yuanyin
                            },
                            success: res => {
                                wx.showToast({
                                    title: '退款成功',
                                })
                                setTimeout(() => {
                                    this.refresh();
                                }, 500);
                            }
                        })
                    }
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
        console.log("进入onshow")
        if (!wx.getStorageSync('user')) {
            wx.showToast({
                title: '请先登录！',
                icon: 'error'
            })
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/my/my',
                })
            }, 500);
        }
        var index = 0;
        // 获取缓存中的索引
        if (wx.getStorageSync('orderIndex')) {
            index = wx.getStorageSync('orderIndex')
            this.chooseNav({
                index
            });
            // 清除索引
            wx.removeStorageSync('orderIndex');
        }

        // 实时查询是否达到检测完成的时间
        db.collection('order').where({
            userId: wx.getStorageSync('user')._id,
            type: 1, // 核酸
            status: 3, // 检测中
        }).get({
            success: res => {
                var list = res.data;
                for (let i = 0; i < list.length; i++) {
                    // 判断是否达到时间
                    db.collection('group').doc(list[i].groupId).get({
                        success: res => {
                            var time = res.data.time;
                            var xiaoshi = null;
                            if (time == 1) {
                                xiaoshi = 4;
                            } else if (time == 2) {
                                xiaoshi = 8;
                            } else if (time == 3) {
                                xiaoshi = 12;
                            } else if (time == 4) {
                                xiaoshi = 2;
                            } else {
                                xiaoshi = 1;
                            }
                            if (list[i].qiandaoTime) {
                                var start = list[i].qiandaoTime.getTime(); // 从前到时间算起往后推最早出报告时间
                                var end = new Date().getTime();
                                console.log(start, end);
                                var xc = end - start;
                                var h = xc / (1000 * 60 * 60);
                                console.log('相差' + h);
                                if (h > xiaoshi) {
                                    db.collection('order').doc(list[i]._id).update({
                                        data: {
                                            status: 4
                                        },
                                        success: res => {
                                            console.log('检测已经完成');
                                        }
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
        wx.showModal({
            title: '温馨提醒',
            content: '确定删除该笔订单吗?',
            success: res => {
                if (res.cancel) {
                    return;
                }
                var id = e.currentTarget.dataset.id;
                // 老逻辑删除订单
                // db.collection('order').doc(id).remove({
                //     success: async res => {
                //         this.refresh();
                //         wx.showToast({
                //             title: '删除成功',
                //         })
                //     }
                // });

                // 新的删除逻辑
                db.collection('order').doc(id).update({
                    data: {
                        isdeleted: true,
                    },
                    success: async res => {
                        var condition = this.data.condition;
                        // condition.isdeleted = false  后期应该加上这个一句
                        this.setData({
                            condition
                        })
                        console.log("删除的数据", res)
                        console.log("删除后的condi", this.data.condition)
                        this.refresh();
                        wx.showToast({
                            title: '删除成功',
                        })
                    }
                })
            }
        })
    },

    // 刷新数据
    async refresh() {
        // 重置数据并查询 
        console.log("重新点击 进入刷新")
        this.setData({
            pageNum: 1,
            list: []
        })
        console.log("点击刷新后的condition", this.data.condition);
        //condition 要加上 isdeleted为false 
        var condition = this.data.condition;
        condition.isdeleted = false;
        var list = await this.getOrderData(this.data.condition, 1, []);
        this.setData({
            list
        })
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
        // 构建条件
        var condition = {};
        console.log("页面触底事件")

        // 这里有bug ！！
        // condition.userId = wx.getStorageSync('user')._id;
        // console.log(this.data.list)
        // console.log("onReachBottom pageNum", this.data.pageNum)
        // var list = await this.getOrderData(condition, this.data.pageNum, this.data.list);
        // this.setData({
        //     list
        // })
    },

    // 去支付
    goPay(e) {
        var groupIndex = e.currentTarget.dataset.index;
        var groups = this.data.list;
        wx.showModal({
            title: '订单金额' + groups[groupIndex].price + '元',
            content: '确认支付吗?',
            success: res => {
                if (res.confirm) {
                    // 确认支付 将订单改为已支付
                    db.collection('order').doc(groups[groupIndex]._id).update({
                        data: {
                            status: 2,
                            payTime: util.formatTime(new Date()), // 支付时间
                            payNum: 'ZF' + new Date().getTime(), // 支付单号
                        },
                        success: res => {
                            wx.showToast({
                                title: '支付成功',
                            })
                            this.refresh();
                        }
                    })
                }
            }
        })
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})