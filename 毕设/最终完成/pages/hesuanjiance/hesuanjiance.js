const util = require('../../utils/util.js');
const idCardUtil = require('../../utils/idCrdutil.js');
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';


const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        category: ["居民身份证", "港澳台居民来往内地通行证", "护照", "台胞证", "其他"], // 证件类型
        cateIndex: 0,
        gender: ['男', '女', '未知'],
        genIndex: 0,
        groups: [],
        groupIndex: null,
        dateTimes: [],
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
        //如果第一次调用这个页面的话, options={} 
        console.log("渲染信息", options);

        this.setData({
                phone: (options.phone && options.phone != 'undefined') ? options.phone : '',
                address: (options.address && options.address != 'undefined') ? options.address : '',
            })
            // 获取今天，明天
        var dates = [];
        for (let i = 0; i < 7; i++) {
            var time = new Date();
            console.log("new Date()的time是", time);
            // console.log("time.getDate()", time.getDate())
            // time.date 返回这个月的第几天
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
        console.log("最终获取到的dates", dates)
        var times = this.data.dateTimes;
        times[0] = dates;
        times[1] = this.data.times;
        var id = options.id;
        var groups;
        if (!id) {
            // 获取机构
            groups = await this.getGroups(0, []);
        } else {
            // 获取机构
            groups = await this.getGroupsById(id);
            var num = groups[0].num; // 总共
            // 查询剩余数量
            db.collection('order').where({
                type: 1, // 核酸
                groupId: groups[0]._id, // 机构id
                yuyueDate: times[0][0].value
            }).get({
                success: res => {
                    var yiyueyue = res.data.length;
                    var title = '剩余采集样本:' + (num - yiyueyue);
                    console.log(title);
                    times[2] = [{
                        value: title
                    }];
                    this.setData({
                        dateTimes: times,
                        left: num - yiyueyue
                    })
                }
            })
        }
        console.log(groups);
        this.setData({
            categoryType: '居民身份证',
            genderType: '男',
            groups,
            dateTimes: times,
            groupIndex: id ? 0 : null
        })
    },

    // 打开导航
    position(e) {
        var index = e.currentTarget.dataset.index;
        console.log("position", e)
        if (index || index == 0) {
            var item = this.data.groups[index]; // 先获取这个地点的所有信息 
            console.log("最终得到导航地点", item)
                // 切割
            var location = item.location.split(',');
            wx.openLocation({ //​使用微信内置地图查看位置。
                latitude: Number(location[1]), //要去的纬度-地址
                longitude: Number(location[0]), //要去的经度-地址
                name: item.name,
                address: item.address
            })
        } else {
            return wx.showToast({
                title: '请选择采集地点',
                icon: 'none'
            })
        }
    },

    // 选择采集点并且查询剩余采集数
    bindChangeGroup(e) {
        var index = Number(e.detail.value);
        var groups = this.data.groups;
        var num = groups[index].num; // 总共
        // 查询剩余数量
        db.collection('order').where({
            type: 1, // 核酸
            groupId: groups[index]._id, // 机构id
            yuyueDate: this.data.dateTimes[0][0].value
        }).get({
            success: res => {
                var yiyueyue = res.data.length;
                var title = '剩余采集样本:' + (num - yiyueyue);
                var dateTimes = this.data.dateTimes;
                dateTimes[2] = [{
                    value: title
                }];
                this.setData({
                    dateTimes,
                    left: num - yiyueyue,
                    groupIndex: index
                })
            }
        })

    },

    // 获取所有机构
    getGroups(num, list) {
        return new Promise((relsove, err) => {
            // 循环查询
            db.collection('group').skip(num * 20).limit(20).get({
                success: res => {
                    if (res.data.length) {
                        list = list.concat(res.data);
                        this.getGroups(++num, list).then(res => relsove(res));
                    } else {
                        relsove(list);
                    }
                }
            })
        })
    },

    getGroupsById(id) {
        return new Promise((relsove, err) => {
            // 先查询团体预约数据
            db.collection('tuanti').doc(id).get({
                success: res => {
                    var tuanti = res.data;
                    this.setData({
                            tuanti
                        })
                        // 循环查询
                    db.collection('group').doc(tuanti.groupId).get({
                        success: res => {
                            var group = res.data;
                            var arr = [];
                            arr.push(group);
                            relsove(arr);
                        }
                    })
                }
            })
        })
    },

    // 获取输入的值
    getValue(e) {
        var name = e.currentTarget.dataset.name;
        console.log("getValue输入的值", name)
        var obj = {};
        obj[name] = e.detail.value;
        this.setData(obj);
        console.log("完成")
    },

    // 选择证件类型  name: 传过来的 "categoryType"
    bindChange(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        console.log("bindChange选择证件类型", e)
        obj[name] = this.data.category[Number(e.detail.value)];
        obj.cateIndex = Number(e.detail.value)
        console.log("bindChange绑定的证件对象", obj)
        this.setData(obj);
    },

    // 选择性别   name = 传过来的 姓名字段 
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
        console.log(column);
        if (column) {
            return;
        }
        var value = Number(e.detail.value); // 选择的值
        var dateTimes = this.data.dateTimes;
        var date = dateTimes[column][value].value;
        console.log("dateTimes", dateTimes)
        console.log("date", date)
            // 根据选择的时间取 剩余采集样本数
            // 查询剩余数量
        db.collection('order').where({
            type: 1, // 核酸
            groupId: this.data.groups[this.data.groupIndex]._id, // 机构id
            yuyueDate: date
        }).get({
            success: res => {
                var yiyueyue = res.data.length;
                var num = this.data.groups[this.data.groupIndex].num;
                var title = '剩余采集样本:' + (num - yiyueyue);
                console.log(title);
                var dateTimes = this.data.dateTimes;
                dateTimes[2] = [{
                    value: title
                }];
                this.setData({
                    left: num - yiyueyue,
                    dateTimes
                })
            }
        })
    },

    // 选择就诊时间段  [日期, 时间, 针剂数量]
    bindChangeTime(e) {
        console.log("选择就诊时间段", e);
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
        // 看用户是否登录信息
        if (!wx.getStorageSync('user')) {
            wx.showToast({
                title: '请先登录！',
                icon: 'error'
            })
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/my/my',
                })
            }, 500); // 0.5s后跳转到用户界面提示登录信息 
        }
        if (this.data.left == 0) {
            return wx.showToast({
                title: '剩余采集样本数不足,请选择其他时段',
                icon: 'none'
            })
        }
        // groups 采集点信息
        var groups = this.data.groups;
        var tuanti = this.data.tuanti;
        var dateTimes = this.data.dateTimes;
        var companyName = this.data.companyName;
        var address = this.data.address;
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
        var tempPath = this.data.tempPath;
        if (!tuanti) {
            if (!realName || !categoryType || !idCard || !genderType || !age || !phone || groupIndex == null || !tempPath) {
                return wx.showToast({
                    title: '请填写完整',
                    icon: 'error'
                })
            }
        } else {
            if (!realName || !phone || !tempPath || !companyName || !address) {
                return wx.showToast({
                    title: '请填写完整',
                    icon: 'error'
                })
            }
        }
        // 校验身份证号格式是否正确
        if (idCard && !idCardUtil.checkIdCard(idCard)) {
            return wx.showToast({
                title: '身份证号格式不正确',
                icon: 'none'
            })
        }
        // 检查手机号格式
        const regu = /^1\d{10}$/;
        if (!regu.test(phone)) {
            return wx.showToast({
                title: '手机号格式不正确',
                icon: 'none'
            })
        }
        wx.showLoading({
            title: '正在提交',
            mask: true
        })

        //!! 表里的这里的userId 是每一个用户特有的吗？ 和openid的区别

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
                address, // 公司地址
                companyName, // 公司名称
                group: groups[groupIndex].name, // 采集点名称
                groupId: groups[groupIndex]._id, // 采集点id
                yuyueDate: dateTimes[0][timeIndex[0]].value, // 预约日期
                yuyueTime: dateTimes[1][timeIndex[1]].value, // 预约时间
                erCode: up.fileID, // 健康码图片
                price: tuanti ? (groups[groupIndex].hesuanPrice * tuanti.renshu) : groups[groupIndex].hesuanPrice, // 支付的金额
                createTime: new Date(), // 创建时间
                tuanti: tuanti ? tuanti : 0,
                title: tuanti ? tuanti.title : '',
                status: 1, // 1待支付 2待签到 3检测中 4已完成 5已退款
                orderNum: 'TH' + new Date().getTime(), // 订单号
                type: 1, // 1核酸订单 2疫苗订单
                img: groups[groupIndex].hsImg,
                province: groups[groupIndex].province
            },
            success: res => {
                var orderId = res._id; // 订单id
                console.log(orderId);
                // 关闭加载框
                wx.hideLoading({
                    success: (res) => {},
                })
                console.log(tuanti ? (groups[groupIndex].hesuanPrice * tuanti.renshu) : groups[groupIndex].hesuanPrice);
                wx.showModal({
                        title: '订单金额' + (tuanti ? (groups[groupIndex].hesuanPrice * tuanti.renshu) : groups[groupIndex].hesuanPrice) + '元',
                        content: '确认支付吗?',
                        success: res => {
                            console.log(res);
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
                    // 增加预约量
                var num = tuanti.num;
                var _ = db.command;
                db.collection('tuanti').doc(tuanti._id).update({
                    data: {
                        num: num ? _.inc(1) : 1
                    },
                    success: res => {
                        console.log('增加预约量成功');
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
        //Promise是一个构造函数, 
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

    // --------------------------------------------------------------------------
    // ocr识别模块 
    getSfz: function(url) {
        var that = this
        wx.cloud.init({
            traceUser: true
        })
        wx.cloud.callFunction({
            name: 'getOcrSfz',
            data: {
                imgUrl: url, // 传给云函数的参数
            },
            success: res => {
                //console.log('getSfz=' + JSON.stringify(res))
                console.log("最终的res是什么", res)
                console.log("最终的res的data的errorcode", res.result.errcode)
                if (res.result.birth == undefined) {
                    console.log("ocr识别失败", res.result.errcode)
                    wx.showToast({
                        title: "识别失败,请确保身份证照片是否清晰",
                        icon: 'none',
                    })
                    return
                }
                //结算年龄, 并且姓名 身份证号 信息的填入
                var birthyear = res.result.birth.substr(0, 4)
                var date = new Date
                var curyear = date.getFullYear()
                console.log("出生的年份", birthyear)
                console.log("今年的年份", curyear)
                that.setData({
                    realName: res.result.name,
                    idCard: res.result.id,
                    age: curyear - birthyear

                })
                Toast.success('成功文案');
                wx.showToast({
                    title: "已经成功识别出身份信息"
                })
            },
            fail: res => {
                console.log("getSfx")
                    // 友情提示 识别失败
                wx.showToast({
                    title: "识别失败,请确报身份证照片是否清晰"
                })

            }
        })
    },

    getUrlById: function(resId) {
        var self = this
        console.log("进入getUrlById", resId)
        wx.cloud.getTempFileURL({
            fileList: [{
                fileID: resId,
                maxAge: 60 * 60, // one hour
            }]
        }).then(res => {
            // get temp file URL
            console.log("获取res", res)
            console.log(res.fileList[0].tempFileURL)
                // 后续操作见第三步操作【识别】
            this.getSfz(res.fileList[0].tempFileURL)
        }).catch(error => {
            // handle error
        })
    },

    // ocr识别 
    chooseOCRImg: function() {
        var self = this
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                // tempFilePath可以作为img标签的src属性显示图片，回调结果
                const tempFilePaths = res.tempFilePaths
                    // ["http://tmp/f3zhptK14bYufe32ad6da213512bffb42e2069144d58.png"]
                console.log("获取照片tempFilePaths信息", tempFilePaths)
                    // 后续操作见第二步操作【上传】
                var util = require('../../utils/util.js');
                const suffix = tempFilePaths[0].substr(tempFilePaths[0].lastIndexOf('.'), tempFilePaths[0].length)
                console.log("事件前缀名称suffix", suffix)
                    // 得到选择图片的后缀名后，加上uuid则组成了待上传的文件名
                const newName = util.wxuuid() + suffix
                console.log("wxuuid:", util.wxuuid)
                console.log("新的名字newName", newName)
                wx.cloud.uploadFile({
                    cloudPath: newName,
                    filePath: tempFilePaths[0], // 文件路径
                    success: (res => {
                        // get resource ID 
                        self.getUrlById(res.fileID)
                        wx.showToast({
                                icon: none,
                                title: "上传中"
                            })
                            //  console.log(res.fileID)
                            //  console.log("获取完整的res", res)
                            // 此处要得到图片的url，就需要用fileID去换
                    }),
                    fail: (err => {
                        wx.showToast({

                        })
                        console.log(err)
                    })
                })
            }
        })
    },

})