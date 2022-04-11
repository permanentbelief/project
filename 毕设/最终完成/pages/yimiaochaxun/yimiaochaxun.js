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
  onLoad: function (options) {
    // 查询个人的接种疫苗
    db.collection('order').where({
      type: 2,
      userId: wx.getStorageSync('user')._id,
      status: 4
    }).get({
      success: res => {
        this.setData({
          order: res.data
        })
      }
    })
  },

  // 查询
  chaxun() {
    if (!this.data.realName) {
      return wx.showToast({
        title: '姓名不能为空',
        icon: 'none'
      })
    }
    if (!this.data.idCard) {
      return wx.showToast({
        title: '身份证不能为空',
        icon: 'none'
      })
    }
    // 查询个人的接种疫苗
    db.collection('order').where({
      type: 2,
      userId: wx.getStorageSync('user')._id,
      status: 4,
      realName: this.data.realName,
      idCard: this.data.idCard
    }).get({
      success: res => {
        this.setData({
          order: res.data
        })
        wx.showToast({
          title: '查询成功',
        })
      }
    })
  },

  // 获取输入的值
  getValue(e) {
    var name = e.currentTarget.dataset.name;
    var obj = {};
    obj[name] = e.detail.value;
    this.setData(obj);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})