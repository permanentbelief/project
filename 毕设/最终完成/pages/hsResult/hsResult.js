const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({

    data: {
        idNo: '',
        idCard: '',
        show: false,
        res: "",
        leftTime: "",
        isValid: true,
        list: [],
        tmpRealName: "",
        tmpidCart: "",
        groupAddress: "",
        tshow: false,
    },
    // 如果是阳性患者 直接弹窗提示
    showPopup() {
        // console.log("进入弹窗提示")
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
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this
        console.log("options", options)
        if (options.detail) {
            db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                status: 4, 
                type: 1, 
                phone: wx.getStorageSync('user').phone,
            }).orderBy('createTime', 'desc').get({
                success: res => {
                    console.log("精简版", res);
                    // console.log(res.data[0].createTime)
                    if (res.data.length) {
                        var result = res.data[0];
                        // console.log("得到的结果数据", result)
                        var creatT = util.formatTime(new Date(result.createTime))
                        result.createTime = creatT
                        var qiandaoTime = util.formatTime(new Date(result.qiandaoTime))
                        result.qiandaoTime = qiandaoTime;
                        var realName = result.realName;
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
                            res: result,
                            tmpRealName: realName,
                        })
                        if (this.data.res.hsresult) { // 阳性的时候 showup, 测试的时候就拿阴性测试
                            this.showPopup()
                        }
                    } else { // 提示暂未检测结果 
                        this.setData({
                            tshow: true
                        });
                    }
                    console.log("得到的结果数据", this.data.res)
                }
            })
        } else {
            console.log("查询个人")
            db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                status: 4, 
                type: 1, 
                phone: wx.getStorageSync('user').phone,
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
                                res: result, // 倒序取第一个
                                tmpRealName: realName,
                    
                            })
                            // console.log("结果数据获取", this.data.jieguo)
                        if (this.data.res.hsresult) { // 阳性的时候 showup, 测试的时候就拿阴性测试
                            this.showPopup()
                        }
                    } else {
                        this.setData({
                            tshow: true
                        });

                    }
                }
            })
        }
    },
    getMore() {
        if (!this.data.res) {
            this.setData({
                tshow: true
            });
            return;
        }
        db.collection('order').where({
                userId: wx.getStorageSync('user')._id,
                status: 4,
                type: 1,
                phone: wx.getStorageSync('user').phone,
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