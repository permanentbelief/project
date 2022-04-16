const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

    },

    // 查询按钮
    chaxun() {
        var realName = this.data.realName;
        var idCard = this.data.idCard;
        if (!realName || !idCard) {
            return wx.showToast({
                title: '请填写完整',
                icon: 'error'
            })
        } else {
            // 查询已经完成的核酸订单
            db.collection('order').where({
                userId: wx.getStorageSync('userId')._id,
                type: 1, // 核酸
                realName,
                status: 4,
                idCard
            }).orderBy('createTime', 'desc').get({
                success: res => {
                    if (!res.data.length) {
                        return wx.showToast({
                            title: '未找到数据！',
                            icon: 'none'
                        })
                    } else {
                        wx.navigateTo({
                            url: '/pages/hesuanjieguo/hesuanjieguo?id=' + res.data[0]._id,
                        })
                    }
                }
            })
        }
    },
    // 获取输入的信息
    getValue(e) {
        var name = e.currentTarget.dataset.name;
        var obj = {};
        obj[name] = e.detail.value;
        this.setData(obj)
    },

    //  跳转到联系人
    skipConcat() {
        var that = this;
        //跳转到联系人，标记变量标记是跳转的页面
        wx.navigateTo({
            url: '/pages/myPatient/myPatient?type=2',
            events: {
                getBack: function(data) {
                    console.log('返回的数据', data)
                    that.setData({
                        realName: data.realName,
                        idCard: data.idCard
                    })
                }
            }
        })
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