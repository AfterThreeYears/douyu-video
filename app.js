const fs = require('fs');
const http = require('http');
const uuid = require('uuid/v1');

let num = 0;
let max = 500;
const sourceUrl = process.argv[2];

function fill(num, length) {
  if (length <= `${num}`.length) return;
  return Array.from(new Array(length - `${num}`.length)).fill(0).join('') + num;
}

function main() {
  if (num >= max) {
    console.log('开始合并');
    num = 0;
    return concat();
  }
  
  const path = fill(num, 7);
  const url = sourceUrl.replace(/_(\d)+\./, `_${path}.`);
  const req = http.get(url);
  req.end();
  req.on('error', (error) => {
    console.error(`错误了,${error.message}`);
  });
  req.on('response', (res) => {
    try {
      if (res.statusCode !== 200) {
        console.log(`状态码为${res.statusCode}`);
        max = num;
        main();
        return;
      }
      const ws = res.pipe(fs.createWriteStream(`/tmp/${num}.mp4`));
      ws.on('finish', () => {
        console.log(num, '完成');
        num += 1;
        main();
      });
      ws.on('error', (error) => {
        console.error(`错误了,${error.message}`);
      });
    } catch (error) {
      console.log('异常', error.message);
    }
  });
};

main();

const ws = fs.createWriteStream(`/tmp/${uuid()}.mp4`);

const concat = () => {
  if (num >= max) {
    console.log('合并结束');
    return process.exit(0);
  }
  const rs = fs.createReadStream(`/tmp/${num}.mp4`);
  rs.pipe(ws, {end: false});
  rs.once('end', () => {
    console.log(num, '合并完成');
    num += 1;
    concat();
  });
  rs.once('error', (error) => {
    console.error(`合并错误了,${error.message}`);
  });
};
