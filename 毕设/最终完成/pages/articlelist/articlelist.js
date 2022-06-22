const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    article_list:[]
  },
  
  onLoad:  function () {

    // var obj = util.getStorageSyncTime("list", "false")
    // if(obj === "false"){
    //   this.setData({
    //     article_list: list
    //   })

    
    //   //放到缓存中4个小时 
      // util.setStorageSyncHour("qwq", "www", 4)
      if(util.getStorageSyncTime("list", "false") == "false"){
         console.log("缓存中没有")
         var list = this.getArticles(this.data.article_list);
        // 异步双保险
          this.setData({
            article_list: list
          })
      }else{
        var obj = util.getStorageSyncTime("list", "false") 
        this.setData({
           article_list: obj
        })
      }
  },

  getArticles(list) {
      db.collection('article').limit(20).get({
        success: res => {
          console.log("res信息", res)
            for (let i = 0; i < res.data.length; i++) {
              res.data[i].createTime = this.dateTrans(res.data[i]._createTime);
            }
            list = list.concat(res.data);
            this.setData({
                article_list: list
            })
            console.log("list", list)
            util.setStorageSyncHour("list", list, 4)
          }
    })
  },
  skipSparticle(e) {
    wx.navigateTo({
      url: '/pages/article/article?message=' + e.currentTarget.dataset.message,
    })
  },
   dateTrans(date) {
    let _date = new Date(parseInt(date));
    let y = _date.getFullYear();
    let m = _date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    let d = _date.getDate();
    d = d < 10 ? ('0' + d) : d;
    let h = _date.getHours();
    h = h < 10 ? ('0' + h) : h;
    let minute = _date.getMinutes();
    let second = _date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute; second = second < 10 ? ('0' + second) : second;
    // console.log( y + '-' + m + '-' + d + ' ' + '　' + h + ':' + minute + ':' + second)
    let dates = y + '-' + m + '-' + d;
    return dates;
 }
})