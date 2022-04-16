const db = wx.cloud.database();
Page({
    /**
     * 页面的初始数据
     */
    data: {},
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        // 查询团体预约的数据
        db.collection('tuanti').get({
            success: async res => {
                var list = res.data;
                console.log(list);
                for (let i = 0; i < list.length; i++) {
                    var group = await this.getGroups(list[i].groupId);
                    list[i].group = group;
                }
                this.setData({
                    list
                });
                console.log("返回的list数据", this.data.list);
            }
        })
    },
    // 跳转到详情
    skipDetail(e) {
        var id = e.currentTarget.dataset.id;
        console.log("跳转到详情页的id", id)
        console.log("Skipgroupid", )
        wx.navigateTo({
            url: '/pages/yimiaoDetail/yimiaoDetail?id=' + id,
        })
    },

    // 获取机构
    getGroups(id) {

        return new Promise((reslove, err) => {
            db.collection('group').doc(id).get({
                success: res => {
                    console.log("获取的机构", res)
                    reslove(res.data);
                }
            })
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