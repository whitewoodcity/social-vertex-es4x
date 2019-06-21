# social-vertex-es4x

## 简介

本项目是一个静态资源服务器，同时提供http请求代理功能。最初的开发目的在于：想用vert.x生态的技术解决web项目(前后端分离) 到服务端请求跨域(CORS)的问题。

es4x官网 请[点击此处](https://reactiverse.io/es4x/)



## setUp

```bash
npm install
```



## Launch

```bash
npm start
```



## 说明:

#### static-service：

将静态资源放入webroot目录当中，即可实现静态资源服务。访问`[your_host]:${localServerPort}/${staticResourcePath}`即可自动跳转到webroot下的index.html文件,

关于localServerPort以及staticResourcePath将再后文解释；

#### 参数

`index.js`当中文件首部有若干configuration项:

```js
//======================================================================
//----------- configuration ----------------
/*no need to fix it unless it's nessessary*/
const indexReg =['/','/index.htm','/index'];

/*url以/assets 开头的请求 会自动映射加载webroot目录之下的文件*/
const staticResourcePath = '/assets';

/*
url以/api 开头的请求 会自动映射到代理服务并被
转发到$remoteHost:$remotePort/$remoteApiBasePath之下
*/
const ajaxReqPathPrefix = '/api';

/*social-vertex-es4x的启动端口*/
const localServerPort = 8090;

/*被代理服务器的远程host*/
const remoteHost = 'polyglot.net.cn';

/*远程port*/
const remotePort = 80;

/* 远程服务基础地址 */
const remoteApiBasePath = '/';

/*默认返回编码*/
const defaultCharset = 'UTF-8';
//=======================================================================
```

