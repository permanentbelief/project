const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    data: {
        locationResult: "",
        ops: "",
        banner1: [

            {
                img: '../../images/index/bj2.jpg'
            },

        ],
        navigation: [{
                name: '核酸预约',
                image: '/images/index/icon1.png',
                url: '/pages/hsyy/hsyy'
            },
            {
                name: '疫苗预约',
                image: '/images/index/icon4.png',
                url: '/pages/vaccineyy/vaccineyy'
            },
            {
                name: '核酸结果',
                image: '/images/index/icon2.png',
                url: '/pages/hsResult/hsResult'
            },
            {
                name: '疫苗记录',
                image: '/images/index/icon3.png',
                url: '/pages/yyResult/yyResult'
            },
            {
                name: '贴吧服务',
                image : "/images/index/icon9.png",
                url : "/pages/articlelist/articlelist",
            },
            {
                name: '地区查询',
                image: '/images/index/icon8.png',
                url: '/pages/risk/risk'
            },
            {
                name: '服务反馈',
                image: '/images/index/yy.png',
                url: '/pages/feedback/feedback'
            },
            {
                name: '报告进度',
                image: '/images/index/progress.png',
                url: '/pages/myReportProcess/myReportProcess'
            },
        ],
    },
    skip(e) {
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
        var url = e.currentTarget.dataset.url;
        wx.navigateTo({
            url,
        })
    },

    onShow: function() {

        this.getTrack();
        //获取api数据
        this.GetAPI();
    },

    clickon(e) {
        // console.log("更多", e.currentTarget.dataset.id)
        var res = this.data.trackRes;
        for (var i = 0; i < res.length; i++) {
            // console.log("(res[i].list._id", res[i].list._id)
            if (res[i].list._id == e.currentTarget.dataset.id) {
                res[i].flag = true
                break;
            }
        }
        this.setData({
            trackRes: res
        })
    },

    clickin(e) {
        var res = this.data.trackRes;
        for (var i = 0; i < res.length; i++) {
            // console.log("(res[i].list._id", res[i].list._id)
            if (res[i].list._id == e.currentTarget.dataset.id) {
                res[i].flag = false
                break;
            }
        }
        this.setData({
            trackRes: res
        })

    },
  
    getTrack() {
        db.collection('track').orderBy('_createTime', 'desc').limit(5).get({
            success: res => {
                console.log("res", res)
                var trackRes = [];
                var track = res.data;
                for (let i = 0; i < track.length; i++) {
                    track[i].createTime = util.formatTime(new Date(track[i]._createTime));
                    var obj = {}
                    obj.list = track[i];
                    obj.flag = false;
                    trackRes.push(obj)
                }
                this.setData({
                    trackRes
                })
            }
        })
    },

    getUserLocation: function() {
        var _this = this;
        wx.getSetting({
            success: (res) => {
                console.log("打印res结果信息", res.authSetting)
                if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
                    //未授权
                    wx.showModal({
                        title: '请求授权当前位置',
                        content: '需要获取您的地理位置，请确认授权',
                        success: function(res) {
                            if (res.cancel) {
                                //取消授权
                                console.log("取消授权")
                                wx.showToast({
                                    title: '拒绝授权',
                                    icon: 'none',
                                    duration: 1000
                                })
                            } else if (res.confirm) {
                                //确定授权，通过wx.openSetting发起授权请求
                                wx.openSetting({
                                    success: function(res) {
                                        if (res.authSetting["scope.userLocation"] == true) {
                                            wx.showToast({
                                                title: '授权成功',
                                                icon: 'success',
                                                duration: 1000
                                            })
                                            console.log("结果集", res)
                                                //再次授权，调用wx.getLocation的API
                                            _this.geo();
                                        } else {
                                            wx.showToast({
                                                title: '授权失败',
                                                icon: 'none',
                                                duration: 1000
                                            })
                                        }
                                    }
                                })
                            }
                        }
                    })
                } else if (res.authSetting['scope.userLocation'] == undefined) {
                    //用户首次进入页面,调用wx.getLocation的API
                    _this.geo();
                } else {
                    console.log('授权成功')
                        //调用wx.getLocation的API
                    _this.geo();
                }
            }
        })
    },
    geo: function() {
        let that = this;
        wx.getLocation({
            type: 'wgs84',
            success: function(res) {
                var latitude = res.latitude
                var longitude = res.longitude
                var speed = res.speed
                var accuracy = res.accuracy;
                console.log("精度", res.latitude);
                console.log("维度", res.longitude);
                // 这里的ak写死就可以了 
                wx.request({
                    url: 'https://api.map.baidu.com/reverse_geocoding/v3/?ak=jbpKuM8cQ2uBPgxEgCimeWDQAyQiFN2K&location=' + res.latitude + ',' + res.longitude + '&output=json',
                    data: {},
                    header: { 'Content-Type': 'application/json' },
                    success: function(ops) {
                        location = ops.data.result.addressComponent
                        console.log("定位获得城市信息", location)
                        var result = ""
                        var f = false;
                        for (var i = 0; i < that.data.diqushuju.length; i++) {
                            //console.log("当前省", that.data.diqushuju[i].name)
                            if (that.data.diqushuju[i].name == location.province.substring(0, location.province.length - 1)) {
                                // console.log("当前省", location.province.substring(0, 2));
                                // console.log("当前省", that.data.diqushuju[i].name)
                                for (var j = 0; j < that.data.diqushuju[i].children.length; j++) {
                                    // console.log("当前市", that.data.diqushuju[i].children[j].name)
                                    // console.log("当前市", location.city.substring(0, 2))
                                    if (that.data.diqushuju[i].children[j].name == location.city.substring(0, location.city.length - 1)) {
                                        result = (that.data.diqushuju[i]).children[j];
                                        console.log("最终获取到的result", result);
                                        f = true;
                                        break;
                                    }
                                }
                                if (f) {
                                    break;
                                }
                            }
                        }
                        // old logic 
                        // console.log("现在的城市", location)
                        // if (location.city === "洛阳市") {
                        //     result = (that.data.diqushuju[8]).children[12]
                        //     console.log("当前城市的result数据", result)
                        // } else if (location.city === "西安市") {
                        //     result = (that.data.diqushuju[6]).children[1]
                        // } else {}
                        that.setData({
                            locationResult: result,
                            ops: ops
                        });
                        // console.log("location获取", that.data.locationResult)
                        console.log("ops 省", that.data.ops.data.result.addressComponent.province);
                        console.log("ops 市", that.data.ops.data.result.addressComponent.city)

                    },
                    fail: function(resq) {
                        wx.showModal({
                            title: '信息提示',
                            content: '请求失败',
                            showCancel: false,
                            confirmColor: '#f37938'
                        });
                    },
                    complete: function() {}
                })
            }
        })
    },
    GetAPI() {

        let that = this
            // old logic 老的调用逻辑。调用定位方法
            // that.getUserLocation();
            // console.log("获取定位信息结束", location)

        //微信、百度等小程序参考代码，和 Jquery发送ajax请求是一样的
        //访问国家疫情的爬虫 新型冠状病毒全国疫情API接口
        wx.request({
            url: 'https://c.m.163.com/ug/api/wuhan/app/data/list-total',
            success: function(res) {
                console.log(res)
                if (res.data.code == 10000) {
                    that.setData({
                        data: res,
                        // 无症状感染者
                        wuzhengzhuang: res.data.data.chinaTotal.extData.noSymptom,
                        // 无症状新增
                        wuzhengzhuangjia: res.data.data.chinaTotal.extData.incrNoSymptom,
                        // 累计确诊
                        leijiquezheng: res.data.data.chinaTotal.total.confirm,
                        // 累计确诊新增
                        leijiquezhengjia: res.data.data.chinaTotal.today.confirm,
                        // 累计死亡
                        leijisiwang: res.data.data.chinaTotal.total.dead,
                        // 累计死亡增加
                        leijisiwangjia: res.data.data.chinaTotal.today.dead,
                        // 累计治愈
                        leijizhiyu: res.data.data.chinaTotal.total.heal,
                        // 累计治愈增加
                        leijizhiyujia: res.data.data.chinaTotal.today.heal,
                        // 累计境外
                        leijijingwai: res.data.data.chinaTotal.total.input,
                        // 累计境外增加
                        leijijingwaijia: res.data.data.chinaTotal.today.input,
                        // 现有确诊
                        xianyouquezheng: res.data.data.chinaTotal.total.confirm - res.data.data.chinaTotal.total.heal - res.data.data.chinaTotal.total.dead,
                        // 现有确诊增加
                        xianyouquezhengjia: res.data.data.chinaTotal.today.storeConfirm,
                        // 地区数据
                        diqushuju: res.data.data.areaTree[2].children,
                    }, () => {

                        // console.log("data数据", that.data);
                        //console.log("地区数据", that.data.diqushuju);
                        // that.geo();
                        that.getUserLocation();
                    })
                } else {}
            },
            fail: function(err) {
                console.log(err)
            }
        })

    },
})