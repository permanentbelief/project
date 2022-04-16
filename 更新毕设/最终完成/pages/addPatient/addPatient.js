const util = require('../../utils/util.js');
const idCardUtil = require('../../utils/idCrdutil.js');
const db = wx.cloud.database();
Page({
    data: {
        region: '',
        check: false, //是否勾选协议
        show: false
    },
    // 阅读协议的弹窗
    showPopup() {
        this.setData({
            show: true,

        });
    },
    onClose() {
        this.setData({
            show: false,
            check: true, // 可以删除 其实已经默认打钩了 
        });
    },
    onLoad: function(options) {
        if (options.id) {
            console.log('是修改', options);
            // 查询数据
            db.collection('patient').doc(options.id).get({
                success: res => {
                    this.setData({
                        patient: res.data,
                        region: res.data.region,
                        realName: res.data.realName,
                        idCard: res.data.idCard,
                        address: res.data.address,
                        phone: res.data.phone,
                    })
                }
            })
        }
    },
    // 获取输入的值
    getValue(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        obj[name] = e.detail.value;
        this.setData(obj);
    },

    // 点击勾选协议
    checkG(e) {
        // console.log("点击勾选协议", e)
        var value = e.detail.value[0];
        if (value) {
            // console.log("value", value)
            this.setData({
                    check: true
                })
                // console.log("check的值为", this.data.check)
        } else {
            this.setData({
                check: false
            })
        }
    },

    // 选择省市区
    bindRegionChange(e) {
        console.log(e);
        var region = e.detail.value;
        console.log(e)
        this.setData({
            region
        })
    },

    // 绑定就诊人
    bindPatient(e) {
        var realName = this.data.realName;
        var idCard = this.data.idCard;
        var region = this.data.region;
        var address = this.data.address;
        var phone = this.data.phone;
        if (!realName || !idCard || !region.length || !address || !phone) {
            return wx.showToast({
                title: '请填写完整',
                icon: 'error'
            })
        }
        // 校验身份证
        // if (!idCardUtil.checkIdCard(idCard)) {
        //     return wx.showToast({
        //         title: '身份证号格式不正确',
        //         icon: 'none'
        //     })
        // }
        // // 校验手机格式的正则表达式
        // const regu = /^1\d{10}$/;
        // ///^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/
        // if (!regu.test(phone)) {
        //     return wx.showToast({
        //         title: '手机号格式不正确',
        //         icon: 'none'
        //     })
        // }
        // 是否勾选了协议
        if (!this.data.check) {
            return wx.showToast({
                title: '请阅读协议',
                icon: 'error'
            })
        }
        if (this.data.patient) {
            //先查询就诊列表中 是否有
            db.collection('patient').where({
                    userId: wx.getStorageSync('user')._id,
                    realName: realName,
                    idCard: idCard
                })
                .get()
                .then(res => {
                    console.log("访问db的res信息", res)
                    if (res.data.length > 0) {
                        return wx.showToast({
                            icon: "none",
                            title: '就诊人已经存在',
                        })
                    } else {
                        db.collection('patient').doc(this.data.patient._id).update({
                            data: {
                                realName,
                                idCard,
                                region,
                                address,
                                phone,
                                userId: wx.getStorageSync('user')._id
                            },
                            success: res => {
                                wx.showToast({
                                    title: '修改成功',
                                })
                                setTimeout(() => {
                                    wx.navigateBack({
                                        delta: 1,
                                    })
                                }, 1000);
                            }
                        })
                    }
                })
                .catch(err => {
                    return wx.showToast({
                        icon: "none",
                        title: '更新错误',
                    })
                })
        } else {
            db.collection('patient').where({
                    userId: wx.getStorageSync('user')._id,
                    realName: realName,
                    idCard: idCard
                })
                .get()
                .then(res => {
                    console.log("访问db的res信息", res)
                    if (res.data.length > 0) {
                        return wx.showToast({
                            icon: "none",
                            title: '就诊人已经存在',
                        })
                    } else {
                        db.collection('patient').add({
                            data: {
                                realName,
                                idCard,
                                region,
                                address,
                                phone,
                                createTime: util.formatTime(new Date()),
                                userId: wx.getStorageSync('user')._id
                            },
                            success: res => {
                                wx.showToast({
                                    title: '绑定成功',
                                })
                                setTimeout(() => {
                                    wx.navigateBack({
                                        delta: 1,
                                    })
                                }, 1000);
                            }
                        })
                    }
                })
                .catch(err => {
                    return wx.showToast({
                        icon: "none",
                        title: '插入出错',
                    })
                })
                // 提交

        }
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