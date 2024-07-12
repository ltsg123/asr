#!/bin/bash

# 下载文件
curl -LO https://github.com/ltsg123/asr/releases/download/v1.0.0/sherpa-ncnn.zip

# 解压文件到 public 目录
unzip sherpa-ncnn.zip -d public

# 删除压缩包
rm sherpa-ncnn.zip