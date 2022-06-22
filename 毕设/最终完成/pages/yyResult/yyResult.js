const db = wx.cloud.database();
Page({
    data: {
        fself: "",
        self: "",
        name: "",
        no: ""
    },
    onLoad: function(options) {
        db.collection('order').where({
            type: 2, 
            userId: wx.getStorageSync('user')._id, 
            status: 4
        }).get({
            success: res => {
                this.setData({
                    fself: res.data
                })
            }
        })
        db.collection('order').where({
            type: 2,
            userId: wx.getStorageSync('user')._id,
            status: 4,
            phone: wx.getStorageSync('user').phone

        }).get({
            success: res => {
                this.setData({
                    self: res.data
                })
            }
        })
    },

    getName(e) {
        console.log(e.detail.value)
        var name = e.detail.value;
        this.setData({
            name
        })
       
    },
    getNo(e){
        var no = e.detail.value;
        this.setData({
            no
        })
    }
})