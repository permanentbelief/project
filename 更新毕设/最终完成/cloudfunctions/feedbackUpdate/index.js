// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database() 
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event.id)
  console.log(event.desc)
  if(event.type == 1){
    return await db.collection('feedbackTY').doc(event.id)
    .update({
      data:{
      desc: event.desc,
      open_id: event.open_id,
      capas:event.capas,
      uses:event.uses,
      ables:event.ables,
      others:event.others,
      }
    })
  }else{
    return await db.collection('feedbackTS').doc(event.id)
    .update({
      data:{
         desc: event.desc,
         detaildesc: event.detaildesc
      } 
  })
}
}
