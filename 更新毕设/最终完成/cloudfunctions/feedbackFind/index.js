// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database() 
// 云函数入口函数
exports.main = async (event, context) => {

  if(event.type == 1){
    return {} 
  }
  else{
    //return await db.collection('feedbackTS').get()
    return await db.collection('feedbackTS').where({
        open_id: event.open_id 
    })
 }
}