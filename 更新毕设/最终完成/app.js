// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    wx.cloud.init({
      env:'cloud1-3gv2wkcsd018f504'
    })
     
    // 获取openid
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        // console.log(res);
        var openid = res.result.event.userInfo.openId;
        wx.setStorageSync('openid', openid);
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
