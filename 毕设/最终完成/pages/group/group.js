const db = wx.cloud.database();
import QQMapWX from '../../utils/qqmap-wx-jssdk.min.js'; // 导入获取用户信息位置的包
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageNum: 1, // 页数
        pageSize: 20, // 每页大小
        show: false,
        groupType: [{
            name: '民营',
            type: 1
        }, {
            name: '公立',
            type: 2
        }],
        groupTime: [
            // '1-2小时',
            // '2-4小时',
            '4-8小时', // 枚举字段 1
            '8-12小时', // 枚举字段 2
            '12-24小时', // 枚举字段 3
            "2-4小时", // 枚举字段 4
            "1-2小时", // 枚举字段 5
        ],
        groupYuyue: [
            '是',
            '否',
        ],
        index1: null,
        index2: null,
        index3: null,
        list: [], // 数据列表
        changeCondition: {},
        content: "", // 遗留的用户输入 
    },


    // vant-weapp弹窗
    showPopup() {
        this.setData({ show: true });
    },

    onClose() {
        this.setData({ show: false });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        // 获取当前用户定位    
        this.getLoacation();
        // 构建条件
        var condition = {};
        this.setData({
            condition,
            selectType: 1 // 这里废弃字段
        });

        // 多余的请求，在location中顺便请求完了
        // this.getData(this.data.pageNum, this.data.pageSize, condition);
    },

    // 逆向解析获取用户的省份
    getPro(latitude, longitude, data) { // async 是什么意思 ？
        return new Promise((reslove, err) => {
            console.log('开始逆向解析', latitude, longitude);
            var that = this;
            // 实例化API核心类
            let qqmapsdk = new QQMapWX({
                key: 'LBFBZ-47D3X-2HL4Z-Z752G-DU5MK-E2FE4' // 腾讯地图服务api的key

            });
            console.log("qmapsdk中有什么", qqmapsdk);
            qqmapsdk.reverseGeocoder({
                sig: '', // 必填  Gf5iTcMFAyIDCGFSwEf07lKkjM4lAEJ
                location: {
                    latitude,
                    longitude
                },
                async success(res) {
                    console.log('逆向解析完成', res);
                    var address = res.result.address;
                    var street = res.result.address_component.street_number;
                    // 解析经纬度
                    var loc = data.location.split(',');
                    console.log(loc);
                    // 计算距离
                    var juli = that.juli(loc[1], loc[0], latitude, longitude)
                    console.log('两地距离', juli);
                    var obj = {
                        address,
                        street,
                        juli: juli.toFixed(2) // toFix ? 
                    };
                    reslove(obj);
                },
                async fail(err) {
                    console.log(err)
                    wx.showToast({
                        title: '获取城市失败',
                        icon: 'none'
                    })
                },
                complete() {
                    // 做点什么

                }
            })
        })
    },

    // 计算打卡距离        
    juli(lat1, lng1, lat2, lng2) {
        console.log(lat1, lng1, lat2, lng2)
        var radLat1 = lat1 * Math.PI / 180.0;
        var radLat2 = lat2 * Math.PI / 180.0;
        var a = radLat1 - radLat2;
        var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137;
        s = Math.round(s * 10000) / 10000;
        return s
    },

    // 获取当前定位
    getLoacation() {
        wx.getLocation({
            type: 'gcj02',
            success: async res => {
                console.log(res);
                // 根据经纬度获取用户位置信息
                // 一进来先获取一次
                this.setData({
                    longitude: res.longitude,
                    latitude: res.latitude
                })
                var condition = {};
                this.setData({
                    condition,
                    selectType: 1 // 废弃字段
                })
                this.getData(this.data.pageNum, this.data.pageSize, condition);

            },
            fail: err => {
                console.log(err);
                if (err.errMsg == 'getLocation:fail 频繁调用会增加电量损耗，可考虑使用 wx.onLocationChange 监听地理位置变化') {
                    return wx.showToast({
                        title: '搜索太频繁了',
                        icon: 'error'
                    })
                }

                if (err.errMsg == 'getLocation:fail auth deny') {
                    wx.getSetting({
                        success: res => {
                            console.log(res);
                            if (!res.authSetting['scope.userLocation']) {
                                wx.showModal({
                                    content: '您未授权位置信息，将无法提供服务，是否去授权？',
                                    success: res => {
                                        if (res.confirm) {
                                            wx.openSetting({
                                                withSubscriptions: false,
                                                success: res => {

                                                }
                                            })
                                        }
                                    }
                                })
                            } else {

                            }
                        }
                    })
                }
            }
        })
    },
    //  判断是否有 获取数据的权限信息
    checkAuthr() {
        return new Promise((reslove, err) => {
            // 判断是否有权限
            wx.getSetting({
                success: res => {
                    console.log('用户位置权限', res);
                    if (!res.authSetting['scope.userLocation']) {
                        reslove(false);
                        console.log("lallala")
                        console.log(reslove(false))

                        return wx.showModal({
                            title: '提示',
                            content: '您拒绝了位置服务，无法为你提供服务，是否去开启位置?',
                            success: res => {
                                if (res.confirm) {
                                    wx.openSetting({
                                        success: res => {
                                            wx.navigateBack({
                                                delta: 1,
                                            })
                                        }
                                    })
                                }
                            }
                        })

                    }
                    reslove(true);
                }
            })
        })
    },

    // 分批请求机构
    async getData(pageNum, pageSize, condition) {
        wx.showLoading({
            title: '正在加载数据',
            mask: true
        })
        var res;
        console.log("分批请求getData", condition)
            // 新逻辑 下面的条件跟着上面走 
        if (condition.content) {
            // 模糊搜索
            console.log("走模糊搜索", condition.key)
            res = await db.collection('group').where({
                name: db.RegExp({
                    regexp: condition.content,
                    options: 'i'
                }),
                type: condition.type,
                time: condition.time,
                yuyue: condition.yuyue

            }).skip((pageNum - 1) * pageSize).limit(pageSize).get({});
            // this.setData({
            //     "content": ""
            // })
        } else {
            // 条件搜索
            console.log("走条件搜索", condition)
            res = await db.collection('group').where(condition).skip((pageNum - 1) * pageSize).limit(pageSize).get({})
        }
        if (res.data.length) {
            var datas = res.data;
            console.log("查找后得到的数据", res)
            if (!this.data.latitude || !this.data.longitude) {
                wx.hideLoading({
                    success: (res) => {},
                })
                return;
            }
            // 如果缓存中有此时这个人所在的经纬度， 直接结算
            // console.log("该结算的时候 此时改优化了", datas)

            // 获取当前人的经纬度
            for (let i = 0; i < datas.length; i++) {
                // 如果=="false" 就是没取出来数据
                if (util.getStorageSyncTime(datas[i].name, "false") == "false") {
                    console.log("缓存中没有读到数据", util.getStorageSyncTime(datas[i].name, "false"))
                        // 解析地址
                    var data = await this.getPro(this.data.latitude, this.data.longitude, datas[i]);
                    datas[i].address = data.address;
                    datas[i].street = data.street;
                    datas[i].juli = data.juli;
                    console.log("放到本地缓存里面", datas[i])
                    util.setStorageSyncHour(datas[i].name, datas[i], 2)
                } else {
                    // 缓存中读到数据了
                    var obj = util.getStorageSyncTime(datas[i].name, "false")
                    console.log("缓存中读到数据了", obj)
                    datas[i].address = obj.address
                    datas[i].juli = obj.juli
                    datas[i].street = obj.street
                }
            }
            var list = this.data.list;
            list = list.concat(datas);
            this.setData({
                list,
                pageNum: ++pageNum, // 页数+1
            })
        } else {
            return wx.showToast({
                title: '到底啦~',
                icon: 'none'
            })
        }
        wx.hideLoading({
            success: (res) => {},
        })
    },

    // 打开导航  从wxml中 将group机构的list数组都给过来了
    daohang(e) {
        // 检测位置权限
        var isTrue = this.checkAuthr();
        if (!isTrue) {
            return;
        }
        var item = e.currentTarget.dataset.item; // 直接拿着groups中的 item数组来做 
        console.log("item", item);
        // 切割
        var location = item.location.split(',');
        wx.openLocation({ //​使用微信内置地图查看位置。
            latitude: Number(location[1]), //要去的纬度-地址
            longitude: Number(location[0]), //要去的经度-地址
            name: item.name,
            address: item.address
        })
    },

    // 打电话
    callPhone(e) {
        var phone = e.currentTarget.dataset.phone;
        wx.makePhoneCall({
            phoneNumber: phone,
            success: res => {
                console.log(res, '拨打成功');
            }
        })
    },

    //搜索
    searCh(e) {
        // 检测位置权限
        var isTrue = this.checkAuthr();
        if (!isTrue) {
            return;
        }
        var key = e.detail.value;

        // 构建模糊搜索
        var condition = {};
        if (key) {
            condition.key = key;
            condition.content = key; // 新加的逻辑，三个列表函数都可以 读取这一个数据
            this.setData({
                condition,
                content: key
            })
        } else {
            // this.getData(this.data.pageNum, this.data.pageSize, condition);
            // 显示所有的数据
            // return wx.showToast({
            //     title: '请输入关键词',
            //     icon: 'none'
            // })
        }
        // 清空数据
        this.setData({
            list: [],
            pageNum: 1
        })

        this.getData(this.data.pageNum, this.data.pageSize, condition);
    },

    // 选择机构类型
    bindChangeType(e) {
        // 检测位置权限
        var isTrue = this.checkAuthr();
        if (!isTrue) {
            return;
        }
        var index = Number(e.detail.value);
        // console.log("选择机构类型的索引", index);
        this.setData({
            index1: index,
            list: [],
            pageNum: 1,

        })
        var condition = this.data.changeCondition;
        condition.type = index + 1; // 索引是从0开始的， type是 1 or 2 
        if (this.data.content) {
            condition.content = this.data.content
        }
        this.getData(this.data.pageNum, this.data.pageSize, condition);
    },

    // 选择出报告时间
    bindChangeTime(e) {
        // 检测位置权限
        var isTrue = this.checkAuthr();
        if (!isTrue) {
            return;
        }
        console.log("选择出报告的时间", e)
        var index = Number(e.detail.value);
        console.log("bindChangeTime 的index", index)
        this.setData({
            index2: index,
            list: [],
            pageNum: 1,
        })
        var condition = this.data.changeCondition;
        console.log("bindChangeTime 的 condition", condition)
        condition.time = index + 1; // 索引是从0开始的， 枚举是从1开始的
        if (this.data.content) {
            condition.content = this.data.content
        }
        this.getData(this.data.pageNum, this.data.pageSize, condition);
    },
    // 选择是否可预约
    bindChangeYuyue(e) {
        // 检测位置权限
        var isTrue = this.checkAuthr();
        if (!isTrue) {
            return;
        }
        var index = Number(e.detail.value);
        this.setData({
            index3: index,
            list: [],
            pageNum: 1
        })
        var condition = this.data.changeCondition;
        console.log("bindChangeYuyue 的 condition", condition)
        condition.yuyue = index == 0 ? true : false;
        console.log("bindChangeYuyue 的 pageNum PageSize", this.data.pageNum, this.data.pageSize);

        if (this.data.content) {
            condition.content = this.data.content
        }
        // 分批请求数据,从数据库中请求数据 
        this.getData(this.data.pageNum, this.data.pageSize, condition);
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
    onPullDownRefresh: function() { // 这个是什么意思？？
        var co = this.data.condition;
        this.getData(this.data.pageNum, this.data.pageSize, co, co.key ? 1 : 0);
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