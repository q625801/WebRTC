var stream, peer, isCalling = false //初始化要发送的流,和描述文件,通话状态
const config = {
    iceServers: [
        { urls: 'stun:192.168.102.70' },
        {
            urls:'turn:192.168.102.70:3478',
            username: 'yunjia01',
            credential: 'yunjia01',
            credentialType: 'password'
        }
    ],
    sdpSemantics:'unified-plan'
};
function startVideoStream(e) { //开始传输视频流
    console.log('开始创建媒体流方法==========>')
    createMedia()
}

function stopVideoStream(data) { //停止传输视频流
    console.log(data.msg)
    stream.getTracks().forEach(async function (track) { //这里得到视频或音频对象
        await track.stop();
        await stream.removeTrack(track)
        stream = null
    })
    peer.close();
    peer = null;
    isCalling = false
    videoChat.hidden = true
    login.hidden = true
    chatBox.hidden = false
}

async function createMedia() { //同步创建本地媒体流
    console.log('创建本地媒体流==========>')
    if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        })
    }
    console.log(stream)
    let video = document.querySelector('#myVideo');
    video.srcObject = stream; //将媒体流输出到本地video以显示自己
    video.onloadedmetadata = function (e) {
        video.play();
    };
    createPeerConnection()
}

async function createPeerConnection() { //同步初始化描述文件并添加事件
    console.log('创建RTC==========>')
    if (!peer) {
        peer = new RTCPeerConnection(config)
    }
    await stream.getTracks().forEach(async track => {
        await peer.addTrack(track, stream); //将本地流附属至peer中
        console.log('addTrack API执行==========>')
    });
    // await peer.addStream(stream); //旧方法（将本地流附属至peer中）
    peer.addEventListener('addstream', setVideo) //当peer收到其他流时显示另一个video以显示对方
    peer.addEventListener('icecandidate', sendIce) //获取到candidate时，将其发送至服务端，传至对方
    peer.addEventListener('negotiationneeded', sendOffer) //addTrack方法成功后触发negotiationneeded
}

function setVideo(data) { //播放对方的视频流
    console.log('播放对方视频流===================>')
    let back = document.getElementById('back')
    back.hidden = false //显示挂断按钮
    back.addEventListener('click', breakVideoConnect) //挂断事件
    isCalling = true //正在通话
    let video = document.querySelector('#otherVideo');
    video.srcObject = data.stream;
    video.onloadedmetadata = function (e) {
        video.play();
    };
}

async function sendOffer() { //同步发送offer到服务端，发送给对方
    let offer = await peer.createOffer();
    await peer.setLocalDescription(offer); //peer本地附属offer
    console.log('peer本地附属offer',offer)
    console.log('执行server.js事件发送offer给对方==========>')
    socket.emit('_offer', {
        streamData: offer
    });
}

async function getOffer(data) { //接收到offer后，返回answer给对方
    if (!peer) return //等待对方响应，也可以用try catch
    await peer.setRemoteDescription(data.streamData); //peer远程附属offer
    console.log('获取对方offer peer附属offer',data.streamData)
    console.log('执行socket发送answer给对方==========>')
    sendAnswer()
}

async function sendAnswer() {
    let answer = await peer.createAnswer();
    await peer.setLocalDescription(answer); //peer附属本地answer
    console.log('peer附属本地answer==========>',answer)
    console.log('执行server.js事件发送answer给对方==========>',answer)
    socket.emit('_answer', {
        streamData: answer
    });
}

async function getAnswer(data) { //接收到answer后，peer远程附属answer
    console.log('peer附属远程answer==========>',data.streamData)
    await peer.setRemoteDescription(data.streamData);
}

function sendIce(e) { //setLocalDescription触发时，发送ICE给对方
    console.log('执行server.js事件发送ice给对方==========>')
    if (!e || !e.candidate) return
    console.log(e.candidate)
    socket.emit('_ice', {
        streamData: e.candidate
    });
}

async function getIce(data) { //获取对方的ICE
    console.log('获取对方ice==========>')
    if (!peer) return //等待对方响应，也可以用try catch
    var candidate = new RTCIceCandidate(data.streamData)
    await peer.addIceCandidate(candidate)
}