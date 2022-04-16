// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database() 

// 云函数入口函数
exports.main = async (event, context) => {
   console.log("进入add云函数", event)
  
    if(event.type == 1){
       return await db.collection('feedbackTY').add({
         data:{
            desc: event.desc,
            capas: event.capas,
            uses: event.uses,
            ables: event.ables,
            others: event.others,
            open_id: event.open_id
         }
       })
    }else{
       return await db.collection('feedbackTS').add({
         data:{
           detaildesc: event.detaildesc,
           desc: event.desc,
           open_id: event.open_id, 
         }
       })
    }
}