const db = wx.cloud.database();
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    num: 1,
    list:[]
  },

  // 跳转到新闻详情
  skipNewDetail(e) {
    wx.navigateTo({
      url: '/pages/newDetail/newDetail?id=' + e.currentTarget.dataset.id,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    console.log("到达论坛")
    var list = await this.getNews(1, this.data.list);
    this.setData({
      list
    })
  },

  // 获取数据
  getNews(num, list) {
    return new Promise((reslove, err) => {
      db.collection('news').skip((num - 1) * 20).limit(20).get({
        success: res => {
          if (res.data.length) {
            this.setData({
              num: ++num
            })
            for (let i = 0; i < res.data.length; i++) {
              res.data[i].createTime = util.formatTime(new Date(res.data[i]._createTime));
            }
            list = list.concat(res.data);
            reslove(list);
            // this.getNews(++num, list).then(res => reslove(res));
          }
        }
      })
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
  onReachBottom: async function () {
    var list = await this.getNews(this.data.num, this.data.list);
    this.setData({
      list
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})