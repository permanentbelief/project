const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let imgUrl = event.imgUrl;
    const result = await cloud.openapi.ocr.idcard({
        type: 'photo',
        imgUrl: imgUrl
      })
    return result
  } catch (err) {
    return err
  }
}