const db = wx.cloud.database();
Page({
    data: {

        groups: ""
    },
    // 跳转到详情
    skipDetail(e) {
        console.log(e)
        var id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/yimiaoSubmit/yimiaoSubmit?id=' + id,
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log("进入疫苗预约,options", options)
            // 分组查询机构的疫苗
        this.getData();
    },
    async getData() {
        var $ = db.command.aggregate;
        var list = await db.collection('yimiao')
            .aggregate()
            .group({
                //不指定id字段是为了下面分组查找
                _id: null,
                //categories是设置的字段，addToSet是添加字段，$name是获取数据库中的name字段数据
                categories: $.addToSet('$groupId')
            }).end()
        console.log("获取数据", list)
        var groups = list.list[0].categories;
        console.log("获取gorups中的数据", groups)

        var tmpGroups = [];
        for (var i = 0; i < groups.length; i++) {
            var id = await this.isValid(groups[i])
            console.log("获取id", id)
            if (id != "false") {
                // console.log("id是", id)
                tmpGroups.push(id)
            }
        }
        console.log("tmpGroups", tmpGroups)
        var g = [];
        for (let i = 0; i < tmpGroups.length; i++) {
            var group = await this.getGroup(tmpGroups[i]);
            g.push(group);
        }
        this.setData({
            groups: g
        })
    },
    isValid(groupId) {
        console.log("isValid", groupId)
        return new Promise((reslove, err) => {
            db.collection('group').where({
                _id: groupId
            }).get({
                success: res => {
                    if (res.data.length > 0) {
                        // console.log("res.data.length > 0", res)
                        reslove(groupId);
                    } else {
                        reslove("false");
                    }
                }
            });
        })
    },
    // 获取机构
    getGroup(id) {
        console.log("getGroup", id)
        return new Promise((reslove, err) => {
            db.collection('group').doc(id).get({
                success: res => {
                    var group = res.data;
                    // 查询剂次
                    db.collection('yimiao').where({
                        groupId: id
                    }).get({
                        success: res => {
                            group.childs = res.data
                            console.log("成功", res);
                            reslove(group);
                        }
                    })
                }
            })
        })
    },
    onReady: function() {},
    onShow: function() {},
    onHide: function() {},
    onUnload: function() {},
    onPullDownRefresh: function() {},
    onReachBottom: function() {},
    onShareAppMessage: function() {}
})