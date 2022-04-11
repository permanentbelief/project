const db = wx.cloud.database();
var WxParse = require('../../wxParse/wxParse.js');
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        scimgUrl: "../../images/luntan/shoucang-yes.png",
        dzimgUrl: "../../images/luntan/dianzan_test.png",
        nonescimgUrl: "../../images/luntan/shoucang-no.png",
        nonedzimgUrl: "../../images/luntan/dianzan-no.png",
        detail: {},
        last_update: {},
        isShowLetter: false,
        commTan: false,
        isDz: false,
        isSc: false,
        dianzan: null,
        shoucang: null,
        comment: [],
        commentArray: [],
        liulan: 0, // 浏览数量
        dz: 0, // 点赞数量
        sc: 0, // 收藏数量

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log("options的信息有", options)
        var id = options.id;
        // 添加浏览量
        this.addLiulian(id);
        var that = this;
        db.collection('news').doc(id).get({
            success: res => {
                console.log("wxParse解析 html, res信息有", res)
                WxParse.wxParse('detail_content', 'html', res.data.content, that, 5);
                // console.log("res.data._updateTime", res.data._updateTime)
                // console.log("res.data._updateTime", util.timestampToTime(res.data._updateTime))
                var time = util.timestampToTime(res.data._updateTime)
                console.log("转换后的time", time)
                this.setData({
                    detail: res.data,
                    last_update: time
                })
                console.log("detail信息", this.data.detail)
            }
        })

        // 查询该文章的所有评论     type = 1
        this.getComment(id);
        // 查询该用户有没有点赞
        this.checkDianzan(id);
        // 查询该用户有没有收藏
        this.checkShoucang(id);

        //结算标记的状态，根据是否已经点赞或者收藏，显示点赞或者收藏的状态
        // this.setData({
        //     imgUrl: isSc ? "../../images/luntan/shoucang-yes.png" : "../../images/luntan/shoucang-no.png",
        //     dianzanimgUrl: isDz ? "../../images/luntan/dianzan-yes.png" : "../..//luntan/dianzan-no.imagespng",
        // });
        // 统计点赞数
        this.countDianzan(id);
        // 统计收藏数
        this.countShoucang(id);
    },
    countShoucang(id) {
        db.collection('luntan').where({
            pid: id, // 文章id
            type: 3, // 收藏
        }).get({
            success: res => {
                console.log(res);
                this.setData({
                    sc: res.data.length
                })
            }
        })
    },
    countDianzan(id) {
        db.collection('luntan').where({
            pid: id, // 文章id
            type: 2, // 点赞
        }).get({
            success: res => {
                console.log("countDianzan", res)
                this.setData({
                    dz: res.data.length
                })
            }
        })
    },

    compare(property) {
        console.log("property", property)
        return function(a, b) {
            var value1 = a[property];
            var value2 = b[property];

            var temp1 = Date.parse(value1);
            var temp2 = Date.parse(value2);
            // console.log("temp1", temp1)
            // console.log("temp2", temp2)
            return temp2 - temp1;
        }
    },
    SortCommentByTime: function(res) {
        var objArr = [];
        for (var i = 0; i < res.data.length; i++) {
            for (var j = 0; res.data[i].comment && j < res.data[i].comment.length; j++) {
                var objtemp = {}
                objtemp.content = res.data[i].comment[j].content;
                objtemp.submitTime = res.data[i].comment[j].submitTime;
                objtemp.avatarUrl = res.data[i].avatarUrl;
                objtemp.nickName = res.data[i].nickName;
                objArr.push(objtemp)
            }
        }
        objArr.sort(this.compare('submitTime'));
        console.log("objArr", objArr);
        this.setData({
            commentArray: objArr
        })
    },
    // type
    getComment: function(id) {
        console.log("getComment(id)", id)
        db.collection('luntan').where({
            type: 1,
            pid: id, // 文章id
        }).get({
            success: async res => {
                console.log("getComment", res);
                // 新逻辑, 结算 按照时间排序

                console.log("要往下面走了");
                // for (var i = 0; i < res.data.length; i++) {
                //     for (var j = 0; j < res.data[i].comment.length; j++) {
                //         var objtemp = {}
                //         objtemp.content = res.data[i].comment[j].content;
                //         objtemp.submitTime = res.data[i].comment[j].submitTime;
                //         objtemp.avatarUrl = res[i].avatarUrl;
                //         objtemp.nickName = res[i].nickName;
                //         objArr.push(objtemp)
                //     }
                // }

                await this.SortCommentByTime(res);
                // objArr.sort(this.compare('submitTime'));
                //console.log("objArr", objArr);

                // 走不到这里 ！
                this.setData({
                    comment: res.data
                })
            }
        })
    },
    // 添加浏览量
    addLiulian(id) {
        db.collection('luntan').where({
                pid: id,
                userId: wx.getStorageSync('user')._id,
                type: 4
            }).get({
                success: res => {
                    // 增加
                    if (!res.data.length) {
                        db.collection('luntan').add({
                            data: {
                                pid: id,
                                userId: wx.getStorageSync('user')._id,
                                type: 4
                            },
                            success: res => {
                                console.log('添加浏览量成功');
                            }
                        })
                    }
                }
            })
            // 查询全部浏览量
        db.collection('luntan').where({
            pid: id,
            type: 4
        }).get({
            success: res => {
                // 增加
                this.setData({
                    liulan: res.data.length
                })
            }
        })
    },
    // 检查我有没有点赞
    checkDianzan(id) {
        db.collection('luntan').where({
            pid: id, // 文章id
            userId: wx.getStorageSync('user')._id, // 那个用户
            type: 2, // 点赞
        }).get({
            success: res => {
                console.log("res信息", res)
                if (res.data.length) {
                    this.setData({
                        dianzan: res.data[0],
                        isDz: true
                    })
                }
            }
        })
    },
    // 检查我有没有收藏
    checkShoucang(id) {
        db.collection('luntan').where({
            pid: id, // 文章id
            userId: wx.getStorageSync('user')._id, // 那个用户
            type: 3, // 点赞
        }).get({
            success: res => {
                if (res.data.length) {
                    this.setData({
                        shoucang: res.data[0],
                        isSc: true
                    })
                }
            }
        })
    },
    // 评论  得到提交时间  不能是全局的 否则会有问题 ！ 所以要保存到obj.comment中的 4.5 修正
    fabiao(e) {
        var content = this.data.content;
        if (!content) {
            return wx.showToast({
                title: '请输入内容',
                icon: 'error'
            })
        }
        var that = this
        console.log("fabiao的content", content)
        db.collection('luntan').where({
                userId: wx.getStorageSync('user')._id,
                type: 1,
                pid: this.data.detail._id
            })
            .get()
            .then(res => {
                console.log("评论之后,进行数据库的查找，查看之前是否有评论过这篇文章res信息", res)
                    // 更新最新的一次评价信息 
                if (res.data.length > 0) {
                    // 更新一下 
                    console.log("fabiao的 res信息", res.data[0])
                        //var getObj = res.data[0]
                    var lastContent = res.data[0].comment; // 一个对象数组 
                    var curObj = {}
                    curObj.content = content
                    curObj.submitTime = util.timestampToTime(new Date())
                    if (!lastContent) { // 兼容之前的逻辑
                        lastContent = []
                    }
                    lastContent.push(curObj)
                        //getObj.comment = lastContent;
                        //console.log("getObj对象", getObj);

                    // debug
                    // console.log("lastContent之前的信息", lastContent)
                    //lastContent.push(content);
                    console.log("lastContent信息", lastContent)
                    db.collection('luntan').doc(res.data[0]._id)
                        .update({
                            data: {
                                comment: lastContent
                            }
                        })
                        .then(res => {
                            console.log("更新成功", res)
                            this.getComment(this.data.detail._id) // 再次刷新页面 
                            wx.showToast({
                                    title: '评论成功',
                                })
                                // 关闭评论框
                            this.setData({
                                commTan: false,
                                content: ''
                            })
                        })
                        .catch(res => {
                            console.log("更新失败", res)
                        })

                } else {
                    console.log("之前并没有任何评论")
                        // 先存入本地变量
                    var obj = {};
                    var commentobj = {};
                    commentobj.content = content;
                    // obj.content = content;
                    obj.nickName = wx.getStorageSync('user').nickName;
                    obj.avatarUrl = wx.getStorageSync('user').avatarUrl;
                    obj.pid = this.data.detail._id;
                    obj.type = 1;
                    obj.userId = wx.getStorageSync('user')._id
                    var d = util.timestampToTime(new Date())
                    obj.submitTime = d;
                    commentobj.submitTime = d;
                    obj.comment = []
                    obj.comment.push(commentobj)
                    var comment = this.data.comment;
                    comment.push(obj);
                    this.setData({
                            comment
                        })
                        // 再存入数据库
                    db.collection('luntan').add({
                        data: obj,
                        success: res => {
                            wx.showToast({
                                    title: '评论成功',
                                })
                                // 关闭评论框
                            this.setData({
                                commTan: false,
                                content: ''
                            })
                        }
                    })
                }
            })
    },

    getContent(e) {
        var content = e.detail.value;
        this.setData({
            content
        })
    },
    // 点赞按钮
    clickDz() {
        console.log("刚刚进入点赞界面", this.data.isDz)
        var detail = this.data.detail;
        // false 表示正在点赞
        console.log("进入点赞 detail.id是什么", this.data.detail) // detail_id就是文章的id

        if (!this.data.isDz) {
            // 手机振动 400ms
            wx.vibrateLong();
            this.setData({
                    isShowLetter: true
                })
                // 添加点赞数据进入点赞表
            db.collection('luntan').add({
                data: {
                    pid: detail._id, // 这条动态的 数据的文章id
                    type: 2, // 这条点赞的数据 
                    userId: wx.getStorageSync('user')._id
                },
                success: res => {
                    var obj = {};
                    obj.pid = detail._id;
                    obj.userId = wx.getStorageSync('user')._id;
                    obj.type = 2;
                    obj._id = res._id; // 点赞的id 
                    // 存入本地变量
                    this.setData({
                        isDz: true,
                        dianzan: obj,
                        dz: ++this.data.dz
                    })
                    setTimeout(() => {
                        this.setData({
                            isShowLetter: false
                        })
                    }, 500);
                    console.log("点赞成功 obj对象", obj)
                }
            })
        } else {
            // 取消点赞
            // 删除该用户点赞的那条数据
            console.log("该用户已经点赞过了", this.data.dianzan._id)
            db.collection('luntan').doc(this.data.dianzan._id).remove({
                success: res => {
                    // 存入本地变量
                    this.setData({
                        isDz: false,
                        dianzan: null,
                        dz: --this.data.dz
                    })
                }
            })
        }
    },

    // 收藏按钮
    clickSc() {
        var detail = this.data.detail;
        if (this.data.isSc) {
            db.collection('luntan').doc(this.data.shoucang._id).remove({
                success: res => {
                    wx.showToast({
                        title: '已取消',
                    })
                    this.setData({
                        shoucang: null,
                        isSc: false,
                        sc: --this.data.sc
                    })
                }
            })
        } else {
            db.collection('luntan').add({
                data: {
                    type: 3,
                    userId: wx.getStorageSync('user')._id,
                    pid: detail._id
                },
                success: res => {
                    var obj = {};
                    obj._id = res._id;
                    obj.pid = detail._id;
                    obj.userId = wx.getStorageSync('user')._id;
                    obj.type = 3;
                    this.setData({
                        shoucang: obj,
                        isSc: true,
                        sc: ++this.data.sc
                    })
                    wx.showToast({
                        title: '已收藏',
                    })
                }
            })
        }

    },

    // 废弃 ！
    openPL(e) {
        this.setData({
            commTan: !this.data.commTan
        })
    },

    onReady: function() {

    },
    onShow: function() {

    },
    onHide: function() {

    },
    onUnload: function() {

    },
    onPullDownRefresh: function() {

    },
    onReachBottom: function() {

    },
    onShareAppMessage: function() {

    }
})