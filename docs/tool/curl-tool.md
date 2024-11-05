---
title: "curl工具"
page: true
aside: true
---

## 指定Method发出请求
```shell 
curl -X "GET" http://example.com/a

curl -X "POST" http://example.com/a

curl -X "HEAD" http://example.com/a

curl -X "DELETE" http://example.com/a
```

## 获取响应头
```shell 
curl -I http://example.com/a

# 上边不好使的话，用这个
curl -i http://example.com/a
```

## 添加请求头
```shell 
curl -H 'Origin: http://b.example.com' http://example.com/a

curl -H 'Origin: http://b.example.com' \
  -H 'Accept: *' \
  http://example.com/a
```

## 发送请求体
```shell 
curl http://example.com/a --data-raw '{ "name": "jack" }'

curl http://example.com/a --data-binary @my-music.mp4
```