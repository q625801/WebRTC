let socket //供其他页面调用

function initSocket(token) {//获取到用户输入的id并传到服务端
    socket = io('http://192.168.211.2:1024',);//192.168.102.70
    socket.open();
    socket.emit('joinUserList',{token:token,roomNo:88888888})
    socket.on('open', socketOpen); //连接登录
    socket.on('disconnect', socketClose); //连接断开
    socket.on('dataChange', createChatList); //新增人员
    socket.on('inviteVideoHandler', inviteVideoHandler); //被邀请视频
    socket.on('askVideoHandler', askVideoHandler); //视频邀请结果
    socket.on('ice', getIce); //从服务端接收ice
    socket.on('offer', getOffer); //从服务端接收offer
    socket.on('answer', getAnswer); //从服务端接收answer
    socket.on('break', stopVideoStream) //挂断视频通话
}

function socketClose(reason) { //主动或被动关闭socket
    console.log(reason)
    localStorage.removeItem("token")
}

function socketOpen(data) { //socket开启
    if (!data.result) { //当服务端找到相同id时跳出连接
        console.log(data.msg)
        return;
    }
    console.log('socketOpen===========>')
    createChatList(data) //创建用户列表
    localStorage.setItem('token', data.token)
    login.hidden = true
    chatBox.hidden = false
    videoChat.hidden = true
    myName.textContent = localStorage.token
}

function inviteVideoHandler(data) { //当用户被邀请时执行
    console.log('用户被邀请时执行==========>',data)
    let allow = 0
    if (isCalling) {
        allow = -1 //正在通话
    } else {
        let res = confirm(data.msg);
        if (res) {
            allow = 1
            startVideoChat(data.token) //用户点击同意后开始初始化视频聊天
            localStorage.setItem('roomNo', data.roomNo) //将房间号保存
        }
    }
    console.log('localStorage.token',localStorage.token)
    socket.emit('askVideo', {
        myId: localStorage.token,
        otherId: data.token,
        type: 'askVideo',
        allow
    });
}

function askVideoHandler(data) { //获取被邀请用户的回复
    console.log(data.msg)
    if (data.allow == -1) return //通话中
    if (data.allow) {
        localStorage.setItem('roomNo', data.roomNo) //将房间号保存
        startVideoChat(data.token)
    }
}

function breakVideoConnect(e) {
    console.log(localStorage.getItem('roomNo'))
    socket.emit('_break', {
        roomNo: localStorage.getItem('roomNo')
    });
}