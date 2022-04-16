const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({


    // 这里的设计思想 展现 个子简单表单的时候, 就显示机构的地址信息，如果过多数据的的情况下就没必要返回就诊地址
    /**
     * 页面的初始数据
     */
    data: {
        idNo: '',
        idCard: '',
        isShow: true, // 眼睛控制
        show: false,
        res: "",
        leftTime: "",
        isValid: true,
        list: [],
        tmpRealName: "",
        tmpidCart: "",
        groupAddress: "",
    },
    // 如果是阳性患者 直接弹窗提示
    showPopup() {
        console.log("进入弹窗提示")
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

    calculateDiffTime(start_time, end_time) {
        console.log("start_time", start_time)
        console.log("end_time", end_time)
        if (end_time < start_time) {
            return "false"
        }
        var usedTime = end_time - start_time; //两个时间戳相差的毫秒数   1000=>1

        console.log("两个时间戳相差", usedTime)
        var days = Math.floor(usedTime / (24 * 3600 * 1));
        //计算出小时数
        var leave1 = usedTime % (24 * 3600 * 1); //计算天数后剩余的毫秒数
        var hours = Math.floor(leave1 / (3600 * 1));
        //计算相差分钟数
        var leave2 = leave1 % (3600 * 1); //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (60 * 1000));
        var time = days + "天" + hours + "时" + minutes + "分";
        console.log("times", time)
            //var time = days;
        return time;
    },
    cal(lastTime) {
        var lastQ = new Date(lastTime).getTime()
        lastQ /= 1000;
        console.log("上次签到时间(还要加上核酸有效期)", lastQ);
        lastQ += 60 * 60 * 24 * 2; // 核酸有效期 2天
        // 现在时间的时间戳
        var curT = Date.parse(new Date());
        curT /= 1000;
        console.log("当前时间", curT)
        return this.calculateDiffTime(curT, lastQ)
    },
    getAddress(group_id) {
        console.log("getAddress", group_id);
        let that = this;
        // console.log("精度", latitude)
        // console.log("维度", longitude)
        db.collection('group').
        where({
            _id: group_id
        }).get({
            success: res => {
                // console.log("getAddress", res);
                // 解析location 获得地址信息 
                var array = res.data[0].location.split(",");
                var latitude = array[1];
                var longitude = array[0];
                console.log("精度", latitude);
                console.log("维度", longitude);
                wx.request({
                    url: 'https://api.map.baidu.com/reverse_geocoding/v3/?ak=jbpKuM8cQ2uBPgxEgCimeWDQAyQiFN2K&location=' + latitude + ',' + longitude + '&output=json',
                    data: {},
                    header: { 'Content-Type': 'application/json' },
                    success: function(ops) {
                        location = ops.data.result.addressComponent
                        console.log("获取到的地理位置", location)
                        var result = location.city + " " + location.district + " " + location.street;
                        // that.setData({
                        //     groupAddress: result
                        // })
                        // console.log(that.data.groupAddress)
                        return result;
                    },
                    fail: function(resq) {
                        wx.showModal({
                            title: '信息提示',
                            content: '请求失败',
                            showCancel: false,
                            confirmColor: '#f37938'
                        });
                        return ""
                    },
                })
            }
        })
        return ""
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this
        console.log("options", options)
        if (options.detail) {
            // 个人报告详情版  => 首页报告结果，是最精简的版本 
            db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                // userId: 'efbc6d71624254fe028c78965b389e1f',
                status: 4, // 已完成的订单
                type: 1, // 核酸结果
                phone: wx.getStorageSync('user').phone,
                // phone: '13663797977'
                tuanti: 0
            }).orderBy('createTime', 'desc').get({
                success: res => {
                    console.log("查询到的订单精简版", res);
                    // console.log(res.data[0].createTime)
                    if (res.data.length) {
                        var result = res.data[0];
                        // console.log("得到的结果数据", result)
                        var creatT = util.formatTime(new Date(result.createTime))
                        result.createTime = creatT
                        var qiandaoTime = util.formatTime(new Date(result.qiandaoTime))
                        result.qiandaoTime = qiandaoTime;
                        var idCard = '';
                        if (result.idCard) {
                            idCard = this.idCardChangeXing(result.idCard);
                        }
                        var realName = result.realName;
                        for (let i = 0; i < realName.length; i++) {
                            var chat = realName.charAt(i);
                            realName = realName.replace(chat, '*');
                        }
                        // console.log(idCard);
                        //剩余时间
                        var left = this.cal(result.qiandaoTime)
                        if (left == "false") {
                            this.setData({
                                    isValid: false
                                })
                                // console.log("无效", this.data.isValid)
                        } else {
                            // console.log("剩余的 left", left)
                            //换算相差所长时间 相差多上时间 多少分钟
                            this.setData({
                                leftTime: left
                            })
                        }
                        // 个人不需要获得address
                        // var tmp = "";
                        // var key = group_address + options.id;
                        // if (!wx.getStorageSync(key)) {
                        //     // 根据 groupid 去获取groupid 再根据groupid获取 group的经纬度，根据经纬度解析group
                        //     tmp = this.getAddress(result.groupId);
                        //     wx.setStorageSync(key, tmp);
                        // } else {
                        //     tmp = wx.getStorageSync(key)
                        // }
                        // console.log("最终获得的address信息", tmp)
                        this.setData({
                            detail: options.detail,
                            realName,
                            idCard,
                            // jieguo, // 倒序取第一个
                            res: result, // 整体都保存到其中，需要什么信息，后续补充会很快
                            tmpRealName: realName,
                            tmpidCart: idCard,
                        })
                        if (!this.data.res.result) { // 阳性的时候 showup, 测试的时候就拿阴性测试
                            this.showPopup()
                        }
                    } else {
                        wx.showModal({
                            title: '提示',
                            content: '暂无核酸结果数据！请耐心等待',
                            showCancel: false,
                            confirmText: '知道了',
                            success: res => {}
                        })
                    }
                    console.log("得到的结果数据", this.data.res)
                }
            })
        } else if (options.id) {
            // 老幼助查详情版
            var orderId = options.id;
            db.collection('order').doc(orderId).get({
                success: res => {
                    console.log(res);
                    var result = res.data;
                    console.log("老幼助查详情版数据", result)
                    var creatT = util.formatTime(new Date(result.createTime))
                    result.createTime = creatT
                    var qiandaoTime = util.formatTime(new Date(result.qiandaoTime))
                    result.qiandaoTime = qiandaoTime;
                    var idCard = this.idCardChangeXing(result.idCard);
                    var realName = result.realName;
                    for (let i = 0; i < realName.length; i++) {
                        var chat = realName.charAt(i);
                        realName = realName.replace(chat, '*');
                    }
                    // 有效时间相减。有效时间剩余 
                    var left = this.cal(result.qiandaoTime)
                    if (left == "false") {
                        this.setData({
                            isValid: false
                        })
                        console.log("无效", this.data.isValid)
                    } else {
                        console.log("剩余的 left", left)
                            //换算相差所长时间 相差多上时间 多少分钟
                        this.setData({
                            leftTime: left
                        })
                    }

                    var tmp = "";
                    var key = "group_address" + result.groupId;
                    if (!wx.getStorageSync(key) || wx.getStorageSync(key) == "") {
                        // 根据 groupid 去获取groupid 再根据groupid获取 group的经纬度，根据经纬度解析group
                        tmp = this.getAddress(result.groupId);
                        console.log("if里面获取地址信息tmp", tmp)
                        wx.setStorageSync(key, tmp);
                    } else {
                        tmp = wx.getStorageSync(key)
                    }
                    console.log("最终获得的address信息", tmp)
                    this.setData({
                        groupAddress: tmp,
                        detail: true,
                        realName,
                        idCard,
                        res: result, // 倒序取第一个
                        tmpRealName: realName,
                        tmpidCart: idCard,
                    })
                    if (!this.data.res.result) { // 阳性的时候 showup, 测试的时候就拿阴性测试
                        this.showPopup()
                    }
                }

            })
        } else {
            // 查询个人报告精简结果
            db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                status: 4, // 已完成的订单
                type: 1, // 核酸结果
                phone: wx.getStorageSync('user').phone,
                tuanti: 0
            }).orderBy('createTime', 'desc').get({
                success: res => {
                    console.log("查询到的版的订单", res);
                    if (res.data.length) {
                        var result = res.data[0];
                        var creatT = util.formatTime(new Date(result.createTime))
                        result.createTime = creatT
                            // console.log("查看签到时间", new Date(result.qiandaoTime).getTime())
                        var qiandaoTime = util.formatTime(new Date(result.qiandaoTime))
                        result.qiandaoTime = qiandaoTime;
                        // console.log("查看签到时间", result.qiandaoTime)
                        var idCard = this.idCardChangeXing(result.idCard);
                        var realName = result.realName;
                        for (let i = 0; i < realName.length; i++) {
                            var chat = realName.charAt(i);
                            realName = realName.replace(chat, '*');
                        }

                        // 有效时间相减。有效时间剩余 
                        var left = this.cal(result.qiandaoTime)
                        if (left == "false") {
                            this.setData({
                                isValid: false
                            })
                            console.log("无效", this.data.isValid)
                        } else {
                            console.log("剩余的 left", left)
                                //换算相差所长时间 相差多上时间 多少分钟
                            this.setData({
                                leftTime: left
                            })
                        }
                        // var tmp = "";
                        // var key = group_address + options.id;
                        // if (!wx.getStorageSync(key)) {
                        //     // 根据 groupid 去获取groupid 再根据groupid获取 group的经纬度，根据经纬度解析group
                        //     tmp = this.getAddress(result.groupId);
                        //     wx.setStorageSync(key, tmp);
                        // } else {
                        //     tmp = wx.getStorageSync(key)
                        // }
                        // console.log("最终获得的address信息", tmp)
                        this.setData({
                                realName,
                                idCard,
                                res: result, // 倒序取第一个
                                tmpRealName: realName,
                                tmpidCart: idCard,
                            })
                            // console.log("结果数据获取", this.data.jieguo)
                        if (!this.data.res.result) { // 阳性的时候 showup, 测试的时候就拿阴性测试
                            this.showPopup()
                        }
                    } else {
                        wx.showModal({
                            title: '提示',
                            content: '暂无核酸结果数据！请耐心等待',
                            showCancel: false,
                            confirmText: '知道了',
                            success: res => {}
                        })
                    }
                }
            })
        }
    },

    // 显示和关闭眼睛
    showEye() {
        var idCard;
        var realName;
        if (!this.data.isShow) {
            // 将身份证中间部分变成星星
            var idCard = '';
            if (this.data.res.idCard) {
                idCard = this.idCardChangeXing(this.data.res.idCard);
            }
            realName = this.data.res.realName;
            for (let i = 0; i < realName.length; i++) {
                var chat = realName.charAt(i);
                realName = realName.replace(chat, '*');
            }
        } else {
            idCard = this.data.res.idCard;
            realName = this.data.res.realName;
        }

        this.setData({
            realName,
            isShow: !this.data.isShow,
            idCard
        })
    },

    // 将身份证号中间12位变成星号
    // 正则替换
    idCardChangeXing(certificateNumber) {
        certificateNumber = certificateNumber.replace(/(?<=\d{3})\d{12}(?=\d{2})/, "************")
        return certificateNumber;
    },
    getMore() {

        if (!this.data.res) {
            return wx.showModal({
                title: '提示',
                content: '暂无核酸结果数据！请耐心等待',
                showCancel: false,
                confirmText: '知道了',
                success: res => {}
            })
        }
        // 查询个人报告精简结果
        db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                status: 4, // 已完成的订单
                type: 1, // 核酸结果
                phone: wx.getStorageSync('user').phone,
                tuanti: 0
            }).orderBy('createTime', 'desc')
            .limit(5)
            .get({
                success: res => {
                    console.log("getMore的信息有", res);
                    if (res.data.length) {
                        // 清空  this.data里面的res
                        // 先取idcart 和 name 进行res的赋值 和老逻辑是一样的
                        var realName = this.data.res.realName
                        var idCard = this.data.res.idCard
                        this.setData({
                            res: ""
                        })
                        var tmplist = []
                        for (var i = 0; i < res.data.length; i++) {
                            var result = res.data[i];
                            var obj = {}
                            var creatT = util.formatTime(new Date(result.createTime))
                            res.data[i].createTime = creatT
                            var qiandaoTime = util.formatTime(new Date(result.qiandaoTime))
                            res.data[i].qiandaoTime = qiandaoTime
                            obj.list = res.data[i];
                            var left = this.cal(result.qiandaoTime)
                            if (left == "false") {
                                obj.isValid = false;
                                console.log("无效", this.data.isValid)
                            } else {
                                console.log("剩余的left", left)
                                obj.left = left
                            }
                            tmplist.push(obj)
                        }
                        // var resultlist = {}
                        // resultlist.list = tmplist;
                        // resultlist.realName = realName;
                        // resultlist.idCard = idCard;
                        this.setData({
                            list: tmplist,
                        })
                    }

                }

            })
    },


})