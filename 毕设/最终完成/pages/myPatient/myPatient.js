const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [], // 就诊人列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var type = options.type;
    console.log(type);
    if (type) {
      this.setData({
        type
      })
    }
  },

  // 删除
  delete(e) {
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提醒',
      content: '是否要删除该就诊人',
      success: res => {
        if (res.confirm) {
          db.collection('patient').doc(id).remove({
            success: res => {
              wx.showToast({
                title: '删除成功',
              })
              // 刷新
              this.getPatient();
            }
          })
        }
      }
    })
  },

  // 修改
  edit(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/addPatient/addPatient?id=' + id,
    })
  },

  getPatient() {
    db.collection('patient').where({
      userId: wx.getStorageSync('user')._id
    }).get({
      success: res => {
        this.setData({
          list: res.data
        })
      }
    })
  },

  // 跳转到绑定就诊人页面
  bindPatient() {
    wx.navigateTo({
      url: '/pages/addPatient/addPatient',
    })
  },

  // 选择数据
  choose(e) {
    var index = e.currentTarget.dataset.index;
    var list = this.data.list;
    var item = list[index];
    // 返回上个页面
    wx.navigateBack({
      delta: 1,
      success: res => {
        const eventChannel = this.getOpenerEventChannel()
        eventChannel.emit('getBack', item);
      }
    })
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
    // 查询我的就诊人
    this.getPatient();
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