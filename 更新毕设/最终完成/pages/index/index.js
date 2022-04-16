const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        locationResult: "",
        ops: "",
        banner1: [{
                img: '../../images/index/bj1.png'
            },
            {
                img: '../../images/index/bj2.jpg'
            },
            {
                img: '../../images/index/bj3.png'
            },
        ],
        navigation: [{
                name: '核酸检测',
                image: '/images/index/icon1.png',
                url: '/pages/hesuanjiance/hesuanjiance'
            },
            {
                name: '核酸结果',
                image: '/images/index/icon2.png',
                url: '/pages/hesuanjieguo/hesuanjieguo'
            },
            {
                name: '疫苗查询',
                image: '/images/index/icon3.png',
                url: '/pages/yimiaochaxun/yimiaochaxun'
            },
            {
                name: '疫苗预约',
                image: '/images/index/icon4.png',
                url: '/pages/yimiaoyuyue/yimiaoyuyue'
            },
            {
                name: '机构查询',
                image: '/images/index/icon5.png',
                url: '/pages/group/group'
            },
            {
                name: '老幼助查',
                image: '/images/index/icon6.png',
                url: '/pages/laoyouchaxun/laoyouchaxun'
            },
            {
                name: '团体预约',
                image: '/images/index/icon7.png',
                url: '/pages/tuanti/tuanti'
            },
            {
                name: '风险区域',
                image: '/images/index/icon8.png',
                url: '/pages/fengxian/fengxian'
            },
        ],
        lastIndex: 0,
        kpIndex: 0
    },


    // 指定跳转到多少页
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

    // 选择最后一个标题栏
    chooseLastNav(e) {

        var index = e.currentTarget.dataset.index;
        index = Number(index);
        this.setData({
            lastIndex: index
        })
    },

    // 选择疫情科普导航栏
    chooseKp(e) {
        var index = e.currentTarget.dataset.index;
        index = Number(index);
        if (index == 0) {
            this.getKpu({});
        } else if (index == 1) {
            this.getKpu({
                type: 1
            });
        } else if (index == 2) {
            this.getKpu({
                type: 2
            });
        } else {
            this.getKpu({
                type: 3
            });
        }
        this.setData({
            kpIndex: index
        })
    },

    // 疫情科普跳转到更多
    more() {
        wx.navigateTo({
            url: '/pages/yiqingkepu/yiqingkepu',
        })
    },

    // 跳转到详情
    skipDetail(e) {
        wx.navigateTo({
            url: '/pages/kepuDetail/kepuDetail?id=' + e.currentTarget.dataset.id,
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

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
        // // 获取昨日本地疫情
        // this.getYiqing(1);
        // // 获取全国本地疫情
        // this.getYiqing(2);
        // 获取实时资讯

        this.getZixun();
        // 获取疫情科普
        this.getKpu({});

        // 获取疫情追踪数据 
        this.getZZ();

        //获取api数据
        this.GetAPI();
    },

    // 获取科普数据
    getKpu(tiaojian) {
        db.collection('kepu').where(tiaojian).limit(5).get({
            success: res => {
                console.log(res);
                this.setData({
                    kepu: res.data
                })
            }
        })
    },

    getYiqing(type) {
        db.collection('yesterday').where({
            type
        }).orderBy('createTime', 'desc').get({
            success: res => {
                console.log(res);
                var data = res.data;
                for (let i = 0; i < data.length; i++) {
                    data[i].createTime = util.formatTime(new Date(data[i]._createTime))
                    data[i].createTime = data[i].createTime.substring(5, 16);
                }
                if (type == 1) {
                    this.setData({
                        bendi: data
                    })
                } else {
                    this.setData({
                        quanguo: data
                    })
                }
            }
        })
    },
    clickon(e) {
        // console.log("更多", e.currentTarget.dataset.id)
        var res = this.data.zixunRes;
        for (var i = 0; i < res.length; i++) {
            // console.log("(res[i].list._id", res[i].list._id)
            if (res[i].list._id == e.currentTarget.dataset.id) {
                res[i].flag = true
                break;
            }
        }
        this.setData({
            zixunRes: res
        })
    },

    clickin(e) {
        var res = this.data.zixunRes;
        for (var i = 0; i < res.length; i++) {
            // console.log("(res[i].list._id", res[i].list._id)
            if (res[i].list._id == e.currentTarget.dataset.id) {
                res[i].flag = false
                break;
            }
        }
        this.setData({
            zixunRes: res
        })

    },
    // 获取实时咨询
    getZixun() {
        // 首页只显示三条
        db.collection('zixun').orderBy('_createTime', 'desc').limit(3).get({
            success: res => {
                var zixunRes = [];
                var zixun = res.data;
                console.log("zixun", zixun)
                for (let i = 0; i < zixun.length; i++) {
                    zixun[i].createTime = util.formatTime(new Date(zixun[i]._createTime));
                    var obj = {}
                    obj.list = zixun[i];
                    obj.flag = false;
                    zixunRes.push(obj)
                }
                console.log("zixunRes", zixunRes)
                this.setData({
                    zixunRes
                })
            }
        })
    },
    getZZ() {
        console.log("进入getZZ")
        db.collection('track').orderBy('_createTime', 'desc').limit(3).get({
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
                    // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
                    // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
                    // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
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
                var accuracy = res.accuracy
                console.log("精度", res.latitude)
                console.log("维度", res.longitude)
                    // 这里的ak写死就可以了 
                wx.request({
                    url: 'https://api.map.baidu.com/reverse_geocoding/v3/?ak=jbpKuM8cQ2uBPgxEgCimeWDQAyQiFN2K&location=' + res.latitude + ',' + res.longitude + '&output=json',
                    data: {},
                    header: { 'Content-Type': 'application/json' },
                    success: function(ops) {
                        console.log('定位城市：', ops);
                        location = ops.data.result.addressComponent

                        console.log("获取到的地理位置", location)
                        var result = ""
                        console.log("现在的城市", location)
                        if (location.city === "洛阳市") {
                            result = (that.data.diqushuju[8]).children[12]
                            console.log("当前城市的result数据", result)
                        } else if (location.city === "西安市") {
                            result = (that.data.diqushuju[6]).children[1]
                        } else {}
                        that.setData({
                            locationResult: result,
                            ops: ops
                        })
                        console.log("location获取", that.data.locationResult)
                        console.log("ops 省 ", that.data.ops.data.result.addressComponent.province);
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
            //调用定位方法
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
                        // lth
                        console.log("data数据", that.data.data);
                        console.log("地区数据", that.data.diqushuju);
                        console.log("地区数据获取", (that.data.diqushuju[7]).children[11]);
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