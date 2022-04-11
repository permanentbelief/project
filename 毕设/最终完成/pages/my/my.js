import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 我的服务
        userPhoto: "../../images/my/xiaomao.png",
        disabled: true,
        myService: [{
                name: '我的就诊人',
                tabUrl: '/pages/myPatient/myPatient'
            },
            {
                name: '我的检验报告',
                tabUrl: '/pages/hesuanjieguo/hesuanjieguo?detail=true'
            },
            {
                name: '报告进度',
                tabUrl: '/pages/myReportProcess/myReportProcess'
            },
            {
                name: '绑定手机号',
                tabUrl: 'phone'
            },
            {
                name: '意见反馈',
                tabUrl: '/pages/feedback/feedback'
            },
            {
                name: '分享',
                tabUrl: '**'
            },
            {
                name: '设置',
                tabUrl: '*'
            },
            {
                name: '退出登录',
                tabUrl: '***'
            }

        ],
        // 防疫专区
        personalArticleCentor: [{
                name: '我的收藏',
                tabUrl: '/pages/myCollect/myCollect'
            },
            {
                name: '我的点赞',
                tabUrl: '/pages/myDianzan/myDianzan'
            },
            {
                name: '我的评论',
                tabUrl: '/pages/myComment/myComment'
            }
        ],
        isLogin: false, // 登录态
        bindPhone: true, // 弹处手机号
        showShare: false,
        dshow: false, // linui框架 退出的dialog提示
        sshow: false, // 设置得dialog提示
        toastQuit: false, // toast退出的友情提示
        toastisLogin: false, // 成功登录的提示信息 
        options: [
            { name: '微信', icon: 'wechat', openType: 'share' },
            { name: '微博', icon: 'weibo', openType: 'share' },
            { name: '复制链接', icon: 'link', openType: 'share' },
            { name: '分享海报', icon: 'poster', openType: 'share' },
            { name: '二维码', icon: 'qrcode', openType: 'share' },
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
                                    // 存入缓存
                                    wx.setStorageSync('user', user)
                                    this.setData({
                                        user,
                                        isLogin: true,

                                    })
                                }
                            })
                        } else {
                            // 存入缓存
                            wx.setStorageSync('user', res.data[0])
                            this.setData({
                                user: res.data[0],
                                isLogin: true
                            })
                        }

                        // wx.showToast({
                        //     title: '登录成功',
                        //})
                        this.setData({
                            toastisLogin: true
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
    // 根据tabUrl跳转到防疫专区
    skip(e) {
        var url = e.currentTarget.dataset.url;
        console.log("已经跳转公共方法", e)
        if (!url) {
            return;
        }
        if (url == "*") { //设置按钮
            this.setData({
                sshow: true
            })
            return;
        }
        if (url == "**") {
            this.onClick();
            return;
        }
        if (url == "***") { // 退出按钮
            this.setData({
                dshow: true
            });
            return;
        }
        // 弹处绑定手机号的对话框
        if (url == 'phone') {
            console.log(e);
            return wx.showModal({
                title: '绑定手机号',
                editable: true,
                success: res => {
                    console.log(res);
                    if (res.confirm) {
                        var phone = res.content;
                        var tip = '';
                        if (!phone) {
                            tip = '手机号不能为空';
                        }
                        if (!this.checkPhone(phone)) {
                            tip = '手机号格式错误';
                        }
                        if (tip) {
                            return wx.showToast({
                                title: tip,
                                icon: 'none'
                            })
                        }
                        // 没有问题就绑定成功  这里的_id 是什么？ 为什么 不是openid
                        db.collection('user').doc(this.data.user._id).update({
                            data: {
                                phone
                            },
                            success: res => {
                                wx.showToast({
                                        title: '绑定成功',
                                    })
                                    // 更新本地变量
                                var user = this.data.user;
                                user.phone = phone;
                                this.setData({
                                        user
                                    })
                                    // 更新本地缓存
                                wx.setStorageSync('user', user);
                            }
                        })
                    }
                }
            })
        }
        wx.navigateTo({
            url,
        })
    },

    // 校验手机号格式是否正确
    checkPhone(phone) {
        var regu = /^1\d{10}$/;
        return regu.test(phone);
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

    },

    // 跳转到我的订单
    skipMyOrder(e) {
        var index = e.currentTarget.dataset.index;
        // 设置跳转过去显示哪一页说
        wx.setStorageSync('orderIndex', index);
        wx.switchTab({
            url: '/pages/myOrder/myOrder',
        })
    },

    onShow: function() {
        // 检测用户是否登录
        console.log("检测用户是否已经登录")
        wx.getStorageSync('user') ? this.setData({
            user: wx.getStorageSync('user'),
            isLogin: true,
            toastisLogin: false, // 下次再次 切换到这个页面的时候 不需要再提示 登录成功
        }) : ''
        console.log("查看user", this.user)
    },

})