const util = require('../../utils/util.js');
const idCardUtil = require('../../utils/idCrdutil.js');
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        category: ["居民身份证", "港澳台居民来往内地通行证", "护照", "台胞证", "其他"], // 证件类型
        cateIndex: 0,
        gender: ['男', '女'],
        genIndex: 0,
        groups: [],
        groupIndex: 0,
        dateTimes: [],
        jcIndex: null, // 剂次索引
        jici: [], // 剂次
        // 时间段
        times: [{
            value: '8:00-10:00'
        }, {
            value: '10:00-12:00'
        }, {
            value: '12:00-14:00'
        }, {
            value: '14:00-16:00'
        }, {
            value: '16:00-18:00'
        }, {
            value: '18:00-20:00'
        }],
        timeIndex: [0, 0, 0],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function(options) {
        console.log(options);
        console.log("进入疫苗预约界面", options)

        var id = options.id; // 机构id
        // 获取今天，明天
        var dates = [];
        for (let i = 0; i < 7; i++) {
            var time = new Date();
            time.setDate(time.getDate() + i);
            var obj = {};
            obj.value = util.formatDate(time);
            if (i == 0) {
                obj.name = '今天';
            }
            if (i == 1) {
                obj.name = '明天';
            }
            if (i == 2) {
                obj.name = '后天';
            }
            dates.push(obj);
        }
        var times = this.data.dateTimes;
        times[0] = dates;
        times[1] = this.data.times;
        this.setData({
                categoryType: '居民身份证',
                genderType: '男',
                dateTimes: times
            })
            // 获取机构
        this.getGroup(id);
    },

    // 选择采集点
    bindChangeGroup(e) {
        var index = Number(e.detail.value);
        this.setData({
            groupIndex: index
        })
    },

    // 获取机构
    getGroup(id) {
        // 循环查询
        db.collection('group').doc(id).get({
            success: res => {
                var group = res.data;
                console.log(group);
                var groups = [];
                groups.push(group); // 单个机构
                // 查询机构下的剂次
                db.collection('yimiao').where({
                    groupId: id
                }).get({
                    success: res => {
                        console.log(res);
                        this.setData({
                            jici: res.data,
                            groups,
                        })
                    }
                })
            }
        })
    },

    // 选择剂次
    bindChangeJici(e) {
        var index = Number(e.detail.value);
        var jici = this.data.jici;
        var num = jici[index].num; // 总数量
        var dateTimes = this.data.dateTimes;
        // 查询剩余剂次
        db.collection('order').where({
            groupId: this.data.groups[0]._id, // 机构id
            type: 2, // 疫苗
            yuyueDate: dateTimes[0][0].value,
            jici: index + 1, // 第几剂次
        }).get({
            success: res => {
                var yi = res.data.length;
                var shengyu = num - yi;
                console.log(shengyu);
                var title = '剩余采集样本:' + shengyu;
                dateTimes[2] = [{
                    value: title
                }];
                this.setData({
                    dateTimes,
                    shengyu,
                    jcIndex: index
                })
            }
        })
    },

    // 获取输入的值
    getValue(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        obj[name] = e.detail.value;
        this.setData(obj);
    },

    // 选择证件类型
    bindChange(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        obj[name] = this.data.category[Number(e.detail.value)];
        obj.cateIndex = Number(e.detail.value)
        this.setData(obj);
    },

    // 选择性别
    bindChangeGender(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        obj[name] = this.data.gender[Number(e.detail.value)];
        obj.genIndex = Number(e.detail.value)
        this.setData(obj);
    },

    // 选择时间
    bindMultiPickerChange(e) {
        console.log('选择时候触发', e);
    },

    // 滑动时候触发
    bindMultiPickerColumnChange(e) {
        var column = e.detail.column; // 滑动的列数
        if (column) {
            return;
        }
        var value = Number(e.detail.value); // 选择的值
        var dateTimes = this.data.dateTimes;
        var date = dateTimes[column][value].value;
        // 根据选择的时间取 剩余采集样本数
        // 查询剩余数量
        db.collection('order').where({
            type: 2, // 疫苗
            groupId: this.data.groups[this.data.groupIndex]._id, // 机构id
            yuyueDate: date,
            jici: this.data.jcIndex + 1
        }).get({
            success: res => {
                var yiyueyue = res.data.length;
                var num = this.data.jici[this.data.jcIndex].num;
                var title = '剩余采集样本:' + (num - yiyueyue);
                console.log(title);
                var dateTimes = this.data.dateTimes;
                dateTimes[2] = [{
                    value: title
                }];
                this.setData({
                    shengyu: num - yiyueyue,
                    dateTimes
                })
            }
        })
    },

    // 选择就诊时间段
    bindChangeTime(e) {
        console.log(e);
        var timeIndex = e.detail.value;
        this.setData({
            timeIndex
        })
    },

    // 选择图片
    chooseImg(e) {
        wx.chooseImage({
            count: 1,
            success: res => {
                console.log(res);
                this.setData({
                    tempPath: res.tempFilePaths[0]
                })
            }
        })
    },

    // 提交预约单
    async submit(e) {
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
        if (this.data.shengyu == 0) {
            return wx.showToast({
                title: '剩余采集样本数不足,请选择其他时段',
                icon: 'none'
            })
        }
        var groups = this.data.groups;
        var jici = this.data.jici;
        var dateTimes = this.data.dateTimes;
        // 数据校验
        var realName = this.data.realName;
        var cateIndex = this.data.cateIndex;
        var categoryType = this.data.categoryType;
        var idCard = this.data.idCard;
        var genIndex = this.data.genIndex;
        var genderType = this.data.genderType;
        var age = this.data.age;
        var phone = this.data.phone;
        var groupIndex = this.data.groupIndex;
        var timeIndex = this.data.timeIndex;
        var jcIndex = this.data.jcIndex;
        var tempPath = this.data.tempPath;
        if (!realName || !categoryType || !idCard || !genderType || !age || !phone || groupIndex == null || jcIndex == null || !tempPath) {
            return wx.showToast({
                title: '请填写完整',
                icon: 'error'
            })
        }
        // 校验身份证号格式是否正确
        // if (!idCardUtil.checkIdCard(idCard)) {
        //     return wx.showToast({
        //         title: '身份证号格式不正确',
        //         icon: 'none'
        //     })
        // }
        // // 检查手机号格式
        // const regu = /^1\d{10}$/;
        // if (!regu.test(phone)) {
        //     return wx.showToast({
        //         title: '手机号格式不正确',
        //         icon: 'none'
        //     })
        // }
        wx.showLoading({
            title: '正在提交',
            mask: true
        })

        // 先上传图片
        var up = await this.upLoadFile(tempPath);
        db.collection('order').add({
            data: {
                userId: wx.getStorageSync('user')._id, // 用户id
                realName, // 真实姓名
                categoryType, // 证件类型
                cateIndex, // 证件索引
                idCard, // 证件号码
                genderType, // 性别
                genIndex, // 性别索引
                age, // 年龄
                phone, // 手机号码
                group: groups[groupIndex].name, // 采集点名称
                groupId: groups[groupIndex]._id, // 采集点id
                yuyueDate: dateTimes[0][timeIndex[0]].value, // 预约日期
                yuyueTime: dateTimes[1][timeIndex[1]].value, // 预约时间
                erCode: up.fileID, // 健康码图片
                jici: jcIndex + 1, // 第几针次
                jiciName: jici[jcIndex].name, // 疫苗名称
                price: jici[jcIndex].price, // 支付的金额
                createTime: new Date(), // 创建时间
                status: 1, // 1待支付 2待签到 3检测中 4已完成 5已退款
                orderNum: 'TH' + new Date().getTime(), // 订单号
                type: 2, // 1核酸订单 2疫苗订单
                img: groups[groupIndex].ymImg,
                province: groups[groupIndex].province,
                // 疫苗信息
                isdeleted: false
            },
            success: res => {
                var orderId = res._id; // 订单id
                // 关闭加载框
                wx.hideLoading({
                    success: (res) => {},
                })
                console.log('ii');
                wx.showModal({
                    title: '订单金额' + jici[jcIndex].price + '元',
                    content: '确认支付吗?',
                    success: res => {
                        if (res.confirm) {
                            // 确认支付 将订单改为已支付
                            db.collection('order').doc(orderId).update({
                                data: {
                                    status: 2,
                                    payTime: util.formatTime(new Date()), // 支付时间
                                    payNum: 'ZF' + new Date().getTime(), // 支付单号
                                },
                                success: res => {
                                    wx.showToast({
                                        title: '支付成功',
                                    })
                                    setTimeout(() => {
                                        wx.reLaunch({
                                            url: '/pages/myOrder/myOrder',
                                        })
                                    }, 1000);
                                }
                            })
                        } else {
                            wx.reLaunch({
                                url: '/pages/myOrder/myOrder',
                            })
                        }
                    }
                })
            }
        })
    },

    // 上传图片异步转同步
    upLoadFile(e) {
        console.log('upLoadFile接收到的', e);
        let suffix = /\.[^\.]+$/.exec(e)[0];
        console.log(suffix);
        return new Promise((resolve, reject) => {
            //上传到云存储
            wx.cloud.uploadFile({
                cloudPath: new Date().getTime() + suffix, //在云端的文件名称
                filePath: e, //临时文件路径
                success: res => {
                    //resolve作用提示小程序请求已结束
                    resolve(res) // 上传成功后的路径
                },
                fail: err => {
                    reject(err) // 上传错误
                }
            })
        });
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