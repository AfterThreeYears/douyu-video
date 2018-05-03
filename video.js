const uuid = require('uuid/v1');
const fs = require('fs');
const http = require('http');
const logUpdate = require('log-update');

module.exports = class Video {
  constructor(options = {}) {
    this.fileName = options.fileName || uuid();
    this.num = +options.num || 0;
    this.max = Infinity;
    this.url = options.url;
    this.targetPath = `/tmp/${this.fileName}.mp4`;
    this.ws = fs.createWriteStream(this.targetPath);

    this.ws.on('finish', () => {
      console.log('任务完成，触发ws finish');
      process.exit(0);
    });

    this.download();
  }
  download() {
    const now = Date.now();
    const url = this.url.replace(/_(\d)+\./, `_${this.fill(7)}.`);
    const req = http.get(url);
    req.end();
    req.on('error', (error) => {
      console.error(`错误了,${error.message}`);
    });
    req.on('response', (res) => {
      try {
        if (res.statusCode !== 200) {
          console.log(`状态码为${res.statusCode}`);
          this.max = this.num;
          this.num = 0;
          return this.concat();
        }
        const contentLength = res.headers['content-length'];
        let currentSize = 0;
        let percent = 0;
        res.on('data', (chunk) => {
          currentSize += chunk.length;
          const currentPercent = Number(currentSize / contentLength * 100).toFixed(0);
          if (percent === currentPercent) return;
          percent = currentPercent;
          logUpdate(`开始下载第${this.num}片,大小为${Number(contentLength / 1024 / 1024).toFixed(2)}MB, 下载了${percent}%`);
        });
        const pipe = res.pipe(fs.createWriteStream(`/tmp/${this.num}-${this.fileName}.mp4`));
        pipe.on('finish', () => {
          logUpdate.done();
          console.log(`第${this.num}片下载完成, ${currentSize / 1024 / ((Date.now() - now) / 1000)}KB\s`);
          this.num += 1;
          this.download();
        });
        pipe.on('error', (error) => {
          console.error(`pipe传输异常:${error.message}`);
        });
      } catch (error) {
        console.log('异常', error.message);
      }
    });
  }
  fill(length) {
    const {num} = this;
    if (length <= `${num}`.length) return;
    return Array.from(new Array(length - `${num}`.length)).fill(0).join('') + num;
  }
  concat() {
    console.log(this.num, this.max);
    if (this.num > this.max) {
      console.log(`合并结束,文件位置为 \n${this.targetPath}`);
      // 完成任务以后需要手动关闭可写流，否则可能导致内存泄漏
      return this.ws.end();
    }
    const rs = fs.createReadStream(`/tmp/${this.num}-${this.fileName}.mp4`);
    rs.pipe(this.ws, {end: false});
    rs.once('end', () => {
      console.log(this.num, '合并完成');
      this.num += 1;
      this.concat();
    });
    rs.once('error', (error) => {
      console.error(`合并错误了,${error.message}`);
      // 发生错误了需要手动关闭
      rs.end();
      this.ws.end();
    });
  };
}
