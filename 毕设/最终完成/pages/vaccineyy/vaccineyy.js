const util = require('../../utils/util.js');
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
const db = wx.cloud.database();
Page({
    data: {
        index:0,
        cate: ["居民身份证", "港澳台居民来往内地通行证", "护照", "台胞证", "其他"], 
        cateIndex: 0,
        dshow: false,
        toastsuccess:false,
        gender: ['男', '女'],
        types:["北京生物新冠灭活疫苗","北京科兴中维新冠肺炎疫苗","生物新冠疫苗","安徽智飞龙科马新冠疫苗","康希诺新冠疫苗"],
        genIndex: 0,
        typeIndex:0,
        countIndex:0,
        dateTimes: [],
        yyjc: ["第一剂次","第二剂次","第三剂次","加强剂次"], 
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
        timeIndex: [0,  0],
    },
    bindPickerChange(e){
        this.index = e.target.value;
        console.log(this.ShopName[e.target.value])
   },
    onLoad: async function() {
        var dates = [];
        for (let i = 0; i < 14; i++) {
            var time = new Date();
            time.setDate(time.getDate() + i);
            var obj = {};
            obj.value = util.formatDate(time);
            dates.push(obj);
        }
        var times = this.data.dateTimes;
        times[0] = dates;
        times[1] = this.data.times;
        this.setData({
                dateTimes: times
        })
    },
    inputNo(e){
        console.log(e.detail.value);
        this.setData({
            idNo: e.detail.value
        })
    },
    inputName(e){
        this.setData({
            name: e.detail.value
        })
    },
    inputPhone(e){
        console.log(e.detail.value);
        this.setData({
            phone: e.detail.value
        })
    },
    inputAge(e){
        this.setData({
            age: e.detail.value
        })
    },
    bindCate(e) {
        this.setData({
            cateIndex:e.detail.value
        })
    },
    bindGen(e) {
        this.setData({
            genIndex : e.detail.value
        })
    },
    // 选择就诊时间段  [日期, 时间]
    bindCheckTime(e) {
        console.log("选择就诊时间段", e);
        this.setData({
            timeIndex:e.detail.value
        })
    },
    bindChangeyyjc(e){
        var index = e.detail.value;
        this.setData({
            countIndex: index
        })
        console.log(index)
    },
    bindTypes(e){
        console.log(e)
        var index = e.detail.value;
        this.setData({
            typeIndex: index
        })
    },
    bindCIndex(e) {
        var index = e.detail.value;
        console.log(e)
        this.setData({
            cateIndex: index
        })
    },
    bindChangeGender(e) {
        var index = e.detail.value;
        this.setData({
            genIndex: index
        })
    },
    bindPickTime(e) {
        console.log(e);
        var timeIndex = e.detail.value;
        this.setData({
            timeIndex
        })
    },
     submit(e) {
        var dateTimes = this.data.dateTimes;
        var name = this.data.name;
        var idNo = this.data.idNo;
        var age = this.data.age;
        var phone = this.data.phone;
        var countIndex = this.data.countIndex;
        var types = this.data.types;
        var timeIndex = this.data.timeIndex;
        var typeIndex = this.data.typeIndex;

        if (!name  || !idNo || !age || !phone) {
            return wx.showToast({
                title: '请填写完整',
                icon: 'error'
            })
        }

        const regu = /^1\d{10}$/;
        if (!regu.test(phone)) {
            return wx.showToast({
                title: '手机号格式不正确',
                icon: 'none'
            })
        }

        db.collection('order').add({
            data: {
                userId: wx.getStorageSync('user')._id, 
                name, 
                idNo, 
                age, 
                phone,
                group: "西安航天城医院",
                groupId: "65742e1362543b09000747c611710a2a",
                yuyueDate: dateTimes[0][timeIndex[0]].value, 
                yuyueTime: dateTimes[1][timeIndex[1]].value, 
                vaccIndex: countIndex + 1,
                vaccName: types[typeIndex],
                price: 10, 
                createTime: new Date(), 
                status: 1, 
                orderNum: 'TH' + new Date().getTime(), 
                type: 2, 
                city: "西安",
                isdeleted: false
            },
            success: res => {
                var orderId = res._id; // 订单id
                console.log(orderId);
                this.setData({
                    dshow: true,
                    orderId:res._id
                })
            }
        })
    },
    goPay(){
        var orderId = this.data.orderId;
        db.collection('order').doc(orderId).update({
            data: {
                status: 2,
                payTime: util.formatTime(new Date()), 
                payNum: 'PAY' + new Date().getTime(), 
            },
            success: res => {
                this.setData({
                    toastsuccess:true
                })
                wx.setStorageSync('Oindex', 2);
                setTimeout(() => {
                    wx.reLaunch({
                        url: '/pages/order/order',
                    })
                }, 1000);
            }
        })
    },
    goOrder(){
        wx.setStorageSync('Oindex', 1);
        wx.reLaunch({
            url: '/pages/order/order',
        })
    },
    // ocr识别   
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
                // console.log("最终的res是什么", res)
                // console.log("最终的res的data的errorcode", res.result.errcode)
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
                    name: res.result.name,
                    idNo: res.result.id,
                    age: curyear - birthyear

                })
                Toast.success('成功文案');
                wx.showToast({
                    title: "已经成功识别出身份信息"
                })
            },
            fail: res => {
                // 友情提示 识别失败
                wx.showToast({
                    title: "识别失败,请确报身份证照片是否清晰"
                })

            }
        })
    },

    getUrlById: function(resId) {
        var self = this
            // console.log("进入getUrlById", resId)
        wx.cloud.getTempFileURL({
            fileList: [{
                fileID: resId,
                maxAge: 60 * 60, // one hour
            }]
        }).then(res => {
            // get temp file URL
            // console.log("获取res", res);
            // console.log(res.fileList[0].tempFileURL)
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
                const newName = util.wxuuid() + suffix;
                // console.log("wxuuid:", util.wxuuid)
                // console.log("新的名字newName", newName)
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