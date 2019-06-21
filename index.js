/// <reference types="@vertx/core/runtime" />
// @ts-check
import { Router, StaticHandler, RoutingContext, BodyHandler} from '@vertx/web';
import {WebClient} from '@vertx/web-client';
import { HttpMethod } from '@vertx/core/enums';

//======================================================================
//----------- configuration ----------------
const indexReg =['/','/index.htm','/index'];
const staticResourcePath = '/assets';
const ajaxReqPathPrefix = '/api';
const localServerPort = 8090;
// const remoteHost = 'polyglot.net.cn';
const remoteHost = '192.168.89.1';
const remotePort = 8090;
const remoteApiBasePath = '/';
const defaultCharset = 'UTF-8';
//----- error msg ---
const errorMSG = "Container Error";
const methodNotSupport = "http method not Supported";
//=======================================================================

//--------- init router and webClient  ------------------
const router = Router.router(vertx);
const localProxyClient = WebClient.create(vertx);
// body handler
router.route().handler(BodyHandler.create().handle);
//预先处理请求(是静态资源还是ajax请求)
preHandleRequest(router);
router.route(staticResourcePath+'/*').handler(StaticHandler.create().setDefaultContentEncoding(defaultCharset));
router.route(ajaxReqPathPrefix + '/*').handler(ajaxRequestHandler);
router.route().failureHandler(failureHandler);
router.errorHandler(500,errorHandler);

vertx.createHttpServer()
    .requestHandler(router)
    .listen(localServerPort);
console.log("static&proxy started at port:" + localServerPort);

function preHandleRequest(router){
  for(let i = 0; i < indexReg.length; i++){
    let preRoutPath = indexReg[i];
    router.route(staticResourcePath + preRoutPath).handler(route2Index);
  }
}

function failureHandler(ctx){
  console.log(ctx.failure());
  ctx.response().setStatusCode(500).end(''+ctx.failure());
}

function errorHandler(ctx){
  ctx.response().end(''+ctx.failure());
}


//将请求转发到静态资源index.html
function route2Index(ctx){
  ctx.reroute(staticResourcePath+'/index.html');
}

function ajaxRequestHandler(ctx){
  console.log("--------------------------------------------------");
  console.log("absUri: " + ctx.request().absoluteURI());
  console.log("localAddress: " + ctx.request().localAddress());
  console.log("http method:" + ctx.request().method());
  console.log("headers:" + ctx.request().headers());
  console.log("body:" + ctx.getBodyAsString());
  console.log("--------------------------------------------------");

  let method = ctx.request().method();
  switch(method){
    case HttpMethod.GET:
      handleGet(ctx);
      break;

    case HttpMethod.POST:
      handlePost(ctx);
      break;

    case HttpMethod.PUT:
      handlePut(ctx);
      break;

    case HttpMethod.DELETE:
      handleDelete(ctx);
      break;

    default:
      handleNotSupportMethod(ctx);
  }
}
function handleNotSupportMethod(ctx){
  console.log("in default");
  ctx.response.setStatusCode(500).end(methodNotSupport);
}

function handleGet(ctx){
  let request = ctx.request();
  let response = ctx.response();
  let req = localProxyClient.get(remotePort,remoteHost,getURI(request.absoluteURI()));
  buildQueryParam(req,request.params());
  req.putHeaders(request.headers())
      .send(ar=>{
        normalResponseHander(response,ar);
      });
}

function handlePost(ctx){
  let request = ctx.request();
  let response = ctx.response();
  let req = localProxyClient.post(remotePort,remoteHost,getURI(request.absoluteURI()));
  buildQueryParam(req,request.params());
  req.putHeaders(request.headers())
      .sendJson(ctx.getBodyAsJson(),ar=>{
        normalResponseHander(response,ar);
      });
}

function handlePut(ctx){
  let request = ctx.request();
  let response = ctx.response();
  let req = localProxyClient.put(remotePort,remoteHost,getURI(request.absoluteURI()));
  buildQueryParam(req,request.params());
  req.putHeaders(request.headers())
      .sendJson(ctx.getBodyAsJson(),ar=>{
        normalResponseHander(response,ar);
      });
}

function handleDelete(ctx){
  let request = ctx.request();
  let response = ctx.response();
  let req = localProxyClient.delete(remotePort,remoteHost,getURI(request.absoluteURI()));
  buildQueryParam(req,request.params());
  req.putHeaders(request.headers())
      .sendJson(ctx.getBodyAsJson(),ar=>{
        normalResponseHander(response,ar);
      });
}

//处理url参数
function buildQueryParam(req,params){
  params.entries().forEach(item=>{
    req.addQueryParam(item.getKey(),item.getValue());
  });
}

function normalResponseHander(response,ar){
  if(ar.failed()){
    console.log(ar.cause());
    response.setStatusCode(500).end('' + ar.cause());
  }else{
    let resps = ar.result();
    //================================
    let statusCode = resps.statusCode();
    let statusMsg = resps.statusMessage();
    let headers = resps.headers();
    let trailers = resps.trailers();
    let bodyAsString = resps.bodyAsString();
    console.log("==========================================")
    console.log("got response from remote server:");
    console.log("statusCode: "+statusCode);
    console.log("statusMsg:" + statusMsg);
    console.log("body:" , bodyAsString);
    console.log("==========================================")
    //================================
    //-- handle headers ----
    headers.entries().forEach(oneHeader=>{
      response.putHeader(oneHeader.getKey(),oneHeader.getValue());
    })

    //-- handle trailers ----
    trailers.entries().forEach(oneTrailer=>{
      response.putTrailer(oneTrailer.getKey(),oneTrailer.getValue());
    })

    response.setStatusCode(statusCode);
    response.setStatusMessage(statusMsg);
    response.end(bodyAsString);
  }
}

function getURI(absUri){
  //http://localhost:8090/api?param1=123&parama2=fh3h9fh
  //根据？分割absUri 获取无参数的uri
  let uriWithourParam = absUri.split('?')[0];
  let i = uriWithourParam.indexOf(ajaxReqPathPrefix) + ajaxReqPathPrefix.length + 1;
  let finalUri = uriWithourParam.substr(i)
  console.log(remoteApiBasePath + finalUri);
  return remoteApiBasePath + finalUri;
}