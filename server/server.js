const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

// 配置https
// const fs = require('fs');
// const options = {
//   key: fs.readFileSync('cert.key'),
//   cert: fs.readFileSync('cert.pem')
// };
// const server = require('https').createServer(options,app);

let userList = {}; //用户列表，所有连接的用户
let userIds = {}; //用户id列表，显示到前端
let roomList = {}; //房间列表，视频聊天
io.on("connect", (socket) => {
  // let { token } = socket.handshake.query;
  let token = '',roomNo = '' //用户id 进入房间号
  socket.on("disconnect", (exit) => {
    //socket断开
    console.log('连接断开用户信息，',roomNo,token)
    delFormList(token,roomNo); //清除用户
    broadCast(socket, token, "leave"); //广播给其他用户
  });
  socket.on("inviteVideo", inviteVideoHandler); //邀请用户
  socket.on("askVideo", inviteVideoHandler); //回应用户是否邀请成功
  socket.on("joinUserList",function(res){
    token = res.token
    roomNo = res.roomNo
    console.log('连接用户信息，',roomNo,token)
    if (roomList[res.roomNo] && roomList[res.roomNo][res.token]) {
      //找到相同用户名就跳出函数
      socket.emit("open", {
        result: 0,
        msg: token + "已存在",
        userIds
      });
      socket.disconnect();
      return;
    }
    if(res.roomNo && !roomList[res.roomNo]){
      roomList[res.roomNo] = {}
    }
    roomList[res.roomNo][res.token] = socket
    addToList(res, socket); //用户连接时，添加到userList
    broadCast(socket, token, "enter"); //广告其他用户，有人加入
  })
  socket.on('waitVideo',returnWaitVideo)
  
});

function addToList(user, item) {
  //添加到userList
  userList[user.token] = item;
  userIds[user.token] = user.token;
  item.emit("open", {
    result: 1,
    msg: "你已加入聊天",
    userIds,
    token: user.token,
  });
  // console.log('=====>加入',roomList)
}

function delFormList(userid,roomNo) {
  //断开时，删除用户
  delete userList[userid];
  delete userIds[userid];
  if(roomNo && userid && roomList[roomNo] && roomList[roomNo][userid]){
    delete roomList[roomNo][userid]
    if(Object.keys(roomList[roomNo]).length == 0){
      delete roomList[roomNo]
    }else if(Object.keys(roomList[roomNo]).length == 1){
      for(let key in roomList[roomNo]){
        // roomList[roomNo][key].emit("break", {
        //   msg: "聊天挂断",
        // });
      }
    }
  }
  
  // if(JSON.stringify(roomList[roomNo]) == '{}'){
  //   delete roomList[roomNo]
  // }
  console.log('删除用户信息',roomList)
  // console.log('=====>断开',roomList)

}

function broadCast(target, token, type) {
  //广播功能
  let msg = "加入聊天";
  if (type !== "enter") {
    msg = "离开聊天";
  }
  target.broadcast.emit("dataChange", {
    result: 1,
    msg: token + msg,
    userIds,
  });
}

function inviteVideoHandler(data) {
  console.log('点击用户列表执行邀请事件===========>')
  //邀请方法
  let { myId, otherId, type, allow  } = data,
    msg = "邀请你进入聊天室",
    event = "inviteVideoHandler"
  let roomNo = 88888888
  if (type == "askVideo") {
    event = "askVideoHandler";
    if (allow == 1) {
      addRoom(roomNo);
      msg = "接受了你的邀请";
    } else if (allow == -1) {
      msg = "正在通话";
    } else {
      msg = "拒绝了你的邀请";
    }
  }
  console.log(myId,roomNo,roomList,event)
  for(let key in roomList[roomNo]){
    if(key != myId){
      roomList[roomNo][key].emit(event, {
        msg: myId + msg,
        token: myId,
        allow,
        roomNo,
      });
    }
  }
}
function returnWaitVideo(res){
  for(let key in roomList[res.roomNo]){
    if(key != res.userId){
      roomList[res.roomNo][key].emit('getWaitVideo', {
        
      });
    }
  }
}
async function addRoom(roomNo, otherId) {
  //用户同意后添加到视频聊天室，只做1对1聊天功能
  // console.log('addRoom=====>',roomNo, otherId)
  // roomList[roomNo] = [userList[roomNo], userList[otherId]];
  // console.log(roomList[roomNo])
  startVideoChat(roomList[roomNo]);
}

function startVideoChat(roomList) {
  //视频聊天初始化
  // console.log(roomItem,'===============>')
  let roomItem = []
  for(let key in roomList){
    roomItem.push(roomList[key])
  }
  for (let i = 0; i < roomItem.length; i++) {
    roomItem[i].room = roomItem;
    roomItem[i].id = i;
    roomItem[i].on("_ice", _iceHandler);
    roomItem[i].on("_offer", _offerHandler);
    roomItem[i].on("_answer", _answerHandler);
    roomItem[i].on("_break", _breakRoom);
  }
}

function _iceHandler(data) {
  //用户发送ice到服务端，服务端转发给另一个用户
  let id = this.id == 0 ? 1 : 0; //判断用户二者其一
  this.room[id].emit("ice", data);
}

function _offerHandler(data) {
  //用户发送offer到服务端，服务端转发给另一个用户
  let id = this.id == 0 ? 1 : 0;
  this.room[id].emit("offer", data);
}

function _answerHandler(data) {
  //用户发送answer到服务端，服务端转发给另一个用户
  let id = this.id == 0 ? 1 : 0;
  this.room[id].emit("answer", data);
}

function _breakRoom(data) {
  //挂断聊天
  // console.log(data)
  let roomItem = []
  for(let key in roomList[data.roomNo]){
    console.log(key)
    roomItem.push(roomList[data.roomNo][key])
  }
  // console.log(roomItem)
  for (let i = 0; i < roomItem.length || 0; i++) {
    console.log('聊天挂断=====>',i)
    roomItem[i].emit("break", {
      msg: "聊天挂断",
    });
  }
}
server.listen(1024, function () {
  console.log("Socket Open");
});
