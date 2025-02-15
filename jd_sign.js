// version v0.0.1
// create by zhihua
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync
const fs = require('fs')
const rp = require('request-promise')
const download = require('download')

// 京东Cookie
const cookie = process.env.JD_COOKIE
// 京东Cookie
const dual_cookie = process.env.JD_DUAL_COOKIE
// Server酱SCKEY
const push_key = process.env.PUSH_KEY

// 京东脚本文件
const js_url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js'
// 下载脚本路劲
const js_path = './JD_DailyBonus.js'
// 脚本执行输出路劲
const result_path = './result.txt'
// 错误信息输出路劲
const error_path = './error.txt'

Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

function dateFormat() {
  var timezone = 8;
  var GMT_offset = new Date().getTimezoneOffset();
  var n_Date = new Date().getTime();
  var t_Date = new Date(n_Date + GMT_offset * 60 * 1000 + timezone * 60 * 60 * 1000);
  console.log(t_Date)
  return t_Date.Format('yyyy.MM.dd')
}

function setupCookie() {
  var js_content = fs.readFileSync(js_path, 'utf8')
  js_content = js_content.replace(/var Key = ''/, `var Key = '${cookie}'`)
  if (dual_cookie) {
    js_content = js_content.replace(/var DualKey = ''/, `var DualKey = '${dual_cookie}'`)
  }
  fs.writeFileSync(js_path, js_content, 'utf8')
}

function sendNotificationIfNeed() {

  if (!push_key) {
    console.log('执行任务结束!'); return;
  }

  if (!fs.existsSync(result_path)) {
    console.log('没有执行结果，任务中断!'); return;
  }
  
  
  let text = "京东签到_" + dateFormat();
  let desp = fs.readFileSync(result_path, "utf8");
  
  
  //20211130 add by zhouwq
  let new_desp = "";
  let pos = desp.indexOf("签到奖励") ;
  if (pos != -1) {
      new_desp += desp.slice(pos + 6 , pos + 12);  
  }
  pos = desp.indexOf("签到奖励" , pos + 8) ;
  if (pos != -1) {
      new_desp += desp.slice(pos + 6 , pos + 16);  
  }
  text = "京东签到_" + dateFormat() + new_desp; 
  
  
  
  
  

 

  
  //20210616 add by zhouwq
  new_desp = "";
  pos = desp.indexOf("签到号一") - 1;
  if (pos != -1) {
      new_desp += desp.slice(pos,desp.indexOf("红包", pos) + 2);  
  }
  pos = desp.indexOf("签到号二") - 1
  if (pos != -1) {
      new_desp += desp.slice(pos,desp.indexOf("红包",pos) + 2);  
  }
  desp = new_desp 
  
  // 去除末尾的换行
  let SCKEY = push_key.replace(/[\r\n]/g,"")

  const options ={
    uri:  `https://sc.ftqq.com/${SCKEY}.send`,
    form: { text, desp },
    json: true,
    method: 'POST'
  }

  rp.post(options).then(res=>{
    const code = res['errno'];
    if (code == 0) {
      console.log("通知发送成功，任务结束！")
    }
    else {
      console.log(res);
      console.log("通知发送失败，任务中断！")
      fs.writeFileSync(error_path, JSON.stringify(res), 'utf8')
    }
  }).catch((err)=>{
    console.log("通知发送失败，任务中断！")
    fs.writeFileSync(error_path, err, 'utf8')
  })
}

function main() {

  if (!cookie) {
    console.log('请配置京东cookie!'); return;
  }

  // 1、下载脚本
  download(js_url, './').then(res=>{
    // 2、替换cookie
    setupCookie()
    // 3、执行脚本
    exec(`node '${js_path}' >> '${result_path}'`);
    // 4、发送推送
    sendNotificationIfNeed() 
  }).catch((err)=>{
    console.log('脚本文件下载失败，任务中断！');
    fs.writeFileSync(error_path, err, 'utf8')
  })

}

main()
