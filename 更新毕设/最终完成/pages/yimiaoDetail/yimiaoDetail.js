const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        nav: 0, // 下面的导航栏
        tip: false
    },

    // 选择导航栏
    chooseNav(e) {
        var index = e.currentTarget.dataset.index;
        this.setData({
            nav: index
        })
    },

    // 跳转到详情
    skipDetail(e) {
        var id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/hesuanjiance/hesuanjiance?id=' + id + '&phone=' + this.data.phone + '&address=' + this.data.address,
        })
    },

    // 获取输入的地址
    getAddress(e) {
        this.setData({
            address: e.detail.value
        })
    },

    // 获取机构
    getGroups(id) {
        return new Promise((reslove, err) => {
            db.collection('group').doc(id).get({
                success: res => {
                    reslove(res.data);
                }
            })
        })
    },

    // 显示弹框
    showTip(e) {
        this.setData({
            tip: !this.data.tip
        })
    },

    // 跳转回首页
    skipIndex() {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },

    // 选择地址
    chooseAddress(e) {
        wx.chooseAddress({
            success: (result) => {
                console.log(result);
                this.setData({
                    address: result.provinceName + result.cityName + result.countyName + result.detailInfo,
                    phone: result.telNumber
                })
            },
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var id = options.id;
        // 查询团体预约的数据
        db.collection('tuanti').doc(id).get({
            success: async res => {
                var list = res.data;
                var group = await this.getGroups(list.groupId);
                list.group = group;
                this.setData({
                    detail: list
                })
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