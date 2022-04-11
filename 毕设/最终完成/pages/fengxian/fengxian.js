const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
    data: {
        kinds: 0, // 0是 api拿数据  1是后台拿数据
        ress: [],
        result: "",
        beifenresult: "",
        highgroups: [],
        midgroups: [],
        highlist: [],
        midlist: [],
        groups3: [],
        apigroups: [],
        lessthan: false,
        province: "",
        cityz: "",
        street: "",
        getG: false,
        getZ: false,
        gethighlist: [],
        getmidlist: [],
    },
    onLoad() {
        this.getTableData();

        // 坑的地方 
        // wx.request是异步的 
        // if(this.data.kinds === 1){
        //   console.log("已经从老数据库中获取到了")
        //   return
        // }
        // console.log("退出啦这里", this.data.kinds)


    },
    getTableData: function() { //自定义函数名称
        var that = this;
        if (wx.getStorageSync('highlist') && wx.getStorageSync('midlist') &&
            wx.getStorageSync('resultData')) {
            var lastUpdate = wx.getStorageSync("resultData").updated_date;
            var date = new Date(lastUpdate);
            var lastUpdateTime = Date.parse(lastUpdate);
            var curTime = Date.parse(new Date());
            var timeDiff = curTime - lastUpdateTime;
            timeDiff /= 1000;
            var hour = Math.floor(timeDiff / 3600);
            console.log("距离上一次数据拉取的时间", hour);
            if (hour < 24) {
                this.setData({
                    result: wx.getStorageSync('resultData'),
                    lessthan: true
                })
                this.getData(4);
                this.getData(5);
                return;
            }
            // console.log("之前已经请求过了，这一次api不需要在进行请求了")

        }
        wx.request({
            //请求接口的地址
            url: 'https://apis.juhe.cn/springTravel/risk?key=4182e22b1444b49cd36f81c2371af736',
            data: {},
            header: {
                "Content-Type": "applciation/json" //默认值
            },
            success: function(res) {
                // console.log("函数调用成功", res)
                if (res.data.error_code == "10012") {
                    console.log("请求的量级已经达到这一天的最高上限")
                    that.setData({
                        kinds: 1
                    });
                    //直接向db中查询

                    // 查询高风险地区
                    that.getData(1);
                    // 查询中风险地区
                    that.getData(2);
                    // 查询低风险地区
                    that.getData(3);
                    // console.log("我这里面的数据", that.data.kinds)
                    return
                } else {
                    console.log("else逻辑, 重新set数据");
                    //留存数据res,看高风险地区 或者 低风险地区
                    that.setData({
                        result: res.data.result
                    });
                    // 缓存一份调用api拿到的 高风险地区 和 中风险地区 列表数据 
                    wx.setStorageSync('resultData', res.data.result)
                    wx.setStorageSync('highlist', res.data.result.high_list)
                    wx.setStorageSync('midlist', res.data.result.middle_list)
                    that.Update(4)
                    that.Update(5)
                    that.getData(4)
                    that.getData(5)

                }
            },
            fail: function(err) {
                console.log("请求调用失败", err)
            },
        })
    },

    Update(type) {
        db.collection('fengxian').where({
                type: type
            }).remove()
            // 从缓存中取出数据
        var that = this
        var list = []
        if (type == 4) {
            list = wx.getStorageSync('highlist')
            that.setData({
                hightlist: list
            })
        } else if (type == 5) {
            list = wx.getStorageSync('midlist')
            that.setData({
                midlist: list
            })
        }
        for (var i = 0; i < list.length; i++) {
            db.collection('fengxian').add({
                data: {
                    type: type,
                    province: list[i].province,
                    address: list[i].communitys,
                    cityz: list[i].city,
                    county_code: list[i].county_code,
                }
            })
        }
        console.log("缓存中没有数据，即重新调用api获取并写入db和缓存")
    },


    //老方法 向云数据库中获取
    async getData(type) {
        //先从缓存中取数据 
        var that = this
        if (type == 4 || type == 5) {
            console.log("type==4 || type == 5", that.data.lessthan)
            if (that.data.lessthan) {
                // console.log("走进 lessthan了已经")
                if (type == 4 && wx.getStorageSync('apigroup4')) {
                    console.log("type == 4 && wx.getStorageSync('apigroup4')")
                    that.setData({
                        kinds: 0,
                        apigroup4: wx.getStorageSync('apigroup4')
                    })
                    return;
                }
                if (type == 5 && wx.getStorageSync('apigroup5')) {
                    console.log("type == 5 && wx.getStorageSync('apigroup5')")
                    that.setData({
                        kinds: 0,
                        apigroup5: wx.getStorageSync('apigroup5')
                    })
                    return;
                }
            }
        }

        // 先分组
        var $ = db.command.aggregate;
        var list = await db.collection('fengxian')
            .aggregate()
            .match({
                type
            })
            .group({
                //不指定id字段是为了下面分组查找
                _id: null,
                //categories是设置的字段，addToSet是添加字段，$name是获取数据库中的name字段数据
                categories: $.addToSet('$province')
            })
            .sort({
                _createTime: -1
            })
            .end()
            // console.log("最终得到的list", list);
        var groups = list.list[0].categories;

        console.log("此时的type,groups数据", type, groups)
        for (let i = 0; i < groups.length; i++) {
            groups[i] = {
                name: groups[i]
            };
            var list = await this.getFengxian(groups[i].name);
            // console.log("分别查找数据", list)
            groups[i].list = list;
        }
        if (type == 4 || type == 5) {
            if (type == 4) {
                that.setData({
                    kinds: 0,
                    apigroup4: groups
                })
                wx.setStorageSync('apigroup4', groups)
            }
            if (type == 5) {
                that.setData({
                    kinds: 0,
                    apigroup5: groups
                })
                wx.setStorageSync('apigroup5', groups)
            }
            return
        }


        var num = 0;

        for (let i = 0; i < groups.length; i++) {
            groups[i] = {
                name: groups[i]
            };
            // 分别查找数据
            var list = await this.getFengxian(groups[i].name);
            console.log("分别查找数据", list)
            num = num + list.length;
            groups[i].list = list;
        }
        for (let i = 0; i < groups.length; i++) {
            groups[i]._createTime = util.formatTime(new Date())
        }
        var save = {};
        if (type == 1) {
            save.num1 = num;
            save.groups1 = groups;
        } else if (type == 2) {
            save.num2 = num;
            save.groups2 = groups;
        } else {
            save.num3 = num;
            save.groups3 = groups;
        }
        this.setData(save)
    },

    getFengxian(name) {
        return new Promise((reslove, err) => {
            db.collection('fengxian').where({
                province: name
            }).get({
                success: res => {
                    reslove(res.data);
                }
            })
        })
    },
    getProvince(e) {
        this.setData({
            province: e.detail.value
        })
    },
    getCityz(e) {
        this.setData({
            cityz: e.detail.value
        })
    },
    getStreet(e) {
        this.setData({
            street: e.detail.value
        })
    },

    // 异步改为同步 要不js 线程 是异步的
    async Click(e) {
        var that = this
        if (!this.data.province || !this.data.cityz) {
            return wx.showToast({
                title: '请填写完整的省和市',
                duration: 2000,
                mask: true, //是否显示透明蒙层，防止触摸穿透，默认：false  
                icon: 'none', //图标，支持"success"、"loading"  
            })
        }
        //var res = ""
        await db.collection('fengxian').where({
                address: db.RegExp({
                    regexp: this.data.street,
                    options: 'i'
                }),
                province: this.data.province,
                cityz: this.data.cityz
            }).get()
            .then(res => {
                if (res.data.length > 0) {
                    // console.log("高风险", res);
                    // 高风险
                    that.setData({
                        getG: true,
                        gethighlist: res.data
                    })
                }

            })

        await db.collection('fengxian').where({
                address: db.RegExp({
                    regexp: this.data.street,
                    options: 'i'
                }),
                province: this.data.province,
                cityz: this.data.cityz,
                type: 5

            }).get()
            .then(res => {
                if (res.data.length > 0) {
                    // console.log("中风险", res);
                    that.setData({
                        getZ: true,
                        getmidlist: res.data
                    })
                }

            });
        // console.log("getG", this.data.getG)
        // console.log("getZ", this.data.getZ)
        if (!this.data.getG && !this.data.getZ) {
            wx.showToast({
                title: '未查到有风险等级',
                duration: 2000,
                mask: true, //是否显示透明蒙层，防止触摸穿透，默认：false  
                icon: 'none', //图标，支持"success"、"loading"  
            })
        }
    }
})