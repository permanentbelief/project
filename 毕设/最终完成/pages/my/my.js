import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 我的服务
        tabUrl1: '/pages/hsResult/hsResult?detail=true',
        tabUrl2: '/pages/myReportProcess/myReportProcess',
        tabUrl3: 'phone',
        tabUrl4: '/pages/feedback/feedback',
        tabUrl5: '**',
        tabUrl6: '*',
        tabUrl7: '***',
        userPhoto: "../../images/my/xiaomao.png",
        value: "",
        isLogin: false, // 登录态
        showShare: false,
        dshow: false, // linui框架 退出的dialog提示
        sshow: false, // 设置得dialog提示
        phone1: false,
        phone2: false,
        toastQuit: false, // toast退出的友情提示
        toastisLogin: false, // 成功登录的提示信息 
        options: [
            { name: '微信', icon: 'wechat', openType: 'share' },
            { name: '微博', icon: 'weibo', openType: 'share' },
            { name: '复制链接', icon: 'link', openType: 'share' },
            { name: '分享海报', icon: 'poster', openType: 'share' },
            { name: '二维码', icon: 'qrcode', openType: 'share' },
        ],
        grids:[
            {
                orderindex:1,
                text:"付款中",
                iamgeurl:"/images/my/first.png",
            },
            {
                orderindex:2,
                text:"签到中",
                iamgeurl:"/images/my/second.png",
            },
            {
                orrderindex:3,
                text:"检测中",
                iamgeurl:"/images/my/third.png",
            },
            {
                orderindex:4,
                text:"已完成",
                iamgeurl:"/images/my/forth.png",
            },
        ]
    },
    //  vant/weapp的 share分享界面
    onClick() {
        this.setData({ showShare: true });
    },

    onClose() {
        this.setData({ showShare: false });
    },

    onSelect(event) {
        // console.log("onselect事件", event)
        Toast(event.detail.name);
        this.onClose();
    },

    // 获取用户信息并登录
    login(e) {
        console.log("进入登录页面")
        wx.getUserProfile({
            desc: '获取用户信息并展示',
            success: res => {
                var user = res.userInfo;
                console.log("user信息", user)
                var openid = wx.getStorageSync('openid');
                console.log("openid的值", openid)
                db.collection('user').where({
                    _openid: openid
                }).get({
                    success: res => {
                        console.log("获取成功res的值", res)
                        if (!res.data.length) {
                            db.collection('user').add({
                                data: {
                                    nickName: user.nickName,
                                    avatarUrl: user.avatarUrl
                                },
                                success: res => {
                                    user._id = res._id;
                                    wx.setStorageSync('user', user)
                                    this.setData({
                                        user,
                                        isLogin: true,

                                    })
                                }
                            })
                        } else {
                            wx.setStorageSync('user', res.data[0])
                            this.setData({
                                user: res.data[0],
                                isLogin: true
                            })
                        }
                        var phone = this.data.user.phone;
                        this.setData({
                            toastisLogin: true,
                            value: phone
                        });
                    },
                    fail: err => {
                        console.log(err);
                    }
                })
            }
        })
    },
    gotoFeedBack(e) {
        console.log("进入意见反馈详情页")
        wx.navigateTo({
            url: '/pages/feedback/feedback',
        })
    },
    tuichu() {
        wx.setStorageSync("user", '')
        this.setData({
            isLogin: false,
            toastQuit: true,
        })
    },
    click1(e) {
        console.log(e.currentTarget.dataset.url);
        var url = e.currentTarget.dataset.url;
        wx.navigateTo({
            url,
        })
    },
    click2(e) {
        var url = e.currentTarget.dataset.url;
        wx.navigateTo({
            url,
        })
    },
    onChange(event) {
        console.log(event.detail)
        this.setData({
            value: event.detail
        })
    },
    click3(e) {
        var message = ""
        var phone = this.data.value;
        console.log("phone", phone);
        if (this.data.value) {
            if (this.data.value.length != 11) {
                this.setData({
                    phone1: true
                })
            } else {
                console.log("更新成功");
            }
        } else {
            this.setData({
                phone2: true
            })
        }
        db.collection('user').doc(this.data.user._id).update({
            data: {
                phone
            },
            success: res => {
                console.log("更新成功 success=>res")
                var user = this.data.user;
                user.phone = phone;
                this.setData({
                    user,
                    value: phone
                })
                wx.setStorageSync('user', user);
            }
        })
        console.log("流程结束")
    },
    click4(e) {
        var url = e.currentTarget.dataset.url;
        console.log(url)
        wx.navigateTo({
            url,
        })
    },
    click5(e) {
        this.onClick();

    },
    click6(e) {
        this.setData({
            sshow: true
        })
    },
    click7(e) { // 退出按钮
        this.setData({
            dshow: true
        });

    },
    checkPhone(phone) {
        var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
        return myreg.test(phone);
    },
    skOrder(e) {
        var index = e.currentTarget.dataset.index;
        wx.setStorageSync('Oindex', index);
        wx.switchTab({
            url: '/pages/order/order',
        })
    },

    onShow: function() {
        wx.getStorageSync('user') ? this.setData({
            user: wx.getStorageSync('user'),
            isLogin: true,
            toastisLogin: false, // 下次再次 切换到这个页面的时候 不需要再提示 登录成功
        }) : ''
        console.log("查看user", this.user)
    },

})