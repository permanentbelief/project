const db = wx.cloud.database();
var WxParse = require('../../wxParse/wxParse.js');
const util = require('../../utils/util.js');
Page({
    data: {
        scimgUrl: "../../images/articles/shoucang-yes.png",
        dzimgUrl: "../../images/articles/dianzan_test.png",
        nonescimgUrl: "../../images/articles/shoucang-no.png",
        nonedzimgUrl: "../../images/articles/dianzan-no.png",
        last_update: {},
        isShowLetter: false,
        isDz: false,
        isSc: false,
        dz_id: "",
        sc_id: "",
        comment: [],
        commentArray: [],
        count: 0, 
        sumDz: 0, 
        sumSc: 0, 
        curpid:"",
    },
    onLoad: function(options) {
        console.log("options的信息有", options)
        var messageId = options.message;
      
        var that = this;
        db.collection('article').doc(messageId).get({
            success: res => {
                console.log("wxParse解析 html, res信息有", res)
                WxParse.wxParse('article', 'html', res.data.content,that);
                var time = util.timestampToTime(res.data._updateTime, 2)
                console.log("time", res.data)
                this.setData({
                    last_update: time,
                    curpid: res.data._id
                })
              
            }
        })
                //结算标记的状态，根据是否已经点赞或者收藏，显示点赞或者收藏的状态
        // this.setData({
        //     imgUrl: isSc ? "../../images/article/shoucang-yes.png" : "../../images/article/shoucang-no.png",
        //     dianzanimgUrl: isDz ? "../../images/article/dianzan-yes.png" : "../..//article/dianzan-no.imagespng",
        // });
        this.listComment(messageId);
        this.checkDZ(messageId);
        this.checkSc(messageId);


        this.countDZ(messageId);
        this.countSc(messageId);
    },
    countSc(messageId) {
        db.collection('articles').where({
            pid: messageId, 
            type: 3, 
        }).get({
            success: res => {
                console.log(res);
                this.setData({
                    sumSc: res.data.length
                })
            }
        })
    },
    countDZ(messageId) {
        db.collection('articles').where({
            pid: messageId, 
            type: 2, 
        }).get({
            success: res => {
                console.log("countDZ", res)
                this.setData({
                    sumDz: res.data.length
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

            return temp1 - temp2;
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
    listComment(messageId) {
        console.log("listComment(id)", messageId)
        db.collection('articles').where({
            type: 1,
            pid: messageId, 
        }).get({
            success: async res => {
                console.log("listComment", res);
                //  结算 按照时间排序

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

    addCount(messageId) {
        db.collection('articles').where({
            pid: messageId,
            userId: wx.getStorageSync('user')._id,
            type: 4
        }).get({
            success: res => {
                if (!res.data.length) {
                    db.collection('articles').add({
                        data: {
                            pid: messageId,
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
        db.collection('articles').where({
            pid: messageId,
            type: 4
        }).get({
            success: res => {
                this.setData({
                    count: res.data.length
                })
            }
        })
    },
    checkDZ(messageId) {
        db.collection('articles').where({
            pid: messageId, 
            userId: wx.getStorageSync('user')._id, 
            type: 2, 
        }).get({
            success: res => {
                console.log("点赞res", res)
                if (res.data.length) {
                    this.setData({
                        isDz: true,
                        dz_id:res.data[0]._id
                    })
                }
            }
        })
    },
    checkSc(messageId) {
        db.collection('articles').where({
            pid: messageId, 
            userId: wx.getStorageSync('user')._id,
            type: 3, 
        }).get({
            success: res => {
                if (res.data.length) {
                    this.setData({
                        sc_id: res.data[0]._id,
                        isSc: true
                    })
                }
            }
        })
    },
    // 评论  得到提交时间  不能是全局的 否则会有问题 ！ 所以要保存到obj.comment中的 4.5 修正
    Submit(e) {
        var content = this.data.content;
        if (!content) {
            return wx.showToast({
                title: '输入内容不能为空',
                icon: 'none'
            })
        }
        var that = this
        console.log("fabiao的content", content)
        db.collection('articles').where({
                userId: wx.getStorageSync('user')._id,
                type: 1,
                pid: this.data.curpid
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
                    db.collection('articles').doc(res.data[0]._id)
                        .update({
                            data: {
                                comment: lastContent
                            }
                        })
                        .then(res => {
                            console.log("更新成功", res)
                            this.listComment(this.data.curpid) 
                            wx.showToast({
                                    title: '评论成功',
                                    icon:'success'
                                })
                                // 关闭评论框
                            this.setData({
                                content: ''
                            })
                        })
                        .catch(res => {
                            console.log("更新失败", res)
                        })

                } else {
                    console.log("之前并没有任何评论")
                    var obj = {};
                    var commentobj = {};
                    commentobj.content = content;
                    obj.nickName = wx.getStorageSync('user').nickName;
                    obj.avatarUrl = wx.getStorageSync('user').avatarUrl;
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
                    db.collection('articles').add({
                        data: obj,
                        success: res => {
                            wx.showToast({
                                    title: '评论成功',
                                    icon: 'none'
                                })
                            this.setData({
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

    clickDz() {
        console.log("刚刚进入点赞界面", this.data.isDz)
       // detail_id就是文章的id

        if (!this.data.isDz) {
            // 手机振动 400ms
            wx.vibrateLong();
            this.setData({
                    isShowLetter: true
                })
            db.collection('articles').add({
                data: {
                    pid: this.data.curpid, 
                    type: 2, 
                    userId: wx.getStorageSync('user')._id
                },
                success: res => {
                    console.log("点赞成功", res._id)
                    this.setData({
                        isDz: true,
                        sumDz: ++this.data.sumDz,
                        dz_id:res._id
                    })
                    setTimeout(() => {
                        this.setData({
                            isShowLetter: false
                        })
                    }, 500);
                    console.log("我的拉阿拉 点赞成功")
                }
            })
        } else {
            console.log("该用户已经点赞过了", this.data.dz_id)
            db.collection('articles').doc(this.data.dz_id).remove({
                success: res => {
                    this.setData({
                        isDz: false,
                        sumDz: --this.data.sumDz,
                        dz_id: "",
                    })
                }
            })
        }
    },
    clickSc() {
        if (this.data.isSc) {
            db.collection('articles').doc(this.data.sc_id).remove({
                success: res => {
                    this.setData({
                        sc_id: "",
                        isSc: false,
                        sumSc: --this.data.sumSc
                    })
                }
            })
        } else {
            db.collection('articles').add({
                data: {
                    type: 3,
                    userId: wx.getStorageSync('user')._id,
                    pid: this.data.curpid
                },
                success: res => {
                    this.setData({
                        sc_id: res._id,
                        isSc: true,
                        sumSc: ++this.data.sumSc
                    })
                }
            })
        }
    },
})