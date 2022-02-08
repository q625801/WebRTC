const stun = require('stun')

stun.request('172.18.0.111',(err,res) => {
    if(err){
        console.log(err)
    }else{
        const {address} = res.getXorAddress();
        console.log('your ip',address)
    }
})