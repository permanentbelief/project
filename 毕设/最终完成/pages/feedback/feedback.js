Page({
    UpLoadImgs: [], // 外网图片的路径数组
    data: {
        tabs: [{
                id: 0,
                value: "体验问题",
                isActive: true
            },
            {
                id: 1,
                value: "服务投诉",
                isActive: false
            }
        ],
        // 被选中的图片路径数组 
        chooseImgs: [],
        // 文本域内容 
        textVal: "",
        //选中的text标签
        textArray: [],
        totalresult: [],
        //当前选中的
        index: [],
        index1: "1", //  功能
        index2: "1", //  使用
        index3: "1", //  性能
        index4: "1", //  建议
        //rate评分组件
        star: 0, //几颗星
        status: '请评价',
        textValTS: "",
        others: [],
        uses: [],
        able: [],
        capa: []
    },
    onLoad: function(options) {
        console.log("开始了")

    },
    changeColor(e) {
        console.log("选中开始了", e)
        console.log("选中的index数值", e.currentTarget.dataset["index1"])

        var source = e.currentTarget.dataset["source"]
        var str = "index" + source
        var status = e.currentTarget.dataset["index" + source]
        console.log("status", status)
        console.log("应该更新为的status", status)
        if (source === "1") {
            this.setData({
                index1: status,
            })
        } else if (source === "2") {
            this.setData({
                index2: status,
            })
        } else if (source === "3") {
            this.setData({
                index3: status,
            })
        } else {
            console.log("此时选中了4", status)
            this.setData({
                index4: status
            })
        }

    },
    // Tabs    标题点击事件，从子组件传递过来的
    handleTabsItemChange(e) {
        //1. 获取被点击的标题索引
        console.log("获取点击事件的索引", e);
        const { index } = e.detail;
        console.log("获取的 index", index);
        //2. 修改原数组
        let { tabs } = this.data;
        tabs.forEach((v, i) => i === index ? v.isActive = true : v.isActive = false);
        //3. 赋值到数组中
        this.setData({
            tabs
        });
        // console.log("获取的tabs ", tabs);
    },
    /*
     1. 点击"+" 触发tap点击事件  
        1. 调用小程序内置api 选择图片的api
        2. 获取图片的路径 数组
        3. 把图片路径存放在data变量中
        4. 页面就可以根据 图片数组 进行循环显示 自定义组件
    */
    handleChooseImage() {
        console.log("开始添加图片了")
        let that = this;
        wx.chooseImage({
            count: 9,
            // 图片的格式  原图 压缩
            sizeType: ['original', 'compressed'],
            // 图片的来源 照相机 相册
            sourceType: ['album', 'camera'],
            success: (result) => {
                // console.log(result);
                console.log("选取的图片列表", result.tempFilePaths)
                this.setData({
                    // 图片数组进行拼接 
                    chooseImgs: [...this.data.chooseImgs, ...result.tempFilePaths],
                    // totalresult: [...this.totalresult, ...result] 不能拼接

                })
            }
        });
        console.log("qwq选取的图片列表", this.chooseImgs)

    },
    /* 2.删除图片信息 
     */
    handleRemoveImg(e) {
        //获取被点击组件的索引
        console.log("开始删除图片", e)
        const { index } = e.currentTarget.dataset;
        console.log("开始删除图片1", index);
        // 后去data中的 图片数组
        let { chooseImgs } = this.data;
        // 删除元素
        chooseImgs.splice(index, 1);
        this.setData({
            chooseImgs
        })
    },
    /*
        点击"提交"
        1. 获取文本域的内容哦那给
            1. data中定义变量 表示输入框的内容
            2. 文本域绑定 输入事件，事件出发的时候，把输入框的值存入到变量中
            3. 拿一下变量
        2. 对于这些内容 合法性验证
        3. 验证通过 用户选择的图片 上传到云服务器上， 返回外网的的连接
           1. 遍历图片数组
           2. 挨个上传
           3. 自己再维护图片数组，上传到专门的服务器 返回图片的外网链接
        4. 文本域 和 外网的图片路径 一起提交到服务器  前端的模拟
        5. 清空当前页面
        6. 返回上一个页面
    */
    handleTextInput(e) {
        this.setData({
            textVal: e.detail.value
        })

    },
    //handleFormSubmit 提交按钮的点击事件
    handleFormSubmit() {
        //1. 获取文本域内容
        const { textVal, chooseImgs } = this.data;
        console.log("提交事件", this.data)
            // 2. 内容合法性的验证  
        if (!textVal.trim()) {
            wx.showToast({
                title: '输入不能为空',
                icon: 'none',
                mask: true
            });
            return
        }
        this.UpLoadImgs = chooseImgs

        wx.showLoading({ //显示加载提示框 不会自动关闭 只能wx.hideLoading关闭
            title: "图片上传中", //提示框显示的提示信息
            mask: true, //显示透明蒙层，防止触摸。为true提示的时候不可以对屏幕进行操作，不写或为false时可以操作屏幕
        });
        // 判断有没有需要上传的图片数组
        if (chooseImgs.length == 0) {
            wx.hideLoading()
            console.log("只是提交了文本");
            this.setData({
                textVal: ""
            });
            wx.showToast({
                title: '文本内容提交成功',
                icon: 'none',
                mask: true
            });

            return;
            // 此时不需要返回 上一页。
            // wx.navigateBack({
            //     delta: 1,
            // })
        }
        // 3. 上传到专门的服务器
        // 上传文件的api 不支持多个文件同时上传 => 遍历数组进行上传
        // 使用 云函数开发 上传到远方 服务器 
        this.UpLoadImgs.forEach((v, i) => {
            console.log("进入循环 v是", v)
            console.log("进入循环 i是", i)
            wx.cloud.uploadFile({
                cloudPath: 'img/feedback/' + new Date().getTime() + "-" + Math.floor(Math.random() * 1000),
                name: 'feedback_file',
                filePath: v,
                formData: {}, // 额外顺带的信息
                success: (result) => {
                    console.log("获得答案", i, result);

                },
                fail: (result) => {
                    console.log("失败的原因", result)
                }
            })
            if (i == this.UpLoadImgs.length - 1) {
                wx.hideLoading()
                console.log("将所有的文本内容和外网的图片数组 提交到后台")
                    // 所有的提交都成功了 重置页面并且返回上一个页面 
                    //上传到云服务器
                    // this.setData({
                    //     textVal: "",
                    //     chooseImgs:[]
                    // })
                    // wx.navigateBack({
                    //   delta: 1,
                    // })
            }
        })
        this.handleforSQL();
        this.setData({
            ttshow: true
        });
        wx.navigateBack({
            delta: 1,
        })
    },
    onChange(event) {
        this.setData({
            star: event.detail,
        });
        let status = '';
        switch (this.data.star) {
            case 1:
                status = '很差';
                break;
            case 2:
                status = '比较差';
                break;
            case 3:
                status = '一般';
                break;
            case 4:
                status = '比较满意';
                break;
            case 5:
                status = '很满意';
                break;
            case 0.5:
                status = '很差啊啊啊';
                break;
            case 1.5:
                status = '比较差啊啊啊';
                break;
            case 2.5:
                status = '一般啊啊啊';
                break;
            case 3.5:
                status = '比较满意啊啊啊';
                break;
            case 4.5:
                status = '很满意啊啊啊';
                break;
            case 6:
                status = '超级满意';
                break;
        }
        this.setData({
            status: status
        })
    },
    handleTextInputTS(e) {
        this.setData({
            textValTS: e.detail.value
        })

    },
    handleforSQL() {
        var newothers = [],
            newuses = [],
            newables = [],
            newcapas = []
        if (this.data.index1 == 0) {
            this.setData({
                ables: this.data.chooseImgs
            })
        }
        if (this.data.index2 == 0) {
            this.setData({
                uses: this.data.chooseImgs
            })
        }
        if (this.data.index3 == 0) {
            this.setData({
                capas: this.data.chooseImgs
            })
        }
        if (this.data.index4 == 0) {
            this.setData({
                others: this.data.chooseImgs
            })
        }
        var that = this
        var open_id = wx.getStorageSync('openid');
        // console.log("取出来的open_id 为", open_id)
        // wx.cloud.database().collection("feedbackTY")
        //     .where({
        //         open_id: open_id,
        //     })
        //     .get()
        //     .then(res => {
        //         console.log("feedbackTY查找到open_id", res);
        // 更新最新的一次评价信息 
        // if (res.data.length > 0) {
        //     // 更新一下 
        //     var id = res.data[0]._id
        //     newcapas = res.data[0].capas.push(that.data.capas)
        //     newuses = res.data[0].uses.push(that.data.usess)
        //     newables = res.data[0].ables.push(that.data.ables)
        //     newothers = res.data[0].others.push(that.data.others)
        //     console.log(newcapas)
        //     console.log(newuses)
        //     console.log(newables)
        //     console.log(newothers)
        //     wx.cloud.database().collection("feedbackTY")
        //     wx.cloud.callFunction({
        //         name: 'feedbackUpdate',
        //         data: {
        //             type: 1,
        //             desc: that.data.textVal,
        //             open_id: open_id,
        //             id: id,
        //             capas: newcapas,
        //             uses: newuses,
        //             ables: newables,
        //             others: newothers
        //         },
        //         success: res => {
        //             console.log("handleFormSubmitTY 云函数更新成功", res)
        //         },
        //         fail: res => {
        //             console.log("handleFormSubmitTY 云函数更新失败", res)
        //         }
        //     })
        //} 
        //else {
        //插入一下 
        //console.log("走到else 插入分支")
        // console.log(that.data.textVal)
        wx.cloud.callFunction({
                name: 'feedbackAdd',
                data: {
                    type: 1,
                    capas: that.data.capas,
                    uses: that.data.uses,
                    ables: that.data.ables,
                    others: that.data.others,
                    desc: that.data.textVal,
                    open_id: open_id
                },
                success: res => {
                    console.log("handleFormSubmitTY 云函数插入成功", res)
                    console.log("that.data.others", that.data.chooseImgs)
                },
                fail: res => {
                    console.log("handleFormSubmitTY 云函数插入失败", res)
                }
            })
            // }

        // .catch(res => {
        //     console.log("[handleFormSubmitTS] 查询失败table feedbackTS 失败", res)
        // })
    },
    handleFormSubmitTS(e) {
        // console.log("status",this.data.status)
        // console.log("textValTS",this.data.textValTS)
        // console.log("进入handleFormSubmitTS")
        var open_id = wx.getStorageSync('openid')
        console.log("获取open_id的值为", open_id)
        var that = this
        if (!open_id) {
            console.log("handleFormSubmitTS 没有从缓存中获取到openid")
            return
        }
        wx.cloud.database().collection("feedbackTS")
            .where({
                open_id: open_id,
            })
            .get()
            .then(res => {
                console.log("原生的查询函数", res)
                    // 更新最新的一次评价信息 
                if (res.data.length > 0) {
                    // 更新一下 
                    var id = res.data[0]._id
                    console.log("detaildesc", that.data.status)
                    console.log("id", id)
                    console.log("desc", that.data.textValTS)
                    wx.cloud.callFunction({
                        name: 'feedbackUpdate',
                        data: {
                            type: 2,
                            detaildesc: that.data.status,
                            desc: that.data.textValTS,
                            open_id: open_id,
                            id: id
                        },
                        success: res => {
                            console.log("handleFormSubmitTS调用云函数更新成功", res)
                            this.setData({
                                textValTS: "",
                                status: "请评价",
                                star: 0, //几颗星 
                            })
                            wx.navigateBack({
                                delta: 1,
                            })

                        },
                        fail: res => {
                            console.log("handleFormSubmitTS调用云函数更新失败原因", res)
                        }
                    })
                } else {
                    //插入一下 
                    console.log("走到else 插入分支")
                    wx.cloud.callFunction({
                        name: 'feedbackAdd',
                        data: {
                            type: 2,
                            detaildesc: that.data.status,
                            desc: that.data.textValTS,
                            open_id: open_id
                        },
                        success: res => {
                            console.log("handleFormSubmitTS调用云函数插入成功", res)
                            this.setData({
                                textValTS: "",
                                status: "请评价",
                                star: 0, //几颗星 
                            })
                            wx.navigateBack({
                                delta: 1,
                            })
                        },
                        fail: res => {
                            console.log("handleFormSubmitTS调用云函数失败插入失败原因", res)
                        }
                    })
                }
            })
            .catch(res => {
                console.log("[handleFormSubmitTS] 查询失败table feedbackTS 失败", res)
            })
    }
})