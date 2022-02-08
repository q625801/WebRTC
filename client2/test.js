let a = [1,2,3];
aa()
const bbb = anyValue =>{
    new Promise(reslove => {
        setTimeout(reslove,2000,anyValue);
    })
}
// console.log(later(111))
async function aa(){
    console.log(await bbb(111))
    // await console.log(a.forEach(async (item) => {console.log(await later(item))}))
}