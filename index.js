#!/usr/bin/env node
const assert = require('assert');
const program = require('commander');
const Video = require('./video');

program
  .version('0.1.0')
  .option('-u, --url [type]', '视频的url')
  .option('-f, --fileName [type]', '下载完成的文件名，默认为uuid生成的随机值')
  .option('-b, --begin [type]', '开始下载分片的位置, 默认为0')
  .parse(process.argv);

const {url, begin, fileName} = program;
assert.ok(url, '下载地址必填');

new Video({
  num: begin,
  fileName,
  url,
});

