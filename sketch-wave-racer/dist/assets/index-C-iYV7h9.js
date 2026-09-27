(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ko="169",em={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},nm={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Nd=0,xc=1,Fd=2,im=3,sm=0,Oc=1,Od=2,In=3,jn=0,Ae=1,xn=2,Jn=0,Yi=1,vc=2,yc=3,Mc=4,Bd=5,mi=100,zd=101,kd=102,Vd=103,Hd=104,Gd=200,Wd=201,Xd=202,qd=203,Ka=204,Ja=205,Yd=206,Zd=207,$d=208,Kd=209,Jd=210,Qd=211,jd=212,tf=213,ef=214,Qa=0,ja=1,to=2,Ji=3,eo=4,no=5,io=6,so=7,zr=0,nf=1,sf=2,Qn=0,rf=1,af=2,of=3,lf=4,cf=5,hf=6,uf=7,bc="attached",df="detached",Vo=300,ti=301,_i=302,xr=303,vr=304,ks=306,yr=1e3,vn=1001,Mr=1002,Fe=1003,Bc=1004,rm=1004,Es=1005,am=1005,Re=1006,lr=1007,om=1007,Ln=1008,lm=1008,Fn=1009,zc=1010,kc=1011,Ns=1012,Ho=1013,ei=1014,nn=1015,Vs=1016,Go=1017,Wo=1018,Qi=1020,Vc=35902,Hc=1021,Gc=1022,$e=1023,Wc=1024,Xc=1025,Zi=1026,ji=1027,Xo=1028,kr=1029,qc=1030,qo=1031,cm=1032,Yo=1033,cr=33776,hr=33777,ur=33778,dr=33779,ro=35840,ao=35841,oo=35842,lo=35843,co=36196,ho=37492,uo=37496,fo=37808,po=37809,mo=37810,go=37811,_o=37812,xo=37813,vo=37814,yo=37815,Mo=37816,bo=37817,So=37818,wo=37819,Ao=37820,To=37821,fr=36492,Eo=36494,Co=36495,Yc=36283,Ro=36284,Po=36285,Io=36286,ff=2200,pf=2201,mf=2202,br=2300,Lo=2301,Wa=2302,Hi=2400,Gi=2401,Sr=2402,Zo=2500,Zc=2501,hm=0,um=1,dm=2,gf=3200,_f=3201,fm=3202,pm=3203,vi=0,xf=1,Zn="",_n="srgb",si="srgb-linear",$o="display-p3",Vr="display-p3-linear",wr="linear",de="srgb",Ar="rec709",Tr="p3",mm=0,Oi=7680,gm=7681,_m=7682,xm=7683,vm=34055,ym=34056,Mm=5386,bm=512,Sm=513,wm=514,Am=515,Tm=516,Em=517,Cm=518,Sc=519,vf=512,yf=513,Mf=514,$c=515,bf=516,Sf=517,wf=518,Af=519,Er=35044,Rm=35048,Pm=35040,Im=35045,Lm=35049,Dm=35041,Um=35046,Nm=35050,Fm=35042,Om="100",wc="300 es",Dn=2e3,Cr=2001;class zn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,t);t.target=null}}}const ke=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let kh=1234567;const $i=Math.PI/180,Fs=180/Math.PI;function fn(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ke[s&255]+ke[s>>8&255]+ke[s>>16&255]+ke[s>>24&255]+"-"+ke[t&255]+ke[t>>8&255]+"-"+ke[t>>16&15|64]+ke[t>>24&255]+"-"+ke[e&63|128]+ke[e>>8&255]+"-"+ke[e>>16&255]+ke[e>>24&255]+ke[n&255]+ke[n>>8&255]+ke[n>>16&255]+ke[n>>24&255]).toLowerCase()}function xe(s,t,e){return Math.max(t,Math.min(e,s))}function Kc(s,t){return(s%t+t)%t}function Bm(s,t,e,n,i){return n+(s-t)*(i-n)/(e-t)}function zm(s,t,e){return s!==t?(e-s)/(t-s):0}function pr(s,t,e){return(1-e)*s+e*t}function km(s,t,e,n){return pr(s,t,1-Math.exp(-e*n))}function Vm(s,t=1){return t-Math.abs(Kc(s,t*2)-t)}function Hm(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function Gm(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function Wm(s,t){return s+Math.floor(Math.random()*(t-s+1))}function Xm(s,t){return s+Math.random()*(t-s)}function qm(s){return s*(.5-Math.random())}function Ym(s){s!==void 0&&(kh=s);let t=kh+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Zm(s){return s*$i}function $m(s){return s*Fs}function Km(s){return(s&s-1)===0&&s!==0}function Jm(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Qm(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function jm(s,t,e,n,i){const r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),d=r((t-n)/2),u=a((t-n)/2),f=r((n-t)/2),m=a((n-t)/2);switch(i){case"XYX":s.set(o*h,l*d,l*u,o*c);break;case"YZY":s.set(l*u,o*h,l*d,o*c);break;case"ZXZ":s.set(l*d,l*u,o*h,o*c);break;case"XZX":s.set(o*h,l*m,l*f,o*c);break;case"YXY":s.set(l*f,o*h,l*m,o*c);break;case"ZYZ":s.set(l*m,l*f,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ze(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function Zt(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}const Ts={DEG2RAD:$i,RAD2DEG:Fs,generateUUID:fn,clamp:xe,euclideanModulo:Kc,mapLinear:Bm,inverseLerp:zm,lerp:pr,damp:km,pingpong:Vm,smoothstep:Hm,smootherstep:Gm,randInt:Wm,randFloat:Xm,randFloatSpread:qm,seededRandom:Ym,degToRad:Zm,radToDeg:$m,isPowerOfTwo:Km,ceilPowerOfTwo:Jm,floorPowerOfTwo:Qm,setQuaternionFromProperEuler:jm,normalize:Zt,denormalize:Ze};class Q{constructor(t=0,e=0){Q.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(xe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*i+t.x,this.y=r*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Yt{constructor(t,e,n,i,r,a,o,l,c){Yt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c)}set(t,e,n,i,r,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],m=n[8],_=i[0],p=i[3],g=i[6],v=i[1],x=i[4],y=i[7],E=i[2],A=i[5],w=i[8];return r[0]=a*_+o*v+l*E,r[3]=a*p+o*x+l*A,r[6]=a*g+o*y+l*w,r[1]=c*_+h*v+d*E,r[4]=c*p+h*x+d*A,r[7]=c*g+h*y+d*w,r[2]=u*_+f*v+m*E,r[5]=u*p+f*x+m*A,r[8]=u*g+f*y+m*w,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*a-o*c,u=o*l-h*r,f=c*r-a*l,m=e*d+n*u+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/m;return t[0]=d*_,t[1]=(i*c-h*n)*_,t[2]=(o*n-i*a)*_,t[3]=u*_,t[4]=(h*e-i*l)*_,t[5]=(i*r-o*e)*_,t[6]=f*_,t[7]=(n*l-c*e)*_,t[8]=(a*e-n*r)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-i*c,i*l,-i*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(wl.makeScale(t,e)),this}rotate(t){return this.premultiply(wl.makeRotation(-t)),this}translate(t,e){return this.premultiply(wl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const wl=new Yt;function Tf(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}const tg={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function Cs(s,t){return new tg[s](t)}function Rr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Ef(){const s=Rr("canvas");return s.style.display="block",s}const Vh={};function Xa(s){s in Vh||(Vh[s]=!0,console.warn(s))}function eg(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function ng(s){const t=s.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function ig(s){const t=s.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Hh=new Yt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Gh=new Yt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),qs={[si]:{transfer:wr,primaries:Ar,luminanceCoefficients:[.2126,.7152,.0722],toReference:s=>s,fromReference:s=>s},[_n]:{transfer:de,primaries:Ar,luminanceCoefficients:[.2126,.7152,.0722],toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[Vr]:{transfer:wr,primaries:Tr,luminanceCoefficients:[.2289,.6917,.0793],toReference:s=>s.applyMatrix3(Gh),fromReference:s=>s.applyMatrix3(Hh)},[$o]:{transfer:de,primaries:Tr,luminanceCoefficients:[.2289,.6917,.0793],toReference:s=>s.convertSRGBToLinear().applyMatrix3(Gh),fromReference:s=>s.applyMatrix3(Hh).convertLinearToSRGB()}},sg=new Set([si,Vr]),ne={enabled:!0,_workingColorSpace:si,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!sg.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,t,e){if(this.enabled===!1||t===e||!t||!e)return s;const n=qs[t].toReference,i=qs[e].fromReference;return i(n(s))},fromWorkingColorSpace:function(s,t){return this.convert(s,this._workingColorSpace,t)},toWorkingColorSpace:function(s,t){return this.convert(s,t,this._workingColorSpace)},getPrimaries:function(s){return qs[s].primaries},getTransfer:function(s){return s===Zn?wr:qs[s].transfer},getLuminanceCoefficients:function(s,t=this._workingColorSpace){return s.fromArray(qs[t].luminanceCoefficients)}};function Ds(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Al(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let as;class Cf{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{as===void 0&&(as=Rr("canvas")),as.width=t.width,as.height=t.height;const n=as.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=as}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Rr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=Ds(r[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ds(e[n]/255)*255):e[n]=Ds(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let rg=0;class Wi{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rg++}),this.uuid=fn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Tl(i[a].image)):r.push(Tl(i[a]))}else r=Tl(i);n.url=r}return e||(t.images[this.uuid]=n),n}}function Tl(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Cf.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let ag=0;class ve extends zn{constructor(t=ve.DEFAULT_IMAGE,e=ve.DEFAULT_MAPPING,n=vn,i=vn,r=Re,a=Ln,o=$e,l=Fn,c=ve.DEFAULT_ANISOTROPY,h=Zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ag++}),this.uuid=fn(),this.name="",this.source=new Wi(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Q(0,0),this.repeat=new Q(1,1),this.center=new Q(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Yt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Vo)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case yr:t.x=t.x-Math.floor(t.x);break;case vn:t.x=t.x<0?0:1;break;case Mr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case yr:t.y=t.y-Math.floor(t.y);break;case vn:t.y=t.y<0?0:1;break;case Mr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ve.DEFAULT_IMAGE=null;ve.DEFAULT_MAPPING=Vo;ve.DEFAULT_ANISOTROPY=1;class te{constructor(t=0,e=0,n=0,i=1){te.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],m=l[9],_=l[2],p=l[6],g=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-_)<.01&&Math.abs(m-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+_)<.1&&Math.abs(m+p)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const x=(c+1)/2,y=(f+1)/2,E=(g+1)/2,A=(h+u)/4,w=(d+_)/4,P=(m+p)/4;return x>y&&x>E?x<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(x),i=A/n,r=w/n):y>E?y<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(y),n=A/i,r=P/i):E<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(E),n=w/r,i=P/r),this.set(n,i,r,e),this}let v=Math.sqrt((p-m)*(p-m)+(d-_)*(d-_)+(u-h)*(u-h));return Math.abs(v)<.001&&(v=1),this.x=(p-m)/v,this.y=(d-_)/v,this.z=(u-h)/v,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Rf extends zn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new te(0,0,t,e),this.scissorTest=!1,this.viewport=new te(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Re,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new ve(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Wi(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Tn extends Rf{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Ko extends ve{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class og extends Tn{constructor(t=1,e=1,n=1,i={}){super(t,e,i),this.isWebGLArrayRenderTarget=!0,this.depth=n,this.texture=new Ko(null,t,e,n),this.texture.isRenderTargetTexture=!0}}class Jc extends ve{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class lg extends Tn{constructor(t=1,e=1,n=1,i={}){super(t,e,i),this.isWebGL3DRenderTarget=!0,this.depth=n,this.texture=new Jc(null,t,e,n),this.texture.isRenderTargetTexture=!0}}class sn{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],d=n[i+3];const u=r[a+0],f=r[a+1],m=r[a+2],_=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=u,t[e+1]=f,t[e+2]=m,t[e+3]=_;return}if(d!==_||l!==u||c!==f||h!==m){let p=1-o;const g=l*u+c*f+h*m+d*_,v=g>=0?1:-1,x=1-g*g;if(x>Number.EPSILON){const E=Math.sqrt(x),A=Math.atan2(E,g*v);p=Math.sin(p*A)/E,o=Math.sin(o*A)/E}const y=o*v;if(l=l*p+u*y,c=c*p+f*y,h=h*p+m*y,d=d*p+_*y,p===1-o){const E=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=E,c*=E,h*=E,d*=E}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,i,r,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],d=r[a],u=r[a+1],f=r[a+2],m=r[a+3];return t[e]=o*m+h*d+l*f-c*u,t[e+1]=l*m+h*u+c*d-o*f,t[e+2]=c*m+h*f+o*u-l*d,t[e+3]=h*m-o*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),d=o(r/2),u=l(n/2),f=l(i/2),m=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"YXZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"ZXY":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"ZYX":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"YZX":this._x=u*h*d+c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d-u*f*m;break;case"XZY":this._x=u*h*d-c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d+u*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+o+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-i)*f}else if(n>o&&n>d){const f=2*Math.sqrt(1+n-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(r+c)/f}else if(o>d){const f=2*Math.sqrt(1+o-n-d);this._w=(r-c)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+d-n-o);this._w=(a-i)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(xe(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+i*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const f=1-e;return this._w=f*a+e*this._w,this._x=f*n+e*this._x,this._y=f*i+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=a*d+this._w*u,this._x=n*d+this._x*u,this._y=i*d+this._y*u,this._z=r*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{constructor(t=0,e=0,n=0){C.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Wh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Wh.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*i-o*n),h=2*(o*e-r*i),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=i+l*d+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return El.copy(this).projectOnVector(t),this.sub(El)}reflect(t){return this.sub(El.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(xe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const El=new C,Wh=new sn;class Ke{constructor(t=new C(1/0,1/0,1/0),e=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Mn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Mn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Mn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Mn):Mn.fromBufferAttribute(r,a),Mn.applyMatrix4(t.matrixWorld),this.expandByPoint(Mn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Jr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Jr.copy(n.boundingBox)),Jr.applyMatrix4(t.matrixWorld),this.union(Jr)}const i=t.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Mn),Mn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ys),Qr.subVectors(this.max,Ys),os.subVectors(t.a,Ys),ls.subVectors(t.b,Ys),cs.subVectors(t.c,Ys),ai.subVectors(ls,os),oi.subVectors(cs,ls),Si.subVectors(os,cs);let e=[0,-ai.z,ai.y,0,-oi.z,oi.y,0,-Si.z,Si.y,ai.z,0,-ai.x,oi.z,0,-oi.x,Si.z,0,-Si.x,-ai.y,ai.x,0,-oi.y,oi.x,0,-Si.y,Si.x,0];return!Cl(e,os,ls,cs,Qr)||(e=[1,0,0,0,1,0,0,0,1],!Cl(e,os,ls,cs,Qr))?!1:(jr.crossVectors(ai,oi),e=[jr.x,jr.y,jr.z],Cl(e,os,ls,cs,Qr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Mn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Mn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Hn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Hn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Hn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Hn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Hn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Hn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Hn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Hn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Hn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Hn=[new C,new C,new C,new C,new C,new C,new C,new C],Mn=new C,Jr=new Ke,os=new C,ls=new C,cs=new C,ai=new C,oi=new C,Si=new C,Ys=new C,Qr=new C,jr=new C,wi=new C;function Cl(s,t,e,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){wi.fromArray(s,r);const o=i.x*Math.abs(wi.x)+i.y*Math.abs(wi.y)+i.z*Math.abs(wi.z),l=t.dot(wi),c=e.dot(wi),h=n.dot(wi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const cg=new Ke,Zs=new C,Rl=new C;class We{constructor(t=new C,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):cg.setFromPoints(t).getCenter(n);let i=0;for(let r=0,a=t.length;r<a;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Zs.subVectors(t,this.center);const e=Zs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(Zs,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Rl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Zs.copy(t.center).add(Rl)),this.expandByPoint(Zs.copy(t.center).sub(Rl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Gn=new C,Pl=new C,ta=new C,li=new C,Il=new C,ea=new C,Ll=new C;class Hs{constructor(t=new C,e=new C(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Gn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Gn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Gn.copy(this.origin).addScaledVector(this.direction,e),Gn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Pl.copy(t).add(e).multiplyScalar(.5),ta.copy(e).sub(t).normalize(),li.copy(this.origin).sub(Pl);const r=t.distanceTo(e)*.5,a=-this.direction.dot(ta),o=li.dot(this.direction),l=-li.dot(ta),c=li.lengthSq(),h=Math.abs(1-a*a);let d,u,f,m;if(h>0)if(d=a*l-o,u=a*o-l,m=r*h,d>=0)if(u>=-m)if(u<=m){const _=1/h;d*=_,u*=_,f=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-m?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=m?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(Pl).addScaledVector(ta,u),f}intersectSphere(t,e){Gn.subVectors(t.center,this.origin);const n=Gn.dot(this.direction),i=Gn.dot(Gn)-n*n,r=t.radius*t.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,i=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,i=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Gn)!==null}intersectTriangle(t,e,n,i,r){Il.subVectors(e,t),ea.subVectors(n,t),Ll.crossVectors(Il,ea);let a=this.direction.dot(Ll),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;li.subVectors(this.origin,t);const l=o*this.direction.dot(ea.crossVectors(li,ea));if(l<0)return null;const c=o*this.direction.dot(Il.cross(li));if(c<0||l+c>a)return null;const h=-o*li.dot(Ll);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Bt{constructor(t,e,n,i,r,a,o,l,c,h,d,u,f,m,_,p){Bt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c,h,d,u,f,m,_,p)}set(t,e,n,i,r,a,o,l,c,h,d,u,f,m,_,p){const g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=i,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=c,g[6]=h,g[10]=d,g[14]=u,g[3]=f,g[7]=m,g[11]=_,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Bt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/hs.setFromMatrixColumn(t,0).length(),r=1/hs.setFromMatrixColumn(t,1).length(),a=1/hs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const u=a*h,f=a*d,m=o*h,_=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+m*c,e[5]=u-_*c,e[9]=-o*l,e[2]=_-u*c,e[6]=m+f*c,e[10]=a*l}else if(t.order==="YXZ"){const u=l*h,f=l*d,m=c*h,_=c*d;e[0]=u+_*o,e[4]=m*o-f,e[8]=a*c,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=f*o-m,e[6]=_+u*o,e[10]=a*l}else if(t.order==="ZXY"){const u=l*h,f=l*d,m=c*h,_=c*d;e[0]=u-_*o,e[4]=-a*d,e[8]=m+f*o,e[1]=f+m*o,e[5]=a*h,e[9]=_-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const u=a*h,f=a*d,m=o*h,_=o*d;e[0]=l*h,e[4]=m*c-f,e[8]=u*c+_,e[1]=l*d,e[5]=_*c+u,e[9]=f*c-m,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const u=a*l,f=a*c,m=o*l,_=o*c;e[0]=l*h,e[4]=_-u*d,e[8]=m*d+f,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*d+m,e[10]=u-_*d}else if(t.order==="XZY"){const u=a*l,f=a*c,m=o*l,_=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+_,e[5]=a*h,e[9]=f*d-m,e[2]=m*d-f,e[6]=o*h,e[10]=_*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(hg,t,ug)}lookAt(t,e,n){const i=this.elements;return hn.subVectors(t,e),hn.lengthSq()===0&&(hn.z=1),hn.normalize(),ci.crossVectors(n,hn),ci.lengthSq()===0&&(Math.abs(n.z)===1?hn.x+=1e-4:hn.z+=1e-4,hn.normalize(),ci.crossVectors(n,hn)),ci.normalize(),na.crossVectors(hn,ci),i[0]=ci.x,i[4]=na.x,i[8]=hn.x,i[1]=ci.y,i[5]=na.y,i[9]=hn.y,i[2]=ci.z,i[6]=na.z,i[10]=hn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],m=n[2],_=n[6],p=n[10],g=n[14],v=n[3],x=n[7],y=n[11],E=n[15],A=i[0],w=i[4],P=i[8],L=i[12],M=i[1],b=i[5],B=i[9],N=i[13],U=i[2],q=i[6],z=i[10],X=i[14],W=i[3],_t=i[7],yt=i[11],it=i[15];return r[0]=a*A+o*M+l*U+c*W,r[4]=a*w+o*b+l*q+c*_t,r[8]=a*P+o*B+l*z+c*yt,r[12]=a*L+o*N+l*X+c*it,r[1]=h*A+d*M+u*U+f*W,r[5]=h*w+d*b+u*q+f*_t,r[9]=h*P+d*B+u*z+f*yt,r[13]=h*L+d*N+u*X+f*it,r[2]=m*A+_*M+p*U+g*W,r[6]=m*w+_*b+p*q+g*_t,r[10]=m*P+_*B+p*z+g*yt,r[14]=m*L+_*N+p*X+g*it,r[3]=v*A+x*M+y*U+E*W,r[7]=v*w+x*b+y*q+E*_t,r[11]=v*P+x*B+y*z+E*yt,r[15]=v*L+x*N+y*X+E*it,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],m=t[3],_=t[7],p=t[11],g=t[15];return m*(+r*l*d-i*c*d-r*o*u+n*c*u+i*o*f-n*l*f)+_*(+e*l*f-e*c*u+r*a*u-i*a*f+i*c*h-r*l*h)+p*(+e*c*d-e*o*f-r*a*d+n*a*f+r*o*h-n*c*h)+g*(-i*o*h-e*l*d+e*o*u+i*a*d-n*a*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],m=t[12],_=t[13],p=t[14],g=t[15],v=d*p*c-_*u*c+_*l*f-o*p*f-d*l*g+o*u*g,x=m*u*c-h*p*c-m*l*f+a*p*f+h*l*g-a*u*g,y=h*_*c-m*d*c+m*o*f-a*_*f-h*o*g+a*d*g,E=m*d*l-h*_*l-m*o*u+a*_*u+h*o*p-a*d*p,A=e*v+n*x+i*y+r*E;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/A;return t[0]=v*w,t[1]=(_*u*r-d*p*r-_*i*f+n*p*f+d*i*g-n*u*g)*w,t[2]=(o*p*r-_*l*r+_*i*c-n*p*c-o*i*g+n*l*g)*w,t[3]=(d*l*r-o*u*r-d*i*c+n*u*c+o*i*f-n*l*f)*w,t[4]=x*w,t[5]=(h*p*r-m*u*r+m*i*f-e*p*f-h*i*g+e*u*g)*w,t[6]=(m*l*r-a*p*r-m*i*c+e*p*c+a*i*g-e*l*g)*w,t[7]=(a*u*r-h*l*r+h*i*c-e*u*c-a*i*f+e*l*f)*w,t[8]=y*w,t[9]=(m*d*r-h*_*r-m*n*f+e*_*f+h*n*g-e*d*g)*w,t[10]=(a*_*r-m*o*r+m*n*c-e*_*c-a*n*g+e*o*g)*w,t[11]=(h*o*r-a*d*r-h*n*c+e*d*c+a*n*f-e*o*f)*w,t[12]=E*w,t[13]=(h*_*i-m*d*i+m*n*u-e*_*u-h*n*p+e*d*p)*w,t[14]=(m*o*i-a*_*i-m*n*l+e*_*l+a*n*p-e*o*p)*w,t[15]=(a*d*i-h*o*i+h*n*l-e*d*l-a*n*u+e*o*u)*w,this}scale(t){const e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,a){return this.set(1,n,r,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,d=o+o,u=r*c,f=r*h,m=r*d,_=a*h,p=a*d,g=o*d,v=l*c,x=l*h,y=l*d,E=n.x,A=n.y,w=n.z;return i[0]=(1-(_+g))*E,i[1]=(f+y)*E,i[2]=(m-x)*E,i[3]=0,i[4]=(f-y)*A,i[5]=(1-(u+g))*A,i[6]=(p+v)*A,i[7]=0,i[8]=(m+x)*w,i[9]=(p-v)*w,i[10]=(1-(u+_))*w,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let r=hs.set(i[0],i[1],i[2]).length();const a=hs.set(i[4],i[5],i[6]).length(),o=hs.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),t.x=i[12],t.y=i[13],t.z=i[14],bn.copy(this);const c=1/r,h=1/a,d=1/o;return bn.elements[0]*=c,bn.elements[1]*=c,bn.elements[2]*=c,bn.elements[4]*=h,bn.elements[5]*=h,bn.elements[6]*=h,bn.elements[8]*=d,bn.elements[9]*=d,bn.elements[10]*=d,e.setFromRotationMatrix(bn),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,i,r,a,o=Dn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-i),d=(e+t)/(e-t),u=(n+i)/(n-i);let f,m;if(o===Dn)f=-(a+r)/(a-r),m=-2*a*r/(a-r);else if(o===Cr)f=-a/(a-r),m=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,r,a,o=Dn){const l=this.elements,c=1/(e-t),h=1/(n-i),d=1/(a-r),u=(e+t)*c,f=(n+i)*h;let m,_;if(o===Dn)m=(a+r)*d,_=-2*d;else if(o===Cr)m=r*d,_=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=_,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const hs=new C,bn=new Bt,hg=new C(0,0,0),ug=new C(1,1,1),ci=new C,na=new C,hn=new C,Xh=new Bt,qh=new sn;class pn{constructor(t=0,e=0,n=0,i=pn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],d=i[2],u=i[6],f=i[10];switch(e){case"XYZ":this._y=Math.asin(xe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-xe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(xe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-xe(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(xe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-xe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Xh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Xh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return qh.setFromEuler(this),this.setFromQuaternion(qh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}pn.DEFAULT_ORDER="XYZ";class Jo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let dg=0;const Yh=new C,us=new sn,Wn=new Bt,ia=new C,$s=new C,fg=new C,pg=new sn,Zh=new C(1,0,0),$h=new C(0,1,0),Kh=new C(0,0,1),Jh={type:"added"},mg={type:"removed"},ds={type:"childadded",child:null},Dl={type:"childremoved",child:null};class ee extends zn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dg++}),this.uuid=fn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ee.DEFAULT_UP.clone();const t=new C,e=new pn,n=new sn,i=new C(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Bt},normalMatrix:{value:new Yt}}),this.matrix=new Bt,this.matrixWorld=new Bt,this.matrixAutoUpdate=ee.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ee.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return us.setFromAxisAngle(t,e),this.quaternion.multiply(us),this}rotateOnWorldAxis(t,e){return us.setFromAxisAngle(t,e),this.quaternion.premultiply(us),this}rotateX(t){return this.rotateOnAxis(Zh,t)}rotateY(t){return this.rotateOnAxis($h,t)}rotateZ(t){return this.rotateOnAxis(Kh,t)}translateOnAxis(t,e){return Yh.copy(t).applyQuaternion(this.quaternion),this.position.add(Yh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Zh,t)}translateY(t){return this.translateOnAxis($h,t)}translateZ(t){return this.translateOnAxis(Kh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Wn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ia.copy(t):ia.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),$s.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Wn.lookAt($s,ia,this.up):Wn.lookAt(ia,$s,this.up),this.quaternion.setFromRotationMatrix(Wn),i&&(Wn.extractRotation(i.matrixWorld),us.setFromRotationMatrix(Wn),this.quaternion.premultiply(us.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Jh),ds.child=t,this.dispatchEvent(ds),ds.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(mg),Dl.child=t,this.dispatchEvent(Dl),Dl.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Wn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Wn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Wn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Jh),ds.child=t,this.dispatchEvent(ds),ds.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,t,fg),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,pg,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));i.material=o}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),d=a(t.shapes),u=a(t.skeletons),f=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}ee.DEFAULT_UP=new C(0,1,0);ee.DEFAULT_MATRIX_AUTO_UPDATE=!0;ee.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Sn=new C,Xn=new C,Ul=new C,qn=new C,fs=new C,ps=new C,Qh=new C,Nl=new C,Fl=new C,Ol=new C,Bl=new te,zl=new te,kl=new te;class en{constructor(t=new C,e=new C,n=new C){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Sn.subVectors(t,e),i.cross(Sn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){Sn.subVectors(i,e),Xn.subVectors(n,e),Ul.subVectors(t,e);const a=Sn.dot(Sn),o=Sn.dot(Xn),l=Sn.dot(Ul),c=Xn.dot(Xn),h=Xn.dot(Ul),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;const u=1/d,f=(c*l-o*h)*u,m=(a*h-o*l)*u;return r.set(1-f-m,m,f)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,qn)===null?!1:qn.x>=0&&qn.y>=0&&qn.x+qn.y<=1}static getInterpolation(t,e,n,i,r,a,o,l){return this.getBarycoord(t,e,n,i,qn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,qn.x),l.addScaledVector(a,qn.y),l.addScaledVector(o,qn.z),l)}static getInterpolatedAttribute(t,e,n,i,r,a){return Bl.setScalar(0),zl.setScalar(0),kl.setScalar(0),Bl.fromBufferAttribute(t,e),zl.fromBufferAttribute(t,n),kl.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(Bl,r.x),a.addScaledVector(zl,r.y),a.addScaledVector(kl,r.z),a}static isFrontFacing(t,e,n,i){return Sn.subVectors(n,e),Xn.subVectors(t,e),Sn.cross(Xn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Sn.subVectors(this.c,this.b),Xn.subVectors(this.a,this.b),Sn.cross(Xn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return en.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return en.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return en.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return en.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return en.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,r=this.c;let a,o;fs.subVectors(i,n),ps.subVectors(r,n),Nl.subVectors(t,n);const l=fs.dot(Nl),c=ps.dot(Nl);if(l<=0&&c<=0)return e.copy(n);Fl.subVectors(t,i);const h=fs.dot(Fl),d=ps.dot(Fl);if(h>=0&&d<=h)return e.copy(i);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(fs,a);Ol.subVectors(t,r);const f=fs.dot(Ol),m=ps.dot(Ol);if(m>=0&&f<=m)return e.copy(r);const _=f*c-l*m;if(_<=0&&c>=0&&m<=0)return o=c/(c-m),e.copy(n).addScaledVector(ps,o);const p=h*m-f*d;if(p<=0&&d-h>=0&&f-m>=0)return Qh.subVectors(r,i),o=(d-h)/(d-h+(f-m)),e.copy(i).addScaledVector(Qh,o);const g=1/(p+_+u);return a=_*g,o=u*g,e.copy(n).addScaledVector(fs,a).addScaledVector(ps,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Pf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},hi={h:0,s:0,l:0},sa={h:0,s:0,l:0};function Vl(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class ft{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=_n){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ne.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=ne.workingColorSpace){return this.r=t,this.g=e,this.b=n,ne.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=ne.workingColorSpace){if(t=Kc(t,1),e=xe(e,0,1),n=xe(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Vl(a,r,t+1/3),this.g=Vl(a,r,t),this.b=Vl(a,r,t-1/3)}return ne.toWorkingColorSpace(this,i),this}setStyle(t,e=_n){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=_n){const n=Pf[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ds(t.r),this.g=Ds(t.g),this.b=Ds(t.b),this}copyLinearToSRGB(t){return this.r=Al(t.r),this.g=Al(t.g),this.b=Al(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=_n){return ne.fromWorkingColorSpace(Ve.copy(this),t),Math.round(xe(Ve.r*255,0,255))*65536+Math.round(xe(Ve.g*255,0,255))*256+Math.round(xe(Ve.b*255,0,255))}getHexString(t=_n){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ne.workingColorSpace){ne.fromWorkingColorSpace(Ve.copy(this),e);const n=Ve.r,i=Ve.g,r=Ve.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(i-r)/d+(i<r?6:0);break;case i:l=(r-n)/d+2;break;case r:l=(n-i)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ne.workingColorSpace){return ne.fromWorkingColorSpace(Ve.copy(this),e),t.r=Ve.r,t.g=Ve.g,t.b=Ve.b,t}getStyle(t=_n){ne.fromWorkingColorSpace(Ve.copy(this),t);const e=Ve.r,n=Ve.g,i=Ve.b;return t!==_n?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(hi),this.setHSL(hi.h+t,hi.s+e,hi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(hi),t.getHSL(sa);const n=pr(hi.h,sa.h,e),i=pr(hi.s,sa.s,e),r=pr(hi.l,sa.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ve=new ft;ft.NAMES=Pf;let gg=0;class Xe extends zn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:gg++}),this.uuid=fn(),this.name="",this.type="Material",this.blending=Yi,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ka,this.blendDst=Ja,this.blendEquation=mi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ft(0,0,0),this.blendAlpha=0,this.depthFunc=Ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Oi,this.stencilZFail=Oi,this.stencilZPass=Oi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Yi&&(n.blending=this.blending),this.side!==jn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ka&&(n.blendSrc=this.blendSrc),this.blendDst!==Ja&&(n.blendDst=this.blendDst),this.blendEquation!==mi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ji&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Oi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Oi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Oi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=i(t.textures),a=i(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class he extends Xe{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.combine=zr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const $n=_g();function _g(){const s=new ArrayBuffer(4),t=new Float32Array(s),e=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let l=0;l<256;++l){const c=l-127;c<-27?(n[l]=0,n[l|256]=32768,i[l]=24,i[l|256]=24):c<-14?(n[l]=1024>>-c-14,n[l|256]=1024>>-c-14|32768,i[l]=-c-1,i[l|256]=-c-1):c<=15?(n[l]=c+15<<10,n[l|256]=c+15<<10|32768,i[l]=13,i[l|256]=13):c<128?(n[l]=31744,n[l|256]=64512,i[l]=24,i[l|256]=24):(n[l]=31744,n[l|256]=64512,i[l]=13,i[l|256]=13)}const r=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;!(c&8388608);)c<<=1,h-=8388608;c&=-8388609,h+=947912704,r[l]=c|h}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:t,uint32View:e,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:a,offsetTable:o}}function je(s){Math.abs(s)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),s=xe(s,-65504,65504),$n.floatView[0]=s;const t=$n.uint32View[0],e=t>>23&511;return $n.baseTable[e]+((t&8388607)>>$n.shiftTable[e])}function rr(s){const t=s>>10;return $n.uint32View[0]=$n.mantissaTable[$n.offsetTable[t]+(s&1023)]+$n.exponentTable[t],$n.floatView[0]}const xg={toHalfFloat:je,fromHalfFloat:rr},Ee=new C,ra=new Q;class se{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Er,this.updateRanges=[],this.gpuType=nn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ra.fromBufferAttribute(this,e),ra.applyMatrix3(t),this.setXY(e,ra.x,ra.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix3(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix4(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyNormalMatrix(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.transformDirection(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ze(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Zt(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ze(e,this.array)),e}setX(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ze(e,this.array)),e}setY(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ze(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ze(e,this.array)),e}setW(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array),r=Zt(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Er&&(t.usage=this.usage),t}}class vg extends se{constructor(t,e,n){super(new Int8Array(t),e,n)}}class yg extends se{constructor(t,e,n){super(new Uint8Array(t),e,n)}}class Mg extends se{constructor(t,e,n){super(new Uint8ClampedArray(t),e,n)}}class bg extends se{constructor(t,e,n){super(new Int16Array(t),e,n)}}class Qc extends se{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Sg extends se{constructor(t,e,n){super(new Int32Array(t),e,n)}}class jc extends se{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class wg extends se{constructor(t,e,n){super(new Uint16Array(t),e,n),this.isFloat16BufferAttribute=!0}getX(t){let e=rr(this.array[t*this.itemSize]);return this.normalized&&(e=Ze(e,this.array)),e}setX(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize]=je(e),this}getY(t){let e=rr(this.array[t*this.itemSize+1]);return this.normalized&&(e=Ze(e,this.array)),e}setY(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+1]=je(e),this}getZ(t){let e=rr(this.array[t*this.itemSize+2]);return this.normalized&&(e=Ze(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+2]=je(e),this}getW(t){let e=rr(this.array[t*this.itemSize+3]);return this.normalized&&(e=Ze(e,this.array)),e}setW(t,e){return this.normalized&&(e=Zt(e,this.array)),this.array[t*this.itemSize+3]=je(e),this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array)),this.array[t+0]=je(e),this.array[t+1]=je(n),this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array)),this.array[t+0]=je(e),this.array[t+1]=je(n),this.array[t+2]=je(i),this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array),r=Zt(r,this.array)),this.array[t+0]=je(e),this.array[t+1]=je(n),this.array[t+2]=je(i),this.array[t+3]=je(r),this}}class Pt extends se{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Ag=0;const gn=new Bt,Hl=new ee,ms=new C,un=new Ke,Ks=new Ke,Ue=new C;class Xt extends zn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ag++}),this.uuid=fn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Tf(t)?jc:Qc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Yt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return gn.makeRotationFromQuaternion(t),this.applyMatrix4(gn),this}rotateX(t){return gn.makeRotationX(t),this.applyMatrix4(gn),this}rotateY(t){return gn.makeRotationY(t),this.applyMatrix4(gn),this}rotateZ(t){return gn.makeRotationZ(t),this.applyMatrix4(gn),this}translate(t,e,n){return gn.makeTranslation(t,e,n),this.applyMatrix4(gn),this}scale(t,e,n){return gn.makeScale(t,e,n),this.applyMatrix4(gn),this}lookAt(t){return Hl.lookAt(t),Hl.updateMatrix(),this.applyMatrix4(Hl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ms).negate(),this.translate(ms.x,ms.y,ms.z),this}setFromPoints(t){const e=[];for(let n=0,i=t.length;n<i;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Pt(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ke);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const r=e[n];un.setFromBufferAttribute(r),this.morphTargetsRelative?(Ue.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(Ue),Ue.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(Ue)):(this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new We);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(t){const n=this.boundingSphere.center;if(un.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Ks.setFromBufferAttribute(o),this.morphTargetsRelative?(Ue.addVectors(un.min,Ks.min),un.expandByPoint(Ue),Ue.addVectors(un.max,Ks.max),un.expandByPoint(Ue)):(un.expandByPoint(Ks.min),un.expandByPoint(Ks.max))}un.getCenter(n);let i=0;for(let r=0,a=t.count;r<a;r++)Ue.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(Ue));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ue.fromBufferAttribute(o,c),l&&(ms.fromBufferAttribute(t,c),Ue.add(ms)),i=Math.max(i,n.distanceToSquared(Ue))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new se(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let P=0;P<n.count;P++)o[P]=new C,l[P]=new C;const c=new C,h=new C,d=new C,u=new Q,f=new Q,m=new Q,_=new C,p=new C;function g(P,L,M){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,L),d.fromBufferAttribute(n,M),u.fromBufferAttribute(r,P),f.fromBufferAttribute(r,L),m.fromBufferAttribute(r,M),h.sub(c),d.sub(c),f.sub(u),m.sub(u);const b=1/(f.x*m.y-m.x*f.y);isFinite(b)&&(_.copy(h).multiplyScalar(m.y).addScaledVector(d,-f.y).multiplyScalar(b),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(b),o[P].add(_),o[L].add(_),o[M].add(_),l[P].add(p),l[L].add(p),l[M].add(p))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let P=0,L=v.length;P<L;++P){const M=v[P],b=M.start,B=M.count;for(let N=b,U=b+B;N<U;N+=3)g(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const x=new C,y=new C,E=new C,A=new C;function w(P){E.fromBufferAttribute(i,P),A.copy(E);const L=o[P];x.copy(L),x.sub(E.multiplyScalar(E.dot(L))).normalize(),y.crossVectors(A,L);const b=y.dot(l[P])<0?-1:1;a.setXYZW(P,x.x,x.y,x.z,b)}for(let P=0,L=v.length;P<L;++P){const M=v[P],b=M.start,B=M.count;for(let N=b,U=b+B;N<U;N+=3)w(t.getX(N+0)),w(t.getX(N+1)),w(t.getX(N+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new se(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const i=new C,r=new C,a=new C,o=new C,l=new C,c=new C,h=new C,d=new C;if(t)for(let u=0,f=t.count;u<f;u+=3){const m=t.getX(u+0),_=t.getX(u+1),p=t.getX(u+2);i.fromBufferAttribute(e,m),r.fromBufferAttribute(e,_),a.fromBufferAttribute(e,p),h.subVectors(a,r),d.subVectors(i,r),h.cross(d),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,p),o.add(h),l.add(h),c.add(h),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)i.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),d.subVectors(i,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ue.fromBufferAttribute(t,e),Ue.normalize(),t.setXYZ(e,Ue.x,Ue.y,Ue.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h);let f=0,m=0;for(let _=0,p=l.length;_<p;_++){o.isInterleavedBufferAttribute?f=l[_]*o.data.stride+o.offset:f=l[_]*h;for(let g=0;g<h;g++)u[m++]=c[f++]}return new se(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Xt,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){const u=c[h],f=t(u,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(i[l]=h,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const jh=new Bt,Ai=new Hs,aa=new We,tu=new C,oa=new C,la=new C,ca=new C,Gl=new C,ha=new C,eu=new C,ua=new C;class at extends ee{constructor(t=new Xt,e=new he){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(r&&o){ha.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],d=r[l];h!==0&&(Gl.fromBufferAttribute(d,t),a?ha.addScaledVector(Gl,h):ha.addScaledVector(Gl.sub(e),h))}e.add(ha)}return e}raycast(t,e){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),aa.copy(n.boundingSphere),aa.applyMatrix4(r),Ai.copy(t.ray).recast(t.near),!(aa.containsPoint(Ai.origin)===!1&&(Ai.intersectSphere(aa,tu)===null||Ai.origin.distanceToSquared(tu)>(t.far-t.near)**2))&&(jh.copy(r).invert(),Ai.copy(t.ray).applyMatrix4(jh),!(n.boundingBox!==null&&Ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ai)))}_computeIntersections(t,e,n){let i;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,_=u.length;m<_;m++){const p=u[m],g=a[p.materialIndex],v=Math.max(p.start,f.start),x=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let y=v,E=x;y<E;y+=3){const A=o.getX(y),w=o.getX(y+1),P=o.getX(y+2);i=da(this,g,t,n,c,h,d,A,w,P),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(o.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){const v=o.getX(p),x=o.getX(p+1),y=o.getX(p+2);i=da(this,a,t,n,c,h,d,v,x,y),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,_=u.length;m<_;m++){const p=u[m],g=a[p.materialIndex],v=Math.max(p.start,f.start),x=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let y=v,E=x;y<E;y+=3){const A=y,w=y+1,P=y+2;i=da(this,g,t,n,c,h,d,A,w,P),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=p.materialIndex,e.push(i))}}else{const m=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let p=m,g=_;p<g;p+=3){const v=p,x=p+1,y=p+2;i=da(this,a,t,n,c,h,d,v,x,y),i&&(i.faceIndex=Math.floor(p/3),e.push(i))}}}}function Tg(s,t,e,n,i,r,a,o){let l;if(t.side===Ae?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,t.side===jn,o),l===null)return null;ua.copy(o),ua.applyMatrix4(s.matrixWorld);const c=e.ray.origin.distanceTo(ua);return c<e.near||c>e.far?null:{distance:c,point:ua.clone(),object:s}}function da(s,t,e,n,i,r,a,o,l,c){s.getVertexPosition(o,oa),s.getVertexPosition(l,la),s.getVertexPosition(c,ca);const h=Tg(s,t,e,n,oa,la,ca,eu);if(h){const d=new C;en.getBarycoord(eu,oa,la,ca,d),i&&(h.uv=en.getInterpolatedAttribute(i,o,l,c,d,new Q)),r&&(h.uv1=en.getInterpolatedAttribute(r,o,l,c,d,new Q)),a&&(h.normal=en.getInterpolatedAttribute(a,o,l,c,d,new C),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new C,materialIndex:0};en.getNormal(oa,la,ca,u.normal),h.face=u,h.barycoord=d}return h}class Pe extends Xt{constructor(t=1,e=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],d=[];let u=0,f=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,i,a,2),m("x","z","y",1,-1,t,n,-e,i,a,3),m("x","y","z",1,-1,t,e,n,i,r,4),m("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new Pt(c,3)),this.setAttribute("normal",new Pt(h,3)),this.setAttribute("uv",new Pt(d,2));function m(_,p,g,v,x,y,E,A,w,P,L){const M=y/w,b=E/P,B=y/2,N=E/2,U=A/2,q=w+1,z=P+1;let X=0,W=0;const _t=new C;for(let yt=0;yt<z;yt++){const it=yt*b-N;for(let ct=0;ct<q;ct++){const Et=ct*M-B;_t[_]=Et*v,_t[p]=it*x,_t[g]=U,c.push(_t.x,_t.y,_t.z),_t[_]=0,_t[p]=0,_t[g]=A>0?1:-1,h.push(_t.x,_t.y,_t.z),d.push(ct/w),d.push(1-yt/P),X+=1}}for(let yt=0;yt<P;yt++)for(let it=0;it<w;it++){const ct=u+it+q*yt,Et=u+it+q*(yt+1),V=u+(it+1)+q*(yt+1),Z=u+(it+1)+q*yt;l.push(ct,Et,Z),l.push(Et,V,Z),W+=6}o.addGroup(f,W,L),f+=W,u+=X}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Pe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Os(s){const t={};for(const e in s){t[e]={};for(const n in s[e]){const i=s[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function Ye(s){const t={};for(let e=0;e<s.length;e++){const n=Os(s[e]);for(const i in n)t[i]=n[i]}return t}function Eg(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function If(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ne.workingColorSpace}const Lf={clone:Os,merge:Ye};var Cg=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Rg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class an extends Xe{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Cg,this.fragmentShader=Rg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Os(t.uniforms),this.uniformsGroups=Eg(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Qo extends ee{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Bt,this.projectionMatrix=new Bt,this.projectionMatrixInverse=new Bt,this.coordinateSystem=Dn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ui=new C,nu=new Q,iu=new Q;class Ne extends Qo{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Fs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan($i*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Fs*2*Math.atan(Math.tan($i*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ui.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ui.x,ui.y).multiplyScalar(-t/ui.z),ui.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ui.x,ui.y).multiplyScalar(-t/ui.z)}getViewSize(t,e){return this.getViewBounds(t,nu,iu),e.subVectors(iu,nu)}setViewOffset(t,e,n,i,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan($i*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,e-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const gs=-90,_s=1;class Df extends ee{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Ne(gs,_s,t,e);i.layers=this.layers,this.add(i);const r=new Ne(gs,_s,t,e);r.layers=this.layers,this.add(r);const a=new Ne(gs,_s,t,e);a.layers=this.layers,this.add(a);const o=new Ne(gs,_s,t,e);o.layers=this.layers,this.add(o);const l=new Ne(gs,_s,t,e);l.layers=this.layers,this.add(l);const c=new Ne(gs,_s,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===Dn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Cr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,r),t.setRenderTarget(n,1,i),t.render(e,a),t.setRenderTarget(n,2,i),t.render(e,o),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class Hr extends ve{constructor(t,e,n,i,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:ti,super(t,e,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Uf extends Tn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new Hr(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Re}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Pe(5,5,5),r=new an({name:"CubemapFromEquirect",uniforms:Os(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ae,blending:Jn});r.uniforms.tEquirect.value=e;const a=new at(i,r),o=e.minFilter;return e.minFilter===Ln&&(e.minFilter=Re),new Df(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,i){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(r)}}const Wl=new C,Pg=new C,Ig=new Yt;class pi{constructor(t=new C(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Wl.subVectors(n,e).cross(Pg.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Wl),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Ig.getNormalMatrix(t),i=this.coplanarPoint(Wl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ti=new We,fa=new C;class Gr{constructor(t=new pi,e=new pi,n=new pi,i=new pi,r=new pi,a=new pi){this.planes=[t,e,n,i,r,a]}set(t,e,n,i,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Dn){const n=this.planes,i=t.elements,r=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],d=i[6],u=i[7],f=i[8],m=i[9],_=i[10],p=i[11],g=i[12],v=i[13],x=i[14],y=i[15];if(n[0].setComponents(l-r,u-c,p-f,y-g).normalize(),n[1].setComponents(l+r,u+c,p+f,y+g).normalize(),n[2].setComponents(l+a,u+h,p+m,y+v).normalize(),n[3].setComponents(l-a,u-h,p-m,y-v).normalize(),n[4].setComponents(l-o,u-d,p-_,y-x).normalize(),e===Dn)n[5].setComponents(l+o,u+d,p+_,y+x).normalize();else if(e===Cr)n[5].setComponents(o,d,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(t){return Ti.center.set(0,0,0),Ti.radius=.7071067811865476,Ti.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(fa.x=i.normal.x>0?t.max.x:t.min.x,fa.y=i.normal.y>0?t.max.y:t.min.y,fa.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(fa)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Nf(){let s=null,t=!1,e=null,n=null;function i(r,a){e(r,a),n=s.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function Lg(s){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,d=c.byteLength,u=s.createBuffer();s.bindBuffer(l,u),s.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=s.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=s.SHORT;else if(c instanceof Uint32Array)f=s.UNSIGNED_INT;else if(c instanceof Int32Array)f=s.INT;else if(c instanceof Int8Array)f=s.BYTE;else if(c instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const h=l.array,d=l.updateRanges;if(s.bindBuffer(c,o),d.length===0)s.bufferSubData(c,0,h);else{d.sort((f,m)=>f.start-m.start);let u=0;for(let f=1;f<d.length;f++){const m=d[u],_=d[f];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++u,d[u]=_)}d.length=u+1;for(let f=0,m=d.length;f<m;f++){const _=d[f];s.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(s.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}class On extends Xt{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,d=t/o,u=e/l,f=[],m=[],_=[],p=[];for(let g=0;g<h;g++){const v=g*u-a;for(let x=0;x<c;x++){const y=x*d-r;m.push(y,-v,0),_.push(0,0,1),p.push(x/o),p.push(1-g/l)}}for(let g=0;g<l;g++)for(let v=0;v<o;v++){const x=v+c*g,y=v+c*(g+1),E=v+1+c*(g+1),A=v+1+c*g;f.push(x,y,A),f.push(y,E,A)}this.setIndex(f),this.setAttribute("position",new Pt(m,3)),this.setAttribute("normal",new Pt(_,3)),this.setAttribute("uv",new Pt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new On(t.width,t.height,t.widthSegments,t.heightSegments)}}var Dg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ug=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ng=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Og=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bg=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,zg=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,kg=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Vg=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Hg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Gg=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Wg=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xg=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,qg=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Yg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Zg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,$g=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Kg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Jg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Qg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,jg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,t0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,e0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,n0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,i0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,s0=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,r0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,a0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,o0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,l0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,c0="gl_FragColor = linearToOutputTexel( gl_FragColor );",h0=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,u0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,d0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,f0=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,p0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,m0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,g0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,_0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,x0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,v0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,y0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,M0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,b0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,S0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,w0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,A0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,T0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,E0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,C0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,R0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,P0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,I0=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,L0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,D0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,U0=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,N0=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,F0=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,O0=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,B0=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,z0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,k0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,V0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,H0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,G0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,W0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,X0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,q0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Y0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Z0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,$0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,K0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,J0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Q0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,j0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,t_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,e_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,n_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,i_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,s_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,r_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,a_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,o_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,l_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,c_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,h_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,u_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,d_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,f_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,p_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,m_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,g_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,__=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,x_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,v_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,y_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,M_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,b_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,S_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,w_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,A_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,T_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,E_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,C_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,R_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,P_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,I_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const L_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,D_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,U_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,N_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,F_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,O_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,B_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,z_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,k_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,V_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,H_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,G_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,W_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,X_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,q_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Y_=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Z_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,K_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,J_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Q_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,j_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,tx=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ex=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nx=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,ix=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ax=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,ox=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,lx=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,hx=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ux=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$t={alphahash_fragment:Dg,alphahash_pars_fragment:Ug,alphamap_fragment:Ng,alphamap_pars_fragment:Fg,alphatest_fragment:Og,alphatest_pars_fragment:Bg,aomap_fragment:zg,aomap_pars_fragment:kg,batching_pars_vertex:Vg,batching_vertex:Hg,begin_vertex:Gg,beginnormal_vertex:Wg,bsdfs:Xg,iridescence_fragment:qg,bumpmap_pars_fragment:Yg,clipping_planes_fragment:Zg,clipping_planes_pars_fragment:$g,clipping_planes_pars_vertex:Kg,clipping_planes_vertex:Jg,color_fragment:Qg,color_pars_fragment:jg,color_pars_vertex:t0,color_vertex:e0,common:n0,cube_uv_reflection_fragment:i0,defaultnormal_vertex:s0,displacementmap_pars_vertex:r0,displacementmap_vertex:a0,emissivemap_fragment:o0,emissivemap_pars_fragment:l0,colorspace_fragment:c0,colorspace_pars_fragment:h0,envmap_fragment:u0,envmap_common_pars_fragment:d0,envmap_pars_fragment:f0,envmap_pars_vertex:p0,envmap_physical_pars_fragment:A0,envmap_vertex:m0,fog_vertex:g0,fog_pars_vertex:_0,fog_fragment:x0,fog_pars_fragment:v0,gradientmap_pars_fragment:y0,lightmap_pars_fragment:M0,lights_lambert_fragment:b0,lights_lambert_pars_fragment:S0,lights_pars_begin:w0,lights_toon_fragment:T0,lights_toon_pars_fragment:E0,lights_phong_fragment:C0,lights_phong_pars_fragment:R0,lights_physical_fragment:P0,lights_physical_pars_fragment:I0,lights_fragment_begin:L0,lights_fragment_maps:D0,lights_fragment_end:U0,logdepthbuf_fragment:N0,logdepthbuf_pars_fragment:F0,logdepthbuf_pars_vertex:O0,logdepthbuf_vertex:B0,map_fragment:z0,map_pars_fragment:k0,map_particle_fragment:V0,map_particle_pars_fragment:H0,metalnessmap_fragment:G0,metalnessmap_pars_fragment:W0,morphinstance_vertex:X0,morphcolor_vertex:q0,morphnormal_vertex:Y0,morphtarget_pars_vertex:Z0,morphtarget_vertex:$0,normal_fragment_begin:K0,normal_fragment_maps:J0,normal_pars_fragment:Q0,normal_pars_vertex:j0,normal_vertex:t_,normalmap_pars_fragment:e_,clearcoat_normal_fragment_begin:n_,clearcoat_normal_fragment_maps:i_,clearcoat_pars_fragment:s_,iridescence_pars_fragment:r_,opaque_fragment:a_,packing:o_,premultiplied_alpha_fragment:l_,project_vertex:c_,dithering_fragment:h_,dithering_pars_fragment:u_,roughnessmap_fragment:d_,roughnessmap_pars_fragment:f_,shadowmap_pars_fragment:p_,shadowmap_pars_vertex:m_,shadowmap_vertex:g_,shadowmask_pars_fragment:__,skinbase_vertex:x_,skinning_pars_vertex:v_,skinning_vertex:y_,skinnormal_vertex:M_,specularmap_fragment:b_,specularmap_pars_fragment:S_,tonemapping_fragment:w_,tonemapping_pars_fragment:A_,transmission_fragment:T_,transmission_pars_fragment:E_,uv_pars_fragment:C_,uv_pars_vertex:R_,uv_vertex:P_,worldpos_vertex:I_,background_vert:L_,background_frag:D_,backgroundCube_vert:U_,backgroundCube_frag:N_,cube_vert:F_,cube_frag:O_,depth_vert:B_,depth_frag:z_,distanceRGBA_vert:k_,distanceRGBA_frag:V_,equirect_vert:H_,equirect_frag:G_,linedashed_vert:W_,linedashed_frag:X_,meshbasic_vert:q_,meshbasic_frag:Y_,meshlambert_vert:Z_,meshlambert_frag:$_,meshmatcap_vert:K_,meshmatcap_frag:J_,meshnormal_vert:Q_,meshnormal_frag:j_,meshphong_vert:tx,meshphong_frag:ex,meshphysical_vert:nx,meshphysical_frag:ix,meshtoon_vert:sx,meshtoon_frag:rx,points_vert:ax,points_frag:ox,shadow_vert:lx,shadow_frag:cx,sprite_vert:hx,sprite_frag:ux},gt={common:{diffuse:{value:new ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Yt}},envmap:{envMap:{value:null},envMapRotation:{value:new Yt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Yt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Yt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Yt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Yt},normalScale:{value:new Q(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Yt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Yt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Yt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Yt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0},uvTransform:{value:new Yt}},sprite:{diffuse:{value:new ft(16777215)},opacity:{value:1},center:{value:new Q(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}}},wn={basic:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.fog]),vertexShader:$t.meshbasic_vert,fragmentShader:$t.meshbasic_frag},lambert:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new ft(0)}}]),vertexShader:$t.meshlambert_vert,fragmentShader:$t.meshlambert_frag},phong:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new ft(0)},specular:{value:new ft(1118481)},shininess:{value:30}}]),vertexShader:$t.meshphong_vert,fragmentShader:$t.meshphong_frag},standard:{uniforms:Ye([gt.common,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.roughnessmap,gt.metalnessmap,gt.fog,gt.lights,{emissive:{value:new ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag},toon:{uniforms:Ye([gt.common,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.gradientmap,gt.fog,gt.lights,{emissive:{value:new ft(0)}}]),vertexShader:$t.meshtoon_vert,fragmentShader:$t.meshtoon_frag},matcap:{uniforms:Ye([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,{matcap:{value:null}}]),vertexShader:$t.meshmatcap_vert,fragmentShader:$t.meshmatcap_frag},points:{uniforms:Ye([gt.points,gt.fog]),vertexShader:$t.points_vert,fragmentShader:$t.points_frag},dashed:{uniforms:Ye([gt.common,gt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$t.linedashed_vert,fragmentShader:$t.linedashed_frag},depth:{uniforms:Ye([gt.common,gt.displacementmap]),vertexShader:$t.depth_vert,fragmentShader:$t.depth_frag},normal:{uniforms:Ye([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,{opacity:{value:1}}]),vertexShader:$t.meshnormal_vert,fragmentShader:$t.meshnormal_frag},sprite:{uniforms:Ye([gt.sprite,gt.fog]),vertexShader:$t.sprite_vert,fragmentShader:$t.sprite_frag},background:{uniforms:{uvTransform:{value:new Yt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$t.background_vert,fragmentShader:$t.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Yt}},vertexShader:$t.backgroundCube_vert,fragmentShader:$t.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$t.cube_vert,fragmentShader:$t.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$t.equirect_vert,fragmentShader:$t.equirect_frag},distanceRGBA:{uniforms:Ye([gt.common,gt.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$t.distanceRGBA_vert,fragmentShader:$t.distanceRGBA_frag},shadow:{uniforms:Ye([gt.lights,gt.fog,{color:{value:new ft(0)},opacity:{value:1}}]),vertexShader:$t.shadow_vert,fragmentShader:$t.shadow_frag}};wn.physical={uniforms:Ye([wn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Yt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Yt},clearcoatNormalScale:{value:new Q(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Yt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Yt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Yt},sheen:{value:0},sheenColor:{value:new ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Yt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Yt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Yt},transmissionSamplerSize:{value:new Q},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Yt},attenuationDistance:{value:0},attenuationColor:{value:new ft(0)},specularColor:{value:new ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Yt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Yt},anisotropyVector:{value:new Q},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Yt}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag};const pa={r:0,b:0,g:0},Ei=new pn,dx=new Bt;function fx(s,t,e,n,i,r,a){const o=new ft(0);let l=r===!0?0:1,c,h,d=null,u=0,f=null;function m(v){let x=v.isScene===!0?v.background:null;return x&&x.isTexture&&(x=(v.backgroundBlurriness>0?e:t).get(x)),x}function _(v){let x=!1;const y=m(v);y===null?g(o,l):y&&y.isColor&&(g(y,1),x=!0);const E=s.xr.getEnvironmentBlendMode();E==="additive"?n.buffers.color.setClear(0,0,0,1,a):E==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function p(v,x){const y=m(x);y&&(y.isCubeTexture||y.mapping===ks)?(h===void 0&&(h=new at(new Pe(1,1,1),new an({name:"BackgroundCubeMaterial",uniforms:Os(wn.backgroundCube.uniforms),vertexShader:wn.backgroundCube.vertexShader,fragmentShader:wn.backgroundCube.fragmentShader,side:Ae,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(E,A,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Ei.copy(x.backgroundRotation),Ei.x*=-1,Ei.y*=-1,Ei.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Ei.y*=-1,Ei.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(dx.makeRotationFromEuler(Ei)),h.material.toneMapped=ne.getTransfer(y.colorSpace)!==de,(d!==y||u!==y.version||f!==s.toneMapping)&&(h.material.needsUpdate=!0,d=y,u=y.version,f=s.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new at(new On(2,2),new an({name:"BackgroundMaterial",uniforms:Os(wn.background.uniforms),vertexShader:wn.background.vertexShader,fragmentShader:wn.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=ne.getTransfer(y.colorSpace)!==de,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(d!==y||u!==y.version||f!==s.toneMapping)&&(c.material.needsUpdate=!0,d=y,u=y.version,f=s.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function g(v,x){v.getRGB(pa,If(s)),n.buffers.color.setClear(pa.r,pa.g,pa.b,x,a)}return{getClearColor:function(){return o},setClearColor:function(v,x=1){o.set(v),l=x,g(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,g(o,l)},render:_,addToRenderList:p}}function px(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=u(null);let r=i,a=!1;function o(M,b,B,N,U){let q=!1;const z=d(N,B,b);r!==z&&(r=z,c(r.object)),q=f(M,N,B,U),q&&m(M,N,B,U),U!==null&&t.update(U,s.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,y(M,b,B,N),U!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(U).buffer))}function l(){return s.createVertexArray()}function c(M){return s.bindVertexArray(M)}function h(M){return s.deleteVertexArray(M)}function d(M,b,B){const N=B.wireframe===!0;let U=n[M.id];U===void 0&&(U={},n[M.id]=U);let q=U[b.id];q===void 0&&(q={},U[b.id]=q);let z=q[N];return z===void 0&&(z=u(l()),q[N]=z),z}function u(M){const b=[],B=[],N=[];for(let U=0;U<e;U++)b[U]=0,B[U]=0,N[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:b,enabledAttributes:B,attributeDivisors:N,object:M,attributes:{},index:null}}function f(M,b,B,N){const U=r.attributes,q=b.attributes;let z=0;const X=B.getAttributes();for(const W in X)if(X[W].location>=0){const yt=U[W];let it=q[W];if(it===void 0&&(W==="instanceMatrix"&&M.instanceMatrix&&(it=M.instanceMatrix),W==="instanceColor"&&M.instanceColor&&(it=M.instanceColor)),yt===void 0||yt.attribute!==it||it&&yt.data!==it.data)return!0;z++}return r.attributesNum!==z||r.index!==N}function m(M,b,B,N){const U={},q=b.attributes;let z=0;const X=B.getAttributes();for(const W in X)if(X[W].location>=0){let yt=q[W];yt===void 0&&(W==="instanceMatrix"&&M.instanceMatrix&&(yt=M.instanceMatrix),W==="instanceColor"&&M.instanceColor&&(yt=M.instanceColor));const it={};it.attribute=yt,yt&&yt.data&&(it.data=yt.data),U[W]=it,z++}r.attributes=U,r.attributesNum=z,r.index=N}function _(){const M=r.newAttributes;for(let b=0,B=M.length;b<B;b++)M[b]=0}function p(M){g(M,0)}function g(M,b){const B=r.newAttributes,N=r.enabledAttributes,U=r.attributeDivisors;B[M]=1,N[M]===0&&(s.enableVertexAttribArray(M),N[M]=1),U[M]!==b&&(s.vertexAttribDivisor(M,b),U[M]=b)}function v(){const M=r.newAttributes,b=r.enabledAttributes;for(let B=0,N=b.length;B<N;B++)b[B]!==M[B]&&(s.disableVertexAttribArray(B),b[B]=0)}function x(M,b,B,N,U,q,z){z===!0?s.vertexAttribIPointer(M,b,B,U,q):s.vertexAttribPointer(M,b,B,N,U,q)}function y(M,b,B,N){_();const U=N.attributes,q=B.getAttributes(),z=b.defaultAttributeValues;for(const X in q){const W=q[X];if(W.location>=0){let _t=U[X];if(_t===void 0&&(X==="instanceMatrix"&&M.instanceMatrix&&(_t=M.instanceMatrix),X==="instanceColor"&&M.instanceColor&&(_t=M.instanceColor)),_t!==void 0){const yt=_t.normalized,it=_t.itemSize,ct=t.get(_t);if(ct===void 0)continue;const Et=ct.buffer,V=ct.type,Z=ct.bytesPerElement,ut=V===s.INT||V===s.UNSIGNED_INT||_t.gpuType===Ho;if(_t.isInterleavedBufferAttribute){const rt=_t.data,vt=rt.stride,Lt=_t.offset;if(rt.isInstancedInterleavedBuffer){for(let Nt=0;Nt<W.locationSize;Nt++)g(W.location+Nt,rt.meshPerAttribute);M.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let Nt=0;Nt<W.locationSize;Nt++)p(W.location+Nt);s.bindBuffer(s.ARRAY_BUFFER,Et);for(let Nt=0;Nt<W.locationSize;Nt++)x(W.location+Nt,it/W.locationSize,V,yt,vt*Z,(Lt+it/W.locationSize*Nt)*Z,ut)}else{if(_t.isInstancedBufferAttribute){for(let rt=0;rt<W.locationSize;rt++)g(W.location+rt,_t.meshPerAttribute);M.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=_t.meshPerAttribute*_t.count)}else for(let rt=0;rt<W.locationSize;rt++)p(W.location+rt);s.bindBuffer(s.ARRAY_BUFFER,Et);for(let rt=0;rt<W.locationSize;rt++)x(W.location+rt,it/W.locationSize,V,yt,it*Z,it/W.locationSize*rt*Z,ut)}}else if(z!==void 0){const yt=z[X];if(yt!==void 0)switch(yt.length){case 2:s.vertexAttrib2fv(W.location,yt);break;case 3:s.vertexAttrib3fv(W.location,yt);break;case 4:s.vertexAttrib4fv(W.location,yt);break;default:s.vertexAttrib1fv(W.location,yt)}}}}v()}function E(){P();for(const M in n){const b=n[M];for(const B in b){const N=b[B];for(const U in N)h(N[U].object),delete N[U];delete b[B]}delete n[M]}}function A(M){if(n[M.id]===void 0)return;const b=n[M.id];for(const B in b){const N=b[B];for(const U in N)h(N[U].object),delete N[U];delete b[B]}delete n[M.id]}function w(M){for(const b in n){const B=n[b];if(B[M.id]===void 0)continue;const N=B[M.id];for(const U in N)h(N[U].object),delete N[U];delete B[M.id]}}function P(){L(),a=!0,r!==i&&(r=i,c(r.object))}function L(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:P,resetDefaultState:L,dispose:E,releaseStatesOfGeometry:A,releaseStatesOfProgram:w,initAttributes:_,enableAttribute:p,disableUnusedAttributes:v}}function mx(s,t,e){let n;function i(c){n=c}function r(c,h){s.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,d){d!==0&&(s.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let f=0;for(let m=0;m<d;m++)f+=h[m];e.update(f,n,1)}function l(c,h,d,u){if(d===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<c.length;m++)a(c[m],h[m],u[m]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let m=0;for(let _=0;_<d;_++)m+=h[_];for(let _=0;_<u.length;_++)e.update(m,n,u[_])}}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function gx(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const w=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(w){return!(w!==$e&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const P=w===Vs&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==Fn&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==nn&&!P)}function l(w){if(w==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(u===!0){const w=t.get("EXT_clip_control");w.clipControlEXT(w.LOWER_LEFT_EXT,w.ZERO_TO_ONE_EXT)}const f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),v=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),x=s.getParameter(s.MAX_VARYING_VECTORS),y=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),E=m>0,A=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:f,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:v,maxVaryings:x,maxFragmentUniforms:y,vertexTextures:E,maxSamples:A}}function _x(s){const t=this;let e=null,n=0,i=!1,r=!1;const a=new pi,o=new Yt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||i;return i=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){const m=d.clippingPlanes,_=d.clipIntersection,p=d.clipShadows,g=s.get(d);if(!i||m===null||m.length===0||r&&!p)r?h(null):c();else{const v=r?0:n,x=v*4;let y=g.clippingState||null;l.value=y,y=h(m,u,x,f);for(let E=0;E!==x;++E)y[E]=e[E];g.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,f,m){const _=d!==null?d.length:0;let p=null;if(_!==0){if(p=l.value,m!==!0||p===null){const g=f+_*4,v=u.matrixWorldInverse;o.getNormalMatrix(v),(p===null||p.length<g)&&(p=new Float32Array(g));for(let x=0,y=f;x!==_;++x,y+=4)a.copy(d[x]).applyMatrix4(v,o),a.normal.toArray(p,y),p[y+3]=a.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,p}}function xx(s){let t=new WeakMap;function e(a,o){return o===xr?a.mapping=ti:o===vr&&(a.mapping=_i),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===xr||o===vr)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Uf(l.height);return c.fromEquirectangularTexture(s,a),t.set(a,c),a.addEventListener("dispose",i),e(c.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class jo extends Qo{constructor(t=-1,e=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Rs=4,su=[.125,.215,.35,.446,.526,.582],ki=20,Xl=new jo,ru=new ft;let ql=null,Yl=0,Zl=0,$l=!1;const Bi=(1+Math.sqrt(5))/2,xs=1/Bi,au=[new C(-Bi,xs,0),new C(Bi,xs,0),new C(-xs,0,Bi),new C(xs,0,Bi),new C(0,Bi,-xs),new C(0,Bi,xs),new C(-1,1,-1),new C(1,1,-1),new C(-1,1,1),new C(1,1,1)];class Ac{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){ql=this._renderer.getRenderTarget(),Yl=this._renderer.getActiveCubeFace(),Zl=this._renderer.getActiveMipmapLevel(),$l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,i,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=cu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=lu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(ql,Yl,Zl),this._renderer.xr.enabled=$l,t.scissorTest=!1,ma(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ti||t.mapping===_i?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),ql=this._renderer.getRenderTarget(),Yl=this._renderer.getActiveCubeFace(),Zl=this._renderer.getActiveMipmapLevel(),$l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Re,minFilter:Re,generateMipmaps:!1,type:Vs,format:$e,colorSpace:si,depthBuffer:!1},i=ou(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ou(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=vx(r)),this._blurMaterial=yx(r,t,e)}return i}_compileMaterial(t){const e=new at(this._lodPlanes[0],t);this._renderer.compile(e,Xl)}_sceneToCubeUV(t,e,n,i){const o=new Ne(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(ru),h.toneMapping=Qn,h.autoClear=!1;const f=new he({name:"PMREM.Background",side:Ae,depthWrite:!1,depthTest:!1}),m=new at(new Pe,f);let _=!1;const p=t.background;p?p.isColor&&(f.color.copy(p),t.background=null,_=!0):(f.color.copy(ru),_=!0);for(let g=0;g<6;g++){const v=g%3;v===0?(o.up.set(0,l[g],0),o.lookAt(c[g],0,0)):v===1?(o.up.set(0,0,l[g]),o.lookAt(0,c[g],0)):(o.up.set(0,l[g],0),o.lookAt(0,0,c[g]));const x=this._cubeSize;ma(i,v*x,g>2?x:0,x,x),h.setRenderTarget(i),_&&h.render(m,o),h.render(t,o)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===ti||t.mapping===_i;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=cu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=lu());const r=i?this._cubemapMaterial:this._equirectMaterial,a=new at(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;ma(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Xl)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let r=1;r<i;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=au[(i-r-1)%au.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,i,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,i,"latitudinal",r),this._halfBlur(a,t,n,n,i,"longitudinal",r)}_halfBlur(t,e,n,i,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new at(this._lodPlanes[i],c),u=c.uniforms,f=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*ki-1),_=r/m,p=isFinite(r)?1+Math.floor(h*_):ki;p>ki&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ki}`);const g=[];let v=0;for(let w=0;w<ki;++w){const P=w/_,L=Math.exp(-P*P/2);g.push(L),w===0?v+=L:w<p&&(v+=2*L)}for(let w=0;w<g.length;w++)g[w]=g[w]/v;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=g,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:x}=this;u.dTheta.value=m,u.mipInt.value=x-n;const y=this._sizeLods[i],E=3*y*(i>x-Rs?i-x+Rs:0),A=4*(this._cubeSize-y);ma(e,E,A,3*y,2*y),l.setRenderTarget(e),l.render(d,Xl)}}function vx(s){const t=[],e=[],n=[];let i=s;const r=s-Rs+1+su.length;for(let a=0;a<r;a++){const o=Math.pow(2,i);e.push(o);let l=1/o;a>s-Rs?l=su[a-s+Rs-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,m=6,_=3,p=2,g=1,v=new Float32Array(_*m*f),x=new Float32Array(p*m*f),y=new Float32Array(g*m*f);for(let A=0;A<f;A++){const w=A%3*2/3-1,P=A>2?0:-1,L=[w,P,0,w+2/3,P,0,w+2/3,P+1,0,w,P,0,w+2/3,P+1,0,w,P+1,0];v.set(L,_*m*A),x.set(u,p*m*A);const M=[A,A,A,A,A,A];y.set(M,g*m*A)}const E=new Xt;E.setAttribute("position",new se(v,_)),E.setAttribute("uv",new se(x,p)),E.setAttribute("faceIndex",new se(y,g)),t.push(E),i>Rs&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ou(s,t,e){const n=new Tn(s,t,e);return n.texture.mapping=ks,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ma(s,t,e,n,i){s.viewport.set(t,e,n,i),s.scissor.set(t,e,n,i)}function yx(s,t,e){const n=new Float32Array(ki),i=new C(0,1,0);return new an({name:"SphericalGaussianBlur",defines:{n:ki,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:th(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function lu(){return new an({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:th(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function cu(){return new an({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:th(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Jn,depthTest:!1,depthWrite:!1})}function th(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Mx(s){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===xr||l===vr,h=l===ti||l===_i;if(c||h){let d=t.get(o);const u=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==u)return e===null&&(e=new Ac(s)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const f=o.image;return c&&f&&f.height>0||h&&f&&i(f)?(e===null&&(e=new Ac(s)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",r),d.texture):null}}}return o}function i(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){const l=o.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function bx(s){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Xa("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Sx(s,t,e,n){const i={},r=new WeakMap;function a(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const m in u.attributes)t.remove(u.attributes[m]);for(const m in u.morphAttributes){const _=u.morphAttributes[m];for(let p=0,g=_.length;p<g;p++)t.remove(_[p])}u.removeEventListener("dispose",a),delete i[u.id];const f=r.get(u);f&&(t.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return i[u.id]===!0||(u.addEventListener("dispose",a),i[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const m in u)t.update(u[m],s.ARRAY_BUFFER);const f=d.morphAttributes;for(const m in f){const _=f[m];for(let p=0,g=_.length;p<g;p++)t.update(_[p],s.ARRAY_BUFFER)}}function c(d){const u=[],f=d.index,m=d.attributes.position;let _=0;if(f!==null){const v=f.array;_=f.version;for(let x=0,y=v.length;x<y;x+=3){const E=v[x+0],A=v[x+1],w=v[x+2];u.push(E,A,A,w,w,E)}}else if(m!==void 0){const v=m.array;_=m.version;for(let x=0,y=v.length/3-1;x<y;x+=3){const E=x+0,A=x+1,w=x+2;u.push(E,A,A,w,w,E)}}else return;const p=new(Tf(u)?jc:Qc)(u,1);p.version=_;const g=r.get(d);g&&t.remove(g),r.set(d,p)}function h(d){const u=r.get(d);if(u){const f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function wx(s,t,e){let n;function i(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,f){s.drawElements(n,f,r,u*a),e.update(f,n,1)}function c(u,f,m){m!==0&&(s.drawElementsInstanced(n,f,r,u*a,m),e.update(f,n,m))}function h(u,f,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,u,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];e.update(p,n,1)}function d(u,f,m,_){if(m===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<u.length;g++)c(u[g]/a,f[g],_[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,u,0,_,0,m);let g=0;for(let v=0;v<m;v++)g+=f[v];for(let v=0;v<_.length;v++)e.update(g,n,_[v])}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function Ax(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function Tx(s,t,e){const n=new WeakMap,i=new te;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let M=function(){P.dispose(),n.delete(o),o.removeEventListener("dispose",M)};var f=M;u!==void 0&&u.texture.dispose();const m=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,p=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],v=o.morphAttributes.normal||[],x=o.morphAttributes.color||[];let y=0;m===!0&&(y=1),_===!0&&(y=2),p===!0&&(y=3);let E=o.attributes.position.count*y,A=1;E>t.maxTextureSize&&(A=Math.ceil(E/t.maxTextureSize),E=t.maxTextureSize);const w=new Float32Array(E*A*4*d),P=new Ko(w,E,A,d);P.type=nn,P.needsUpdate=!0;const L=y*4;for(let b=0;b<d;b++){const B=g[b],N=v[b],U=x[b],q=E*A*4*b;for(let z=0;z<B.count;z++){const X=z*L;m===!0&&(i.fromBufferAttribute(B,z),w[q+X+0]=i.x,w[q+X+1]=i.y,w[q+X+2]=i.z,w[q+X+3]=0),_===!0&&(i.fromBufferAttribute(N,z),w[q+X+4]=i.x,w[q+X+5]=i.y,w[q+X+6]=i.z,w[q+X+7]=0),p===!0&&(i.fromBufferAttribute(U,z),w[q+X+8]=i.x,w[q+X+9]=i.y,w[q+X+10]=i.z,w[q+X+11]=U.itemSize===4?i.w:1)}}u={count:d,texture:P,size:new Q(E,A)},n.set(o,u),o.addEventListener("dispose",M)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let m=0;for(let p=0;p<c.length;p++)m+=c[p];const _=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(s,"morphTargetBaseInfluence",_),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(s,"morphTargetsTextureSize",u.size)}return{update:r}}function Ex(s,t,e,n){let i=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(i.get(d)!==c&&(t.update(d),i.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(e.update(l.instanceMatrix,s.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,s.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;i.get(u)!==c&&(u.update(),i.set(u,c))}return d}function a(){i=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}class eh extends ve{constructor(t,e,n,i,r,a,o,l,c,h=Zi){if(h!==Zi&&h!==ji)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Zi&&(n=ei),n===void 0&&h===ji&&(n=Qi),super(null,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Fe,this.minFilter=l!==void 0?l:Fe,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Ff=new ve,hu=new eh(1,1),Of=new Ko,Bf=new Jc,zf=new Hr,uu=[],du=[],fu=new Float32Array(16),pu=new Float32Array(9),mu=new Float32Array(4);function Gs(s,t,e){const n=s[0];if(n<=0||n>0)return s;const i=t*e;let r=uu[i];if(r===void 0&&(r=new Float32Array(i),uu[i]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function Le(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function De(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function tl(s,t){let e=du[t];e===void 0&&(e=new Int32Array(t),du[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function Cx(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function Rx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;s.uniform2fv(this.addr,t),De(e,t)}}function Px(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Le(e,t))return;s.uniform3fv(this.addr,t),De(e,t)}}function Ix(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;s.uniform4fv(this.addr,t),De(e,t)}}function Lx(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),De(e,t)}else{if(Le(e,n))return;mu.set(n),s.uniformMatrix2fv(this.addr,!1,mu),De(e,n)}}function Dx(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),De(e,t)}else{if(Le(e,n))return;pu.set(n),s.uniformMatrix3fv(this.addr,!1,pu),De(e,n)}}function Ux(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(Le(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),De(e,t)}else{if(Le(e,n))return;fu.set(n),s.uniformMatrix4fv(this.addr,!1,fu),De(e,n)}}function Nx(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function Fx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;s.uniform2iv(this.addr,t),De(e,t)}}function Ox(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Le(e,t))return;s.uniform3iv(this.addr,t),De(e,t)}}function Bx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;s.uniform4iv(this.addr,t),De(e,t)}}function zx(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function kx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Le(e,t))return;s.uniform2uiv(this.addr,t),De(e,t)}}function Vx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Le(e,t))return;s.uniform3uiv(this.addr,t),De(e,t)}}function Hx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Le(e,t))return;s.uniform4uiv(this.addr,t),De(e,t)}}function Gx(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(hu.compareFunction=$c,r=hu):r=Ff,e.setTexture2D(t||r,i)}function Wx(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||Bf,i)}function Xx(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||zf,i)}function qx(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||Of,i)}function Yx(s){switch(s){case 5126:return Cx;case 35664:return Rx;case 35665:return Px;case 35666:return Ix;case 35674:return Lx;case 35675:return Dx;case 35676:return Ux;case 5124:case 35670:return Nx;case 35667:case 35671:return Fx;case 35668:case 35672:return Ox;case 35669:case 35673:return Bx;case 5125:return zx;case 36294:return kx;case 36295:return Vx;case 36296:return Hx;case 35678:case 36198:case 36298:case 36306:case 35682:return Gx;case 35679:case 36299:case 36307:return Wx;case 35680:case 36300:case 36308:case 36293:return Xx;case 36289:case 36303:case 36311:case 36292:return qx}}function Zx(s,t){s.uniform1fv(this.addr,t)}function $x(s,t){const e=Gs(t,this.size,2);s.uniform2fv(this.addr,e)}function Kx(s,t){const e=Gs(t,this.size,3);s.uniform3fv(this.addr,e)}function Jx(s,t){const e=Gs(t,this.size,4);s.uniform4fv(this.addr,e)}function Qx(s,t){const e=Gs(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function jx(s,t){const e=Gs(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function tv(s,t){const e=Gs(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function ev(s,t){s.uniform1iv(this.addr,t)}function nv(s,t){s.uniform2iv(this.addr,t)}function iv(s,t){s.uniform3iv(this.addr,t)}function sv(s,t){s.uniform4iv(this.addr,t)}function rv(s,t){s.uniform1uiv(this.addr,t)}function av(s,t){s.uniform2uiv(this.addr,t)}function ov(s,t){s.uniform3uiv(this.addr,t)}function lv(s,t){s.uniform4uiv(this.addr,t)}function cv(s,t,e){const n=this.cache,i=t.length,r=tl(e,i);Le(n,r)||(s.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==i;++a)e.setTexture2D(t[a]||Ff,r[a])}function hv(s,t,e){const n=this.cache,i=t.length,r=tl(e,i);Le(n,r)||(s.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||Bf,r[a])}function uv(s,t,e){const n=this.cache,i=t.length,r=tl(e,i);Le(n,r)||(s.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==i;++a)e.setTextureCube(t[a]||zf,r[a])}function dv(s,t,e){const n=this.cache,i=t.length,r=tl(e,i);Le(n,r)||(s.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||Of,r[a])}function fv(s){switch(s){case 5126:return Zx;case 35664:return $x;case 35665:return Kx;case 35666:return Jx;case 35674:return Qx;case 35675:return jx;case 35676:return tv;case 5124:case 35670:return ev;case 35667:case 35671:return nv;case 35668:case 35672:return iv;case 35669:case 35673:return sv;case 5125:return rv;case 36294:return av;case 36295:return ov;case 36296:return lv;case 35678:case 36198:case 36298:case 36306:case 35682:return cv;case 35679:case 36299:case 36307:return hv;case 35680:case 36300:case 36308:case 36293:return uv;case 36289:case 36303:case 36311:case 36292:return dv}}class pv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Yx(e.type)}}class mv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=fv(e.type)}}class gv{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(t,e[o.id],n)}}}const Kl=/(\w+)(\])?(\[|\.)?/g;function gu(s,t){s.seq.push(t),s.map[t.id]=t}function _v(s,t,e){const n=s.name,i=n.length;for(Kl.lastIndex=0;;){const r=Kl.exec(n),a=Kl.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){gu(e,c===void 0?new pv(o,s,t):new mv(o,s,t));break}else{let d=e.map[o];d===void 0&&(d=new gv(o),gu(e,d)),e=d}}}class qa{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=t.getActiveUniform(e,i),a=t.getUniformLocation(e,r.name);_v(r,a,this)}}setValue(t,e,n,i){const r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,r=t.length;i!==r;++i){const a=t[i];a.id in e&&n.push(a)}return n}}function _u(s,t,e){const n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}const xv=37297;let vv=0;function yv(s,t){const e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function Mv(s){const t=ne.getPrimaries(ne.workingColorSpace),e=ne.getPrimaries(s);let n;switch(t===e?n="":t===Tr&&e===Ar?n="LinearDisplayP3ToLinearSRGB":t===Ar&&e===Tr&&(n="LinearSRGBToLinearDisplayP3"),s){case si:case Vr:return[n,"LinearTransferOETF"];case _n:case $o:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",s),[n,"LinearTransferOETF"]}}function xu(s,t,e){const n=s.getShaderParameter(t,s.COMPILE_STATUS),i=s.getShaderInfoLog(t).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+i+`

`+yv(s.getShaderSource(t),a)}else return i}function bv(s,t){const e=Mv(t);return`vec4 ${s}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function Sv(s,t){let e;switch(t){case rf:e="Linear";break;case af:e="Reinhard";break;case of:e="Cineon";break;case lf:e="ACESFilmic";break;case hf:e="AgX";break;case uf:e="Neutral";break;case cf:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const ga=new C;function wv(){ne.getLuminanceCoefficients(ga);const s=ga.x.toFixed(4),t=ga.y.toFixed(4),e=ga.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Av(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ar).join(`
`)}function Tv(s){const t=[];for(const e in s){const n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Ev(s,t){const e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(t,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function ar(s){return s!==""}function vu(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function yu(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Cv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Tc(s){return s.replace(Cv,Pv)}const Rv=new Map;function Pv(s,t){let e=$t[t];if(e===void 0){const n=Rv.get(t);if(n!==void 0)e=$t[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Tc(e)}const Iv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mu(s){return s.replace(Iv,Lv)}function Lv(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function bu(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Dv(s){let t="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Oc?t="SHADOWMAP_TYPE_PCF":s.shadowMapType===Od?t="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===In&&(t="SHADOWMAP_TYPE_VSM"),t}function Uv(s){let t="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case ti:case _i:t="ENVMAP_TYPE_CUBE";break;case ks:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Nv(s){let t="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case _i:t="ENVMAP_MODE_REFRACTION";break}return t}function Fv(s){let t="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case zr:t="ENVMAP_BLENDING_MULTIPLY";break;case nf:t="ENVMAP_BLENDING_MIX";break;case sf:t="ENVMAP_BLENDING_ADD";break}return t}function Ov(s){const t=s.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function Bv(s,t,e,n){const i=s.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=Dv(e),c=Uv(e),h=Nv(e),d=Fv(e),u=Ov(e),f=Av(e),m=Tv(r),_=i.createProgram();let p,g,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(ar).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(ar).join(`
`),g.length>0&&(g+=`
`)):(p=[bu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ar).join(`
`),g=[bu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Qn?"#define TONE_MAPPING":"",e.toneMapping!==Qn?$t.tonemapping_pars_fragment:"",e.toneMapping!==Qn?Sv("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",$t.colorspace_pars_fragment,bv("linearToOutputTexel",e.outputColorSpace),wv(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(ar).join(`
`)),a=Tc(a),a=vu(a,e),a=yu(a,e),o=Tc(o),o=vu(o,e),o=yu(o,e),a=Mu(a),o=Mu(o),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",e.glslVersion===wc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===wc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const x=v+p+a,y=v+g+o,E=_u(i,i.VERTEX_SHADER,x),A=_u(i,i.FRAGMENT_SHADER,y);i.attachShader(_,E),i.attachShader(_,A),e.index0AttributeName!==void 0?i.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function w(b){if(s.debug.checkShaderErrors){const B=i.getProgramInfoLog(_).trim(),N=i.getShaderInfoLog(E).trim(),U=i.getShaderInfoLog(A).trim();let q=!0,z=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(q=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,_,E,A);else{const X=xu(i,E,"vertex"),W=xu(i,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+b.name+`
Material Type: `+b.type+`

Program Info Log: `+B+`
`+X+`
`+W)}else B!==""?console.warn("THREE.WebGLProgram: Program Info Log:",B):(N===""||U==="")&&(z=!1);z&&(b.diagnostics={runnable:q,programLog:B,vertexShader:{log:N,prefix:p},fragmentShader:{log:U,prefix:g}})}i.deleteShader(E),i.deleteShader(A),P=new qa(i,_),L=Ev(i,_)}let P;this.getUniforms=function(){return P===void 0&&w(this),P};let L;this.getAttributes=function(){return L===void 0&&w(this),L};let M=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=i.getProgramParameter(_,xv)),M},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=vv++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=E,this.fragmentShader=A,this}let zv=0;class kv{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Vv(t),e.set(t,n)),n}}class Vv{constructor(t){this.id=zv++,this.code=t,this.usedTimes=0}}function Hv(s,t,e,n,i,r,a){const o=new Jo,l=new kv,c=new Set,h=[],d=i.logarithmicDepthBuffer,u=i.reverseDepthBuffer,f=i.vertexTextures;let m=i.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(M){return c.add(M),M===0?"uv":`uv${M}`}function g(M,b,B,N,U){const q=N.fog,z=U.geometry,X=M.isMeshStandardMaterial?N.environment:null,W=(M.isMeshStandardMaterial?e:t).get(M.envMap||X),_t=W&&W.mapping===ks?W.image.height:null,yt=_[M.type];M.precision!==null&&(m=i.getMaxPrecision(M.precision),m!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",m,"instead."));const it=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ct=it!==void 0?it.length:0;let Et=0;z.morphAttributes.position!==void 0&&(Et=1),z.morphAttributes.normal!==void 0&&(Et=2),z.morphAttributes.color!==void 0&&(Et=3);let V,Z,ut,rt;if(yt){const Qe=wn[yt];V=Qe.vertexShader,Z=Qe.fragmentShader}else V=M.vertexShader,Z=M.fragmentShader,l.update(M),ut=l.getVertexShaderID(M),rt=l.getFragmentShaderID(M);const vt=s.getRenderTarget(),Lt=U.isInstancedMesh===!0,Nt=U.isBatchedMesh===!0,kt=!!M.map,j=!!M.matcap,I=!!W,ht=!!M.aoMap,ot=!!M.lightMap,nt=!!M.bumpMap,dt=!!M.normalMap,mt=!!M.displacementMap,pt=!!M.emissiveMap,R=!!M.metalnessMap,S=!!M.roughnessMap,k=M.anisotropy>0,K=M.clearcoat>0,tt=M.dispersion>0,J=M.iridescence>0,Dt=M.sheen>0,xt=M.transmission>0,At=k&&!!M.anisotropyMap,Kt=K&&!!M.clearcoatMap,st=K&&!!M.clearcoatNormalMap,Tt=K&&!!M.clearcoatRoughnessMap,Gt=J&&!!M.iridescenceMap,Wt=J&&!!M.iridescenceThicknessMap,Ct=Dt&&!!M.sheenColorMap,Jt=Dt&&!!M.sheenRoughnessMap,qt=!!M.specularMap,ue=!!M.specularColorMap,D=!!M.specularIntensityMap,St=xt&&!!M.transmissionMap,$=xt&&!!M.thicknessMap,et=!!M.gradientMap,Mt=!!M.alphaMap,wt=M.alphaTest>0,Qt=!!M.alphaHash,Te=!!M.extensions;let Je=Qn;M.toneMapped&&(vt===null||vt.isXRRenderTarget===!0)&&(Je=s.toneMapping);const re={shaderID:yt,shaderType:M.type,shaderName:M.name,vertexShader:V,fragmentShader:Z,defines:M.defines,customVertexShaderID:ut,customFragmentShaderID:rt,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:m,batching:Nt,batchingColor:Nt&&U._colorsTexture!==null,instancing:Lt,instancingColor:Lt&&U.instanceColor!==null,instancingMorph:Lt&&U.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:vt===null?s.outputColorSpace:vt.isXRRenderTarget===!0?vt.texture.colorSpace:si,alphaToCoverage:!!M.alphaToCoverage,map:kt,matcap:j,envMap:I,envMapMode:I&&W.mapping,envMapCubeUVHeight:_t,aoMap:ht,lightMap:ot,bumpMap:nt,normalMap:dt,displacementMap:f&&mt,emissiveMap:pt,normalMapObjectSpace:dt&&M.normalMapType===xf,normalMapTangentSpace:dt&&M.normalMapType===vi,metalnessMap:R,roughnessMap:S,anisotropy:k,anisotropyMap:At,clearcoat:K,clearcoatMap:Kt,clearcoatNormalMap:st,clearcoatRoughnessMap:Tt,dispersion:tt,iridescence:J,iridescenceMap:Gt,iridescenceThicknessMap:Wt,sheen:Dt,sheenColorMap:Ct,sheenRoughnessMap:Jt,specularMap:qt,specularColorMap:ue,specularIntensityMap:D,transmission:xt,transmissionMap:St,thicknessMap:$,gradientMap:et,opaque:M.transparent===!1&&M.blending===Yi&&M.alphaToCoverage===!1,alphaMap:Mt,alphaTest:wt,alphaHash:Qt,combine:M.combine,mapUv:kt&&p(M.map.channel),aoMapUv:ht&&p(M.aoMap.channel),lightMapUv:ot&&p(M.lightMap.channel),bumpMapUv:nt&&p(M.bumpMap.channel),normalMapUv:dt&&p(M.normalMap.channel),displacementMapUv:mt&&p(M.displacementMap.channel),emissiveMapUv:pt&&p(M.emissiveMap.channel),metalnessMapUv:R&&p(M.metalnessMap.channel),roughnessMapUv:S&&p(M.roughnessMap.channel),anisotropyMapUv:At&&p(M.anisotropyMap.channel),clearcoatMapUv:Kt&&p(M.clearcoatMap.channel),clearcoatNormalMapUv:st&&p(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Tt&&p(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Gt&&p(M.iridescenceMap.channel),iridescenceThicknessMapUv:Wt&&p(M.iridescenceThicknessMap.channel),sheenColorMapUv:Ct&&p(M.sheenColorMap.channel),sheenRoughnessMapUv:Jt&&p(M.sheenRoughnessMap.channel),specularMapUv:qt&&p(M.specularMap.channel),specularColorMapUv:ue&&p(M.specularColorMap.channel),specularIntensityMapUv:D&&p(M.specularIntensityMap.channel),transmissionMapUv:St&&p(M.transmissionMap.channel),thicknessMapUv:$&&p(M.thicknessMap.channel),alphaMapUv:Mt&&p(M.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(dt||k),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!z.attributes.uv&&(kt||Mt),fog:!!q,useFog:M.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:u,skinning:U.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:ct,morphTextureStride:Et,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:s.shadowMap.enabled&&B.length>0,shadowMapType:s.shadowMap.type,toneMapping:Je,decodeVideoTexture:kt&&M.map.isVideoTexture===!0&&ne.getTransfer(M.map.colorSpace)===de,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===xn,flipSided:M.side===Ae,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Te&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Te&&M.extensions.multiDraw===!0||Nt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return re.vertexUv1s=c.has(1),re.vertexUv2s=c.has(2),re.vertexUv3s=c.has(3),c.clear(),re}function v(M){const b=[];if(M.shaderID?b.push(M.shaderID):(b.push(M.customVertexShaderID),b.push(M.customFragmentShaderID)),M.defines!==void 0)for(const B in M.defines)b.push(B),b.push(M.defines[B]);return M.isRawShaderMaterial===!1&&(x(b,M),y(b,M),b.push(s.outputColorSpace)),b.push(M.customProgramCacheKey),b.join()}function x(M,b){M.push(b.precision),M.push(b.outputColorSpace),M.push(b.envMapMode),M.push(b.envMapCubeUVHeight),M.push(b.mapUv),M.push(b.alphaMapUv),M.push(b.lightMapUv),M.push(b.aoMapUv),M.push(b.bumpMapUv),M.push(b.normalMapUv),M.push(b.displacementMapUv),M.push(b.emissiveMapUv),M.push(b.metalnessMapUv),M.push(b.roughnessMapUv),M.push(b.anisotropyMapUv),M.push(b.clearcoatMapUv),M.push(b.clearcoatNormalMapUv),M.push(b.clearcoatRoughnessMapUv),M.push(b.iridescenceMapUv),M.push(b.iridescenceThicknessMapUv),M.push(b.sheenColorMapUv),M.push(b.sheenRoughnessMapUv),M.push(b.specularMapUv),M.push(b.specularColorMapUv),M.push(b.specularIntensityMapUv),M.push(b.transmissionMapUv),M.push(b.thicknessMapUv),M.push(b.combine),M.push(b.fogExp2),M.push(b.sizeAttenuation),M.push(b.morphTargetsCount),M.push(b.morphAttributeCount),M.push(b.numDirLights),M.push(b.numPointLights),M.push(b.numSpotLights),M.push(b.numSpotLightMaps),M.push(b.numHemiLights),M.push(b.numRectAreaLights),M.push(b.numDirLightShadows),M.push(b.numPointLightShadows),M.push(b.numSpotLightShadows),M.push(b.numSpotLightShadowsWithMaps),M.push(b.numLightProbes),M.push(b.shadowMapType),M.push(b.toneMapping),M.push(b.numClippingPlanes),M.push(b.numClipIntersection),M.push(b.depthPacking)}function y(M,b){o.disableAll(),b.supportsVertexTextures&&o.enable(0),b.instancing&&o.enable(1),b.instancingColor&&o.enable(2),b.instancingMorph&&o.enable(3),b.matcap&&o.enable(4),b.envMap&&o.enable(5),b.normalMapObjectSpace&&o.enable(6),b.normalMapTangentSpace&&o.enable(7),b.clearcoat&&o.enable(8),b.iridescence&&o.enable(9),b.alphaTest&&o.enable(10),b.vertexColors&&o.enable(11),b.vertexAlphas&&o.enable(12),b.vertexUv1s&&o.enable(13),b.vertexUv2s&&o.enable(14),b.vertexUv3s&&o.enable(15),b.vertexTangents&&o.enable(16),b.anisotropy&&o.enable(17),b.alphaHash&&o.enable(18),b.batching&&o.enable(19),b.dispersion&&o.enable(20),b.batchingColor&&o.enable(21),M.push(o.mask),o.disableAll(),b.fog&&o.enable(0),b.useFog&&o.enable(1),b.flatShading&&o.enable(2),b.logarithmicDepthBuffer&&o.enable(3),b.reverseDepthBuffer&&o.enable(4),b.skinning&&o.enable(5),b.morphTargets&&o.enable(6),b.morphNormals&&o.enable(7),b.morphColors&&o.enable(8),b.premultipliedAlpha&&o.enable(9),b.shadowMapEnabled&&o.enable(10),b.doubleSided&&o.enable(11),b.flipSided&&o.enable(12),b.useDepthPacking&&o.enable(13),b.dithering&&o.enable(14),b.transmission&&o.enable(15),b.sheen&&o.enable(16),b.opaque&&o.enable(17),b.pointsUvs&&o.enable(18),b.decodeVideoTexture&&o.enable(19),b.alphaToCoverage&&o.enable(20),M.push(o.mask)}function E(M){const b=_[M.type];let B;if(b){const N=wn[b];B=Lf.clone(N.uniforms)}else B=M.uniforms;return B}function A(M,b){let B;for(let N=0,U=h.length;N<U;N++){const q=h[N];if(q.cacheKey===b){B=q,++B.usedTimes;break}}return B===void 0&&(B=new Bv(s,b,M,r),h.push(B)),B}function w(M){if(--M.usedTimes===0){const b=h.indexOf(M);h[b]=h[h.length-1],h.pop(),M.destroy()}}function P(M){l.remove(M)}function L(){l.dispose()}return{getParameters:g,getProgramCacheKey:v,getUniforms:E,acquireProgram:A,releaseProgram:w,releaseShaderCache:P,programs:h,dispose:L}}function Gv(){let s=new WeakMap;function t(a){return s.has(a)}function e(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:r}}function Wv(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.z!==t.z?s.z-t.z:s.id-t.id}function Su(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function wu(){const s=[];let t=0;const e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function a(d,u,f,m,_,p){let g=s[t];return g===void 0?(g={id:d.id,object:d,geometry:u,material:f,groupOrder:m,renderOrder:d.renderOrder,z:_,group:p},s[t]=g):(g.id=d.id,g.object=d,g.geometry=u,g.material=f,g.groupOrder=m,g.renderOrder=d.renderOrder,g.z=_,g.group=p),t++,g}function o(d,u,f,m,_,p){const g=a(d,u,f,m,_,p);f.transmission>0?n.push(g):f.transparent===!0?i.push(g):e.push(g)}function l(d,u,f,m,_,p){const g=a(d,u,f,m,_,p);f.transmission>0?n.unshift(g):f.transparent===!0?i.unshift(g):e.unshift(g)}function c(d,u){e.length>1&&e.sort(d||Wv),n.length>1&&n.sort(u||Su),i.length>1&&i.sort(u||Su)}function h(){for(let d=t,u=s.length;d<u;d++){const f=s[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:o,unshift:l,finish:h,sort:c}}function Xv(){let s=new WeakMap;function t(n,i){const r=s.get(n);let a;return r===void 0?(a=new wu,s.set(n,[a])):i>=r.length?(a=new wu,r.push(a)):a=r[i],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function qv(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new C,color:new ft};break;case"SpotLight":e={position:new C,direction:new C,color:new ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new C,color:new ft,distance:0,decay:0};break;case"HemisphereLight":e={direction:new C,skyColor:new ft,groundColor:new ft};break;case"RectAreaLight":e={color:new ft,position:new C,halfWidth:new C,halfHeight:new C};break}return s[t.id]=e,e}}}function Yv(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Q};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Q};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Q,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let Zv=0;function $v(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function Kv(s){const t=new qv,e=Yv(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new C);const i=new C,r=new Bt,a=new Bt;function o(c){let h=0,d=0,u=0;for(let L=0;L<9;L++)n.probe[L].set(0,0,0);let f=0,m=0,_=0,p=0,g=0,v=0,x=0,y=0,E=0,A=0,w=0;c.sort($v);for(let L=0,M=c.length;L<M;L++){const b=c[L],B=b.color,N=b.intensity,U=b.distance,q=b.shadow&&b.shadow.map?b.shadow.map.texture:null;if(b.isAmbientLight)h+=B.r*N,d+=B.g*N,u+=B.b*N;else if(b.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(b.sh.coefficients[z],N);w++}else if(b.isDirectionalLight){const z=t.get(b);if(z.color.copy(b.color).multiplyScalar(b.intensity),b.castShadow){const X=b.shadow,W=e.get(b);W.shadowIntensity=X.intensity,W.shadowBias=X.bias,W.shadowNormalBias=X.normalBias,W.shadowRadius=X.radius,W.shadowMapSize=X.mapSize,n.directionalShadow[f]=W,n.directionalShadowMap[f]=q,n.directionalShadowMatrix[f]=b.shadow.matrix,v++}n.directional[f]=z,f++}else if(b.isSpotLight){const z=t.get(b);z.position.setFromMatrixPosition(b.matrixWorld),z.color.copy(B).multiplyScalar(N),z.distance=U,z.coneCos=Math.cos(b.angle),z.penumbraCos=Math.cos(b.angle*(1-b.penumbra)),z.decay=b.decay,n.spot[_]=z;const X=b.shadow;if(b.map&&(n.spotLightMap[E]=b.map,E++,X.updateMatrices(b),b.castShadow&&A++),n.spotLightMatrix[_]=X.matrix,b.castShadow){const W=e.get(b);W.shadowIntensity=X.intensity,W.shadowBias=X.bias,W.shadowNormalBias=X.normalBias,W.shadowRadius=X.radius,W.shadowMapSize=X.mapSize,n.spotShadow[_]=W,n.spotShadowMap[_]=q,y++}_++}else if(b.isRectAreaLight){const z=t.get(b);z.color.copy(B).multiplyScalar(N),z.halfWidth.set(b.width*.5,0,0),z.halfHeight.set(0,b.height*.5,0),n.rectArea[p]=z,p++}else if(b.isPointLight){const z=t.get(b);if(z.color.copy(b.color).multiplyScalar(b.intensity),z.distance=b.distance,z.decay=b.decay,b.castShadow){const X=b.shadow,W=e.get(b);W.shadowIntensity=X.intensity,W.shadowBias=X.bias,W.shadowNormalBias=X.normalBias,W.shadowRadius=X.radius,W.shadowMapSize=X.mapSize,W.shadowCameraNear=X.camera.near,W.shadowCameraFar=X.camera.far,n.pointShadow[m]=W,n.pointShadowMap[m]=q,n.pointShadowMatrix[m]=b.shadow.matrix,x++}n.point[m]=z,m++}else if(b.isHemisphereLight){const z=t.get(b);z.skyColor.copy(b.color).multiplyScalar(N),z.groundColor.copy(b.groundColor).multiplyScalar(N),n.hemi[g]=z,g++}}p>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=gt.LTC_FLOAT_1,n.rectAreaLTC2=gt.LTC_FLOAT_2):(n.rectAreaLTC1=gt.LTC_HALF_1,n.rectAreaLTC2=gt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const P=n.hash;(P.directionalLength!==f||P.pointLength!==m||P.spotLength!==_||P.rectAreaLength!==p||P.hemiLength!==g||P.numDirectionalShadows!==v||P.numPointShadows!==x||P.numSpotShadows!==y||P.numSpotMaps!==E||P.numLightProbes!==w)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.pointShadow.length=x,n.pointShadowMap.length=x,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=v,n.pointShadowMatrix.length=x,n.spotLightMatrix.length=y+E-A,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=w,P.directionalLength=f,P.pointLength=m,P.spotLength=_,P.rectAreaLength=p,P.hemiLength=g,P.numDirectionalShadows=v,P.numPointShadows=x,P.numSpotShadows=y,P.numSpotMaps=E,P.numLightProbes=w,n.version=Zv++)}function l(c,h){let d=0,u=0,f=0,m=0,_=0;const p=h.matrixWorldInverse;for(let g=0,v=c.length;g<v;g++){const x=c[g];if(x.isDirectionalLight){const y=n.directional[d];y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),d++}else if(x.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),f++}else if(x.isRectAreaLight){const y=n.rectArea[m];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),a.identity(),r.copy(x.matrixWorld),r.premultiply(p),a.extractRotation(r),y.halfWidth.set(x.width*.5,0,0),y.halfHeight.set(0,x.height*.5,0),y.halfWidth.applyMatrix4(a),y.halfHeight.applyMatrix4(a),m++}else if(x.isPointLight){const y=n.point[u];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),u++}else if(x.isHemisphereLight){const y=n.hemi[_];y.direction.setFromMatrixPosition(x.matrixWorld),y.direction.transformDirection(p),_++}}}return{setup:o,setupView:l,state:n}}function Au(s){const t=new Kv(s),e=[],n=[];function i(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Jv(s){let t=new WeakMap;function e(i,r=0){const a=t.get(i);let o;return a===void 0?(o=new Au(s),t.set(i,[o])):r>=a.length?(o=new Au(s),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class nh extends Xe{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=gf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class ih extends Xe{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Qv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,jv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function ty(s,t,e){let n=new Gr;const i=new Q,r=new Q,a=new te,o=new nh({depthPacking:_f}),l=new ih,c={},h=e.maxTextureSize,d={[jn]:Ae,[Ae]:jn,[xn]:xn},u=new an({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Q},radius:{value:4}},vertexShader:Qv,fragmentShader:jv}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const m=new Xt;m.setAttribute("position",new se(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new at(m,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Oc;let g=this.type;this.render=function(A,w,P){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;const L=s.getRenderTarget(),M=s.getActiveCubeFace(),b=s.getActiveMipmapLevel(),B=s.state;B.setBlending(Jn),B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const N=g!==In&&this.type===In,U=g===In&&this.type!==In;for(let q=0,z=A.length;q<z;q++){const X=A[q],W=X.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",X,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;i.copy(W.mapSize);const _t=W.getFrameExtents();if(i.multiply(_t),r.copy(W.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/_t.x),i.x=r.x*_t.x,W.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/_t.y),i.y=r.y*_t.y,W.mapSize.y=r.y)),W.map===null||N===!0||U===!0){const it=this.type!==In?{minFilter:Fe,magFilter:Fe}:{};W.map!==null&&W.map.dispose(),W.map=new Tn(i.x,i.y,it),W.map.texture.name=X.name+".shadowMap",W.camera.updateProjectionMatrix()}s.setRenderTarget(W.map),s.clear();const yt=W.getViewportCount();for(let it=0;it<yt;it++){const ct=W.getViewport(it);a.set(r.x*ct.x,r.y*ct.y,r.x*ct.z,r.y*ct.w),B.viewport(a),W.updateMatrices(X,it),n=W.getFrustum(),y(w,P,W.camera,X,this.type)}W.isPointLightShadow!==!0&&this.type===In&&v(W,P),W.needsUpdate=!1}g=this.type,p.needsUpdate=!1,s.setRenderTarget(L,M,b)};function v(A,w){const P=t.update(_);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Tn(i.x,i.y)),u.uniforms.shadow_pass.value=A.map.texture,u.uniforms.resolution.value=A.mapSize,u.uniforms.radius.value=A.radius,s.setRenderTarget(A.mapPass),s.clear(),s.renderBufferDirect(w,null,P,u,_,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,s.setRenderTarget(A.map),s.clear(),s.renderBufferDirect(w,null,P,f,_,null)}function x(A,w,P,L){let M=null;const b=P.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(b!==void 0)M=b;else if(M=P.isPointLight===!0?l:o,s.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const B=M.uuid,N=w.uuid;let U=c[B];U===void 0&&(U={},c[B]=U);let q=U[N];q===void 0&&(q=M.clone(),U[N]=q,w.addEventListener("dispose",E)),M=q}if(M.visible=w.visible,M.wireframe=w.wireframe,L===In?M.side=w.shadowSide!==null?w.shadowSide:w.side:M.side=w.shadowSide!==null?w.shadowSide:d[w.side],M.alphaMap=w.alphaMap,M.alphaTest=w.alphaTest,M.map=w.map,M.clipShadows=w.clipShadows,M.clippingPlanes=w.clippingPlanes,M.clipIntersection=w.clipIntersection,M.displacementMap=w.displacementMap,M.displacementScale=w.displacementScale,M.displacementBias=w.displacementBias,M.wireframeLinewidth=w.wireframeLinewidth,M.linewidth=w.linewidth,P.isPointLight===!0&&M.isMeshDistanceMaterial===!0){const B=s.properties.get(M);B.light=P}return M}function y(A,w,P,L,M){if(A.visible===!1)return;if(A.layers.test(w.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&M===In)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,A.matrixWorld);const N=t.update(A),U=A.material;if(Array.isArray(U)){const q=N.groups;for(let z=0,X=q.length;z<X;z++){const W=q[z],_t=U[W.materialIndex];if(_t&&_t.visible){const yt=x(A,_t,L,M);A.onBeforeShadow(s,A,w,P,N,yt,W),s.renderBufferDirect(P,null,N,yt,A,W),A.onAfterShadow(s,A,w,P,N,yt,W)}}}else if(U.visible){const q=x(A,U,L,M);A.onBeforeShadow(s,A,w,P,N,q,null),s.renderBufferDirect(P,null,N,q,A,null),A.onAfterShadow(s,A,w,P,N,q,null)}}const B=A.children;for(let N=0,U=B.length;N<U;N++)y(B[N],w,P,L,M)}function E(A){A.target.removeEventListener("dispose",E);for(const P in c){const L=c[P],M=A.target.uuid;M in L&&(L[M].dispose(),delete L[M])}}}const ey={[Qa]:ja,[to]:io,[eo]:so,[Ji]:no,[ja]:Qa,[io]:to,[so]:eo,[no]:Ji};function ny(s){function t(){let D=!1;const St=new te;let $=null;const et=new te(0,0,0,0);return{setMask:function(Mt){$!==Mt&&!D&&(s.colorMask(Mt,Mt,Mt,Mt),$=Mt)},setLocked:function(Mt){D=Mt},setClear:function(Mt,wt,Qt,Te,Je){Je===!0&&(Mt*=Te,wt*=Te,Qt*=Te),St.set(Mt,wt,Qt,Te),et.equals(St)===!1&&(s.clearColor(Mt,wt,Qt,Te),et.copy(St))},reset:function(){D=!1,$=null,et.set(-1,0,0,0)}}}function e(){let D=!1,St=!1,$=null,et=null,Mt=null;return{setReversed:function(wt){St=wt},setTest:function(wt){wt?ut(s.DEPTH_TEST):rt(s.DEPTH_TEST)},setMask:function(wt){$!==wt&&!D&&(s.depthMask(wt),$=wt)},setFunc:function(wt){if(St&&(wt=ey[wt]),et!==wt){switch(wt){case Qa:s.depthFunc(s.NEVER);break;case ja:s.depthFunc(s.ALWAYS);break;case to:s.depthFunc(s.LESS);break;case Ji:s.depthFunc(s.LEQUAL);break;case eo:s.depthFunc(s.EQUAL);break;case no:s.depthFunc(s.GEQUAL);break;case io:s.depthFunc(s.GREATER);break;case so:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}et=wt}},setLocked:function(wt){D=wt},setClear:function(wt){Mt!==wt&&(s.clearDepth(wt),Mt=wt)},reset:function(){D=!1,$=null,et=null,Mt=null}}}function n(){let D=!1,St=null,$=null,et=null,Mt=null,wt=null,Qt=null,Te=null,Je=null;return{setTest:function(re){D||(re?ut(s.STENCIL_TEST):rt(s.STENCIL_TEST))},setMask:function(re){St!==re&&!D&&(s.stencilMask(re),St=re)},setFunc:function(re,Qe,Vn){($!==re||et!==Qe||Mt!==Vn)&&(s.stencilFunc(re,Qe,Vn),$=re,et=Qe,Mt=Vn)},setOp:function(re,Qe,Vn){(wt!==re||Qt!==Qe||Te!==Vn)&&(s.stencilOp(re,Qe,Vn),wt=re,Qt=Qe,Te=Vn)},setLocked:function(re){D=re},setClear:function(re){Je!==re&&(s.clearStencil(re),Je=re)},reset:function(){D=!1,St=null,$=null,et=null,Mt=null,wt=null,Qt=null,Te=null,Je=null}}}const i=new t,r=new e,a=new n,o=new WeakMap,l=new WeakMap;let c={},h={},d=new WeakMap,u=[],f=null,m=!1,_=null,p=null,g=null,v=null,x=null,y=null,E=null,A=new ft(0,0,0),w=0,P=!1,L=null,M=null,b=null,B=null,N=null;const U=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,z=0;const X=s.getParameter(s.VERSION);X.indexOf("WebGL")!==-1?(z=parseFloat(/^WebGL (\d)/.exec(X)[1]),q=z>=1):X.indexOf("OpenGL ES")!==-1&&(z=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),q=z>=2);let W=null,_t={};const yt=s.getParameter(s.SCISSOR_BOX),it=s.getParameter(s.VIEWPORT),ct=new te().fromArray(yt),Et=new te().fromArray(it);function V(D,St,$,et){const Mt=new Uint8Array(4),wt=s.createTexture();s.bindTexture(D,wt),s.texParameteri(D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(D,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Qt=0;Qt<$;Qt++)D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?s.texImage3D(St,0,s.RGBA,1,1,et,0,s.RGBA,s.UNSIGNED_BYTE,Mt):s.texImage2D(St+Qt,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,Mt);return wt}const Z={};Z[s.TEXTURE_2D]=V(s.TEXTURE_2D,s.TEXTURE_2D,1),Z[s.TEXTURE_CUBE_MAP]=V(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[s.TEXTURE_2D_ARRAY]=V(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),Z[s.TEXTURE_3D]=V(s.TEXTURE_3D,s.TEXTURE_3D,1,1),i.setClear(0,0,0,1),r.setClear(1),a.setClear(0),ut(s.DEPTH_TEST),r.setFunc(Ji),ot(!1),nt(xc),ut(s.CULL_FACE),I(Jn);function ut(D){c[D]!==!0&&(s.enable(D),c[D]=!0)}function rt(D){c[D]!==!1&&(s.disable(D),c[D]=!1)}function vt(D,St){return h[D]!==St?(s.bindFramebuffer(D,St),h[D]=St,D===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=St),D===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=St),!0):!1}function Lt(D,St){let $=u,et=!1;if(D){$=d.get(St),$===void 0&&($=[],d.set(St,$));const Mt=D.textures;if($.length!==Mt.length||$[0]!==s.COLOR_ATTACHMENT0){for(let wt=0,Qt=Mt.length;wt<Qt;wt++)$[wt]=s.COLOR_ATTACHMENT0+wt;$.length=Mt.length,et=!0}}else $[0]!==s.BACK&&($[0]=s.BACK,et=!0);et&&s.drawBuffers($)}function Nt(D){return f!==D?(s.useProgram(D),f=D,!0):!1}const kt={[mi]:s.FUNC_ADD,[zd]:s.FUNC_SUBTRACT,[kd]:s.FUNC_REVERSE_SUBTRACT};kt[Vd]=s.MIN,kt[Hd]=s.MAX;const j={[Gd]:s.ZERO,[Wd]:s.ONE,[Xd]:s.SRC_COLOR,[Ka]:s.SRC_ALPHA,[Jd]:s.SRC_ALPHA_SATURATE,[$d]:s.DST_COLOR,[Yd]:s.DST_ALPHA,[qd]:s.ONE_MINUS_SRC_COLOR,[Ja]:s.ONE_MINUS_SRC_ALPHA,[Kd]:s.ONE_MINUS_DST_COLOR,[Zd]:s.ONE_MINUS_DST_ALPHA,[Qd]:s.CONSTANT_COLOR,[jd]:s.ONE_MINUS_CONSTANT_COLOR,[tf]:s.CONSTANT_ALPHA,[ef]:s.ONE_MINUS_CONSTANT_ALPHA};function I(D,St,$,et,Mt,wt,Qt,Te,Je,re){if(D===Jn){m===!0&&(rt(s.BLEND),m=!1);return}if(m===!1&&(ut(s.BLEND),m=!0),D!==Bd){if(D!==_||re!==P){if((p!==mi||x!==mi)&&(s.blendEquation(s.FUNC_ADD),p=mi,x=mi),re)switch(D){case Yi:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case vc:s.blendFunc(s.ONE,s.ONE);break;case yc:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Mc:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Yi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case vc:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case yc:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Mc:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}g=null,v=null,y=null,E=null,A.set(0,0,0),w=0,_=D,P=re}return}Mt=Mt||St,wt=wt||$,Qt=Qt||et,(St!==p||Mt!==x)&&(s.blendEquationSeparate(kt[St],kt[Mt]),p=St,x=Mt),($!==g||et!==v||wt!==y||Qt!==E)&&(s.blendFuncSeparate(j[$],j[et],j[wt],j[Qt]),g=$,v=et,y=wt,E=Qt),(Te.equals(A)===!1||Je!==w)&&(s.blendColor(Te.r,Te.g,Te.b,Je),A.copy(Te),w=Je),_=D,P=!1}function ht(D,St){D.side===xn?rt(s.CULL_FACE):ut(s.CULL_FACE);let $=D.side===Ae;St&&($=!$),ot($),D.blending===Yi&&D.transparent===!1?I(Jn):I(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),r.setFunc(D.depthFunc),r.setTest(D.depthTest),r.setMask(D.depthWrite),i.setMask(D.colorWrite);const et=D.stencilWrite;a.setTest(et),et&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),mt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ut(s.SAMPLE_ALPHA_TO_COVERAGE):rt(s.SAMPLE_ALPHA_TO_COVERAGE)}function ot(D){L!==D&&(D?s.frontFace(s.CW):s.frontFace(s.CCW),L=D)}function nt(D){D!==Nd?(ut(s.CULL_FACE),D!==M&&(D===xc?s.cullFace(s.BACK):D===Fd?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):rt(s.CULL_FACE),M=D}function dt(D){D!==b&&(q&&s.lineWidth(D),b=D)}function mt(D,St,$){D?(ut(s.POLYGON_OFFSET_FILL),(B!==St||N!==$)&&(s.polygonOffset(St,$),B=St,N=$)):rt(s.POLYGON_OFFSET_FILL)}function pt(D){D?ut(s.SCISSOR_TEST):rt(s.SCISSOR_TEST)}function R(D){D===void 0&&(D=s.TEXTURE0+U-1),W!==D&&(s.activeTexture(D),W=D)}function S(D,St,$){$===void 0&&(W===null?$=s.TEXTURE0+U-1:$=W);let et=_t[$];et===void 0&&(et={type:void 0,texture:void 0},_t[$]=et),(et.type!==D||et.texture!==St)&&(W!==$&&(s.activeTexture($),W=$),s.bindTexture(D,St||Z[D]),et.type=D,et.texture=St)}function k(){const D=_t[W];D!==void 0&&D.type!==void 0&&(s.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function K(){try{s.compressedTexImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function tt(){try{s.compressedTexImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function J(){try{s.texSubImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Dt(){try{s.texSubImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function xt(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function At(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Kt(){try{s.texStorage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function st(){try{s.texStorage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Tt(){try{s.texImage2D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Gt(){try{s.texImage3D.apply(s,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Wt(D){ct.equals(D)===!1&&(s.scissor(D.x,D.y,D.z,D.w),ct.copy(D))}function Ct(D){Et.equals(D)===!1&&(s.viewport(D.x,D.y,D.z,D.w),Et.copy(D))}function Jt(D,St){let $=l.get(St);$===void 0&&($=new WeakMap,l.set(St,$));let et=$.get(D);et===void 0&&(et=s.getUniformBlockIndex(St,D.name),$.set(D,et))}function qt(D,St){const et=l.get(St).get(D);o.get(St)!==et&&(s.uniformBlockBinding(St,et,D.__bindingPointIndex),o.set(St,et))}function ue(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),c={},W=null,_t={},h={},d=new WeakMap,u=[],f=null,m=!1,_=null,p=null,g=null,v=null,x=null,y=null,E=null,A=new ft(0,0,0),w=0,P=!1,L=null,M=null,b=null,B=null,N=null,ct.set(0,0,s.canvas.width,s.canvas.height),Et.set(0,0,s.canvas.width,s.canvas.height),i.reset(),r.reset(),a.reset()}return{buffers:{color:i,depth:r,stencil:a},enable:ut,disable:rt,bindFramebuffer:vt,drawBuffers:Lt,useProgram:Nt,setBlending:I,setMaterial:ht,setFlipSided:ot,setCullFace:nt,setLineWidth:dt,setPolygonOffset:mt,setScissorTest:pt,activeTexture:R,bindTexture:S,unbindTexture:k,compressedTexImage2D:K,compressedTexImage3D:tt,texImage2D:Tt,texImage3D:Gt,updateUBOMapping:Jt,uniformBlockBinding:qt,texStorage2D:Kt,texStorage3D:st,texSubImage2D:J,texSubImage3D:Dt,compressedTexSubImage2D:xt,compressedTexSubImage3D:At,scissor:Wt,viewport:Ct,reset:ue}}function iy(s,t){const e=s.image&&s.image.width?s.image.width/s.image.height:1;return e>t?(s.repeat.x=1,s.repeat.y=e/t,s.offset.x=0,s.offset.y=(1-s.repeat.y)/2):(s.repeat.x=t/e,s.repeat.y=1,s.offset.x=(1-s.repeat.x)/2,s.offset.y=0),s}function sy(s,t){const e=s.image&&s.image.width?s.image.width/s.image.height:1;return e>t?(s.repeat.x=t/e,s.repeat.y=1,s.offset.x=(1-s.repeat.x)/2,s.offset.y=0):(s.repeat.x=1,s.repeat.y=e/t,s.offset.x=0,s.offset.y=(1-s.repeat.y)/2),s}function ry(s){return s.repeat.x=1,s.repeat.y=1,s.offset.x=0,s.offset.y=0,s}function Ec(s,t,e,n){const i=ay(n);switch(e){case Hc:return s*t;case Wc:return s*t;case Xc:return s*t*2;case Xo:return s*t/i.components*i.byteLength;case kr:return s*t/i.components*i.byteLength;case qc:return s*t*2/i.components*i.byteLength;case qo:return s*t*2/i.components*i.byteLength;case Gc:return s*t*3/i.components*i.byteLength;case $e:return s*t*4/i.components*i.byteLength;case Yo:return s*t*4/i.components*i.byteLength;case cr:case hr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case ur:case dr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case ao:case lo:return Math.max(s,16)*Math.max(t,8)/4;case ro:case oo:return Math.max(s,8)*Math.max(t,8)/2;case co:case ho:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case uo:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case fo:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case po:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case mo:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case go:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case _o:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case xo:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case vo:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case yo:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Mo:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case bo:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case So:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case wo:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Ao:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case To:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case fr:case Eo:case Co:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Yc:case Ro:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Po:case Io:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function ay(s){switch(s){case Fn:case zc:return{byteLength:1,components:1};case Ns:case kc:case Vs:return{byteLength:2,components:1};case Go:case Wo:return{byteLength:2,components:4};case ei:case Ho:case nn:return{byteLength:4,components:1};case Vc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}const oy={contain:iy,cover:sy,fill:ry,getByteLength:Ec};function ly(s,t,e,n,i,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Q,h=new WeakMap;let d;const u=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(R,S){return f?new OffscreenCanvas(R,S):Rr("canvas")}function _(R,S,k){let K=1;const tt=pt(R);if((tt.width>k||tt.height>k)&&(K=k/Math.max(tt.width,tt.height)),K<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const J=Math.floor(K*tt.width),Dt=Math.floor(K*tt.height);d===void 0&&(d=m(J,Dt));const xt=S?m(J,Dt):d;return xt.width=J,xt.height=Dt,xt.getContext("2d").drawImage(R,0,0,J,Dt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+J+"x"+Dt+")."),xt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),R;return R}function p(R){return R.generateMipmaps&&R.minFilter!==Fe&&R.minFilter!==Re}function g(R){s.generateMipmap(R)}function v(R,S,k,K,tt=!1){if(R!==null){if(s[R]!==void 0)return s[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let J=S;if(S===s.RED&&(k===s.FLOAT&&(J=s.R32F),k===s.HALF_FLOAT&&(J=s.R16F),k===s.UNSIGNED_BYTE&&(J=s.R8)),S===s.RED_INTEGER&&(k===s.UNSIGNED_BYTE&&(J=s.R8UI),k===s.UNSIGNED_SHORT&&(J=s.R16UI),k===s.UNSIGNED_INT&&(J=s.R32UI),k===s.BYTE&&(J=s.R8I),k===s.SHORT&&(J=s.R16I),k===s.INT&&(J=s.R32I)),S===s.RG&&(k===s.FLOAT&&(J=s.RG32F),k===s.HALF_FLOAT&&(J=s.RG16F),k===s.UNSIGNED_BYTE&&(J=s.RG8)),S===s.RG_INTEGER&&(k===s.UNSIGNED_BYTE&&(J=s.RG8UI),k===s.UNSIGNED_SHORT&&(J=s.RG16UI),k===s.UNSIGNED_INT&&(J=s.RG32UI),k===s.BYTE&&(J=s.RG8I),k===s.SHORT&&(J=s.RG16I),k===s.INT&&(J=s.RG32I)),S===s.RGB_INTEGER&&(k===s.UNSIGNED_BYTE&&(J=s.RGB8UI),k===s.UNSIGNED_SHORT&&(J=s.RGB16UI),k===s.UNSIGNED_INT&&(J=s.RGB32UI),k===s.BYTE&&(J=s.RGB8I),k===s.SHORT&&(J=s.RGB16I),k===s.INT&&(J=s.RGB32I)),S===s.RGBA_INTEGER&&(k===s.UNSIGNED_BYTE&&(J=s.RGBA8UI),k===s.UNSIGNED_SHORT&&(J=s.RGBA16UI),k===s.UNSIGNED_INT&&(J=s.RGBA32UI),k===s.BYTE&&(J=s.RGBA8I),k===s.SHORT&&(J=s.RGBA16I),k===s.INT&&(J=s.RGBA32I)),S===s.RGB&&k===s.UNSIGNED_INT_5_9_9_9_REV&&(J=s.RGB9_E5),S===s.RGBA){const Dt=tt?wr:ne.getTransfer(K);k===s.FLOAT&&(J=s.RGBA32F),k===s.HALF_FLOAT&&(J=s.RGBA16F),k===s.UNSIGNED_BYTE&&(J=Dt===de?s.SRGB8_ALPHA8:s.RGBA8),k===s.UNSIGNED_SHORT_4_4_4_4&&(J=s.RGBA4),k===s.UNSIGNED_SHORT_5_5_5_1&&(J=s.RGB5_A1)}return(J===s.R16F||J===s.R32F||J===s.RG16F||J===s.RG32F||J===s.RGBA16F||J===s.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function x(R,S){let k;return R?S===null||S===ei||S===Qi?k=s.DEPTH24_STENCIL8:S===nn?k=s.DEPTH32F_STENCIL8:S===Ns&&(k=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===ei||S===Qi?k=s.DEPTH_COMPONENT24:S===nn?k=s.DEPTH_COMPONENT32F:S===Ns&&(k=s.DEPTH_COMPONENT16),k}function y(R,S){return p(R)===!0||R.isFramebufferTexture&&R.minFilter!==Fe&&R.minFilter!==Re?Math.log2(Math.max(S.width,S.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?S.mipmaps.length:1}function E(R){const S=R.target;S.removeEventListener("dispose",E),w(S),S.isVideoTexture&&h.delete(S)}function A(R){const S=R.target;S.removeEventListener("dispose",A),L(S)}function w(R){const S=n.get(R);if(S.__webglInit===void 0)return;const k=R.source,K=u.get(k);if(K){const tt=K[S.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&P(R),Object.keys(K).length===0&&u.delete(k)}n.remove(R)}function P(R){const S=n.get(R);s.deleteTexture(S.__webglTexture);const k=R.source,K=u.get(k);delete K[S.__cacheKey],a.memory.textures--}function L(R){const S=n.get(R);if(R.depthTexture&&R.depthTexture.dispose(),R.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(S.__webglFramebuffer[K]))for(let tt=0;tt<S.__webglFramebuffer[K].length;tt++)s.deleteFramebuffer(S.__webglFramebuffer[K][tt]);else s.deleteFramebuffer(S.__webglFramebuffer[K]);S.__webglDepthbuffer&&s.deleteRenderbuffer(S.__webglDepthbuffer[K])}else{if(Array.isArray(S.__webglFramebuffer))for(let K=0;K<S.__webglFramebuffer.length;K++)s.deleteFramebuffer(S.__webglFramebuffer[K]);else s.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&s.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&s.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let K=0;K<S.__webglColorRenderbuffer.length;K++)S.__webglColorRenderbuffer[K]&&s.deleteRenderbuffer(S.__webglColorRenderbuffer[K]);S.__webglDepthRenderbuffer&&s.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const k=R.textures;for(let K=0,tt=k.length;K<tt;K++){const J=n.get(k[K]);J.__webglTexture&&(s.deleteTexture(J.__webglTexture),a.memory.textures--),n.remove(k[K])}n.remove(R)}let M=0;function b(){M=0}function B(){const R=M;return R>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+i.maxTextures),M+=1,R}function N(R){const S=[];return S.push(R.wrapS),S.push(R.wrapT),S.push(R.wrapR||0),S.push(R.magFilter),S.push(R.minFilter),S.push(R.anisotropy),S.push(R.internalFormat),S.push(R.format),S.push(R.type),S.push(R.generateMipmaps),S.push(R.premultiplyAlpha),S.push(R.flipY),S.push(R.unpackAlignment),S.push(R.colorSpace),S.join()}function U(R,S){const k=n.get(R);if(R.isVideoTexture&&dt(R),R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){const K=R.image;if(K===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Et(k,R,S);return}}e.bindTexture(s.TEXTURE_2D,k.__webglTexture,s.TEXTURE0+S)}function q(R,S){const k=n.get(R);if(R.version>0&&k.__version!==R.version){Et(k,R,S);return}e.bindTexture(s.TEXTURE_2D_ARRAY,k.__webglTexture,s.TEXTURE0+S)}function z(R,S){const k=n.get(R);if(R.version>0&&k.__version!==R.version){Et(k,R,S);return}e.bindTexture(s.TEXTURE_3D,k.__webglTexture,s.TEXTURE0+S)}function X(R,S){const k=n.get(R);if(R.version>0&&k.__version!==R.version){V(k,R,S);return}e.bindTexture(s.TEXTURE_CUBE_MAP,k.__webglTexture,s.TEXTURE0+S)}const W={[yr]:s.REPEAT,[vn]:s.CLAMP_TO_EDGE,[Mr]:s.MIRRORED_REPEAT},_t={[Fe]:s.NEAREST,[Bc]:s.NEAREST_MIPMAP_NEAREST,[Es]:s.NEAREST_MIPMAP_LINEAR,[Re]:s.LINEAR,[lr]:s.LINEAR_MIPMAP_NEAREST,[Ln]:s.LINEAR_MIPMAP_LINEAR},yt={[vf]:s.NEVER,[Af]:s.ALWAYS,[yf]:s.LESS,[$c]:s.LEQUAL,[Mf]:s.EQUAL,[wf]:s.GEQUAL,[bf]:s.GREATER,[Sf]:s.NOTEQUAL};function it(R,S){if(S.type===nn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===Re||S.magFilter===lr||S.magFilter===Es||S.magFilter===Ln||S.minFilter===Re||S.minFilter===lr||S.minFilter===Es||S.minFilter===Ln)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(R,s.TEXTURE_WRAP_S,W[S.wrapS]),s.texParameteri(R,s.TEXTURE_WRAP_T,W[S.wrapT]),(R===s.TEXTURE_3D||R===s.TEXTURE_2D_ARRAY)&&s.texParameteri(R,s.TEXTURE_WRAP_R,W[S.wrapR]),s.texParameteri(R,s.TEXTURE_MAG_FILTER,_t[S.magFilter]),s.texParameteri(R,s.TEXTURE_MIN_FILTER,_t[S.minFilter]),S.compareFunction&&(s.texParameteri(R,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(R,s.TEXTURE_COMPARE_FUNC,yt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===Fe||S.minFilter!==Es&&S.minFilter!==Ln||S.type===nn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const k=t.get("EXT_texture_filter_anisotropic");s.texParameterf(R,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function ct(R,S){let k=!1;R.__webglInit===void 0&&(R.__webglInit=!0,S.addEventListener("dispose",E));const K=S.source;let tt=u.get(K);tt===void 0&&(tt={},u.set(K,tt));const J=N(S);if(J!==R.__cacheKey){tt[J]===void 0&&(tt[J]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,k=!0),tt[J].usedTimes++;const Dt=tt[R.__cacheKey];Dt!==void 0&&(tt[R.__cacheKey].usedTimes--,Dt.usedTimes===0&&P(S)),R.__cacheKey=J,R.__webglTexture=tt[J].texture}return k}function Et(R,S,k){let K=s.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(K=s.TEXTURE_2D_ARRAY),S.isData3DTexture&&(K=s.TEXTURE_3D);const tt=ct(R,S),J=S.source;e.bindTexture(K,R.__webglTexture,s.TEXTURE0+k);const Dt=n.get(J);if(J.version!==Dt.__version||tt===!0){e.activeTexture(s.TEXTURE0+k);const xt=ne.getPrimaries(ne.workingColorSpace),At=S.colorSpace===Zn?null:ne.getPrimaries(S.colorSpace),Kt=S.colorSpace===Zn||xt===At?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,S.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,S.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Kt);let st=_(S.image,!1,i.maxTextureSize);st=mt(S,st);const Tt=r.convert(S.format,S.colorSpace),Gt=r.convert(S.type);let Wt=v(S.internalFormat,Tt,Gt,S.colorSpace,S.isVideoTexture);it(K,S);let Ct;const Jt=S.mipmaps,qt=S.isVideoTexture!==!0,ue=Dt.__version===void 0||tt===!0,D=J.dataReady,St=y(S,st);if(S.isDepthTexture)Wt=x(S.format===ji,S.type),ue&&(qt?e.texStorage2D(s.TEXTURE_2D,1,Wt,st.width,st.height):e.texImage2D(s.TEXTURE_2D,0,Wt,st.width,st.height,0,Tt,Gt,null));else if(S.isDataTexture)if(Jt.length>0){qt&&ue&&e.texStorage2D(s.TEXTURE_2D,St,Wt,Jt[0].width,Jt[0].height);for(let $=0,et=Jt.length;$<et;$++)Ct=Jt[$],qt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,Ct.width,Ct.height,Tt,Gt,Ct.data):e.texImage2D(s.TEXTURE_2D,$,Wt,Ct.width,Ct.height,0,Tt,Gt,Ct.data);S.generateMipmaps=!1}else qt?(ue&&e.texStorage2D(s.TEXTURE_2D,St,Wt,st.width,st.height),D&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,st.width,st.height,Tt,Gt,st.data)):e.texImage2D(s.TEXTURE_2D,0,Wt,st.width,st.height,0,Tt,Gt,st.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){qt&&ue&&e.texStorage3D(s.TEXTURE_2D_ARRAY,St,Wt,Jt[0].width,Jt[0].height,st.depth);for(let $=0,et=Jt.length;$<et;$++)if(Ct=Jt[$],S.format!==$e)if(Tt!==null)if(qt){if(D)if(S.layerUpdates.size>0){const Mt=Ec(Ct.width,Ct.height,S.format,S.type);for(const wt of S.layerUpdates){const Qt=Ct.data.subarray(wt*Mt/Ct.data.BYTES_PER_ELEMENT,(wt+1)*Mt/Ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,wt,Ct.width,Ct.height,1,Tt,Qt,0,0)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,Ct.width,Ct.height,st.depth,Tt,Ct.data,0,0)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,$,Wt,Ct.width,Ct.height,st.depth,0,Ct.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else qt?D&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,Ct.width,Ct.height,st.depth,Tt,Gt,Ct.data):e.texImage3D(s.TEXTURE_2D_ARRAY,$,Wt,Ct.width,Ct.height,st.depth,0,Tt,Gt,Ct.data)}else{qt&&ue&&e.texStorage2D(s.TEXTURE_2D,St,Wt,Jt[0].width,Jt[0].height);for(let $=0,et=Jt.length;$<et;$++)Ct=Jt[$],S.format!==$e?Tt!==null?qt?D&&e.compressedTexSubImage2D(s.TEXTURE_2D,$,0,0,Ct.width,Ct.height,Tt,Ct.data):e.compressedTexImage2D(s.TEXTURE_2D,$,Wt,Ct.width,Ct.height,0,Ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,Ct.width,Ct.height,Tt,Gt,Ct.data):e.texImage2D(s.TEXTURE_2D,$,Wt,Ct.width,Ct.height,0,Tt,Gt,Ct.data)}else if(S.isDataArrayTexture)if(qt){if(ue&&e.texStorage3D(s.TEXTURE_2D_ARRAY,St,Wt,st.width,st.height,st.depth),D)if(S.layerUpdates.size>0){const $=Ec(st.width,st.height,S.format,S.type);for(const et of S.layerUpdates){const Mt=st.data.subarray(et*$/st.data.BYTES_PER_ELEMENT,(et+1)*$/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,et,st.width,st.height,1,Tt,Gt,Mt)}S.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,Tt,Gt,st.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,Wt,st.width,st.height,st.depth,0,Tt,Gt,st.data);else if(S.isData3DTexture)qt?(ue&&e.texStorage3D(s.TEXTURE_3D,St,Wt,st.width,st.height,st.depth),D&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,Tt,Gt,st.data)):e.texImage3D(s.TEXTURE_3D,0,Wt,st.width,st.height,st.depth,0,Tt,Gt,st.data);else if(S.isFramebufferTexture){if(ue)if(qt)e.texStorage2D(s.TEXTURE_2D,St,Wt,st.width,st.height);else{let $=st.width,et=st.height;for(let Mt=0;Mt<St;Mt++)e.texImage2D(s.TEXTURE_2D,Mt,Wt,$,et,0,Tt,Gt,null),$>>=1,et>>=1}}else if(Jt.length>0){if(qt&&ue){const $=pt(Jt[0]);e.texStorage2D(s.TEXTURE_2D,St,Wt,$.width,$.height)}for(let $=0,et=Jt.length;$<et;$++)Ct=Jt[$],qt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,Tt,Gt,Ct):e.texImage2D(s.TEXTURE_2D,$,Wt,Tt,Gt,Ct);S.generateMipmaps=!1}else if(qt){if(ue){const $=pt(st);e.texStorage2D(s.TEXTURE_2D,St,Wt,$.width,$.height)}D&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,Tt,Gt,st)}else e.texImage2D(s.TEXTURE_2D,0,Wt,Tt,Gt,st);p(S)&&g(K),Dt.__version=J.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function V(R,S,k){if(S.image.length!==6)return;const K=ct(R,S),tt=S.source;e.bindTexture(s.TEXTURE_CUBE_MAP,R.__webglTexture,s.TEXTURE0+k);const J=n.get(tt);if(tt.version!==J.__version||K===!0){e.activeTexture(s.TEXTURE0+k);const Dt=ne.getPrimaries(ne.workingColorSpace),xt=S.colorSpace===Zn?null:ne.getPrimaries(S.colorSpace),At=S.colorSpace===Zn||Dt===xt?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,S.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,S.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,At);const Kt=S.isCompressedTexture||S.image[0].isCompressedTexture,st=S.image[0]&&S.image[0].isDataTexture,Tt=[];for(let et=0;et<6;et++)!Kt&&!st?Tt[et]=_(S.image[et],!0,i.maxCubemapSize):Tt[et]=st?S.image[et].image:S.image[et],Tt[et]=mt(S,Tt[et]);const Gt=Tt[0],Wt=r.convert(S.format,S.colorSpace),Ct=r.convert(S.type),Jt=v(S.internalFormat,Wt,Ct,S.colorSpace),qt=S.isVideoTexture!==!0,ue=J.__version===void 0||K===!0,D=tt.dataReady;let St=y(S,Gt);it(s.TEXTURE_CUBE_MAP,S);let $;if(Kt){qt&&ue&&e.texStorage2D(s.TEXTURE_CUBE_MAP,St,Jt,Gt.width,Gt.height);for(let et=0;et<6;et++){$=Tt[et].mipmaps;for(let Mt=0;Mt<$.length;Mt++){const wt=$[Mt];S.format!==$e?Wt!==null?qt?D&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt,0,0,wt.width,wt.height,Wt,wt.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt,Jt,wt.width,wt.height,0,wt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):qt?D&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt,0,0,wt.width,wt.height,Wt,Ct,wt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt,Jt,wt.width,wt.height,0,Wt,Ct,wt.data)}}}else{if($=S.mipmaps,qt&&ue){$.length>0&&St++;const et=pt(Tt[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,St,Jt,et.width,et.height)}for(let et=0;et<6;et++)if(st){qt?D&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,0,0,Tt[et].width,Tt[et].height,Wt,Ct,Tt[et].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,Jt,Tt[et].width,Tt[et].height,0,Wt,Ct,Tt[et].data);for(let Mt=0;Mt<$.length;Mt++){const Qt=$[Mt].image[et].image;qt?D&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt+1,0,0,Qt.width,Qt.height,Wt,Ct,Qt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt+1,Jt,Qt.width,Qt.height,0,Wt,Ct,Qt.data)}}else{qt?D&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,0,0,Wt,Ct,Tt[et]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,0,Jt,Wt,Ct,Tt[et]);for(let Mt=0;Mt<$.length;Mt++){const wt=$[Mt];qt?D&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt+1,0,0,Wt,Ct,wt.image[et]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+et,Mt+1,Jt,Wt,Ct,wt.image[et])}}}p(S)&&g(s.TEXTURE_CUBE_MAP),J.__version=tt.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function Z(R,S,k,K,tt,J){const Dt=r.convert(k.format,k.colorSpace),xt=r.convert(k.type),At=v(k.internalFormat,Dt,xt,k.colorSpace);if(!n.get(S).__hasExternalTextures){const st=Math.max(1,S.width>>J),Tt=Math.max(1,S.height>>J);tt===s.TEXTURE_3D||tt===s.TEXTURE_2D_ARRAY?e.texImage3D(tt,J,At,st,Tt,S.depth,0,Dt,xt,null):e.texImage2D(tt,J,At,st,Tt,0,Dt,xt,null)}e.bindFramebuffer(s.FRAMEBUFFER,R),nt(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,K,tt,n.get(k).__webglTexture,0,ot(S)):(tt===s.TEXTURE_2D||tt>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,K,tt,n.get(k).__webglTexture,J),e.bindFramebuffer(s.FRAMEBUFFER,null)}function ut(R,S,k){if(s.bindRenderbuffer(s.RENDERBUFFER,R),S.depthBuffer){const K=S.depthTexture,tt=K&&K.isDepthTexture?K.type:null,J=x(S.stencilBuffer,tt),Dt=S.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,xt=ot(S);nt(S)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,xt,J,S.width,S.height):k?s.renderbufferStorageMultisample(s.RENDERBUFFER,xt,J,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,J,S.width,S.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,Dt,s.RENDERBUFFER,R)}else{const K=S.textures;for(let tt=0;tt<K.length;tt++){const J=K[tt],Dt=r.convert(J.format,J.colorSpace),xt=r.convert(J.type),At=v(J.internalFormat,Dt,xt,J.colorSpace),Kt=ot(S);k&&nt(S)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Kt,At,S.width,S.height):nt(S)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Kt,At,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,At,S.width,S.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function rt(R,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(s.FRAMEBUFFER,R),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),U(S.depthTexture,0);const K=n.get(S.depthTexture).__webglTexture,tt=ot(S);if(S.depthTexture.format===Zi)nt(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0,tt):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0);else if(S.depthTexture.format===ji)nt(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0,tt):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0);else throw new Error("Unknown depthTexture format")}function vt(R){const S=n.get(R),k=R.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==R.depthTexture){const K=R.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),K){const tt=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,K.removeEventListener("dispose",tt)};K.addEventListener("dispose",tt),S.__depthDisposeCallback=tt}S.__boundDepthTexture=K}if(R.depthTexture&&!S.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");rt(S.__webglFramebuffer,R)}else if(k){S.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(e.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer[K]),S.__webglDepthbuffer[K]===void 0)S.__webglDepthbuffer[K]=s.createRenderbuffer(),ut(S.__webglDepthbuffer[K],R,!1);else{const tt=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,J=S.__webglDepthbuffer[K];s.bindRenderbuffer(s.RENDERBUFFER,J),s.framebufferRenderbuffer(s.FRAMEBUFFER,tt,s.RENDERBUFFER,J)}}else if(e.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=s.createRenderbuffer(),ut(S.__webglDepthbuffer,R,!1);else{const K=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,tt=S.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,tt),s.framebufferRenderbuffer(s.FRAMEBUFFER,K,s.RENDERBUFFER,tt)}e.bindFramebuffer(s.FRAMEBUFFER,null)}function Lt(R,S,k){const K=n.get(R);S!==void 0&&Z(K.__webglFramebuffer,R,R.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),k!==void 0&&vt(R)}function Nt(R){const S=R.texture,k=n.get(R),K=n.get(S);R.addEventListener("dispose",A);const tt=R.textures,J=R.isWebGLCubeRenderTarget===!0,Dt=tt.length>1;if(Dt||(K.__webglTexture===void 0&&(K.__webglTexture=s.createTexture()),K.__version=S.version,a.memory.textures++),J){k.__webglFramebuffer=[];for(let xt=0;xt<6;xt++)if(S.mipmaps&&S.mipmaps.length>0){k.__webglFramebuffer[xt]=[];for(let At=0;At<S.mipmaps.length;At++)k.__webglFramebuffer[xt][At]=s.createFramebuffer()}else k.__webglFramebuffer[xt]=s.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){k.__webglFramebuffer=[];for(let xt=0;xt<S.mipmaps.length;xt++)k.__webglFramebuffer[xt]=s.createFramebuffer()}else k.__webglFramebuffer=s.createFramebuffer();if(Dt)for(let xt=0,At=tt.length;xt<At;xt++){const Kt=n.get(tt[xt]);Kt.__webglTexture===void 0&&(Kt.__webglTexture=s.createTexture(),a.memory.textures++)}if(R.samples>0&&nt(R)===!1){k.__webglMultisampledFramebuffer=s.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let xt=0;xt<tt.length;xt++){const At=tt[xt];k.__webglColorRenderbuffer[xt]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,k.__webglColorRenderbuffer[xt]);const Kt=r.convert(At.format,At.colorSpace),st=r.convert(At.type),Tt=v(At.internalFormat,Kt,st,At.colorSpace,R.isXRRenderTarget===!0),Gt=ot(R);s.renderbufferStorageMultisample(s.RENDERBUFFER,Gt,Tt,R.width,R.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+xt,s.RENDERBUFFER,k.__webglColorRenderbuffer[xt])}s.bindRenderbuffer(s.RENDERBUFFER,null),R.depthBuffer&&(k.__webglDepthRenderbuffer=s.createRenderbuffer(),ut(k.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(J){e.bindTexture(s.TEXTURE_CUBE_MAP,K.__webglTexture),it(s.TEXTURE_CUBE_MAP,S);for(let xt=0;xt<6;xt++)if(S.mipmaps&&S.mipmaps.length>0)for(let At=0;At<S.mipmaps.length;At++)Z(k.__webglFramebuffer[xt][At],R,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+xt,At);else Z(k.__webglFramebuffer[xt],R,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+xt,0);p(S)&&g(s.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Dt){for(let xt=0,At=tt.length;xt<At;xt++){const Kt=tt[xt],st=n.get(Kt);e.bindTexture(s.TEXTURE_2D,st.__webglTexture),it(s.TEXTURE_2D,Kt),Z(k.__webglFramebuffer,R,Kt,s.COLOR_ATTACHMENT0+xt,s.TEXTURE_2D,0),p(Kt)&&g(s.TEXTURE_2D)}e.unbindTexture()}else{let xt=s.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(xt=R.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(xt,K.__webglTexture),it(xt,S),S.mipmaps&&S.mipmaps.length>0)for(let At=0;At<S.mipmaps.length;At++)Z(k.__webglFramebuffer[At],R,S,s.COLOR_ATTACHMENT0,xt,At);else Z(k.__webglFramebuffer,R,S,s.COLOR_ATTACHMENT0,xt,0);p(S)&&g(xt),e.unbindTexture()}R.depthBuffer&&vt(R)}function kt(R){const S=R.textures;for(let k=0,K=S.length;k<K;k++){const tt=S[k];if(p(tt)){const J=R.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,Dt=n.get(tt).__webglTexture;e.bindTexture(J,Dt),g(J),e.unbindTexture()}}}const j=[],I=[];function ht(R){if(R.samples>0){if(nt(R)===!1){const S=R.textures,k=R.width,K=R.height;let tt=s.COLOR_BUFFER_BIT;const J=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Dt=n.get(R),xt=S.length>1;if(xt)for(let At=0;At<S.length;At++)e.bindFramebuffer(s.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+At,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,Dt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+At,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Dt.__webglFramebuffer);for(let At=0;At<S.length;At++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(tt|=s.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(tt|=s.STENCIL_BUFFER_BIT)),xt){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,Dt.__webglColorRenderbuffer[At]);const Kt=n.get(S[At]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,Kt,0)}s.blitFramebuffer(0,0,k,K,0,0,k,K,tt,s.NEAREST),l===!0&&(j.length=0,I.length=0,j.push(s.COLOR_ATTACHMENT0+At),R.depthBuffer&&R.resolveDepthBuffer===!1&&(j.push(J),I.push(J),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,I)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,j))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),xt)for(let At=0;At<S.length;At++){e.bindFramebuffer(s.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+At,s.RENDERBUFFER,Dt.__webglColorRenderbuffer[At]);const Kt=n.get(S[At]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,Dt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+At,s.TEXTURE_2D,Kt,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const S=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[S])}}}function ot(R){return Math.min(i.maxSamples,R.samples)}function nt(R){const S=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function dt(R){const S=a.render.frame;h.get(R)!==S&&(h.set(R,S),R.update())}function mt(R,S){const k=R.colorSpace,K=R.format,tt=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||k!==si&&k!==Zn&&(ne.getTransfer(k)===de?(K!==$e||tt!==Fn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),S}function pt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=b,this.setTexture2D=U,this.setTexture2DArray=q,this.setTexture3D=z,this.setTextureCube=X,this.rebindTextures=Lt,this.setupRenderTarget=Nt,this.updateRenderTargetMipmap=kt,this.updateMultisampleRenderTarget=ht,this.setupDepthRenderbuffer=vt,this.setupFrameBufferTexture=Z,this.useMultisampledRTT=nt}function kf(s,t){function e(n,i=Zn){let r;const a=ne.getTransfer(i);if(n===Fn)return s.UNSIGNED_BYTE;if(n===Go)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Wo)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Vc)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===zc)return s.BYTE;if(n===kc)return s.SHORT;if(n===Ns)return s.UNSIGNED_SHORT;if(n===Ho)return s.INT;if(n===ei)return s.UNSIGNED_INT;if(n===nn)return s.FLOAT;if(n===Vs)return s.HALF_FLOAT;if(n===Hc)return s.ALPHA;if(n===Gc)return s.RGB;if(n===$e)return s.RGBA;if(n===Wc)return s.LUMINANCE;if(n===Xc)return s.LUMINANCE_ALPHA;if(n===Zi)return s.DEPTH_COMPONENT;if(n===ji)return s.DEPTH_STENCIL;if(n===Xo)return s.RED;if(n===kr)return s.RED_INTEGER;if(n===qc)return s.RG;if(n===qo)return s.RG_INTEGER;if(n===Yo)return s.RGBA_INTEGER;if(n===cr||n===hr||n===ur||n===dr)if(a===de)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===cr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===cr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ro||n===ao||n===oo||n===lo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ro)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ao)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===oo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===lo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===co||n===ho||n===uo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===co||n===ho)return a===de?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===uo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===fo||n===po||n===mo||n===go||n===_o||n===xo||n===vo||n===yo||n===Mo||n===bo||n===So||n===wo||n===Ao||n===To)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===fo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===po)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===mo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===go)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===_o)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===xo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===vo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===yo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Mo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===bo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===So)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===wo)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ao)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===To)return a===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===fr||n===Eo||n===Co)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===fr)return a===de?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Eo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Co)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Yc||n===Ro||n===Po||n===Io)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===fr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ro)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Po)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Io)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Qi?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}class Vf extends Ne{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class pe extends ee{constructor(){super(),this.isGroup=!0,this.type="Group"}}const cy={type:"move"};class Jl{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const _ of t.hand.values()){const p=e.getJointPose(_,n),g=this._getHandJoint(c,_);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,m=.005;c.inputState.pinching&&u>f+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(cy)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new pe;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const hy=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,uy=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class dy{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new ve,r=t.properties.get(i);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new an({vertexShader:hy,fragmentShader:uy,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new at(new On(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class fy extends zn{constructor(t,e){super();const n=this;let i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,m=null;const _=new dy,p=e.getContextAttributes();let g=null,v=null;const x=[],y=[],E=new Q;let A=null;const w=new Ne;w.layers.enable(1),w.viewport=new te;const P=new Ne;P.layers.enable(2),P.viewport=new te;const L=[w,P],M=new Vf;M.layers.enable(1),M.layers.enable(2);let b=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(V){let Z=x[V];return Z===void 0&&(Z=new Jl,x[V]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(V){let Z=x[V];return Z===void 0&&(Z=new Jl,x[V]=Z),Z.getGripSpace()},this.getHand=function(V){let Z=x[V];return Z===void 0&&(Z=new Jl,x[V]=Z),Z.getHandSpace()};function N(V){const Z=y.indexOf(V.inputSource);if(Z===-1)return;const ut=x[Z];ut!==void 0&&(ut.update(V.inputSource,V.frame,c||a),ut.dispatchEvent({type:V.type,data:V.inputSource}))}function U(){i.removeEventListener("select",N),i.removeEventListener("selectstart",N),i.removeEventListener("selectend",N),i.removeEventListener("squeeze",N),i.removeEventListener("squeezestart",N),i.removeEventListener("squeezeend",N),i.removeEventListener("end",U),i.removeEventListener("inputsourceschange",q);for(let V=0;V<x.length;V++){const Z=y[V];Z!==null&&(y[V]=null,x[V].disconnect(Z))}b=null,B=null,_.reset(),t.setRenderTarget(g),f=null,u=null,d=null,i=null,v=null,Et.stop(),n.isPresenting=!1,t.setPixelRatio(A),t.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(V){r=V,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(V){o=V,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(V){c=V},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function(V){if(i=V,i!==null){if(g=t.getRenderTarget(),i.addEventListener("select",N),i.addEventListener("selectstart",N),i.addEventListener("selectend",N),i.addEventListener("squeeze",N),i.addEventListener("squeezestart",N),i.addEventListener("squeezeend",N),i.addEventListener("end",U),i.addEventListener("inputsourceschange",q),p.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(E),i.renderState.layers===void 0){const Z={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,e,Z),i.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new Tn(f.framebufferWidth,f.framebufferHeight,{format:$e,type:Fn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let Z=null,ut=null,rt=null;p.depth&&(rt=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Z=p.stencil?ji:Zi,ut=p.stencil?Qi:ei);const vt={colorFormat:e.RGBA8,depthFormat:rt,scaleFactor:r};d=new XRWebGLBinding(i,e),u=d.createProjectionLayer(vt),i.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),v=new Tn(u.textureWidth,u.textureHeight,{format:$e,type:Fn,depthTexture:new eh(u.textureWidth,u.textureHeight,ut,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Et.setContext(i),Et.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function q(V){for(let Z=0;Z<V.removed.length;Z++){const ut=V.removed[Z],rt=y.indexOf(ut);rt>=0&&(y[rt]=null,x[rt].disconnect(ut))}for(let Z=0;Z<V.added.length;Z++){const ut=V.added[Z];let rt=y.indexOf(ut);if(rt===-1){for(let Lt=0;Lt<x.length;Lt++)if(Lt>=y.length){y.push(ut),rt=Lt;break}else if(y[Lt]===null){y[Lt]=ut,rt=Lt;break}if(rt===-1)break}const vt=x[rt];vt&&vt.connect(ut)}}const z=new C,X=new C;function W(V,Z,ut){z.setFromMatrixPosition(Z.matrixWorld),X.setFromMatrixPosition(ut.matrixWorld);const rt=z.distanceTo(X),vt=Z.projectionMatrix.elements,Lt=ut.projectionMatrix.elements,Nt=vt[14]/(vt[10]-1),kt=vt[14]/(vt[10]+1),j=(vt[9]+1)/vt[5],I=(vt[9]-1)/vt[5],ht=(vt[8]-1)/vt[0],ot=(Lt[8]+1)/Lt[0],nt=Nt*ht,dt=Nt*ot,mt=rt/(-ht+ot),pt=mt*-ht;if(Z.matrixWorld.decompose(V.position,V.quaternion,V.scale),V.translateX(pt),V.translateZ(mt),V.matrixWorld.compose(V.position,V.quaternion,V.scale),V.matrixWorldInverse.copy(V.matrixWorld).invert(),vt[10]===-1)V.projectionMatrix.copy(Z.projectionMatrix),V.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{const R=Nt+mt,S=kt+mt,k=nt-pt,K=dt+(rt-pt),tt=j*kt/S*R,J=I*kt/S*R;V.projectionMatrix.makePerspective(k,K,tt,J,R,S),V.projectionMatrixInverse.copy(V.projectionMatrix).invert()}}function _t(V,Z){Z===null?V.matrixWorld.copy(V.matrix):V.matrixWorld.multiplyMatrices(Z.matrixWorld,V.matrix),V.matrixWorldInverse.copy(V.matrixWorld).invert()}this.updateCamera=function(V){if(i===null)return;let Z=V.near,ut=V.far;_.texture!==null&&(_.depthNear>0&&(Z=_.depthNear),_.depthFar>0&&(ut=_.depthFar)),M.near=P.near=w.near=Z,M.far=P.far=w.far=ut,(b!==M.near||B!==M.far)&&(i.updateRenderState({depthNear:M.near,depthFar:M.far}),b=M.near,B=M.far);const rt=V.parent,vt=M.cameras;_t(M,rt);for(let Lt=0;Lt<vt.length;Lt++)_t(vt[Lt],rt);vt.length===2?W(M,w,P):M.projectionMatrix.copy(w.projectionMatrix),yt(V,M,rt)};function yt(V,Z,ut){ut===null?V.matrix.copy(Z.matrixWorld):(V.matrix.copy(ut.matrixWorld),V.matrix.invert(),V.matrix.multiply(Z.matrixWorld)),V.matrix.decompose(V.position,V.quaternion,V.scale),V.updateMatrixWorld(!0),V.projectionMatrix.copy(Z.projectionMatrix),V.projectionMatrixInverse.copy(Z.projectionMatrixInverse),V.isPerspectiveCamera&&(V.fov=Fs*2*Math.atan(1/V.projectionMatrix.elements[5]),V.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(V){l=V,u!==null&&(u.fixedFoveation=V),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=V)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)};let it=null;function ct(V,Z){if(h=Z.getViewerPose(c||a),m=Z,h!==null){const ut=h.views;f!==null&&(t.setRenderTargetFramebuffer(v,f.framebuffer),t.setRenderTarget(v));let rt=!1;ut.length!==M.cameras.length&&(M.cameras.length=0,rt=!0);for(let Lt=0;Lt<ut.length;Lt++){const Nt=ut[Lt];let kt=null;if(f!==null)kt=f.getViewport(Nt);else{const I=d.getViewSubImage(u,Nt);kt=I.viewport,Lt===0&&(t.setRenderTargetTextures(v,I.colorTexture,u.ignoreDepthValues?void 0:I.depthStencilTexture),t.setRenderTarget(v))}let j=L[Lt];j===void 0&&(j=new Ne,j.layers.enable(Lt),j.viewport=new te,L[Lt]=j),j.matrix.fromArray(Nt.transform.matrix),j.matrix.decompose(j.position,j.quaternion,j.scale),j.projectionMatrix.fromArray(Nt.projectionMatrix),j.projectionMatrixInverse.copy(j.projectionMatrix).invert(),j.viewport.set(kt.x,kt.y,kt.width,kt.height),Lt===0&&(M.matrix.copy(j.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),rt===!0&&M.cameras.push(j)}const vt=i.enabledFeatures;if(vt&&vt.includes("depth-sensing")){const Lt=d.getDepthInformation(ut[0]);Lt&&Lt.isValid&&Lt.texture&&_.init(t,Lt,i.renderState)}}for(let ut=0;ut<x.length;ut++){const rt=y[ut],vt=x[ut];rt!==null&&vt!==void 0&&vt.update(rt,Z,c||a)}it&&it(V,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),m=null}const Et=new Nf;Et.setAnimationLoop(ct),this.setAnimationLoop=function(V){it=V},this.dispose=function(){}}}const Ci=new pn,py=new Bt;function my(s,t){function e(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,If(s)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function i(p,g,v,x,y){g.isMeshBasicMaterial||g.isMeshLambertMaterial?r(p,g):g.isMeshToonMaterial?(r(p,g),d(p,g)):g.isMeshPhongMaterial?(r(p,g),h(p,g)):g.isMeshStandardMaterial?(r(p,g),u(p,g),g.isMeshPhysicalMaterial&&f(p,g,y)):g.isMeshMatcapMaterial?(r(p,g),m(p,g)):g.isMeshDepthMaterial?r(p,g):g.isMeshDistanceMaterial?(r(p,g),_(p,g)):g.isMeshNormalMaterial?r(p,g):g.isLineBasicMaterial?(a(p,g),g.isLineDashedMaterial&&o(p,g)):g.isPointsMaterial?l(p,g,v,x):g.isSpriteMaterial?c(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,e(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===Ae&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,e(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===Ae&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,e(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,e(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);const v=t.get(g),x=v.envMap,y=v.envMapRotation;x&&(p.envMap.value=x,Ci.copy(y),Ci.x*=-1,Ci.y*=-1,Ci.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(Ci.y*=-1,Ci.z*=-1),p.envMapRotation.value.setFromMatrix4(py.makeRotationFromEuler(Ci)),p.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,p.aoMapTransform))}function a(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform))}function o(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function l(p,g,v,x){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*v,p.scale.value=x*.5,g.map&&(p.map.value=g.map,e(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function c(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function h(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function d(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function u(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,v){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Ae&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function _(p,g){const v=t.get(g).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function gy(s,t,e,n){let i={},r={},a=[];const o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,x){const y=x.program;n.uniformBlockBinding(v,y)}function c(v,x){let y=i[v.id];y===void 0&&(m(v),y=h(v),i[v.id]=y,v.addEventListener("dispose",p));const E=x.program;n.updateUBOMapping(v,E);const A=t.render.frame;r[v.id]!==A&&(u(v),r[v.id]=A)}function h(v){const x=d();v.__bindingPointIndex=x;const y=s.createBuffer(),E=v.__size,A=v.usage;return s.bindBuffer(s.UNIFORM_BUFFER,y),s.bufferData(s.UNIFORM_BUFFER,E,A),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,x,y),y}function d(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){const x=i[v.id],y=v.uniforms,E=v.__cache;s.bindBuffer(s.UNIFORM_BUFFER,x);for(let A=0,w=y.length;A<w;A++){const P=Array.isArray(y[A])?y[A]:[y[A]];for(let L=0,M=P.length;L<M;L++){const b=P[L];if(f(b,A,L,E)===!0){const B=b.__offset,N=Array.isArray(b.value)?b.value:[b.value];let U=0;for(let q=0;q<N.length;q++){const z=N[q],X=_(z);typeof z=="number"||typeof z=="boolean"?(b.__data[0]=z,s.bufferSubData(s.UNIFORM_BUFFER,B+U,b.__data)):z.isMatrix3?(b.__data[0]=z.elements[0],b.__data[1]=z.elements[1],b.__data[2]=z.elements[2],b.__data[3]=0,b.__data[4]=z.elements[3],b.__data[5]=z.elements[4],b.__data[6]=z.elements[5],b.__data[7]=0,b.__data[8]=z.elements[6],b.__data[9]=z.elements[7],b.__data[10]=z.elements[8],b.__data[11]=0):(z.toArray(b.__data,U),U+=X.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,B,b.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function f(v,x,y,E){const A=v.value,w=x+"_"+y;if(E[w]===void 0)return typeof A=="number"||typeof A=="boolean"?E[w]=A:E[w]=A.clone(),!0;{const P=E[w];if(typeof A=="number"||typeof A=="boolean"){if(P!==A)return E[w]=A,!0}else if(P.equals(A)===!1)return P.copy(A),!0}return!1}function m(v){const x=v.uniforms;let y=0;const E=16;for(let w=0,P=x.length;w<P;w++){const L=Array.isArray(x[w])?x[w]:[x[w]];for(let M=0,b=L.length;M<b;M++){const B=L[M],N=Array.isArray(B.value)?B.value:[B.value];for(let U=0,q=N.length;U<q;U++){const z=N[U],X=_(z),W=y%E,_t=W%X.boundary,yt=W+_t;y+=_t,yt!==0&&E-yt<X.storage&&(y+=E-yt),B.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=y,y+=X.storage}}}const A=y%E;return A>0&&(y+=E-A),v.__size=y,v.__cache={},this}function _(v){const x={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(x.boundary=4,x.storage=4):v.isVector2?(x.boundary=8,x.storage=8):v.isVector3||v.isColor?(x.boundary=16,x.storage=12):v.isVector4?(x.boundary=16,x.storage=16):v.isMatrix3?(x.boundary=48,x.storage=48):v.isMatrix4?(x.boundary=64,x.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),x}function p(v){const x=v.target;x.removeEventListener("dispose",p);const y=a.indexOf(x.__bindingPointIndex);a.splice(y,1),s.deleteBuffer(i[x.id]),delete i[x.id],delete r[x.id]}function g(){for(const v in i)s.deleteBuffer(i[v]);a=[],i={},r={}}return{bind:l,update:c,dispose:g}}class Hf{constructor(t={}){const{canvas:e=Ef(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=a;const f=new Uint32Array(4),m=new Int32Array(4);let _=null,p=null;const g=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=_n,this.toneMapping=Qn,this.toneMappingExposure=1;const x=this;let y=!1,E=0,A=0,w=null,P=-1,L=null;const M=new te,b=new te;let B=null;const N=new ft(0);let U=0,q=e.width,z=e.height,X=1,W=null,_t=null;const yt=new te(0,0,q,z),it=new te(0,0,q,z);let ct=!1;const Et=new Gr;let V=!1,Z=!1;const ut=new Bt,rt=new Bt,vt=new C,Lt=new te,Nt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let kt=!1;function j(){return w===null?X:1}let I=n;function ht(T,F){return e.getContext(T,F)}try{const T={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ko}`),e.addEventListener("webglcontextlost",et,!1),e.addEventListener("webglcontextrestored",Mt,!1),e.addEventListener("webglcontextcreationerror",wt,!1),I===null){const F="webgl2";if(I=ht(F,T),I===null)throw ht(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let ot,nt,dt,mt,pt,R,S,k,K,tt,J,Dt,xt,At,Kt,st,Tt,Gt,Wt,Ct,Jt,qt,ue,D;function St(){ot=new bx(I),ot.init(),qt=new kf(I,ot),nt=new gx(I,ot,t,qt),dt=new ny(I),nt.reverseDepthBuffer&&dt.buffers.depth.setReversed(!0),mt=new Ax(I),pt=new Gv,R=new ly(I,ot,dt,pt,nt,qt,mt),S=new xx(x),k=new Mx(x),K=new Lg(I),ue=new px(I,K),tt=new Sx(I,K,mt,ue),J=new Ex(I,tt,K,mt),Wt=new Tx(I,nt,R),st=new _x(pt),Dt=new Hv(x,S,k,ot,nt,ue,st),xt=new my(x,pt),At=new Xv,Kt=new Jv(ot),Gt=new fx(x,S,k,dt,J,u,l),Tt=new ty(x,J,nt),D=new gy(I,mt,nt,dt),Ct=new mx(I,ot,mt),Jt=new wx(I,ot,mt),mt.programs=Dt.programs,x.capabilities=nt,x.extensions=ot,x.properties=pt,x.renderLists=At,x.shadowMap=Tt,x.state=dt,x.info=mt}St();const $=new fy(x,I);this.xr=$,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const T=ot.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=ot.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return X},this.setPixelRatio=function(T){T!==void 0&&(X=T,this.setSize(q,z,!1))},this.getSize=function(T){return T.set(q,z)},this.setSize=function(T,F,H=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=T,z=F,e.width=Math.floor(T*X),e.height=Math.floor(F*X),H===!0&&(e.style.width=T+"px",e.style.height=F+"px"),this.setViewport(0,0,T,F)},this.getDrawingBufferSize=function(T){return T.set(q*X,z*X).floor()},this.setDrawingBufferSize=function(T,F,H){q=T,z=F,X=H,e.width=Math.floor(T*H),e.height=Math.floor(F*H),this.setViewport(0,0,T,F)},this.getCurrentViewport=function(T){return T.copy(M)},this.getViewport=function(T){return T.copy(yt)},this.setViewport=function(T,F,H,G){T.isVector4?yt.set(T.x,T.y,T.z,T.w):yt.set(T,F,H,G),dt.viewport(M.copy(yt).multiplyScalar(X).round())},this.getScissor=function(T){return T.copy(it)},this.setScissor=function(T,F,H,G){T.isVector4?it.set(T.x,T.y,T.z,T.w):it.set(T,F,H,G),dt.scissor(b.copy(it).multiplyScalar(X).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(T){dt.setScissorTest(ct=T)},this.setOpaqueSort=function(T){W=T},this.setTransparentSort=function(T){_t=T},this.getClearColor=function(T){return T.copy(Gt.getClearColor())},this.setClearColor=function(){Gt.setClearColor.apply(Gt,arguments)},this.getClearAlpha=function(){return Gt.getClearAlpha()},this.setClearAlpha=function(){Gt.setClearAlpha.apply(Gt,arguments)},this.clear=function(T=!0,F=!0,H=!0){let G=0;if(T){let O=!1;if(w!==null){const lt=w.texture.format;O=lt===Yo||lt===qo||lt===kr}if(O){const lt=w.texture.type,bt=lt===Fn||lt===ei||lt===Ns||lt===Qi||lt===Go||lt===Wo,It=Gt.getClearColor(),Ut=Gt.getClearAlpha(),zt=It.r,Vt=It.g,Ft=It.b;bt?(f[0]=zt,f[1]=Vt,f[2]=Ft,f[3]=Ut,I.clearBufferuiv(I.COLOR,0,f)):(m[0]=zt,m[1]=Vt,m[2]=Ft,m[3]=Ut,I.clearBufferiv(I.COLOR,0,m))}else G|=I.COLOR_BUFFER_BIT}F&&(G|=I.DEPTH_BUFFER_BIT,I.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),H&&(G|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",et,!1),e.removeEventListener("webglcontextrestored",Mt,!1),e.removeEventListener("webglcontextcreationerror",wt,!1),At.dispose(),Kt.dispose(),pt.dispose(),S.dispose(),k.dispose(),J.dispose(),ue.dispose(),D.dispose(),Dt.dispose(),$.dispose(),$.removeEventListener("sessionstart",Lh),$.removeEventListener("sessionend",Dh),bi.stop()};function et(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function Mt(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;const T=mt.autoReset,F=Tt.enabled,H=Tt.autoUpdate,G=Tt.needsUpdate,O=Tt.type;St(),mt.autoReset=T,Tt.enabled=F,Tt.autoUpdate=H,Tt.needsUpdate=G,Tt.type=O}function wt(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function Qt(T){const F=T.target;F.removeEventListener("dispose",Qt),Te(F)}function Te(T){Je(T),pt.remove(T)}function Je(T){const F=pt.get(T).programs;F!==void 0&&(F.forEach(function(H){Dt.releaseProgram(H)}),T.isShaderMaterial&&Dt.releaseShaderCache(T))}this.renderBufferDirect=function(T,F,H,G,O,lt){F===null&&(F=Nt);const bt=O.isMesh&&O.matrixWorld.determinant()<0,It=Jp(T,F,H,G,O);dt.setMaterial(G,bt);let Ut=H.index,zt=1;if(G.wireframe===!0){if(Ut=tt.getWireframeAttribute(H),Ut===void 0)return;zt=2}const Vt=H.drawRange,Ft=H.attributes.position;let le=Vt.start*zt,fe=(Vt.start+Vt.count)*zt;lt!==null&&(le=Math.max(le,lt.start*zt),fe=Math.min(fe,(lt.start+lt.count)*zt)),Ut!==null?(le=Math.max(le,0),fe=Math.min(fe,Ut.count)):Ft!=null&&(le=Math.max(le,0),fe=Math.min(fe,Ft.count));const ge=fe-le;if(ge<0||ge===1/0)return;ue.setup(O,G,It,H,Ut);let ln,ae=Ct;if(Ut!==null&&(ln=K.get(Ut),ae=Jt,ae.setIndex(ln)),O.isMesh)G.wireframe===!0?(dt.setLineWidth(G.wireframeLinewidth*j()),ae.setMode(I.LINES)):ae.setMode(I.TRIANGLES);else if(O.isLine){let Ot=G.linewidth;Ot===void 0&&(Ot=1),dt.setLineWidth(Ot*j()),O.isLineSegments?ae.setMode(I.LINES):O.isLineLoop?ae.setMode(I.LINE_LOOP):ae.setMode(I.LINE_STRIP)}else O.isPoints?ae.setMode(I.POINTS):O.isSprite&&ae.setMode(I.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)ae.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(ot.get("WEBGL_multi_draw"))ae.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{const Ot=O._multiDrawStarts,Oe=O._multiDrawCounts,oe=O._multiDrawCount,yn=Ut?K.get(Ut).bytesPerElement:1,rs=pt.get(G).currentProgram.getUniforms();for(let cn=0;cn<oe;cn++)rs.setValue(I,"_gl_DrawID",cn),ae.render(Ot[cn]/yn,Oe[cn])}else if(O.isInstancedMesh)ae.renderInstances(le,ge,O.count);else if(H.isInstancedBufferGeometry){const Ot=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Oe=Math.min(H.instanceCount,Ot);ae.renderInstances(le,ge,Oe)}else ae.render(le,ge)};function re(T,F,H){T.transparent===!0&&T.side===xn&&T.forceSinglePass===!1?(T.side=Ae,T.needsUpdate=!0,Kr(T,F,H),T.side=jn,T.needsUpdate=!0,Kr(T,F,H),T.side=xn):Kr(T,F,H)}this.compile=function(T,F,H=null){H===null&&(H=T),p=Kt.get(H),p.init(F),v.push(p),H.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),T!==H&&T.traverseVisible(function(O){O.isLight&&O.layers.test(F.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();const G=new Set;return T.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;const lt=O.material;if(lt)if(Array.isArray(lt))for(let bt=0;bt<lt.length;bt++){const It=lt[bt];re(It,H,O),G.add(It)}else re(lt,H,O),G.add(lt)}),v.pop(),p=null,G},this.compileAsync=function(T,F,H=null){const G=this.compile(T,F,H);return new Promise(O=>{function lt(){if(G.forEach(function(bt){pt.get(bt).currentProgram.isReady()&&G.delete(bt)}),G.size===0){O(T);return}setTimeout(lt,10)}ot.get("KHR_parallel_shader_compile")!==null?lt():setTimeout(lt,10)})};let Qe=null;function Vn(T){Qe&&Qe(T)}function Lh(){bi.stop()}function Dh(){bi.start()}const bi=new Nf;bi.setAnimationLoop(Vn),typeof self<"u"&&bi.setContext(self),this.setAnimationLoop=function(T){Qe=T,$.setAnimationLoop(T),T===null?bi.stop():bi.start()},$.addEventListener("sessionstart",Lh),$.addEventListener("sessionend",Dh),this.render=function(T,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(F),F=$.getCamera()),T.isScene===!0&&T.onBeforeRender(x,T,F,w),p=Kt.get(T,v.length),p.init(F),v.push(p),rt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),Et.setFromProjectionMatrix(rt),Z=this.localClippingEnabled,V=st.init(this.clippingPlanes,Z),_=At.get(T,g.length),_.init(),g.push(_),$.enabled===!0&&$.isPresenting===!0){const lt=x.xr.getDepthSensingMesh();lt!==null&&yl(lt,F,-1/0,x.sortObjects)}yl(T,F,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(W,_t),kt=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,kt&&Gt.addToRenderList(_,T),this.info.render.frame++,V===!0&&st.beginShadows();const H=p.state.shadowsArray;Tt.render(H,T,F),V===!0&&st.endShadows(),this.info.autoReset===!0&&this.info.reset();const G=_.opaque,O=_.transmissive;if(p.setupLights(),F.isArrayCamera){const lt=F.cameras;if(O.length>0)for(let bt=0,It=lt.length;bt<It;bt++){const Ut=lt[bt];Nh(G,O,T,Ut)}kt&&Gt.render(T);for(let bt=0,It=lt.length;bt<It;bt++){const Ut=lt[bt];Uh(_,T,Ut,Ut.viewport)}}else O.length>0&&Nh(G,O,T,F),kt&&Gt.render(T),Uh(_,T,F);w!==null&&(R.updateMultisampleRenderTarget(w),R.updateRenderTargetMipmap(w)),T.isScene===!0&&T.onAfterRender(x,T,F),ue.resetDefaultState(),P=-1,L=null,v.pop(),v.length>0?(p=v[v.length-1],V===!0&&st.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,g.pop(),g.length>0?_=g[g.length-1]:_=null};function yl(T,F,H,G){if(T.visible===!1)return;if(T.layers.test(F.layers)){if(T.isGroup)H=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(F);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||Et.intersectsSprite(T)){G&&Lt.setFromMatrixPosition(T.matrixWorld).applyMatrix4(rt);const bt=J.update(T),It=T.material;It.visible&&_.push(T,bt,It,H,Lt.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||Et.intersectsObject(T))){const bt=J.update(T),It=T.material;if(G&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),Lt.copy(T.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),Lt.copy(bt.boundingSphere.center)),Lt.applyMatrix4(T.matrixWorld).applyMatrix4(rt)),Array.isArray(It)){const Ut=bt.groups;for(let zt=0,Vt=Ut.length;zt<Vt;zt++){const Ft=Ut[zt],le=It[Ft.materialIndex];le&&le.visible&&_.push(T,bt,le,H,Lt.z,Ft)}}else It.visible&&_.push(T,bt,It,H,Lt.z,null)}}const lt=T.children;for(let bt=0,It=lt.length;bt<It;bt++)yl(lt[bt],F,H,G)}function Uh(T,F,H,G){const O=T.opaque,lt=T.transmissive,bt=T.transparent;p.setupLightsView(H),V===!0&&st.setGlobalState(x.clippingPlanes,H),G&&dt.viewport(M.copy(G)),O.length>0&&$r(O,F,H),lt.length>0&&$r(lt,F,H),bt.length>0&&$r(bt,F,H),dt.buffers.depth.setTest(!0),dt.buffers.depth.setMask(!0),dt.buffers.color.setMask(!0),dt.setPolygonOffset(!1)}function Nh(T,F,H,G){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[G.id]===void 0&&(p.state.transmissionRenderTarget[G.id]=new Tn(1,1,{generateMipmaps:!0,type:ot.has("EXT_color_buffer_half_float")||ot.has("EXT_color_buffer_float")?Vs:Fn,minFilter:Ln,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ne.workingColorSpace}));const lt=p.state.transmissionRenderTarget[G.id],bt=G.viewport||M;lt.setSize(bt.z,bt.w);const It=x.getRenderTarget();x.setRenderTarget(lt),x.getClearColor(N),U=x.getClearAlpha(),U<1&&x.setClearColor(16777215,.5),x.clear(),kt&&Gt.render(H);const Ut=x.toneMapping;x.toneMapping=Qn;const zt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),p.setupLightsView(G),V===!0&&st.setGlobalState(x.clippingPlanes,G),$r(T,H,G),R.updateMultisampleRenderTarget(lt),R.updateRenderTargetMipmap(lt),ot.has("WEBGL_multisampled_render_to_texture")===!1){let Vt=!1;for(let Ft=0,le=F.length;Ft<le;Ft++){const fe=F[Ft],ge=fe.object,ln=fe.geometry,ae=fe.material,Ot=fe.group;if(ae.side===xn&&ge.layers.test(G.layers)){const Oe=ae.side;ae.side=Ae,ae.needsUpdate=!0,Fh(ge,H,G,ln,ae,Ot),ae.side=Oe,ae.needsUpdate=!0,Vt=!0}}Vt===!0&&(R.updateMultisampleRenderTarget(lt),R.updateRenderTargetMipmap(lt))}x.setRenderTarget(It),x.setClearColor(N,U),zt!==void 0&&(G.viewport=zt),x.toneMapping=Ut}function $r(T,F,H){const G=F.isScene===!0?F.overrideMaterial:null;for(let O=0,lt=T.length;O<lt;O++){const bt=T[O],It=bt.object,Ut=bt.geometry,zt=G===null?bt.material:G,Vt=bt.group;It.layers.test(H.layers)&&Fh(It,F,H,Ut,zt,Vt)}}function Fh(T,F,H,G,O,lt){T.onBeforeRender(x,F,H,G,O,lt),T.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),O.onBeforeRender(x,F,H,G,T,lt),O.transparent===!0&&O.side===xn&&O.forceSinglePass===!1?(O.side=Ae,O.needsUpdate=!0,x.renderBufferDirect(H,F,G,O,T,lt),O.side=jn,O.needsUpdate=!0,x.renderBufferDirect(H,F,G,O,T,lt),O.side=xn):x.renderBufferDirect(H,F,G,O,T,lt),T.onAfterRender(x,F,H,G,O,lt)}function Kr(T,F,H){F.isScene!==!0&&(F=Nt);const G=pt.get(T),O=p.state.lights,lt=p.state.shadowsArray,bt=O.state.version,It=Dt.getParameters(T,O.state,lt,F,H),Ut=Dt.getProgramCacheKey(It);let zt=G.programs;G.environment=T.isMeshStandardMaterial?F.environment:null,G.fog=F.fog,G.envMap=(T.isMeshStandardMaterial?k:S).get(T.envMap||G.environment),G.envMapRotation=G.environment!==null&&T.envMap===null?F.environmentRotation:T.envMapRotation,zt===void 0&&(T.addEventListener("dispose",Qt),zt=new Map,G.programs=zt);let Vt=zt.get(Ut);if(Vt!==void 0){if(G.currentProgram===Vt&&G.lightsStateVersion===bt)return Bh(T,It),Vt}else It.uniforms=Dt.getUniforms(T),T.onBeforeCompile(It,x),Vt=Dt.acquireProgram(It,Ut),zt.set(Ut,Vt),G.uniforms=It.uniforms;const Ft=G.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Ft.clippingPlanes=st.uniform),Bh(T,It),G.needsLights=jp(T),G.lightsStateVersion=bt,G.needsLights&&(Ft.ambientLightColor.value=O.state.ambient,Ft.lightProbe.value=O.state.probe,Ft.directionalLights.value=O.state.directional,Ft.directionalLightShadows.value=O.state.directionalShadow,Ft.spotLights.value=O.state.spot,Ft.spotLightShadows.value=O.state.spotShadow,Ft.rectAreaLights.value=O.state.rectArea,Ft.ltc_1.value=O.state.rectAreaLTC1,Ft.ltc_2.value=O.state.rectAreaLTC2,Ft.pointLights.value=O.state.point,Ft.pointLightShadows.value=O.state.pointShadow,Ft.hemisphereLights.value=O.state.hemi,Ft.directionalShadowMap.value=O.state.directionalShadowMap,Ft.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ft.spotShadowMap.value=O.state.spotShadowMap,Ft.spotLightMatrix.value=O.state.spotLightMatrix,Ft.spotLightMap.value=O.state.spotLightMap,Ft.pointShadowMap.value=O.state.pointShadowMap,Ft.pointShadowMatrix.value=O.state.pointShadowMatrix),G.currentProgram=Vt,G.uniformsList=null,Vt}function Oh(T){if(T.uniformsList===null){const F=T.currentProgram.getUniforms();T.uniformsList=qa.seqWithValue(F.seq,T.uniforms)}return T.uniformsList}function Bh(T,F){const H=pt.get(T);H.outputColorSpace=F.outputColorSpace,H.batching=F.batching,H.batchingColor=F.batchingColor,H.instancing=F.instancing,H.instancingColor=F.instancingColor,H.instancingMorph=F.instancingMorph,H.skinning=F.skinning,H.morphTargets=F.morphTargets,H.morphNormals=F.morphNormals,H.morphColors=F.morphColors,H.morphTargetsCount=F.morphTargetsCount,H.numClippingPlanes=F.numClippingPlanes,H.numIntersection=F.numClipIntersection,H.vertexAlphas=F.vertexAlphas,H.vertexTangents=F.vertexTangents,H.toneMapping=F.toneMapping}function Jp(T,F,H,G,O){F.isScene!==!0&&(F=Nt),R.resetTextureUnits();const lt=F.fog,bt=G.isMeshStandardMaterial?F.environment:null,It=w===null?x.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:si,Ut=(G.isMeshStandardMaterial?k:S).get(G.envMap||bt),zt=G.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Vt=!!H.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Ft=!!H.morphAttributes.position,le=!!H.morphAttributes.normal,fe=!!H.morphAttributes.color;let ge=Qn;G.toneMapped&&(w===null||w.isXRRenderTarget===!0)&&(ge=x.toneMapping);const ln=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ae=ln!==void 0?ln.length:0,Ot=pt.get(G),Oe=p.state.lights;if(V===!0&&(Z===!0||T!==L)){const mn=T===L&&G.id===P;st.setState(G,T,mn)}let oe=!1;G.version===Ot.__version?(Ot.needsLights&&Ot.lightsStateVersion!==Oe.state.version||Ot.outputColorSpace!==It||O.isBatchedMesh&&Ot.batching===!1||!O.isBatchedMesh&&Ot.batching===!0||O.isBatchedMesh&&Ot.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Ot.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Ot.instancing===!1||!O.isInstancedMesh&&Ot.instancing===!0||O.isSkinnedMesh&&Ot.skinning===!1||!O.isSkinnedMesh&&Ot.skinning===!0||O.isInstancedMesh&&Ot.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Ot.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Ot.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Ot.instancingMorph===!1&&O.morphTexture!==null||Ot.envMap!==Ut||G.fog===!0&&Ot.fog!==lt||Ot.numClippingPlanes!==void 0&&(Ot.numClippingPlanes!==st.numPlanes||Ot.numIntersection!==st.numIntersection)||Ot.vertexAlphas!==zt||Ot.vertexTangents!==Vt||Ot.morphTargets!==Ft||Ot.morphNormals!==le||Ot.morphColors!==fe||Ot.toneMapping!==ge||Ot.morphTargetsCount!==ae)&&(oe=!0):(oe=!0,Ot.__version=G.version);let yn=Ot.currentProgram;oe===!0&&(yn=Kr(G,F,O));let rs=!1,cn=!1,Ml=!1;const ye=yn.getUniforms(),ri=Ot.uniforms;if(dt.useProgram(yn.program)&&(rs=!0,cn=!0,Ml=!0),G.id!==P&&(P=G.id,cn=!0),rs||L!==T){nt.reverseDepthBuffer?(ut.copy(T.projectionMatrix),ng(ut),ig(ut),ye.setValue(I,"projectionMatrix",ut)):ye.setValue(I,"projectionMatrix",T.projectionMatrix),ye.setValue(I,"viewMatrix",T.matrixWorldInverse);const mn=ye.map.cameraPosition;mn!==void 0&&mn.setValue(I,vt.setFromMatrixPosition(T.matrixWorld)),nt.logarithmicDepthBuffer&&ye.setValue(I,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&ye.setValue(I,"isOrthographic",T.isOrthographicCamera===!0),L!==T&&(L=T,cn=!0,Ml=!0)}if(O.isSkinnedMesh){ye.setOptional(I,O,"bindMatrix"),ye.setOptional(I,O,"bindMatrixInverse");const mn=O.skeleton;mn&&(mn.boneTexture===null&&mn.computeBoneTexture(),ye.setValue(I,"boneTexture",mn.boneTexture,R))}O.isBatchedMesh&&(ye.setOptional(I,O,"batchingTexture"),ye.setValue(I,"batchingTexture",O._matricesTexture,R),ye.setOptional(I,O,"batchingIdTexture"),ye.setValue(I,"batchingIdTexture",O._indirectTexture,R),ye.setOptional(I,O,"batchingColorTexture"),O._colorsTexture!==null&&ye.setValue(I,"batchingColorTexture",O._colorsTexture,R));const bl=H.morphAttributes;if((bl.position!==void 0||bl.normal!==void 0||bl.color!==void 0)&&Wt.update(O,H,yn),(cn||Ot.receiveShadow!==O.receiveShadow)&&(Ot.receiveShadow=O.receiveShadow,ye.setValue(I,"receiveShadow",O.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(ri.envMap.value=Ut,ri.flipEnvMap.value=Ut.isCubeTexture&&Ut.isRenderTargetTexture===!1?-1:1),G.isMeshStandardMaterial&&G.envMap===null&&F.environment!==null&&(ri.envMapIntensity.value=F.environmentIntensity),cn&&(ye.setValue(I,"toneMappingExposure",x.toneMappingExposure),Ot.needsLights&&Qp(ri,Ml),lt&&G.fog===!0&&xt.refreshFogUniforms(ri,lt),xt.refreshMaterialUniforms(ri,G,X,z,p.state.transmissionRenderTarget[T.id]),qa.upload(I,Oh(Ot),ri,R)),G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(qa.upload(I,Oh(Ot),ri,R),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&ye.setValue(I,"center",O.center),ye.setValue(I,"modelViewMatrix",O.modelViewMatrix),ye.setValue(I,"normalMatrix",O.normalMatrix),ye.setValue(I,"modelMatrix",O.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){const mn=G.uniformsGroups;for(let Sl=0,tm=mn.length;Sl<tm;Sl++){const zh=mn[Sl];D.update(zh,yn),D.bind(zh,yn)}}return yn}function Qp(T,F){T.ambientLightColor.needsUpdate=F,T.lightProbe.needsUpdate=F,T.directionalLights.needsUpdate=F,T.directionalLightShadows.needsUpdate=F,T.pointLights.needsUpdate=F,T.pointLightShadows.needsUpdate=F,T.spotLights.needsUpdate=F,T.spotLightShadows.needsUpdate=F,T.rectAreaLights.needsUpdate=F,T.hemisphereLights.needsUpdate=F}function jp(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(T,F,H){pt.get(T.texture).__webglTexture=F,pt.get(T.depthTexture).__webglTexture=H;const G=pt.get(T);G.__hasExternalTextures=!0,G.__autoAllocateDepthBuffer=H===void 0,G.__autoAllocateDepthBuffer||ot.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),G.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,F){const H=pt.get(T);H.__webglFramebuffer=F,H.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(T,F=0,H=0){w=T,E=F,A=H;let G=!0,O=null,lt=!1,bt=!1;if(T){const Ut=pt.get(T);if(Ut.__useDefaultFramebuffer!==void 0)dt.bindFramebuffer(I.FRAMEBUFFER,null),G=!1;else if(Ut.__webglFramebuffer===void 0)R.setupRenderTarget(T);else if(Ut.__hasExternalTextures)R.rebindTextures(T,pt.get(T.texture).__webglTexture,pt.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){const Ft=T.depthTexture;if(Ut.__boundDepthTexture!==Ft){if(Ft!==null&&pt.has(Ft)&&(T.width!==Ft.image.width||T.height!==Ft.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(T)}}const zt=T.texture;(zt.isData3DTexture||zt.isDataArrayTexture||zt.isCompressedArrayTexture)&&(bt=!0);const Vt=pt.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Vt[F])?O=Vt[F][H]:O=Vt[F],lt=!0):T.samples>0&&R.useMultisampledRTT(T)===!1?O=pt.get(T).__webglMultisampledFramebuffer:Array.isArray(Vt)?O=Vt[H]:O=Vt,M.copy(T.viewport),b.copy(T.scissor),B=T.scissorTest}else M.copy(yt).multiplyScalar(X).floor(),b.copy(it).multiplyScalar(X).floor(),B=ct;if(dt.bindFramebuffer(I.FRAMEBUFFER,O)&&G&&dt.drawBuffers(T,O),dt.viewport(M),dt.scissor(b),dt.setScissorTest(B),lt){const Ut=pt.get(T.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+F,Ut.__webglTexture,H)}else if(bt){const Ut=pt.get(T.texture),zt=F||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Ut.__webglTexture,H||0,zt)}P=-1},this.readRenderTargetPixels=function(T,F,H,G,O,lt,bt){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let It=pt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&bt!==void 0&&(It=It[bt]),It){dt.bindFramebuffer(I.FRAMEBUFFER,It);try{const Ut=T.texture,zt=Ut.format,Vt=Ut.type;if(!nt.textureFormatReadable(zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!nt.textureTypeReadable(Vt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=T.width-G&&H>=0&&H<=T.height-O&&I.readPixels(F,H,G,O,qt.convert(zt),qt.convert(Vt),lt)}finally{const Ut=w!==null?pt.get(w).__webglFramebuffer:null;dt.bindFramebuffer(I.FRAMEBUFFER,Ut)}}},this.readRenderTargetPixelsAsync=async function(T,F,H,G,O,lt,bt){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let It=pt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&bt!==void 0&&(It=It[bt]),It){const Ut=T.texture,zt=Ut.format,Vt=Ut.type;if(!nt.textureFormatReadable(zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!nt.textureTypeReadable(Vt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=T.width-G&&H>=0&&H<=T.height-O){dt.bindFramebuffer(I.FRAMEBUFFER,It);const Ft=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ft),I.bufferData(I.PIXEL_PACK_BUFFER,lt.byteLength,I.STREAM_READ),I.readPixels(F,H,G,O,qt.convert(zt),qt.convert(Vt),0);const le=w!==null?pt.get(w).__webglFramebuffer:null;dt.bindFramebuffer(I.FRAMEBUFFER,le);const fe=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await eg(I,fe,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ft),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,lt),I.deleteBuffer(Ft),I.deleteSync(fe),lt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(T,F=null,H=0){T.isTexture!==!0&&(Xa("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,T=arguments[1]);const G=Math.pow(2,-H),O=Math.floor(T.image.width*G),lt=Math.floor(T.image.height*G),bt=F!==null?F.x:0,It=F!==null?F.y:0;R.setTexture2D(T,0),I.copyTexSubImage2D(I.TEXTURE_2D,H,0,0,bt,It,O,lt),dt.unbindTexture()},this.copyTextureToTexture=function(T,F,H=null,G=null,O=0){T.isTexture!==!0&&(Xa("WebGLRenderer: copyTextureToTexture function signature has changed."),G=arguments[0]||null,T=arguments[1],F=arguments[2],O=arguments[3]||0,H=null);let lt,bt,It,Ut,zt,Vt;H!==null?(lt=H.max.x-H.min.x,bt=H.max.y-H.min.y,It=H.min.x,Ut=H.min.y):(lt=T.image.width,bt=T.image.height,It=0,Ut=0),G!==null?(zt=G.x,Vt=G.y):(zt=0,Vt=0);const Ft=qt.convert(F.format),le=qt.convert(F.type);R.setTexture2D(F,0),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,F.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,F.unpackAlignment);const fe=I.getParameter(I.UNPACK_ROW_LENGTH),ge=I.getParameter(I.UNPACK_IMAGE_HEIGHT),ln=I.getParameter(I.UNPACK_SKIP_PIXELS),ae=I.getParameter(I.UNPACK_SKIP_ROWS),Ot=I.getParameter(I.UNPACK_SKIP_IMAGES),Oe=T.isCompressedTexture?T.mipmaps[O]:T.image;I.pixelStorei(I.UNPACK_ROW_LENGTH,Oe.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Oe.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,It),I.pixelStorei(I.UNPACK_SKIP_ROWS,Ut),T.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,O,zt,Vt,lt,bt,Ft,le,Oe.data):T.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,O,zt,Vt,Oe.width,Oe.height,Ft,Oe.data):I.texSubImage2D(I.TEXTURE_2D,O,zt,Vt,lt,bt,Ft,le,Oe),I.pixelStorei(I.UNPACK_ROW_LENGTH,fe),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ge),I.pixelStorei(I.UNPACK_SKIP_PIXELS,ln),I.pixelStorei(I.UNPACK_SKIP_ROWS,ae),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ot),O===0&&F.generateMipmaps&&I.generateMipmap(I.TEXTURE_2D),dt.unbindTexture()},this.copyTextureToTexture3D=function(T,F,H=null,G=null,O=0){T.isTexture!==!0&&(Xa("WebGLRenderer: copyTextureToTexture3D function signature has changed."),H=arguments[0]||null,G=arguments[1]||null,T=arguments[2],F=arguments[3],O=arguments[4]||0);let lt,bt,It,Ut,zt,Vt,Ft,le,fe;const ge=T.isCompressedTexture?T.mipmaps[O]:T.image;H!==null?(lt=H.max.x-H.min.x,bt=H.max.y-H.min.y,It=H.max.z-H.min.z,Ut=H.min.x,zt=H.min.y,Vt=H.min.z):(lt=ge.width,bt=ge.height,It=ge.depth,Ut=0,zt=0,Vt=0),G!==null?(Ft=G.x,le=G.y,fe=G.z):(Ft=0,le=0,fe=0);const ln=qt.convert(F.format),ae=qt.convert(F.type);let Ot;if(F.isData3DTexture)R.setTexture3D(F,0),Ot=I.TEXTURE_3D;else if(F.isDataArrayTexture||F.isCompressedArrayTexture)R.setTexture2DArray(F,0),Ot=I.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,F.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,F.unpackAlignment);const Oe=I.getParameter(I.UNPACK_ROW_LENGTH),oe=I.getParameter(I.UNPACK_IMAGE_HEIGHT),yn=I.getParameter(I.UNPACK_SKIP_PIXELS),rs=I.getParameter(I.UNPACK_SKIP_ROWS),cn=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,ge.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ge.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Ut),I.pixelStorei(I.UNPACK_SKIP_ROWS,zt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Vt),T.isDataTexture||T.isData3DTexture?I.texSubImage3D(Ot,O,Ft,le,fe,lt,bt,It,ln,ae,ge.data):F.isCompressedArrayTexture?I.compressedTexSubImage3D(Ot,O,Ft,le,fe,lt,bt,It,ln,ge.data):I.texSubImage3D(Ot,O,Ft,le,fe,lt,bt,It,ln,ae,ge),I.pixelStorei(I.UNPACK_ROW_LENGTH,Oe),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,oe),I.pixelStorei(I.UNPACK_SKIP_PIXELS,yn),I.pixelStorei(I.UNPACK_SKIP_ROWS,rs),I.pixelStorei(I.UNPACK_SKIP_IMAGES,cn),O===0&&F.generateMipmaps&&I.generateMipmap(Ot),dt.unbindTexture()},this.initRenderTarget=function(T){pt.get(T).__webglFramebuffer===void 0&&R.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?R.setTextureCube(T,0):T.isData3DTexture?R.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?R.setTexture2DArray(T,0):R.setTexture2D(T,0),dt.unbindTexture()},this.resetState=function(){E=0,A=0,w=null,dt.reset(),ue.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Dn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===$o?"display-p3":"srgb",e.unpackColorSpace=ne.workingColorSpace===Vr?"display-p3":"srgb"}}class el{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new ft(t),this.density=e}clone(){return new el(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Wr{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new ft(t),this.near=e,this.far=n}clone(){return new Wr(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class sh extends ee{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new pn,this.environmentIntensity=1,this.environmentRotation=new pn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class nl{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Er,this.updateRanges=[],this.version=0,this.uuid=fn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,r=this.stride;i<r;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=fn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=fn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const qe=new C;class ts{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix4(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyNormalMatrix(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.transformDirection(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Ze(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Zt(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=Zt(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=Zt(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=Zt(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=Zt(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Ze(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Ze(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Ze(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Ze(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=Zt(e,this.array),n=Zt(n,this.array),i=Zt(i,this.array),r=Zt(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=r,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return new se(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new ts(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class rh extends Xe{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new ft(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let vs;const Js=new C,ys=new C,Ms=new C,bs=new Q,Qs=new Q,Gf=new Bt,_a=new C,js=new C,xa=new C,Tu=new Q,Ql=new Q,Eu=new Q;class Wf extends ee{constructor(t=new rh){if(super(),this.isSprite=!0,this.type="Sprite",vs===void 0){vs=new Xt;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new nl(e,5);vs.setIndex([0,1,2,0,2,3]),vs.setAttribute("position",new ts(n,3,0,!1)),vs.setAttribute("uv",new ts(n,2,3,!1))}this.geometry=vs,this.material=t,this.center=new Q(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ys.setFromMatrixScale(this.matrixWorld),Gf.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Ms.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ys.multiplyScalar(-Ms.z);const n=this.material.rotation;let i,r;n!==0&&(r=Math.cos(n),i=Math.sin(n));const a=this.center;va(_a.set(-.5,-.5,0),Ms,a,ys,i,r),va(js.set(.5,-.5,0),Ms,a,ys,i,r),va(xa.set(.5,.5,0),Ms,a,ys,i,r),Tu.set(0,0),Ql.set(1,0),Eu.set(1,1);let o=t.ray.intersectTriangle(_a,js,xa,!1,Js);if(o===null&&(va(js.set(-.5,.5,0),Ms,a,ys,i,r),Ql.set(0,1),o=t.ray.intersectTriangle(_a,xa,js,!1,Js),o===null))return;const l=t.ray.origin.distanceTo(Js);l<t.near||l>t.far||e.push({distance:l,point:Js.clone(),uv:en.getInterpolation(Js,_a,js,xa,Tu,Ql,Eu,new Q),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function va(s,t,e,n,i,r){bs.subVectors(s,e).addScalar(.5).multiply(n),i!==void 0?(Qs.x=r*bs.x-i*bs.y,Qs.y=i*bs.x+r*bs.y):Qs.copy(bs),s.copy(t),s.x+=Qs.x,s.y+=Qs.y,s.applyMatrix4(Gf)}const ya=new C,Cu=new C;class Xf extends ee{constructor(){super(),this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]},isLOD:{value:!0}}),this.autoUpdate=!0}copy(t){super.copy(t,!1);const e=t.levels;for(let n=0,i=e.length;n<i;n++){const r=e[n];this.addLevel(r.object.clone(),r.distance,r.hysteresis)}return this.autoUpdate=t.autoUpdate,this}addLevel(t,e=0,n=0){e=Math.abs(e);const i=this.levels;let r;for(r=0;r<i.length&&!(e<i[r].distance);r++);return i.splice(r,0,{distance:e,hysteresis:n,object:t}),this.add(t),this}removeLevel(t){const e=this.levels;for(let n=0;n<e.length;n++)if(e[n].distance===t){const i=e.splice(n,1);return this.remove(i[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(t){const e=this.levels;if(e.length>0){let n,i;for(n=1,i=e.length;n<i;n++){let r=e[n].distance;if(e[n].object.visible&&(r-=r*e[n].hysteresis),t<r)break}return e[n-1].object}return null}raycast(t,e){if(this.levels.length>0){ya.setFromMatrixPosition(this.matrixWorld);const i=t.ray.origin.distanceTo(ya);this.getObjectForDistance(i).raycast(t,e)}}update(t){const e=this.levels;if(e.length>1){ya.setFromMatrixPosition(t.matrixWorld),Cu.setFromMatrixPosition(this.matrixWorld);const n=ya.distanceTo(Cu)/t.zoom;e[0].object.visible=!0;let i,r;for(i=1,r=e.length;i<r;i++){let a=e[i].distance;if(e[i].object.visible&&(a-=a*e[i].hysteresis),n>=a)e[i-1].object.visible=!1,e[i].object.visible=!0;else break}for(this._currentLevel=i-1;i<r;i++)e[i].object.visible=!1}}toJSON(t){const e=super.toJSON(t);this.autoUpdate===!1&&(e.object.autoUpdate=!1),e.object.levels=[];const n=this.levels;for(let i=0,r=n.length;i<r;i++){const a=n[i];e.object.levels.push({object:a.object.uuid,distance:a.distance,hysteresis:a.hysteresis})}return e}}const Ru=new C,Pu=new te,Iu=new te,_y=new C,Lu=new Bt,Ma=new C,jl=new We,Du=new Bt,tc=new Hs;class qf extends at{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=bc,this.bindMatrix=new Bt,this.bindMatrixInverse=new Bt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ke),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Ma),this.boundingBox.expandByPoint(Ma)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new We),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Ma),this.boundingSphere.expandByPoint(Ma)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),jl.copy(this.boundingSphere),jl.applyMatrix4(i),t.ray.intersectsSphere(jl)!==!1&&(Du.copy(i).invert(),tc.copy(t.ray).applyMatrix4(Du),!(this.boundingBox!==null&&tc.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,tc)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new te,e=this.geometry.attributes.skinWeight;for(let n=0,i=e.count;n<i;n++){t.fromBufferAttribute(e,n);const r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===bc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===df?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,i=this.geometry;Pu.fromBufferAttribute(i.attributes.skinIndex,t),Iu.fromBufferAttribute(i.attributes.skinWeight,t),Ru.copy(e).applyMatrix4(this.bindMatrix),e.set(0,0,0);for(let r=0;r<4;r++){const a=Iu.getComponent(r);if(a!==0){const o=Pu.getComponent(r);Lu.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),e.addScaledVector(_y.copy(Ru).applyMatrix4(Lu),a)}}return e.applyMatrix4(this.bindMatrixInverse)}}class ah extends ee{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Un extends ve{constructor(t=null,e=1,n=1,i,r,a,o,l,c=Fe,h=Fe,d,u){super(null,a,o,l,c,h,i,r,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Uu=new Bt,xy=new Bt;class il{constructor(t=[],e=[]){this.uuid=fn(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Bt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Bt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=t.length;r<a;r++){const o=t[r]?t[r].matrixWorld:xy;Uu.multiplyMatrices(o,e[r]),Uu.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new il(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Un(e,t,t,$e,nn);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const i=this.bones[e];if(i.name===t)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,i=t.bones.length;n<i;n++){const r=t.bones[n];let a=e[r];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),a=new ah),this.bones.push(a),this.boneInverses.push(new Bt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let i=0,r=e.length;i<r;i++){const a=e[i];t.bones.push(a.uuid);const o=n[i];t.boneInverses.push(o.toArray())}return t}}class Bs extends se{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Ss=new Bt,Nu=new Bt,ba=[],Fu=new Ke,vy=new Bt,tr=new at,er=new We;class Yf extends at{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Bs(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,vy)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ke),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ss),Fu.copy(t.boundingBox).applyMatrix4(Ss),this.boundingBox.union(Fu)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new We),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ss),er.copy(t.boundingSphere).applyMatrix4(Ss),this.boundingSphere.union(er)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(tr.geometry=this.geometry,tr.material=this.material,tr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),er.copy(this.boundingSphere),er.applyMatrix4(n),t.ray.intersectsSphere(er)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Ss),Nu.multiplyMatrices(n,Ss),tr.matrixWorld=Nu,tr.raycast(t,ba);for(let a=0,o=ba.length;a<o;a++){const l=ba[a];l.instanceId=r,l.object=this,e.push(l)}ba.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Bs(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Un(new Float32Array(i*this.count),i,this.count,Xo,nn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}function yy(s,t){return s.z-t.z}function My(s,t){return t.z-s.z}class by{constructor(){this.index=0,this.pool=[],this.list=[]}push(t,e,n){const i=this.pool,r=this.list;this.index>=i.length&&i.push({start:-1,count:-1,z:-1,index:-1});const a=i[this.index];r.push(a),this.index++,a.start=t.start,a.count=t.count,a.z=e,a.index=n}reset(){this.list.length=0,this.index=0}}const di=new Bt,ec=new Bt,Sy=new Bt,wy=new ft(1,1,1),Ou=new Bt,nc=new Gr,Sa=new Ke,Ri=new We,nr=new C,Bu=new C,Ay=new C,ic=new by,He=new at,wa=[];function Ty(s,t,e=0){const n=t.itemSize;if(s.isInterleavedBufferAttribute||s.array.constructor!==t.array.constructor){const i=s.count;for(let r=0;r<i;r++)for(let a=0;a<n;a++)t.setComponent(r+e,a,s.getComponent(r,a))}else t.array.set(s.array,e*n);t.needsUpdate=!0}class Zf extends at{get maxInstanceCount(){return this._maxInstanceCount}constructor(t,e,n=e*2,i){super(new Xt,i),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._drawInfo=[],this._availableInstanceIds=[],this._drawRanges=[],this._reservedRanges=[],this._bounds=[],this._maxInstanceCount=t,this._maxVertexCount=e,this._maxIndexCount=n,this._geometryInitialized=!1,this._geometryCount=0,this._multiDrawCounts=new Int32Array(t),this._multiDrawStarts=new Int32Array(t),this._multiDrawCount=0,this._multiDrawInstances=null,this._visibilityChanged=!0,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}_initMatricesTexture(){let t=Math.sqrt(this._maxInstanceCount*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4),n=new Un(e,t,t,$e,nn);this._matricesTexture=n}_initIndirectTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);const e=new Uint32Array(t*t),n=new Un(e,t,t,kr,ei);this._indirectTexture=n}_initColorsTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);const e=new Float32Array(t*t*4).fill(1),n=new Un(e,t,t,$e,nn);n.colorSpace=ne.workingColorSpace,this._colorsTexture=n}_initializeGeometry(t){const e=this.geometry,n=this._maxVertexCount,i=this._maxIndexCount;if(this._geometryInitialized===!1){for(const r in t.attributes){const a=t.getAttribute(r),{array:o,itemSize:l,normalized:c}=a,h=new o.constructor(n*l),d=new se(h,l,c);e.setAttribute(r,d)}if(t.getIndex()!==null){const r=n>65535?new Uint32Array(i):new Uint16Array(i);e.setIndex(new se(r,1))}this._geometryInitialized=!0}}_validateGeometry(t){const e=this.geometry;if(!!t.getIndex()!=!!e.getIndex())throw new Error('BatchedMesh: All geometries must consistently have "index".');for(const n in e.attributes){if(!t.hasAttribute(n))throw new Error(`BatchedMesh: Added geometry missing "${n}". All geometries must have consistent attributes.`);const i=t.getAttribute(n),r=e.getAttribute(n);if(i.itemSize!==r.itemSize||i.normalized!==r.normalized)throw new Error("BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}setCustomSort(t){return this.customSort=t,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ke);const t=this.boundingBox,e=this._drawInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;const r=e[n].geometryIndex;this.getMatrixAt(n,di),this.getBoundingBoxAt(r,Sa).applyMatrix4(di),t.union(Sa)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new We);const t=this.boundingSphere,e=this._drawInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;const r=e[n].geometryIndex;this.getMatrixAt(n,di),this.getBoundingSphereAt(r,Ri).applyMatrix4(di),t.union(Ri)}}addInstance(t){if(this._drawInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("BatchedMesh: Maximum item count reached.");const n={visible:!0,active:!0,geometryIndex:t};let i=null;this._availableInstanceIds.length>0?(i=this._availableInstanceIds.pop(),this._drawInfo[i]=n):(i=this._drawInfo.length,this._drawInfo.push(n));const r=this._matricesTexture,a=r.image.data;Sy.toArray(a,i*16),r.needsUpdate=!0;const o=this._colorsTexture;return o&&(wy.toArray(o.image.data,i*4),o.needsUpdate=!0),i}addGeometry(t,e=-1,n=-1){if(this._initializeGeometry(t),this._validateGeometry(t),this._drawInfo.length>=this._maxInstanceCount)throw new Error("BatchedMesh: Maximum item count reached.");const i={vertexStart:-1,vertexCount:-1,indexStart:-1,indexCount:-1};let r=null;const a=this._reservedRanges,o=this._drawRanges,l=this._bounds;this._geometryCount!==0&&(r=a[a.length-1]),e===-1?i.vertexCount=t.getAttribute("position").count:i.vertexCount=e,r===null?i.vertexStart=0:i.vertexStart=r.vertexStart+r.vertexCount;const c=t.getIndex(),h=c!==null;if(h&&(n===-1?i.indexCount=c.count:i.indexCount=n,r===null?i.indexStart=0:i.indexStart=r.indexStart+r.indexCount),i.indexStart!==-1&&i.indexStart+i.indexCount>this._maxIndexCount||i.vertexStart+i.vertexCount>this._maxVertexCount)throw new Error("BatchedMesh: Reserved space request exceeds the maximum buffer size.");const d=this._geometryCount;return this._geometryCount++,a.push(i),o.push({start:h?i.indexStart:i.vertexStart,count:-1}),l.push({boxInitialized:!1,box:new Ke,sphereInitialized:!1,sphere:new We}),this.setGeometryAt(d,t),d}setGeometryAt(t,e){if(t>=this._geometryCount)throw new Error("BatchedMesh: Maximum geometry count reached.");this._validateGeometry(e);const n=this.geometry,i=n.getIndex()!==null,r=n.getIndex(),a=e.getIndex(),o=this._reservedRanges[t];if(i&&a.count>o.indexCount||e.attributes.position.count>o.vertexCount)throw new Error("BatchedMesh: Reserved space not large enough for provided geometry.");const l=o.vertexStart,c=o.vertexCount;for(const f in n.attributes){const m=e.getAttribute(f),_=n.getAttribute(f);Ty(m,_,l);const p=m.itemSize;for(let g=m.count,v=c;g<v;g++){const x=l+g;for(let y=0;y<p;y++)_.setComponent(x,y,0)}_.needsUpdate=!0,_.addUpdateRange(l*p,c*p)}if(i){const f=o.indexStart;for(let m=0;m<a.count;m++)r.setX(f+m,l+a.getX(m));for(let m=a.count,_=o.indexCount;m<_;m++)r.setX(f+m,l);r.needsUpdate=!0,r.addUpdateRange(f,o.indexCount)}const h=this._bounds[t];e.boundingBox!==null?(h.box.copy(e.boundingBox),h.boxInitialized=!0):h.boxInitialized=!1,e.boundingSphere!==null?(h.sphere.copy(e.boundingSphere),h.sphereInitialized=!0):h.sphereInitialized=!1;const d=this._drawRanges[t],u=e.getAttribute("position");return d.count=i?a.count:u.count,this._visibilityChanged=!0,t}deleteInstance(t){const e=this._drawInfo;return t>=e.length||e[t].active===!1?this:(e[t].active=!1,this._availableInstanceIds.push(t),this._visibilityChanged=!0,this)}getBoundingBoxAt(t,e){if(t>=this._geometryCount)return null;const n=this._bounds[t],i=n.box,r=this.geometry;if(n.boxInitialized===!1){i.makeEmpty();const a=r.index,o=r.attributes.position,l=this._drawRanges[t];for(let c=l.start,h=l.start+l.count;c<h;c++){let d=c;a&&(d=a.getX(d)),i.expandByPoint(nr.fromBufferAttribute(o,d))}n.boxInitialized=!0}return e.copy(i),e}getBoundingSphereAt(t,e){if(t>=this._geometryCount)return null;const n=this._bounds[t],i=n.sphere,r=this.geometry;if(n.sphereInitialized===!1){i.makeEmpty(),this.getBoundingBoxAt(t,Sa),Sa.getCenter(i.center);const a=r.index,o=r.attributes.position,l=this._drawRanges[t];let c=0;for(let h=l.start,d=l.start+l.count;h<d;h++){let u=h;a&&(u=a.getX(u)),nr.fromBufferAttribute(o,u),c=Math.max(c,i.center.distanceToSquared(nr))}i.radius=Math.sqrt(c),n.sphereInitialized=!0}return e.copy(i),e}setMatrixAt(t,e){const n=this._drawInfo,i=this._matricesTexture,r=this._matricesTexture.image.data;return t>=n.length||n[t].active===!1?this:(e.toArray(r,t*16),i.needsUpdate=!0,this)}getMatrixAt(t,e){const n=this._drawInfo,i=this._matricesTexture.image.data;return t>=n.length||n[t].active===!1?null:e.fromArray(i,t*16)}setColorAt(t,e){this._colorsTexture===null&&this._initColorsTexture();const n=this._colorsTexture,i=this._colorsTexture.image.data,r=this._drawInfo;return t>=r.length||r[t].active===!1?this:(e.toArray(i,t*4),n.needsUpdate=!0,this)}getColorAt(t,e){const n=this._colorsTexture.image.data,i=this._drawInfo;return t>=i.length||i[t].active===!1?null:e.fromArray(n,t*4)}setVisibleAt(t,e){const n=this._drawInfo;return t>=n.length||n[t].active===!1||n[t].visible===e?this:(n[t].visible=e,this._visibilityChanged=!0,this)}getVisibleAt(t){const e=this._drawInfo;return t>=e.length||e[t].active===!1?!1:e[t].visible}setGeometryIdAt(t,e){const n=this._drawInfo;return t>=n.length||n[t].active===!1||e<0||e>=this._geometryCount?null:(n[t].geometryIndex=e,this)}getGeometryIdAt(t){const e=this._drawInfo;return t>=e.length||e[t].active===!1?-1:e[t].geometryIndex}getGeometryRangeAt(t,e={}){if(t<0||t>=this._geometryCount)return null;const n=this._drawRanges[t];return e.start=n.start,e.count=n.count,e}raycast(t,e){const n=this._drawInfo,i=this._drawRanges,r=this.matrixWorld,a=this.geometry;He.material=this.material,He.geometry.index=a.index,He.geometry.attributes=a.attributes,He.geometry.boundingBox===null&&(He.geometry.boundingBox=new Ke),He.geometry.boundingSphere===null&&(He.geometry.boundingSphere=new We);for(let o=0,l=n.length;o<l;o++){if(!n[o].visible||!n[o].active)continue;const c=n[o].geometryIndex,h=i[c];He.geometry.setDrawRange(h.start,h.count),this.getMatrixAt(o,He.matrixWorld).premultiply(r),this.getBoundingBoxAt(c,He.geometry.boundingBox),this.getBoundingSphereAt(c,He.geometry.boundingSphere),He.raycast(t,wa);for(let d=0,u=wa.length;d<u;d++){const f=wa[d];f.object=this,f.batchId=o,e.push(f)}wa.length=0}He.material=null,He.geometry.index=null,He.geometry.attributes={},He.geometry.setDrawRange(0,1/0)}copy(t){return super.copy(t),this.geometry=t.geometry.clone(),this.perObjectFrustumCulled=t.perObjectFrustumCulled,this.sortObjects=t.sortObjects,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this._drawRanges=t._drawRanges.map(e=>({...e})),this._reservedRanges=t._reservedRanges.map(e=>({...e})),this._drawInfo=t._drawInfo.map(e=>({...e})),this._bounds=t._bounds.map(e=>({boxInitialized:e.boxInitialized,box:e.box.clone(),sphereInitialized:e.sphereInitialized,sphere:e.sphere.clone()})),this._maxInstanceCount=t._maxInstanceCount,this._maxVertexCount=t._maxVertexCount,this._maxIndexCount=t._maxIndexCount,this._geometryInitialized=t._geometryInitialized,this._geometryCount=t._geometryCount,this._multiDrawCounts=t._multiDrawCounts.slice(),this._multiDrawStarts=t._multiDrawStarts.slice(),this._matricesTexture=t._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=t._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){return this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null),this}onBeforeRender(t,e,n,i,r){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;const a=i.getIndex(),o=a===null?1:a.array.BYTES_PER_ELEMENT,l=this._drawInfo,c=this._multiDrawStarts,h=this._multiDrawCounts,d=this._drawRanges,u=this.perObjectFrustumCulled,f=this._indirectTexture,m=f.image.data;u&&(Ou.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse).multiply(this.matrixWorld),nc.setFromProjectionMatrix(Ou,t.coordinateSystem));let _=0;if(this.sortObjects){ec.copy(this.matrixWorld).invert(),nr.setFromMatrixPosition(n.matrixWorld).applyMatrix4(ec),Bu.set(0,0,-1).transformDirection(n.matrixWorld).transformDirection(ec);for(let v=0,x=l.length;v<x;v++)if(l[v].visible&&l[v].active){const y=l[v].geometryIndex;this.getMatrixAt(v,di),this.getBoundingSphereAt(y,Ri).applyMatrix4(di);let E=!1;if(u&&(E=!nc.intersectsSphere(Ri)),!E){const A=Ay.subVectors(Ri.center,nr).dot(Bu);ic.push(d[y],A,v)}}const p=ic.list,g=this.customSort;g===null?p.sort(r.transparent?My:yy):g.call(this,p,n);for(let v=0,x=p.length;v<x;v++){const y=p[v];c[_]=y.start*o,h[_]=y.count,m[_]=y.index,_++}ic.reset()}else for(let p=0,g=l.length;p<g;p++)if(l[p].visible&&l[p].active){const v=l[p].geometryIndex;let x=!1;if(u&&(this.getMatrixAt(p,di),this.getBoundingSphereAt(v,Ri).applyMatrix4(di),x=!nc.intersectsSphere(Ri)),!x){const y=d[v];c[_]=y.start*o,h[_]=y.count,m[_]=p,_++}}f.needsUpdate=!0,this._multiDrawCount=_,this._visibilityChanged=!1}onBeforeShadow(t,e,n,i,r,a){this.onBeforeRender(t,null,i,r,a)}}class ze extends Xe{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ft(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Do=new C,Uo=new C,zu=new Bt,ir=new Hs,Aa=new We,sc=new C,ku=new C;class Bn extends ee{constructor(t=new Xt,e=new ze){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,r=e.count;i<r;i++)Do.fromBufferAttribute(e,i-1),Uo.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=Do.distanceTo(Uo);t.setAttribute("lineDistance",new Pt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Aa.copy(n.boundingSphere),Aa.applyMatrix4(i),Aa.radius+=r,t.ray.intersectsSphere(Aa)===!1)return;zu.copy(i).invert(),ir.copy(t.ray).applyMatrix4(zu);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),m=Math.min(h.count,a.start+a.count);for(let _=f,p=m-1;_<p;_+=c){const g=h.getX(_),v=h.getX(_+1),x=Ta(this,t,ir,l,g,v);x&&e.push(x)}if(this.isLineLoop){const _=h.getX(m-1),p=h.getX(f),g=Ta(this,t,ir,l,_,p);g&&e.push(g)}}else{const f=Math.max(0,a.start),m=Math.min(u.count,a.start+a.count);for(let _=f,p=m-1;_<p;_+=c){const g=Ta(this,t,ir,l,_,_+1);g&&e.push(g)}if(this.isLineLoop){const _=Ta(this,t,ir,l,m-1,f);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Ta(s,t,e,n,i,r){const a=s.geometry.attributes.position;if(Do.fromBufferAttribute(a,i),Uo.fromBufferAttribute(a,r),e.distanceSqToSegment(Do,Uo,sc,ku)>n)return;sc.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(sc);if(!(l<t.near||l>t.far))return{distance:l,point:ku.clone().applyMatrix4(s.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:s}}const Vu=new C,Hu=new C;class kn extends Bn{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let i=0,r=e.count;i<r;i+=2)Vu.fromBufferAttribute(e,i),Hu.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Vu.distanceTo(Hu);t.setAttribute("lineDistance",new Pt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class $f extends Bn{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}}class oh extends Xe{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ft(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Gu=new Bt,Cc=new Hs,Ea=new We,Ca=new C;class lh extends ee{constructor(t=new Xt,e=new oh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ea.copy(n.boundingSphere),Ea.applyMatrix4(i),Ea.radius+=r,t.ray.intersectsSphere(Ea)===!1)return;Gu.copy(i).invert(),Cc.copy(t.ray).applyMatrix4(Gu);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const u=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let m=u,_=f;m<_;m++){const p=c.getX(m);Ca.fromBufferAttribute(d,p),Wu(Ca,p,l,i,t,e,this)}}else{const u=Math.max(0,a.start),f=Math.min(d.count,a.start+a.count);for(let m=u,_=f;m<_;m++)Ca.fromBufferAttribute(d,m),Wu(Ca,m,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Wu(s,t,e,n,i,r,a){const o=Cc.distanceSqToPoint(s);if(o<e){const l=new C;Cc.closestPointToPoint(s,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class Ey extends ve{constructor(t,e,n,i,r,a,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isVideoTexture=!0,this.minFilter=a!==void 0?a:Re,this.magFilter=r!==void 0?r:Re,this.generateMipmaps=!1;const h=this;function d(){h.needsUpdate=!0,t.requestVideoFrameCallback(d)}"requestVideoFrameCallback"in t&&t.requestVideoFrameCallback(d)}clone(){return new this.constructor(this.image).copy(this)}update(){const t=this.image;"requestVideoFrameCallback"in t===!1&&t.readyState>=t.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}}class Cy extends ve{constructor(t,e){super({width:t,height:e}),this.isFramebufferTexture=!0,this.magFilter=Fe,this.minFilter=Fe,this.generateMipmaps=!1,this.needsUpdate=!0}}class sl extends ve{constructor(t,e,n,i,r,a,o,l,c,h,d,u){super(null,a,o,l,c,h,i,r,d,u),this.isCompressedTexture=!0,this.image={width:e,height:n},this.mipmaps=t,this.flipY=!1,this.generateMipmaps=!1}}class Ry extends sl{constructor(t,e,n,i,r,a){super(t,e,n,r,a),this.isCompressedArrayTexture=!0,this.image.depth=i,this.wrapR=vn,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Py extends sl{constructor(t,e,n){super(void 0,t[0].width,t[0].height,e,n,ti),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=t}}class Ya extends ve{constructor(t,e,n,i,r,a,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class En{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(i),e.push(r),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let i=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);const h=n[i],u=n[i+1]-h,f=(a-h)/u;return(i+f)/(r-1)}getTangent(t,e){let i=t-1e-4,r=t+1e-4;i<0&&(i=0),r>1&&(r=1);const a=this.getPoint(i),o=this.getPoint(r),l=e||(a.isVector2?new Q:new C);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new C,i=[],r=[],a=[],o=new C,l=new Bt;for(let f=0;f<=t;f++){const m=f/t;i[f]=this.getTangentAt(m,new C)}r[0]=new C,a[0]=new C;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),d=Math.abs(i[0].y),u=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(i[f-1],i[f]),o.length()>Number.EPSILON){o.normalize();const m=Math.acos(xe(i[f-1].dot(i[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,m))}a[f].crossVectors(i[f],r[f])}if(e===!0){let f=Math.acos(xe(r[0].dot(r[t]),-1,1));f/=t,i[0].dot(o.crossVectors(r[0],r[t]))>0&&(f=-f);for(let m=1;m<=t;m++)r[m].applyMatrix4(l.makeRotationAxis(i[m],f*m)),a[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class rl extends En{constructor(t=0,e=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new Q){const n=e,i=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);const o=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,f=c-this.aY;l=u*h-f*d+this.aX,c=u*d+f*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Kf extends rl{constructor(t,e,n,i,r,a){super(t,e,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function ch(){let s=0,t=0,e=0,n=0;function i(r,a,o,l){s=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let u=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+d)+(l-o)/d;u*=h,f*=h,i(a,o,u,f)},calc:function(r){const a=r*r,o=a*r;return s+t*r+e*a+n*o}}}const Ra=new C,rc=new ch,ac=new ch,oc=new ch;class hh extends En{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new C){const n=e,i=this.points,r=i.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%r]:(Ra.subVectors(i[0],i[1]).add(i[0]),c=Ra);const d=i[o%r],u=i[(o+1)%r];if(this.closed||o+2<r?h=i[(o+2)%r]:(Ra.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=Ra),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let m=Math.pow(c.distanceToSquared(d),f),_=Math.pow(d.distanceToSquared(u),f),p=Math.pow(u.distanceToSquared(h),f);_<1e-4&&(_=1),m<1e-4&&(m=_),p<1e-4&&(p=_),rc.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,m,_,p),ac.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,m,_,p),oc.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,m,_,p)}else this.curveType==="catmullrom"&&(rc.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),ac.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),oc.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return n.set(rc.calc(l),ac.calc(l),oc.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new C().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Xu(s,t,e,n,i){const r=(n-t)*.5,a=(i-e)*.5,o=s*s,l=s*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*s+e}function Iy(s,t){const e=1-s;return e*e*t}function Ly(s,t){return 2*(1-s)*s*t}function Dy(s,t){return s*s*t}function mr(s,t,e,n){return Iy(s,t)+Ly(s,e)+Dy(s,n)}function Uy(s,t){const e=1-s;return e*e*e*t}function Ny(s,t){const e=1-s;return 3*e*e*s*t}function Fy(s,t){return 3*(1-s)*s*s*t}function Oy(s,t){return s*s*s*t}function gr(s,t,e,n,i){return Uy(s,t)+Ny(s,e)+Fy(s,n)+Oy(s,i)}class uh extends En{constructor(t=new Q,e=new Q,n=new Q,i=new Q){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new Q){const n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(gr(t,i.x,r.x,a.x,o.x),gr(t,i.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Jf extends En{constructor(t=new C,e=new C,n=new C,i=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new C){const n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(gr(t,i.x,r.x,a.x,o.x),gr(t,i.y,r.y,a.y,o.y),gr(t,i.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class dh extends En{constructor(t=new Q,e=new Q){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new Q){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new Q){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Qf extends En{constructor(t=new C,e=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new C){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new C){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class fh extends En{constructor(t=new Q,e=new Q,n=new Q){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new Q){const n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(mr(t,i.x,r.x,a.x),mr(t,i.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ph extends En{constructor(t=new C,e=new C,n=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new C){const n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(mr(t,i.x,r.x,a.x),mr(t,i.y,r.y,a.y),mr(t,i.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class mh extends En{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new Q){const n=e,i=this.points,r=(i.length-1)*t,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],d=i[a>i.length-3?i.length-1:a+2];return n.set(Xu(o,l.x,c.x,h.x,d.x),Xu(o,l.y,c.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new Q().fromArray(i))}return this}}var No=Object.freeze({__proto__:null,ArcCurve:Kf,CatmullRomCurve3:hh,CubicBezierCurve:uh,CubicBezierCurve3:Jf,EllipseCurve:rl,LineCurve:dh,LineCurve3:Qf,QuadraticBezierCurve:fh,QuadraticBezierCurve3:ph,SplineCurve:mh});class jf extends En{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new No[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let r=0;for(;r<i.length;){if(i[r]>=n){const a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,r=this.curves;i<r.length;i++){const a=r[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new No[i.type]().fromJSON(i))}return this}}class Pr extends jf{constructor(t){super(),this.type="Path",this.currentPoint=new Q,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new dh(this.currentPoint.clone(),new Q(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const r=new fh(this.currentPoint.clone(),new Q(t,e),new Q(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,r,a){const o=new uh(this.currentPoint.clone(),new Q(t,e),new Q(n,i),new Q(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new mh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,r,a),this}absarc(t,e,n,i,r,a){return this.absellipse(t,e,n,n,i,r,a),this}ellipse(t,e,n,i,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,i,r,a,o,l),this}absellipse(t,e,n,i,r,a,o,l){const c=new rl(t,e,n,i,r,a,o,l);if(this.curves.length>0){const d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Xr extends Xt{constructor(t=[new Q(0,-.5),new Q(.5,0),new Q(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=xe(i,0,Math.PI*2);const r=[],a=[],o=[],l=[],c=[],h=1/e,d=new C,u=new Q,f=new C,m=new C,_=new C;let p=0,g=0;for(let v=0;v<=t.length-1;v++)switch(v){case 0:p=t[v+1].x-t[v].x,g=t[v+1].y-t[v].y,f.x=g*1,f.y=-p,f.z=g*0,_.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:p=t[v+1].x-t[v].x,g=t[v+1].y-t[v].y,f.x=g*1,f.y=-p,f.z=g*0,m.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),l.push(f.x,f.y,f.z),_.copy(m)}for(let v=0;v<=e;v++){const x=n+v*h*i,y=Math.sin(x),E=Math.cos(x);for(let A=0;A<=t.length-1;A++){d.x=t[A].x*y,d.y=t[A].y,d.z=t[A].x*E,a.push(d.x,d.y,d.z),u.x=v/e,u.y=A/(t.length-1),o.push(u.x,u.y);const w=l[3*A+0]*y,P=l[3*A+1],L=l[3*A+0]*E;c.push(w,P,L)}}for(let v=0;v<e;v++)for(let x=0;x<t.length-1;x++){const y=x+v*t.length,E=y,A=y+t.length,w=y+t.length+1,P=y+1;r.push(E,A,P),r.push(w,P,A)}this.setIndex(r),this.setAttribute("position",new Pt(a,3)),this.setAttribute("uv",new Pt(o,2)),this.setAttribute("normal",new Pt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xr(t.points,t.segments,t.phiStart,t.phiLength)}}class al extends Xr{constructor(t=1,e=1,n=4,i=8){const r=new Pr;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:i}}static fromJSON(t){return new al(t.radius,t.length,t.capSegments,t.radialSegments)}}class ol extends Xt{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const r=[],a=[],o=[],l=[],c=new C,h=new Q;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let d=0,u=3;d<=e;d++,u+=3){const f=n+d/e*i;c.x=t*Math.cos(f),c.y=t*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[u]/t+1)/2,h.y=(a[u+1]/t+1)/2,l.push(h.x,h.y)}for(let d=1;d<=e;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new Pt(a,3)),this.setAttribute("normal",new Pt(o,3)),this.setAttribute("uv",new Pt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ol(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Be extends Xt{constructor(t=1,e=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),r=Math.floor(r);const h=[],d=[],u=[],f=[];let m=0;const _=[],p=n/2;let g=0;v(),a===!1&&(t>0&&x(!0),e>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new Pt(d,3)),this.setAttribute("normal",new Pt(u,3)),this.setAttribute("uv",new Pt(f,2));function v(){const y=new C,E=new C;let A=0;const w=(e-t)/n;for(let P=0;P<=r;P++){const L=[],M=P/r,b=M*(e-t)+t;for(let B=0;B<=i;B++){const N=B/i,U=N*l+o,q=Math.sin(U),z=Math.cos(U);E.x=b*q,E.y=-M*n+p,E.z=b*z,d.push(E.x,E.y,E.z),y.set(q,w,z).normalize(),u.push(y.x,y.y,y.z),f.push(N,1-M),L.push(m++)}_.push(L)}for(let P=0;P<i;P++)for(let L=0;L<r;L++){const M=_[L][P],b=_[L+1][P],B=_[L+1][P+1],N=_[L][P+1];t>0&&(h.push(M,b,N),A+=3),e>0&&(h.push(b,B,N),A+=3)}c.addGroup(g,A,0),g+=A}function x(y){const E=m,A=new Q,w=new C;let P=0;const L=y===!0?t:e,M=y===!0?1:-1;for(let B=1;B<=i;B++)d.push(0,p*M,0),u.push(0,M,0),f.push(.5,.5),m++;const b=m;for(let B=0;B<=i;B++){const U=B/i*l+o,q=Math.cos(U),z=Math.sin(U);w.x=L*z,w.y=p*M,w.z=L*q,d.push(w.x,w.y,w.z),u.push(0,M,0),A.x=q*.5+.5,A.y=z*.5*M+.5,f.push(A.x,A.y),m++}for(let B=0;B<i;B++){const N=E+B,U=b+B;y===!0?h.push(U,U+1,N):h.push(U+1,U,N),P+=3}c.addGroup(g,P,y===!0?1:2),g+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Be(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class rn extends Be{constructor(t=1,e=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new rn(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class yi extends Xt{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const r=[],a=[];o(i),c(n),h(),this.setAttribute("position",new Pt(r,3)),this.setAttribute("normal",new Pt(r.slice(),3)),this.setAttribute("uv",new Pt(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(v){const x=new C,y=new C,E=new C;for(let A=0;A<e.length;A+=3)f(e[A+0],x),f(e[A+1],y),f(e[A+2],E),l(x,y,E,v)}function l(v,x,y,E){const A=E+1,w=[];for(let P=0;P<=A;P++){w[P]=[];const L=v.clone().lerp(y,P/A),M=x.clone().lerp(y,P/A),b=A-P;for(let B=0;B<=b;B++)B===0&&P===A?w[P][B]=L:w[P][B]=L.clone().lerp(M,B/b)}for(let P=0;P<A;P++)for(let L=0;L<2*(A-P)-1;L++){const M=Math.floor(L/2);L%2===0?(u(w[P][M+1]),u(w[P+1][M]),u(w[P][M])):(u(w[P][M+1]),u(w[P+1][M+1]),u(w[P+1][M]))}}function c(v){const x=new C;for(let y=0;y<r.length;y+=3)x.x=r[y+0],x.y=r[y+1],x.z=r[y+2],x.normalize().multiplyScalar(v),r[y+0]=x.x,r[y+1]=x.y,r[y+2]=x.z}function h(){const v=new C;for(let x=0;x<r.length;x+=3){v.x=r[x+0],v.y=r[x+1],v.z=r[x+2];const y=p(v)/2/Math.PI+.5,E=g(v)/Math.PI+.5;a.push(y,1-E)}m(),d()}function d(){for(let v=0;v<a.length;v+=6){const x=a[v+0],y=a[v+2],E=a[v+4],A=Math.max(x,y,E),w=Math.min(x,y,E);A>.9&&w<.1&&(x<.2&&(a[v+0]+=1),y<.2&&(a[v+2]+=1),E<.2&&(a[v+4]+=1))}}function u(v){r.push(v.x,v.y,v.z)}function f(v,x){const y=v*3;x.x=t[y+0],x.y=t[y+1],x.z=t[y+2]}function m(){const v=new C,x=new C,y=new C,E=new C,A=new Q,w=new Q,P=new Q;for(let L=0,M=0;L<r.length;L+=9,M+=6){v.set(r[L+0],r[L+1],r[L+2]),x.set(r[L+3],r[L+4],r[L+5]),y.set(r[L+6],r[L+7],r[L+8]),A.set(a[M+0],a[M+1]),w.set(a[M+2],a[M+3]),P.set(a[M+4],a[M+5]),E.copy(v).add(x).add(y).divideScalar(3);const b=p(E);_(A,M+0,v,b),_(w,M+2,x,b),_(P,M+4,y,b)}}function _(v,x,y,E){E<0&&v.x===1&&(a[x]=v.x-1),y.x===0&&y.z===0&&(a[x]=E/2/Math.PI+.5)}function p(v){return Math.atan2(v.z,-v.x)}function g(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new yi(t.vertices,t.indices,t.radius,t.details)}}class ll extends yi{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new ll(t.radius,t.detail)}}const Pa=new C,Ia=new C,lc=new C,La=new en;class tp extends Xt{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const i=Math.pow(10,4),r=Math.cos($i*e),a=t.getIndex(),o=t.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],d=new Array(3),u={},f=[];for(let m=0;m<l;m+=3){a?(c[0]=a.getX(m),c[1]=a.getX(m+1),c[2]=a.getX(m+2)):(c[0]=m,c[1]=m+1,c[2]=m+2);const{a:_,b:p,c:g}=La;if(_.fromBufferAttribute(o,c[0]),p.fromBufferAttribute(o,c[1]),g.fromBufferAttribute(o,c[2]),La.getNormal(lc),d[0]=`${Math.round(_.x*i)},${Math.round(_.y*i)},${Math.round(_.z*i)}`,d[1]=`${Math.round(p.x*i)},${Math.round(p.y*i)},${Math.round(p.z*i)}`,d[2]=`${Math.round(g.x*i)},${Math.round(g.y*i)},${Math.round(g.z*i)}`,!(d[0]===d[1]||d[1]===d[2]||d[2]===d[0]))for(let v=0;v<3;v++){const x=(v+1)%3,y=d[v],E=d[x],A=La[h[v]],w=La[h[x]],P=`${y}_${E}`,L=`${E}_${y}`;L in u&&u[L]?(lc.dot(u[L].normal)<=r&&(f.push(A.x,A.y,A.z),f.push(w.x,w.y,w.z)),u[L]=null):P in u||(u[P]={index0:c[v],index1:c[x],normal:lc.clone()})}}for(const m in u)if(u[m]){const{index0:_,index1:p}=u[m];Pa.fromBufferAttribute(o,_),Ia.fromBufferAttribute(o,p),f.push(Pa.x,Pa.y,Pa.z),f.push(Ia.x,Ia.y,Ia.z)}this.setAttribute("position",new Pt(f,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class Ki extends Pr{constructor(t){super(t),this.uuid=fn(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,i=this.holes.length;n<i;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const i=this.holes[e];t.holes.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(new Pr().fromJSON(i))}return this}}const By={triangulate:function(s,t,e=2){const n=t&&t.length,i=n?t[0]*e:s.length;let r=ep(s,0,i,e,!0);const a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,d,u,f;if(n&&(r=Gy(s,t,r,e)),s.length>80*e){o=c=s[0],l=h=s[1];for(let m=e;m<i;m+=e)d=s[m],u=s[m+1],d<o&&(o=d),u<l&&(l=u),d>c&&(c=d),u>h&&(h=u);f=Math.max(c-o,h-l),f=f!==0?32767/f:0}return Ir(r,a,e,o,l,f,0),a}};function ep(s,t,e,n,i){let r,a;if(i===tM(s,t,e,n)>0)for(r=t;r<e;r+=n)a=qu(r,s[r],s[r+1],a);else for(r=e-n;r>=t;r-=n)a=qu(r,s[r],s[r+1],a);return a&&cl(a,a.next)&&(Dr(a),a=a.next),a}function es(s,t){if(!s)return s;t||(t=s);let e=s,n;do if(n=!1,!e.steiner&&(cl(e,e.next)||me(e.prev,e,e.next)===0)){if(Dr(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Ir(s,t,e,n,i,r,a){if(!s)return;!a&&r&&Zy(s,n,i,r);let o=s,l,c;for(;s.prev!==s.next;){if(l=s.prev,c=s.next,r?ky(s,n,i,r):zy(s)){t.push(l.i/e|0),t.push(s.i/e|0),t.push(c.i/e|0),Dr(s),s=c.next,o=c.next;continue}if(s=c,s===o){a?a===1?(s=Vy(es(s),t,e),Ir(s,t,e,n,i,r,2)):a===2&&Hy(s,t,e,n,i,r):Ir(es(s),t,e,n,i,r,1);break}}}function zy(s){const t=s.prev,e=s,n=s.next;if(me(t,e,n)>=0)return!1;const i=t.x,r=e.x,a=n.x,o=t.y,l=e.y,c=n.y,h=i<r?i<a?i:a:r<a?r:a,d=o<l?o<c?o:c:l<c?l:c,u=i>r?i>a?i:a:r>a?r:a,f=o>l?o>c?o:c:l>c?l:c;let m=n.next;for(;m!==t;){if(m.x>=h&&m.x<=u&&m.y>=d&&m.y<=f&&Ps(i,o,r,l,a,c,m.x,m.y)&&me(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function ky(s,t,e,n){const i=s.prev,r=s,a=s.next;if(me(i,r,a)>=0)return!1;const o=i.x,l=r.x,c=a.x,h=i.y,d=r.y,u=a.y,f=o<l?o<c?o:c:l<c?l:c,m=h<d?h<u?h:u:d<u?d:u,_=o>l?o>c?o:c:l>c?l:c,p=h>d?h>u?h:u:d>u?d:u,g=Rc(f,m,t,e,n),v=Rc(_,p,t,e,n);let x=s.prevZ,y=s.nextZ;for(;x&&x.z>=g&&y&&y.z<=v;){if(x.x>=f&&x.x<=_&&x.y>=m&&x.y<=p&&x!==i&&x!==a&&Ps(o,h,l,d,c,u,x.x,x.y)&&me(x.prev,x,x.next)>=0||(x=x.prevZ,y.x>=f&&y.x<=_&&y.y>=m&&y.y<=p&&y!==i&&y!==a&&Ps(o,h,l,d,c,u,y.x,y.y)&&me(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;x&&x.z>=g;){if(x.x>=f&&x.x<=_&&x.y>=m&&x.y<=p&&x!==i&&x!==a&&Ps(o,h,l,d,c,u,x.x,x.y)&&me(x.prev,x,x.next)>=0)return!1;x=x.prevZ}for(;y&&y.z<=v;){if(y.x>=f&&y.x<=_&&y.y>=m&&y.y<=p&&y!==i&&y!==a&&Ps(o,h,l,d,c,u,y.x,y.y)&&me(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function Vy(s,t,e){let n=s;do{const i=n.prev,r=n.next.next;!cl(i,r)&&np(i,n,n.next,r)&&Lr(i,r)&&Lr(r,i)&&(t.push(i.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),Dr(n),Dr(n.next),n=s=r),n=n.next}while(n!==s);return es(n)}function Hy(s,t,e,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Jy(a,o)){let l=ip(a,o);a=es(a,a.next),l=es(l,l.next),Ir(a,t,e,n,i,r,0),Ir(l,t,e,n,i,r,0);return}o=o.next}a=a.next}while(a!==s)}function Gy(s,t,e,n){const i=[];let r,a,o,l,c;for(r=0,a=t.length;r<a;r++)o=t[r]*n,l=r<a-1?t[r+1]*n:s.length,c=ep(s,o,l,n,!1),c===c.next&&(c.steiner=!0),i.push(Ky(c));for(i.sort(Wy),r=0;r<i.length;r++)e=Xy(i[r],e);return e}function Wy(s,t){return s.x-t.x}function Xy(s,t){const e=qy(s,t);if(!e)return t;const n=ip(e,s);return es(n,n.next),es(e,e.next)}function qy(s,t){let e=t,n=-1/0,i;const r=s.x,a=s.y;do{if(a<=e.y&&a>=e.next.y&&e.next.y!==e.y){const u=e.x+(a-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=r&&u>n&&(n=u,i=e.x<e.next.x?e:e.next,u===r))return i}e=e.next}while(e!==t);if(!i)return null;const o=i,l=i.x,c=i.y;let h=1/0,d;e=i;do r>=e.x&&e.x>=l&&r!==e.x&&Ps(a<c?r:n,a,l,c,a<c?n:r,a,e.x,e.y)&&(d=Math.abs(a-e.y)/(r-e.x),Lr(e,s)&&(d<h||d===h&&(e.x>i.x||e.x===i.x&&Yy(i,e)))&&(i=e,h=d)),e=e.next;while(e!==o);return i}function Yy(s,t){return me(s.prev,s,t.prev)<0&&me(t.next,s,s.next)<0}function Zy(s,t,e,n){let i=s;do i.z===0&&(i.z=Rc(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,$y(i)}function $y(s){let t,e,n,i,r,a,o,l,c=1;do{for(e=s,s=null,r=null,a=0;e;){for(a++,n=e,o=0,t=0;t<c&&(o++,n=n.nextZ,!!n);t++);for(l=c;o>0||l>0&&n;)o!==0&&(l===0||!n||e.z<=n.z)?(i=e,e=e.nextZ,o--):(i=n,n=n.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;e=n}r.nextZ=null,c*=2}while(a>1);return s}function Rc(s,t,e,n,i){return s=(s-e)*i|0,t=(t-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,s|t<<1}function Ky(s){let t=s,e=s;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==s);return e}function Ps(s,t,e,n,i,r,a,o){return(i-a)*(t-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(i-a)*(n-o)}function Jy(s,t){return s.next.i!==t.i&&s.prev.i!==t.i&&!Qy(s,t)&&(Lr(s,t)&&Lr(t,s)&&jy(s,t)&&(me(s.prev,s,t.prev)||me(s,t.prev,t))||cl(s,t)&&me(s.prev,s,s.next)>0&&me(t.prev,t,t.next)>0)}function me(s,t,e){return(t.y-s.y)*(e.x-t.x)-(t.x-s.x)*(e.y-t.y)}function cl(s,t){return s.x===t.x&&s.y===t.y}function np(s,t,e,n){const i=Ua(me(s,t,e)),r=Ua(me(s,t,n)),a=Ua(me(e,n,s)),o=Ua(me(e,n,t));return!!(i!==r&&a!==o||i===0&&Da(s,e,t)||r===0&&Da(s,n,t)||a===0&&Da(e,s,n)||o===0&&Da(e,t,n))}function Da(s,t,e){return t.x<=Math.max(s.x,e.x)&&t.x>=Math.min(s.x,e.x)&&t.y<=Math.max(s.y,e.y)&&t.y>=Math.min(s.y,e.y)}function Ua(s){return s>0?1:s<0?-1:0}function Qy(s,t){let e=s;do{if(e.i!==s.i&&e.next.i!==s.i&&e.i!==t.i&&e.next.i!==t.i&&np(e,e.next,s,t))return!0;e=e.next}while(e!==s);return!1}function Lr(s,t){return me(s.prev,s,s.next)<0?me(s,t,s.next)>=0&&me(s,s.prev,t)>=0:me(s,t,s.prev)<0||me(s,s.next,t)<0}function jy(s,t){let e=s,n=!1;const i=(s.x+t.x)/2,r=(s.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&i<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==s);return n}function ip(s,t){const e=new Pc(s.i,s.x,s.y),n=new Pc(t.i,t.x,t.y),i=s.next,r=t.prev;return s.next=t,t.prev=s,e.next=i,i.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function qu(s,t,e,n){const i=new Pc(s,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Dr(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Pc(s,t,e){this.i=s,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function tM(s,t,e,n){let i=0;for(let r=t,a=e-n;r<e;r+=n)i+=(s[a]-s[r])*(s[r+1]+s[a+1]),a=r;return i}class Nn{static area(t){const e=t.length;let n=0;for(let i=e-1,r=0;r<e;i=r++)n+=t[i].x*t[r].y-t[r].x*t[i].y;return n*.5}static isClockWise(t){return Nn.area(t)<0}static triangulateShape(t,e){const n=[],i=[],r=[];Yu(t),Zu(n,t);let a=t.length;e.forEach(Yu);for(let l=0;l<e.length;l++)i.push(a),a+=e[l].length,Zu(n,e[l]);const o=By.triangulate(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}}function Yu(s){const t=s.length;t>2&&s[t-1].equals(s[0])&&s.pop()}function Zu(s,t){for(let e=0;e<t.length;e++)s.push(t[e].x),s.push(t[e].y)}class hl extends Xt{constructor(t=new Ki([new Q(.5,.5),new Q(-.5,.5),new Q(-.5,-.5),new Q(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,i=[],r=[];for(let o=0,l=t.length;o<l;o++){const c=t[o];a(c)}this.setAttribute("position",new Pt(i,3)),this.setAttribute("uv",new Pt(r,2)),this.computeVertexNormals();function a(o){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,d=e.depth!==void 0?e.depth:1;let u=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,m=e.bevelSize!==void 0?e.bevelSize:f-.1,_=e.bevelOffset!==void 0?e.bevelOffset:0,p=e.bevelSegments!==void 0?e.bevelSegments:3;const g=e.extrudePath,v=e.UVGenerator!==void 0?e.UVGenerator:eM;let x,y=!1,E,A,w,P;g&&(x=g.getSpacedPoints(h),y=!0,u=!1,E=g.computeFrenetFrames(h,!1),A=new C,w=new C,P=new C),u||(p=0,f=0,m=0,_=0);const L=o.extractPoints(c);let M=L.shape;const b=L.holes;if(!Nn.isClockWise(M)){M=M.reverse();for(let j=0,I=b.length;j<I;j++){const ht=b[j];Nn.isClockWise(ht)&&(b[j]=ht.reverse())}}const N=Nn.triangulateShape(M,b),U=M;for(let j=0,I=b.length;j<I;j++){const ht=b[j];M=M.concat(ht)}function q(j,I,ht){return I||console.error("THREE.ExtrudeGeometry: vec does not exist"),j.clone().addScaledVector(I,ht)}const z=M.length,X=N.length;function W(j,I,ht){let ot,nt,dt;const mt=j.x-I.x,pt=j.y-I.y,R=ht.x-j.x,S=ht.y-j.y,k=mt*mt+pt*pt,K=mt*S-pt*R;if(Math.abs(K)>Number.EPSILON){const tt=Math.sqrt(k),J=Math.sqrt(R*R+S*S),Dt=I.x-pt/tt,xt=I.y+mt/tt,At=ht.x-S/J,Kt=ht.y+R/J,st=((At-Dt)*S-(Kt-xt)*R)/(mt*S-pt*R);ot=Dt+mt*st-j.x,nt=xt+pt*st-j.y;const Tt=ot*ot+nt*nt;if(Tt<=2)return new Q(ot,nt);dt=Math.sqrt(Tt/2)}else{let tt=!1;mt>Number.EPSILON?R>Number.EPSILON&&(tt=!0):mt<-Number.EPSILON?R<-Number.EPSILON&&(tt=!0):Math.sign(pt)===Math.sign(S)&&(tt=!0),tt?(ot=-pt,nt=mt,dt=Math.sqrt(k)):(ot=mt,nt=pt,dt=Math.sqrt(k/2))}return new Q(ot/dt,nt/dt)}const _t=[];for(let j=0,I=U.length,ht=I-1,ot=j+1;j<I;j++,ht++,ot++)ht===I&&(ht=0),ot===I&&(ot=0),_t[j]=W(U[j],U[ht],U[ot]);const yt=[];let it,ct=_t.concat();for(let j=0,I=b.length;j<I;j++){const ht=b[j];it=[];for(let ot=0,nt=ht.length,dt=nt-1,mt=ot+1;ot<nt;ot++,dt++,mt++)dt===nt&&(dt=0),mt===nt&&(mt=0),it[ot]=W(ht[ot],ht[dt],ht[mt]);yt.push(it),ct=ct.concat(it)}for(let j=0;j<p;j++){const I=j/p,ht=f*Math.cos(I*Math.PI/2),ot=m*Math.sin(I*Math.PI/2)+_;for(let nt=0,dt=U.length;nt<dt;nt++){const mt=q(U[nt],_t[nt],ot);rt(mt.x,mt.y,-ht)}for(let nt=0,dt=b.length;nt<dt;nt++){const mt=b[nt];it=yt[nt];for(let pt=0,R=mt.length;pt<R;pt++){const S=q(mt[pt],it[pt],ot);rt(S.x,S.y,-ht)}}}const Et=m+_;for(let j=0;j<z;j++){const I=u?q(M[j],ct[j],Et):M[j];y?(w.copy(E.normals[0]).multiplyScalar(I.x),A.copy(E.binormals[0]).multiplyScalar(I.y),P.copy(x[0]).add(w).add(A),rt(P.x,P.y,P.z)):rt(I.x,I.y,0)}for(let j=1;j<=h;j++)for(let I=0;I<z;I++){const ht=u?q(M[I],ct[I],Et):M[I];y?(w.copy(E.normals[j]).multiplyScalar(ht.x),A.copy(E.binormals[j]).multiplyScalar(ht.y),P.copy(x[j]).add(w).add(A),rt(P.x,P.y,P.z)):rt(ht.x,ht.y,d/h*j)}for(let j=p-1;j>=0;j--){const I=j/p,ht=f*Math.cos(I*Math.PI/2),ot=m*Math.sin(I*Math.PI/2)+_;for(let nt=0,dt=U.length;nt<dt;nt++){const mt=q(U[nt],_t[nt],ot);rt(mt.x,mt.y,d+ht)}for(let nt=0,dt=b.length;nt<dt;nt++){const mt=b[nt];it=yt[nt];for(let pt=0,R=mt.length;pt<R;pt++){const S=q(mt[pt],it[pt],ot);y?rt(S.x,S.y+x[h-1].y,x[h-1].x+ht):rt(S.x,S.y,d+ht)}}}V(),Z();function V(){const j=i.length/3;if(u){let I=0,ht=z*I;for(let ot=0;ot<X;ot++){const nt=N[ot];vt(nt[2]+ht,nt[1]+ht,nt[0]+ht)}I=h+p*2,ht=z*I;for(let ot=0;ot<X;ot++){const nt=N[ot];vt(nt[0]+ht,nt[1]+ht,nt[2]+ht)}}else{for(let I=0;I<X;I++){const ht=N[I];vt(ht[2],ht[1],ht[0])}for(let I=0;I<X;I++){const ht=N[I];vt(ht[0]+z*h,ht[1]+z*h,ht[2]+z*h)}}n.addGroup(j,i.length/3-j,0)}function Z(){const j=i.length/3;let I=0;ut(U,I),I+=U.length;for(let ht=0,ot=b.length;ht<ot;ht++){const nt=b[ht];ut(nt,I),I+=nt.length}n.addGroup(j,i.length/3-j,1)}function ut(j,I){let ht=j.length;for(;--ht>=0;){const ot=ht;let nt=ht-1;nt<0&&(nt=j.length-1);for(let dt=0,mt=h+p*2;dt<mt;dt++){const pt=z*dt,R=z*(dt+1),S=I+ot+pt,k=I+nt+pt,K=I+nt+R,tt=I+ot+R;Lt(S,k,K,tt)}}}function rt(j,I,ht){l.push(j),l.push(I),l.push(ht)}function vt(j,I,ht){Nt(j),Nt(I),Nt(ht);const ot=i.length/3,nt=v.generateTopUV(n,i,ot-3,ot-2,ot-1);kt(nt[0]),kt(nt[1]),kt(nt[2])}function Lt(j,I,ht,ot){Nt(j),Nt(I),Nt(ot),Nt(I),Nt(ht),Nt(ot);const nt=i.length/3,dt=v.generateSideWallUV(n,i,nt-6,nt-3,nt-2,nt-1);kt(dt[0]),kt(dt[1]),kt(dt[3]),kt(dt[1]),kt(dt[2]),kt(dt[3])}function Nt(j){i.push(l[j*3+0]),i.push(l[j*3+1]),i.push(l[j*3+2])}function kt(j){r.push(j.x),r.push(j.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return nM(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,a=t.shapes.length;r<a;r++){const o=e[t.shapes[r]];n.push(o)}const i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new No[i.type]().fromJSON(i)),new hl(n,t.options)}}const eM={generateTopUV:function(s,t,e,n,i){const r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],c=t[i*3],h=t[i*3+1];return[new Q(r,a),new Q(o,l),new Q(c,h)]},generateSideWallUV:function(s,t,e,n,i,r){const a=t[e*3],o=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],d=t[n*3+2],u=t[i*3],f=t[i*3+1],m=t[i*3+2],_=t[r*3],p=t[r*3+1],g=t[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new Q(a,1-l),new Q(c,1-d),new Q(u,1-m),new Q(_,1-g)]:[new Q(o,1-l),new Q(h,1-d),new Q(f,1-m),new Q(p,1-g)]}};function nM(s,t,e){if(e.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){const r=s[n];e.shapes.push(r.uuid)}else e.shapes.push(s.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class ul extends yi{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new ul(t.radius,t.detail)}}class Ws extends yi{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ws(t.radius,t.detail)}}class An extends Xt{constructor(t=.5,e=1,n=32,i=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);const o=[],l=[],c=[],h=[];let d=t;const u=(e-t)/i,f=new C,m=new Q;for(let _=0;_<=i;_++){for(let p=0;p<=n;p++){const g=r+p/n*a;f.x=d*Math.cos(g),f.y=d*Math.sin(g),l.push(f.x,f.y,f.z),c.push(0,0,1),m.x=(f.x/e+1)/2,m.y=(f.y/e+1)/2,h.push(m.x,m.y)}d+=u}for(let _=0;_<i;_++){const p=_*(n+1);for(let g=0;g<n;g++){const v=g+p,x=v,y=v+n+1,E=v+n+2,A=v+1;o.push(x,y,A),o.push(y,E,A)}}this.setIndex(o),this.setAttribute("position",new Pt(l,3)),this.setAttribute("normal",new Pt(c,3)),this.setAttribute("uv",new Pt(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new An(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class dl extends Xt{constructor(t=new Ki([new Q(0,.5),new Q(-.5,-.5),new Q(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],i=[],r=[],a=[];let o=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let h=0;h<t.length;h++)c(t[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new Pt(i,3)),this.setAttribute("normal",new Pt(r,3)),this.setAttribute("uv",new Pt(a,2));function c(h){const d=i.length/3,u=h.extractPoints(e);let f=u.shape;const m=u.holes;Nn.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,g=m.length;p<g;p++){const v=m[p];Nn.isClockWise(v)===!0&&(m[p]=v.reverse())}const _=Nn.triangulateShape(f,m);for(let p=0,g=m.length;p<g;p++){const v=m[p];f=f.concat(v)}for(let p=0,g=f.length;p<g;p++){const v=f[p];i.push(v.x,v.y,0),r.push(0,0,1),a.push(v.x,v.y)}for(let p=0,g=_.length;p<g;p++){const v=_[p],x=v[0]+d,y=v[1]+d,E=v[2]+d;n.push(x,y,E),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return iM(e,t)}static fromJSON(t,e){const n=[];for(let i=0,r=t.shapes.length;i<r;i++){const a=e[t.shapes[i]];n.push(a)}return new dl(n,t.curveSegments)}}function iM(s,t){if(t.shapes=[],Array.isArray(s))for(let e=0,n=s.length;e<n;e++){const i=s[e];t.shapes.push(i.uuid)}else t.shapes.push(s.uuid);return t}class Ie extends Xt{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],d=new C,u=new C,f=[],m=[],_=[],p=[];for(let g=0;g<=n;g++){const v=[],x=g/n;let y=0;g===0&&a===0?y=.5/e:g===n&&l===Math.PI&&(y=-.5/e);for(let E=0;E<=e;E++){const A=E/e;d.x=-t*Math.cos(i+A*r)*Math.sin(a+x*o),d.y=t*Math.cos(a+x*o),d.z=t*Math.sin(i+A*r)*Math.sin(a+x*o),m.push(d.x,d.y,d.z),u.copy(d).normalize(),_.push(u.x,u.y,u.z),p.push(A+y,1-x),v.push(c++)}h.push(v)}for(let g=0;g<n;g++)for(let v=0;v<e;v++){const x=h[g][v+1],y=h[g][v],E=h[g+1][v],A=h[g+1][v+1];(g!==0||a>0)&&f.push(x,y,A),(g!==n-1||l<Math.PI)&&f.push(y,E,A)}this.setIndex(f),this.setAttribute("position",new Pt(m,3)),this.setAttribute("normal",new Pt(_,3)),this.setAttribute("uv",new Pt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ie(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class fl extends yi{constructor(t=1,e=0){const n=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],i=[2,1,0,0,3,2,1,3,0,2,3,1];super(n,i,t,e),this.type="TetrahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new fl(t.radius,t.detail)}}class pl extends Xt{constructor(t=1,e=.4,n=12,i=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);const a=[],o=[],l=[],c=[],h=new C,d=new C,u=new C;for(let f=0;f<=n;f++)for(let m=0;m<=i;m++){const _=m/i*r,p=f/n*Math.PI*2;d.x=(t+e*Math.cos(p))*Math.cos(_),d.y=(t+e*Math.cos(p))*Math.sin(_),d.z=e*Math.sin(p),o.push(d.x,d.y,d.z),h.x=t*Math.cos(_),h.y=t*Math.sin(_),u.subVectors(d,h).normalize(),l.push(u.x,u.y,u.z),c.push(m/i),c.push(f/n)}for(let f=1;f<=n;f++)for(let m=1;m<=i;m++){const _=(i+1)*f+m-1,p=(i+1)*(f-1)+m-1,g=(i+1)*(f-1)+m,v=(i+1)*f+m;a.push(_,p,v),a.push(p,g,v)}this.setIndex(a),this.setAttribute("position",new Pt(o,3)),this.setAttribute("normal",new Pt(l,3)),this.setAttribute("uv",new Pt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pl(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class ml extends Xt{constructor(t=1,e=.4,n=64,i=8,r=2,a=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:t,tube:e,tubularSegments:n,radialSegments:i,p:r,q:a},n=Math.floor(n),i=Math.floor(i);const o=[],l=[],c=[],h=[],d=new C,u=new C,f=new C,m=new C,_=new C,p=new C,g=new C;for(let x=0;x<=n;++x){const y=x/n*r*Math.PI*2;v(y,r,a,t,f),v(y+.01,r,a,t,m),p.subVectors(m,f),g.addVectors(m,f),_.crossVectors(p,g),g.crossVectors(_,p),_.normalize(),g.normalize();for(let E=0;E<=i;++E){const A=E/i*Math.PI*2,w=-e*Math.cos(A),P=e*Math.sin(A);d.x=f.x+(w*g.x+P*_.x),d.y=f.y+(w*g.y+P*_.y),d.z=f.z+(w*g.z+P*_.z),l.push(d.x,d.y,d.z),u.subVectors(d,f).normalize(),c.push(u.x,u.y,u.z),h.push(x/n),h.push(E/i)}}for(let x=1;x<=n;x++)for(let y=1;y<=i;y++){const E=(i+1)*(x-1)+(y-1),A=(i+1)*x+(y-1),w=(i+1)*x+y,P=(i+1)*(x-1)+y;o.push(E,A,P),o.push(A,w,P)}this.setIndex(o),this.setAttribute("position",new Pt(l,3)),this.setAttribute("normal",new Pt(c,3)),this.setAttribute("uv",new Pt(h,2));function v(x,y,E,A,w){const P=Math.cos(x),L=Math.sin(x),M=E/y*x,b=Math.cos(M);w.x=A*(2+b)*.5*P,w.y=A*(2+b)*L*.5,w.z=A*Math.sin(M)*.5}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ml(t.radius,t.tube,t.tubularSegments,t.radialSegments,t.p,t.q)}}class gl extends Xt{constructor(t=new ph(new C(-1,-1,0),new C(-1,1,0),new C(1,1,0)),e=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:i,closed:r};const a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new C,l=new C,c=new Q;let h=new C;const d=[],u=[],f=[],m=[];_(),this.setIndex(m),this.setAttribute("position",new Pt(d,3)),this.setAttribute("normal",new Pt(u,3)),this.setAttribute("uv",new Pt(f,2));function _(){for(let x=0;x<e;x++)p(x);p(r===!1?e:0),v(),g()}function p(x){h=t.getPointAt(x/e,h);const y=a.normals[x],E=a.binormals[x];for(let A=0;A<=i;A++){const w=A/i*Math.PI*2,P=Math.sin(w),L=-Math.cos(w);l.x=L*y.x+P*E.x,l.y=L*y.y+P*E.y,l.z=L*y.z+P*E.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,d.push(o.x,o.y,o.z)}}function g(){for(let x=1;x<=e;x++)for(let y=1;y<=i;y++){const E=(i+1)*(x-1)+(y-1),A=(i+1)*x+(y-1),w=(i+1)*x+y,P=(i+1)*(x-1)+y;m.push(E,A,P),m.push(A,w,P)}}function v(){for(let x=0;x<=e;x++)for(let y=0;y<=i;y++)c.x=x/e,c.y=y/i,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new gl(new No[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class sp extends Xt{constructor(t=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:t},t!==null){const e=[],n=new Set,i=new C,r=new C;if(t.index!==null){const a=t.attributes.position,o=t.index;let l=t.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){const d=l[c],u=d.start,f=d.count;for(let m=u,_=u+f;m<_;m+=3)for(let p=0;p<3;p++){const g=o.getX(m+p),v=o.getX(m+(p+1)%3);i.fromBufferAttribute(a,g),r.fromBufferAttribute(a,v),$u(i,r,n)===!0&&(e.push(i.x,i.y,i.z),e.push(r.x,r.y,r.z))}}}else{const a=t.attributes.position;for(let o=0,l=a.count/3;o<l;o++)for(let c=0;c<3;c++){const h=3*o+c,d=3*o+(c+1)%3;i.fromBufferAttribute(a,h),r.fromBufferAttribute(a,d),$u(i,r,n)===!0&&(e.push(i.x,i.y,i.z),e.push(r.x,r.y,r.z))}}this.setAttribute("position",new Pt(e,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}function $u(s,t,e){const n=`${s.x},${s.y},${s.z}-${t.x},${t.y},${t.z}`,i=`${t.x},${t.y},${t.z}-${s.x},${s.y},${s.z}`;return e.has(n)===!0||e.has(i)===!0?!1:(e.add(n),e.add(i),!0)}var Ku=Object.freeze({__proto__:null,BoxGeometry:Pe,CapsuleGeometry:al,CircleGeometry:ol,ConeGeometry:rn,CylinderGeometry:Be,DodecahedronGeometry:ll,EdgesGeometry:tp,ExtrudeGeometry:hl,IcosahedronGeometry:ul,LatheGeometry:Xr,OctahedronGeometry:Ws,PlaneGeometry:On,PolyhedronGeometry:yi,RingGeometry:An,ShapeGeometry:dl,SphereGeometry:Ie,TetrahedronGeometry:fl,TorusGeometry:pl,TorusKnotGeometry:ml,TubeGeometry:gl,WireframeGeometry:sp});class rp extends Xe{constructor(t){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new ft(0),this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.fog=t.fog,this}}class ap extends an{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class gh extends Xe{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class op extends gh{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Q(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return xe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ft(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ft(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ft(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class lp extends Xe{constructor(t){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new ft(16777215),this.specular=new ft(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.combine=zr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class ns extends Xe{constructor(t){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new ft(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.gradientMap=t.gradientMap,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}class cp extends Xe{constructor(t){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(t)}copy(t){return super.copy(t),this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.flatShading=t.flatShading,this}}class hp extends Xe{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.combine=zr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class up extends Xe{constructor(t){super(),this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new ft(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vi,this.normalScale=new Q(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={MATCAP:""},this.color.copy(t.color),this.matcap=t.matcap,this.map=t.map,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.flatShading=t.flatShading,this.fog=t.fog,this}}class dp extends ze{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}}function Xi(s,t,e){return!s||!e&&s.constructor===t?s:typeof t.BYTES_PER_ELEMENT=="number"?new t(s):Array.prototype.slice.call(s)}function fp(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function pp(s){function t(i,r){return s[i]-s[r]}const e=s.length,n=new Array(e);for(let i=0;i!==e;++i)n[i]=i;return n.sort(t),n}function Ic(s,t,e){const n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){const o=e[r]*t;for(let l=0;l!==t;++l)i[a++]=s[o+l]}return i}function _h(s,t,e,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(t.push(r.time),e.push.apply(e,a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(t.push(r.time),a.toArray(e,e.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(t.push(r.time),e.push(a)),r=s[i++];while(r!==void 0)}function sM(s,t,e,n,i=30){const r=s.clone();r.name=t;const a=[];for(let l=0;l<r.tracks.length;++l){const c=r.tracks[l],h=c.getValueSize(),d=[],u=[];for(let f=0;f<c.times.length;++f){const m=c.times[f]*i;if(!(m<e||m>=n)){d.push(c.times[f]);for(let _=0;_<h;++_)u.push(c.values[f*h+_])}}d.length!==0&&(c.times=Xi(d,c.times.constructor),c.values=Xi(u,c.values.constructor),a.push(c))}r.tracks=a;let o=1/0;for(let l=0;l<r.tracks.length;++l)o>r.tracks[l].times[0]&&(o=r.tracks[l].times[0]);for(let l=0;l<r.tracks.length;++l)r.tracks[l].shift(-1*o);return r.resetDuration(),r}function rM(s,t=0,e=s,n=30){n<=0&&(n=30);const i=e.tracks.length,r=t/n;for(let a=0;a<i;++a){const o=e.tracks[a],l=o.ValueTypeName;if(l==="bool"||l==="string")continue;const c=s.tracks.find(function(g){return g.name===o.name&&g.ValueTypeName===l});if(c===void 0)continue;let h=0;const d=o.getValueSize();o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(h=d/3);let u=0;const f=c.getValueSize();c.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(u=f/3);const m=o.times.length-1;let _;if(r<=o.times[0]){const g=h,v=d-h;_=o.values.slice(g,v)}else if(r>=o.times[m]){const g=m*d+h,v=g+d-h;_=o.values.slice(g,v)}else{const g=o.createInterpolant(),v=h,x=d-h;g.evaluate(r),_=g.resultBuffer.slice(v,x)}l==="quaternion"&&new sn().fromArray(_).normalize().conjugate().toArray(_);const p=c.times.length;for(let g=0;g<p;++g){const v=g*f+u;if(l==="quaternion")sn.multiplyQuaternionsFlat(c.values,v,_,0,c.values,v);else{const x=f-u*2;for(let y=0;y<x;++y)c.values[v+y]-=_[y]}}}return s.blendMode=Zc,s}const aM={convertArray:Xi,isTypedArray:fp,getKeyframeOrder:pp,sortedArray:Ic,flattenJSON:_h,subclip:sM,makeClipAdditive:rM};class qr{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){const e=this.parameterPositions;let n=this._cachedIndex,i=e[n],r=e[n-1];t:{e:{let a;n:{i:if(!(t<i)){for(let o=n+2;;){if(i===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=e[++n],t<i)break e}a=e.length;break n}if(!(t>=r)){const o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=e[--n-1],t>=r)break e}a=n,n=0;break n}break t}for(;n<a;){const o=n+a>>>1;t<e[o]?a=o:n=o+1}if(i=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){const e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=t*i;for(let a=0;a!==i;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class mp extends qr{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Hi,endingEnd:Hi}}intervalChanged_(t,e,n){const i=this.parameterPositions;let r=t-2,a=t+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case Gi:r=t,o=2*e-n;break;case Sr:r=i.length-2,o=e+i[r]-i[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Gi:a=t,l=2*n-e;break;case Sr:a=1,l=n+i[1]-i[0];break;default:a=t-1,l=e}const c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,m=(n-e)/(i-e),_=m*m,p=_*m,g=-u*p+2*u*_-u*m,v=(1+u)*p+(-1.5-2*u)*_+(-.5+u)*m+1,x=(-1-f)*p+(1.5+f)*_+.5*m,y=f*p-f*_;for(let E=0;E!==o;++E)r[E]=g*a[h+E]+v*a[c+E]+x*a[l+E]+y*a[d+E];return r}}class xh extends qr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(i-e),d=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*d+a[l+u]*h;return r}}class gp extends qr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}}class Cn{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Xi(e,this.TimeBufferType),this.values=Xi(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){const e=t.constructor;let n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Xi(t.times,Array),values:Xi(t.values,Array)};const i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new gp(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new xh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new mp(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case br:e=this.InterpolantFactoryMethodDiscrete;break;case Lo:e=this.InterpolantFactoryMethodLinear;break;case Wa:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return br;case this.InterpolantFactoryMethodLinear:return Lo;case this.InterpolantFactoryMethodSmooth:return Wa}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t}return this}scale(t){if(t!==1){const e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t}return this}trim(t,e){const n=this.times,i=n.length;let r=0,a=i-1;for(;r!==i&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);const o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0;const e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);const n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){const l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(i!==void 0&&fp(i))for(let o=0,l=i.length;o!==l;++o){const c=i[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){const t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Wa,r=t.length-1;let a=1;for(let o=1;o<r;++o){let l=!1;const c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(i)l=!0;else{const d=o*n,u=d-n,f=d+n;for(let m=0;m!==n;++m){const _=e[d+m];if(_!==e[u+m]||_!==e[f+m]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];const d=o*n,u=a*n;for(let f=0;f!==n;++f)e[u+f]=e[d+f]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){const t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,i}}Cn.prototype.TimeBufferType=Float32Array;Cn.prototype.ValueBufferType=Float32Array;Cn.prototype.DefaultInterpolation=Lo;class is extends Cn{constructor(t,e,n){super(t,e,n)}}is.prototype.ValueTypeName="bool";is.prototype.ValueBufferType=Array;is.prototype.DefaultInterpolation=br;is.prototype.InterpolantFactoryMethodLinear=void 0;is.prototype.InterpolantFactoryMethodSmooth=void 0;class vh extends Cn{}vh.prototype.ValueTypeName="color";class Ur extends Cn{}Ur.prototype.ValueTypeName="number";class _p extends qr{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(i-e);let c=t*o;for(let h=c+o;c!==h;c+=4)sn.slerpFlat(r,0,a,c-o,a,c,l);return r}}class Yr extends Cn{InterpolantFactoryMethodLinear(t){return new _p(this.times,this.values,this.getValueSize(),t)}}Yr.prototype.ValueTypeName="quaternion";Yr.prototype.InterpolantFactoryMethodSmooth=void 0;class ss extends Cn{constructor(t,e,n){super(t,e,n)}}ss.prototype.ValueTypeName="string";ss.prototype.ValueBufferType=Array;ss.prototype.DefaultInterpolation=br;ss.prototype.InterpolantFactoryMethodLinear=void 0;ss.prototype.InterpolantFactoryMethodSmooth=void 0;class Nr extends Cn{}Nr.prototype.ValueTypeName="vector";class Fr{constructor(t="",e=-1,n=[],i=Zo){this.name=t,this.tracks=n,this.duration=e,this.blendMode=i,this.uuid=fn(),this.duration<0&&this.resetDuration()}static parse(t){const e=[],n=t.tracks,i=1/(t.fps||1);for(let a=0,o=n.length;a!==o;++a)e.push(lM(n[a]).scale(i));const r=new this(t.name,t.duration,e,t.blendMode);return r.uuid=t.uuid,r}static toJSON(t){const e=[],n=t.tracks,i={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode};for(let r=0,a=n.length;r!==a;++r)e.push(Cn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(t,e,n,i){const r=e.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);const h=pp(l);l=Ic(l,1,h),c=Ic(c,1,h),!i&&l[0]===0&&(l.push(r),c.push(c[0])),a.push(new Ur(".morphTargetInfluences["+e[o].name+"]",l,c).scale(1/n))}return new this(t,-1,a)}static findByName(t,e){let n=t;if(!Array.isArray(t)){const i=t;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===e)return n[i];return null}static CreateClipsFromMorphTargetSequences(t,e,n){const i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=t.length;o<l;o++){const c=t[o],h=c.name.match(r);if(h&&h.length>1){const d=h[1];let u=i[d];u||(i[d]=u=[]),u.push(c)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],e,n));return a}static parseAnimation(t,e){if(!t)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(d,u,f,m,_){if(f.length!==0){const p=[],g=[];_h(f,p,g,m),p.length!==0&&_.push(new d(u,p,g))}},i=[],r=t.name||"default",a=t.fps||30,o=t.blendMode;let l=t.length||-1;const c=t.hierarchy||[];for(let d=0;d<c.length;d++){const u=c[d].keys;if(!(!u||u.length===0))if(u[0].morphTargets){const f={};let m;for(m=0;m<u.length;m++)if(u[m].morphTargets)for(let _=0;_<u[m].morphTargets.length;_++)f[u[m].morphTargets[_]]=-1;for(const _ in f){const p=[],g=[];for(let v=0;v!==u[m].morphTargets.length;++v){const x=u[m];p.push(x.time),g.push(x.morphTarget===_?1:0)}i.push(new Ur(".morphTargetInfluence["+_+"]",p,g))}l=f.length*a}else{const f=".bones["+e[d].name+"]";n(Nr,f+".position",u,"pos",i),n(Yr,f+".quaternion",u,"rot",i),n(Nr,f+".scale",u,"scl",i)}}return i.length===0?null:new this(r,l,i,o)}resetDuration(){const t=this.tracks;let e=0;for(let n=0,i=t.length;n!==i;++n){const r=this.tracks[n];e=Math.max(e,r.times[r.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=!0;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){const t=[];for(let e=0;e<this.tracks.length;e++)t.push(this.tracks[e].clone());return new this.constructor(this.name,this.duration,t,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function oM(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Ur;case"vector":case"vector2":case"vector3":case"vector4":return Nr;case"color":return vh;case"quaternion":return Yr;case"bool":case"boolean":return is;case"string":return ss}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function lM(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const t=oM(s.type);if(s.times===void 0){const e=[],n=[];_h(s.keys,e,n,"value"),s.times=e,s.values=n}return t.parse!==void 0?t.parse(s):new t(s.name,s.times,s.values,s.interpolation)}const Kn={enabled:!1,files:{},add:function(s,t){this.enabled!==!1&&(this.files[s]=t)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class yh{constructor(t,e,n){const i=this;let r=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){const d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){const f=c[d],m=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null}}}const xp=new yh;class on{constructor(t){this.manager=t!==void 0?t:xp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){const n=this;return new Promise(function(i,r){n.load(t,i,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}}on.DEFAULT_MATERIAL_NAME="__DEFAULT";const Yn={};class cM extends Error{constructor(t,e){super(t),this.response=e}}class ni extends on{constructor(t){super(t)}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const r=Kn.get(t);if(r!==void 0)return this.manager.itemStart(t),setTimeout(()=>{e&&e(r),this.manager.itemEnd(t)},0),r;if(Yn[t]!==void 0){Yn[t].push({onLoad:e,onProgress:n,onError:i});return}Yn[t]=[],Yn[t].push({onLoad:e,onProgress:n,onError:i});const a=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=Yn[t],d=c.body.getReader(),u=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=u?parseInt(u):0,m=f!==0;let _=0;const p=new ReadableStream({start(g){v();function v(){d.read().then(({done:x,value:y})=>{if(x)g.close();else{_+=y.byteLength;const E=new ProgressEvent("progress",{lengthComputable:m,loaded:_,total:f});for(let A=0,w=h.length;A<w;A++){const P=h[A];P.onProgress&&P.onProgress(E)}g.enqueue(y),v()}},x=>{g.error(x)})}}});return new Response(p)}else throw new cM(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o===void 0)return c.text();{const d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,f=new TextDecoder(u);return c.arrayBuffer().then(m=>f.decode(m))}}}).then(c=>{Kn.add(t,c);const h=Yn[t];delete Yn[t];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onLoad&&f.onLoad(c)}}).catch(c=>{const h=Yn[t];if(h===void 0)throw this.manager.itemError(t),c;delete Yn[t];for(let d=0,u=h.length;d<u;d++){const f=h[d];f.onError&&f.onError(c)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}}class hM extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=new ni(this.manager);a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):console.error(l),r.manager.itemError(t)}},n,i)}parse(t){const e=[];for(let n=0;n<t.length;n++){const i=Fr.parse(t[n]);e.push(i)}return e}}class uM extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=[],o=new sl,l=new ni(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(r.withCredentials);let c=0;function h(d){l.load(t[d],function(u){const f=r.parse(u,!0);a[d]={width:f.width,height:f.height,format:f.format,mipmaps:f.mipmaps},c+=1,c===6&&(f.mipmapCount===1&&(o.minFilter=Re),o.image=a,o.format=f.format,o.needsUpdate=!0,e&&e(o))},n,i)}if(Array.isArray(t))for(let d=0,u=t.length;d<u;++d)h(d);else l.load(t,function(d){const u=r.parse(d,!0);if(u.isCubemap){const f=u.mipmaps.length/u.mipmapCount;for(let m=0;m<f;m++){a[m]={mipmaps:[]};for(let _=0;_<u.mipmapCount;_++)a[m].mipmaps.push(u.mipmaps[m*u.mipmapCount+_]),a[m].format=u.format,a[m].width=u.width,a[m].height=u.height}o.image=a}else o.image.width=u.width,o.image.height=u.height,o.mipmaps=u.mipmaps;u.mipmapCount===1&&(o.minFilter=Re),o.format=u.format,o.needsUpdate=!0,e&&e(o)},n,i);return o}}class Or extends on{constructor(t){super(t)}load(t,e,n,i){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const r=this,a=Kn.get(t);if(a!==void 0)return r.manager.itemStart(t),setTimeout(function(){e&&e(a),r.manager.itemEnd(t)},0),a;const o=Rr("img");function l(){h(),Kn.add(t,this),e&&e(this),r.manager.itemEnd(t)}function c(d){h(),i&&i(d),r.manager.itemError(t),r.manager.itemEnd(t)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),r.manager.itemStart(t),o.src=t,o}}class dM extends on{constructor(t){super(t)}load(t,e,n,i){const r=new Hr;r.colorSpace=_n;const a=new Or(this.manager);a.setCrossOrigin(this.crossOrigin),a.setPath(this.path);let o=0;function l(c){a.load(t[c],function(h){r.images[c]=h,o++,o===6&&(r.needsUpdate=!0,e&&e(r))},void 0,i)}for(let c=0;c<t.length;++c)l(c);return r}}class fM extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=new Un,o=new ni(this.manager);return o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(r.withCredentials),o.load(t,function(l){let c;try{c=r.parse(l)}catch(h){if(i!==void 0)i(h);else{console.error(h);return}}c.image!==void 0?a.image=c.image:c.data!==void 0&&(a.image.width=c.width,a.image.height=c.height,a.image.data=c.data),a.wrapS=c.wrapS!==void 0?c.wrapS:vn,a.wrapT=c.wrapT!==void 0?c.wrapT:vn,a.magFilter=c.magFilter!==void 0?c.magFilter:Re,a.minFilter=c.minFilter!==void 0?c.minFilter:Re,a.anisotropy=c.anisotropy!==void 0?c.anisotropy:1,c.colorSpace!==void 0&&(a.colorSpace=c.colorSpace),c.flipY!==void 0&&(a.flipY=c.flipY),c.format!==void 0&&(a.format=c.format),c.type!==void 0&&(a.type=c.type),c.mipmaps!==void 0&&(a.mipmaps=c.mipmaps,a.minFilter=Ln),c.mipmapCount===1&&(a.minFilter=Re),c.generateMipmaps!==void 0&&(a.generateMipmaps=c.generateMipmaps),a.needsUpdate=!0,e&&e(a,c)},n,i),a}}class pM extends on{constructor(t){super(t)}load(t,e,n,i){const r=new ve,a=new Or(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,function(o){r.image=o,r.needsUpdate=!0,e!==void 0&&e(r)},n,i),r}}class Mi extends ee{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ft(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Mh extends Mi{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ee.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ft(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const cc=new Bt,Ju=new C,Qu=new C;class bh{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Q(512,512),this.map=null,this.mapPass=null,this.matrix=new Bt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Gr,this._frameExtents=new Q(1,1),this._viewportCount=1,this._viewports=[new te(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Ju.setFromMatrixPosition(t.matrixWorld),e.position.copy(Ju),Qu.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Qu),e.updateMatrixWorld(),cc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(cc),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(cc)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class mM extends bh{constructor(){super(new Ne(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){const e=this.camera,n=Fs*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height,r=t.distance||e.far;(n!==e.fov||i!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=i,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class vp extends Mi{constructor(t,e,n=0,i=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ee.DEFAULT_UP),this.updateMatrix(),this.target=new ee,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new mM}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const ju=new Bt,sr=new C,hc=new C;class gM extends bh{constructor(){super(new Ne(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Q(4,2),this._viewportCount=6,this._viewports=[new te(2,1,1,1),new te(0,1,1,1),new te(3,1,1,1),new te(1,1,1,1),new te(3,0,1,1),new te(1,0,1,1)],this._cubeDirections=[new C(1,0,0),new C(-1,0,0),new C(0,0,1),new C(0,0,-1),new C(0,1,0),new C(0,-1,0)],this._cubeUps=[new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,0,1),new C(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,i=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),sr.setFromMatrixPosition(t.matrixWorld),n.position.copy(sr),hc.copy(n.position),hc.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(hc),n.updateMatrixWorld(),i.makeTranslation(-sr.x,-sr.y,-sr.z),ju.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ju)}}class yp extends Mi{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new gM}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class _M extends bh{constructor(){super(new jo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Sh extends Mi{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ee.DEFAULT_UP),this.updateMatrix(),this.target=new ee,this.shadow=new _M}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Mp extends Mi{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class bp extends Mi{constructor(t,e,n=10,i=10){super(t,e),this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=n,this.height=i}get power(){return this.intensity*this.width*this.height*Math.PI}set power(t){this.intensity=t/(this.width*this.height*Math.PI)}copy(t){return super.copy(t),this.width=t.width,this.height=t.height,this}toJSON(t){const e=super.toJSON(t);return e.object.width=this.width,e.object.height=this.height,e}}class Sp{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let t=0;t<9;t++)this.coefficients.push(new C)}set(t){for(let e=0;e<9;e++)this.coefficients[e].copy(t[e]);return this}zero(){for(let t=0;t<9;t++)this.coefficients[t].set(0,0,0);return this}getAt(t,e){const n=t.x,i=t.y,r=t.z,a=this.coefficients;return e.copy(a[0]).multiplyScalar(.282095),e.addScaledVector(a[1],.488603*i),e.addScaledVector(a[2],.488603*r),e.addScaledVector(a[3],.488603*n),e.addScaledVector(a[4],1.092548*(n*i)),e.addScaledVector(a[5],1.092548*(i*r)),e.addScaledVector(a[6],.315392*(3*r*r-1)),e.addScaledVector(a[7],1.092548*(n*r)),e.addScaledVector(a[8],.546274*(n*n-i*i)),e}getIrradianceAt(t,e){const n=t.x,i=t.y,r=t.z,a=this.coefficients;return e.copy(a[0]).multiplyScalar(.886227),e.addScaledVector(a[1],2*.511664*i),e.addScaledVector(a[2],2*.511664*r),e.addScaledVector(a[3],2*.511664*n),e.addScaledVector(a[4],2*.429043*n*i),e.addScaledVector(a[5],2*.429043*i*r),e.addScaledVector(a[6],.743125*r*r-.247708),e.addScaledVector(a[7],2*.429043*n*r),e.addScaledVector(a[8],.429043*(n*n-i*i)),e}add(t){for(let e=0;e<9;e++)this.coefficients[e].add(t.coefficients[e]);return this}addScaledSH(t,e){for(let n=0;n<9;n++)this.coefficients[n].addScaledVector(t.coefficients[n],e);return this}scale(t){for(let e=0;e<9;e++)this.coefficients[e].multiplyScalar(t);return this}lerp(t,e){for(let n=0;n<9;n++)this.coefficients[n].lerp(t.coefficients[n],e);return this}equals(t){for(let e=0;e<9;e++)if(!this.coefficients[e].equals(t.coefficients[e]))return!1;return!0}copy(t){return this.set(t.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(t,e=0){const n=this.coefficients;for(let i=0;i<9;i++)n[i].fromArray(t,e+i*3);return this}toArray(t=[],e=0){const n=this.coefficients;for(let i=0;i<9;i++)n[i].toArray(t,e+i*3);return t}static getBasisAt(t,e){const n=t.x,i=t.y,r=t.z;e[0]=.282095,e[1]=.488603*i,e[2]=.488603*r,e[3]=.488603*n,e[4]=1.092548*n*i,e[5]=1.092548*i*r,e[6]=.315392*(3*r*r-1),e[7]=1.092548*n*r,e[8]=.546274*(n*n-i*i)}}class wp extends Mi{constructor(t=new Sp,e=1){super(void 0,e),this.isLightProbe=!0,this.sh=t}copy(t){return super.copy(t),this.sh.copy(t.sh),this}fromJSON(t){return this.intensity=t.intensity,this.sh.fromArray(t.sh),this}toJSON(t){const e=super.toJSON(t);return e.object.sh=this.sh.toArray(),e}}class _l extends on{constructor(t){super(t),this.textures={}}load(t,e,n,i){const r=this,a=new ni(r.manager);a.setPath(r.path),a.setRequestHeader(r.requestHeader),a.setWithCredentials(r.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):console.error(l),r.manager.itemError(t)}},n,i)}parse(t){const e=this.textures;function n(r){return e[r]===void 0&&console.warn("THREE.MaterialLoader: Undefined texture",r),e[r]}const i=this.createMaterialFromType(t.type);if(t.uuid!==void 0&&(i.uuid=t.uuid),t.name!==void 0&&(i.name=t.name),t.color!==void 0&&i.color!==void 0&&i.color.setHex(t.color),t.roughness!==void 0&&(i.roughness=t.roughness),t.metalness!==void 0&&(i.metalness=t.metalness),t.sheen!==void 0&&(i.sheen=t.sheen),t.sheenColor!==void 0&&(i.sheenColor=new ft().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(i.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&i.emissive!==void 0&&i.emissive.setHex(t.emissive),t.specular!==void 0&&i.specular!==void 0&&i.specular.setHex(t.specular),t.specularIntensity!==void 0&&(i.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&i.specularColor!==void 0&&i.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(i.shininess=t.shininess),t.clearcoat!==void 0&&(i.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(i.dispersion=t.dispersion),t.iridescence!==void 0&&(i.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(i.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(i.transmission=t.transmission),t.thickness!==void 0&&(i.thickness=t.thickness),t.attenuationDistance!==void 0&&(i.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&i.attenuationColor!==void 0&&i.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(i.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(i.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(i.fog=t.fog),t.flatShading!==void 0&&(i.flatShading=t.flatShading),t.blending!==void 0&&(i.blending=t.blending),t.combine!==void 0&&(i.combine=t.combine),t.side!==void 0&&(i.side=t.side),t.shadowSide!==void 0&&(i.shadowSide=t.shadowSide),t.opacity!==void 0&&(i.opacity=t.opacity),t.transparent!==void 0&&(i.transparent=t.transparent),t.alphaTest!==void 0&&(i.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(i.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(i.depthFunc=t.depthFunc),t.depthTest!==void 0&&(i.depthTest=t.depthTest),t.depthWrite!==void 0&&(i.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(i.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(i.blendSrc=t.blendSrc),t.blendDst!==void 0&&(i.blendDst=t.blendDst),t.blendEquation!==void 0&&(i.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(i.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(i.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(i.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&i.blendColor!==void 0&&i.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(i.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(i.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(i.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(i.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(i.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(i.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(i.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(i.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(i.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(i.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(i.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(i.rotation=t.rotation),t.linewidth!==void 0&&(i.linewidth=t.linewidth),t.dashSize!==void 0&&(i.dashSize=t.dashSize),t.gapSize!==void 0&&(i.gapSize=t.gapSize),t.scale!==void 0&&(i.scale=t.scale),t.polygonOffset!==void 0&&(i.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(i.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(i.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(i.dithering=t.dithering),t.alphaToCoverage!==void 0&&(i.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(i.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(i.forceSinglePass=t.forceSinglePass),t.visible!==void 0&&(i.visible=t.visible),t.toneMapped!==void 0&&(i.toneMapped=t.toneMapped),t.userData!==void 0&&(i.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?i.vertexColors=t.vertexColors>0:i.vertexColors=t.vertexColors),t.uniforms!==void 0)for(const r in t.uniforms){const a=t.uniforms[r];switch(i.uniforms[r]={},a.type){case"t":i.uniforms[r].value=n(a.value);break;case"c":i.uniforms[r].value=new ft().setHex(a.value);break;case"v2":i.uniforms[r].value=new Q().fromArray(a.value);break;case"v3":i.uniforms[r].value=new C().fromArray(a.value);break;case"v4":i.uniforms[r].value=new te().fromArray(a.value);break;case"m3":i.uniforms[r].value=new Yt().fromArray(a.value);break;case"m4":i.uniforms[r].value=new Bt().fromArray(a.value);break;default:i.uniforms[r].value=a.value}}if(t.defines!==void 0&&(i.defines=t.defines),t.vertexShader!==void 0&&(i.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(i.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(i.glslVersion=t.glslVersion),t.extensions!==void 0)for(const r in t.extensions)i.extensions[r]=t.extensions[r];if(t.lights!==void 0&&(i.lights=t.lights),t.clipping!==void 0&&(i.clipping=t.clipping),t.size!==void 0&&(i.size=t.size),t.sizeAttenuation!==void 0&&(i.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(i.map=n(t.map)),t.matcap!==void 0&&(i.matcap=n(t.matcap)),t.alphaMap!==void 0&&(i.alphaMap=n(t.alphaMap)),t.bumpMap!==void 0&&(i.bumpMap=n(t.bumpMap)),t.bumpScale!==void 0&&(i.bumpScale=t.bumpScale),t.normalMap!==void 0&&(i.normalMap=n(t.normalMap)),t.normalMapType!==void 0&&(i.normalMapType=t.normalMapType),t.normalScale!==void 0){let r=t.normalScale;Array.isArray(r)===!1&&(r=[r,r]),i.normalScale=new Q().fromArray(r)}return t.displacementMap!==void 0&&(i.displacementMap=n(t.displacementMap)),t.displacementScale!==void 0&&(i.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(i.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(i.roughnessMap=n(t.roughnessMap)),t.metalnessMap!==void 0&&(i.metalnessMap=n(t.metalnessMap)),t.emissiveMap!==void 0&&(i.emissiveMap=n(t.emissiveMap)),t.emissiveIntensity!==void 0&&(i.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(i.specularMap=n(t.specularMap)),t.specularIntensityMap!==void 0&&(i.specularIntensityMap=n(t.specularIntensityMap)),t.specularColorMap!==void 0&&(i.specularColorMap=n(t.specularColorMap)),t.envMap!==void 0&&(i.envMap=n(t.envMap)),t.envMapRotation!==void 0&&i.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(i.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(i.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(i.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(i.lightMap=n(t.lightMap)),t.lightMapIntensity!==void 0&&(i.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(i.aoMap=n(t.aoMap)),t.aoMapIntensity!==void 0&&(i.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(i.gradientMap=n(t.gradientMap)),t.clearcoatMap!==void 0&&(i.clearcoatMap=n(t.clearcoatMap)),t.clearcoatRoughnessMap!==void 0&&(i.clearcoatRoughnessMap=n(t.clearcoatRoughnessMap)),t.clearcoatNormalMap!==void 0&&(i.clearcoatNormalMap=n(t.clearcoatNormalMap)),t.clearcoatNormalScale!==void 0&&(i.clearcoatNormalScale=new Q().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(i.iridescenceMap=n(t.iridescenceMap)),t.iridescenceThicknessMap!==void 0&&(i.iridescenceThicknessMap=n(t.iridescenceThicknessMap)),t.transmissionMap!==void 0&&(i.transmissionMap=n(t.transmissionMap)),t.thicknessMap!==void 0&&(i.thicknessMap=n(t.thicknessMap)),t.anisotropyMap!==void 0&&(i.anisotropyMap=n(t.anisotropyMap)),t.sheenColorMap!==void 0&&(i.sheenColorMap=n(t.sheenColorMap)),t.sheenRoughnessMap!==void 0&&(i.sheenRoughnessMap=n(t.sheenRoughnessMap)),i}setTextures(t){return this.textures=t,this}createMaterialFromType(t){return _l.createMaterialFromType(t)}static createMaterialFromType(t){const e={ShadowMaterial:rp,SpriteMaterial:rh,RawShaderMaterial:ap,ShaderMaterial:an,PointsMaterial:oh,MeshPhysicalMaterial:op,MeshStandardMaterial:gh,MeshPhongMaterial:lp,MeshToonMaterial:ns,MeshNormalMaterial:cp,MeshLambertMaterial:hp,MeshDepthMaterial:nh,MeshDistanceMaterial:ih,MeshBasicMaterial:he,MeshMatcapMaterial:up,LineDashedMaterial:dp,LineBasicMaterial:ze,Material:Xe};return new e[t]}}class Lc{static decodeText(t){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(t);let e="";for(let n=0,i=t.length;n<i;n++)e+=String.fromCharCode(t[n]);try{return decodeURIComponent(escape(e))}catch{return e}}static extractUrlBase(t){const e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}}class Ap extends Xt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){const t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}}class Tp extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=new ni(r.manager);a.setPath(r.path),a.setRequestHeader(r.requestHeader),a.setWithCredentials(r.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):console.error(l),r.manager.itemError(t)}},n,i)}parse(t){const e={},n={};function i(f,m){if(e[m]!==void 0)return e[m];const p=f.interleavedBuffers[m],g=r(f,p.buffer),v=Cs(p.type,g),x=new nl(v,p.stride);return x.uuid=p.uuid,e[m]=x,x}function r(f,m){if(n[m]!==void 0)return n[m];const p=f.arrayBuffers[m],g=new Uint32Array(p).buffer;return n[m]=g,g}const a=t.isInstancedBufferGeometry?new Ap:new Xt,o=t.data.index;if(o!==void 0){const f=Cs(o.type,o.array);a.setIndex(new se(f,1))}const l=t.data.attributes;for(const f in l){const m=l[f];let _;if(m.isInterleavedBufferAttribute){const p=i(t.data,m.data);_=new ts(p,m.itemSize,m.offset,m.normalized)}else{const p=Cs(m.type,m.array),g=m.isInstancedBufferAttribute?Bs:se;_=new g(p,m.itemSize,m.normalized)}m.name!==void 0&&(_.name=m.name),m.usage!==void 0&&_.setUsage(m.usage),a.setAttribute(f,_)}const c=t.data.morphAttributes;if(c)for(const f in c){const m=c[f],_=[];for(let p=0,g=m.length;p<g;p++){const v=m[p];let x;if(v.isInterleavedBufferAttribute){const y=i(t.data,v.data);x=new ts(y,v.itemSize,v.offset,v.normalized)}else{const y=Cs(v.type,v.array);x=new se(y,v.itemSize,v.normalized)}v.name!==void 0&&(x.name=v.name),_.push(x)}a.morphAttributes[f]=_}t.data.morphTargetsRelative&&(a.morphTargetsRelative=!0);const d=t.data.groups||t.data.drawcalls||t.data.offsets;if(d!==void 0)for(let f=0,m=d.length;f!==m;++f){const _=d[f];a.addGroup(_.start,_.count,_.materialIndex)}const u=t.data.boundingSphere;if(u!==void 0){const f=new C;u.center!==void 0&&f.fromArray(u.center),a.boundingSphere=new We(f,u.radius)}return t.name&&(a.name=t.name),t.userData&&(a.userData=t.userData),a}}class xM extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=this.path===""?Lc.extractUrlBase(t):this.path;this.resourcePath=this.resourcePath||a;const o=new ni(this.manager);o.setPath(this.path),o.setRequestHeader(this.requestHeader),o.setWithCredentials(this.withCredentials),o.load(t,function(l){let c=null;try{c=JSON.parse(l)}catch(d){i!==void 0&&i(d),console.error("THREE:ObjectLoader: Can't parse "+t+".",d.message);return}const h=c.metadata;if(h===void 0||h.type===void 0||h.type.toLowerCase()==="geometry"){i!==void 0&&i(new Error("THREE.ObjectLoader: Can't load "+t)),console.error("THREE.ObjectLoader: Can't load "+t);return}r.parse(c,e)},n,i)}async loadAsync(t,e){const n=this,i=this.path===""?Lc.extractUrlBase(t):this.path;this.resourcePath=this.resourcePath||i;const r=new ni(this.manager);r.setPath(this.path),r.setRequestHeader(this.requestHeader),r.setWithCredentials(this.withCredentials);const a=await r.loadAsync(t,e),o=JSON.parse(a),l=o.metadata;if(l===void 0||l.type===void 0||l.type.toLowerCase()==="geometry")throw new Error("THREE.ObjectLoader: Can't load "+t);return await n.parseAsync(o)}parse(t,e){const n=this.parseAnimations(t.animations),i=this.parseShapes(t.shapes),r=this.parseGeometries(t.geometries,i),a=this.parseImages(t.images,function(){e!==void 0&&e(c)}),o=this.parseTextures(t.textures,a),l=this.parseMaterials(t.materials,o),c=this.parseObject(t.object,r,l,o,n),h=this.parseSkeletons(t.skeletons,c);if(this.bindSkeletons(c,h),this.bindLightTargets(c),e!==void 0){let d=!1;for(const u in a)if(a[u].data instanceof HTMLImageElement){d=!0;break}d===!1&&e(c)}return c}async parseAsync(t){const e=this.parseAnimations(t.animations),n=this.parseShapes(t.shapes),i=this.parseGeometries(t.geometries,n),r=await this.parseImagesAsync(t.images),a=this.parseTextures(t.textures,r),o=this.parseMaterials(t.materials,a),l=this.parseObject(t.object,i,o,a,e),c=this.parseSkeletons(t.skeletons,l);return this.bindSkeletons(l,c),this.bindLightTargets(l),l}parseShapes(t){const e={};if(t!==void 0)for(let n=0,i=t.length;n<i;n++){const r=new Ki().fromJSON(t[n]);e[r.uuid]=r}return e}parseSkeletons(t,e){const n={},i={};if(e.traverse(function(r){r.isBone&&(i[r.uuid]=r)}),t!==void 0)for(let r=0,a=t.length;r<a;r++){const o=new il().fromJSON(t[r],i);n[o.uuid]=o}return n}parseGeometries(t,e){const n={};if(t!==void 0){const i=new Tp;for(let r=0,a=t.length;r<a;r++){let o;const l=t[r];switch(l.type){case"BufferGeometry":case"InstancedBufferGeometry":o=i.parse(l);break;default:l.type in Ku?o=Ku[l.type].fromJSON(l,e):console.warn(`THREE.ObjectLoader: Unsupported geometry type "${l.type}"`)}o.uuid=l.uuid,l.name!==void 0&&(o.name=l.name),l.userData!==void 0&&(o.userData=l.userData),n[l.uuid]=o}}return n}parseMaterials(t,e){const n={},i={};if(t!==void 0){const r=new _l;r.setTextures(e);for(let a=0,o=t.length;a<o;a++){const l=t[a];n[l.uuid]===void 0&&(n[l.uuid]=r.parse(l)),i[l.uuid]=n[l.uuid]}}return i}parseAnimations(t){const e={};if(t!==void 0)for(let n=0;n<t.length;n++){const i=t[n],r=Fr.parse(i);e[r.uuid]=r}return e}parseImages(t,e){const n=this,i={};let r;function a(l){return n.manager.itemStart(l),r.load(l,function(){n.manager.itemEnd(l)},void 0,function(){n.manager.itemError(l),n.manager.itemEnd(l)})}function o(l){if(typeof l=="string"){const c=l,h=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c)?c:n.resourcePath+c;return a(h)}else return l.data?{data:Cs(l.type,l.data),width:l.width,height:l.height}:null}if(t!==void 0&&t.length>0){const l=new yh(e);r=new Or(l),r.setCrossOrigin(this.crossOrigin);for(let c=0,h=t.length;c<h;c++){const d=t[c],u=d.url;if(Array.isArray(u)){const f=[];for(let m=0,_=u.length;m<_;m++){const p=u[m],g=o(p);g!==null&&(g instanceof HTMLImageElement?f.push(g):f.push(new Un(g.data,g.width,g.height)))}i[d.uuid]=new Wi(f)}else{const f=o(d.url);i[d.uuid]=new Wi(f)}}}return i}async parseImagesAsync(t){const e=this,n={};let i;async function r(a){if(typeof a=="string"){const o=a,l=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(o)?o:e.resourcePath+o;return await i.loadAsync(l)}else return a.data?{data:Cs(a.type,a.data),width:a.width,height:a.height}:null}if(t!==void 0&&t.length>0){i=new Or(this.manager),i.setCrossOrigin(this.crossOrigin);for(let a=0,o=t.length;a<o;a++){const l=t[a],c=l.url;if(Array.isArray(c)){const h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d],m=await r(f);m!==null&&(m instanceof HTMLImageElement?h.push(m):h.push(new Un(m.data,m.width,m.height)))}n[l.uuid]=new Wi(h)}else{const h=await r(l.url);n[l.uuid]=new Wi(h)}}}return n}parseTextures(t,e){function n(r,a){return typeof r=="number"?r:(console.warn("THREE.ObjectLoader.parseTexture: Constant should be in numeric form.",r),a[r])}const i={};if(t!==void 0)for(let r=0,a=t.length;r<a;r++){const o=t[r];o.image===void 0&&console.warn('THREE.ObjectLoader: No "image" specified for',o.uuid),e[o.image]===void 0&&console.warn("THREE.ObjectLoader: Undefined image",o.image);const l=e[o.image],c=l.data;let h;Array.isArray(c)?(h=new Hr,c.length===6&&(h.needsUpdate=!0)):(c&&c.data?h=new Un:h=new ve,c&&(h.needsUpdate=!0)),h.source=l,h.uuid=o.uuid,o.name!==void 0&&(h.name=o.name),o.mapping!==void 0&&(h.mapping=n(o.mapping,vM)),o.channel!==void 0&&(h.channel=o.channel),o.offset!==void 0&&h.offset.fromArray(o.offset),o.repeat!==void 0&&h.repeat.fromArray(o.repeat),o.center!==void 0&&h.center.fromArray(o.center),o.rotation!==void 0&&(h.rotation=o.rotation),o.wrap!==void 0&&(h.wrapS=n(o.wrap[0],td),h.wrapT=n(o.wrap[1],td)),o.format!==void 0&&(h.format=o.format),o.internalFormat!==void 0&&(h.internalFormat=o.internalFormat),o.type!==void 0&&(h.type=o.type),o.colorSpace!==void 0&&(h.colorSpace=o.colorSpace),o.minFilter!==void 0&&(h.minFilter=n(o.minFilter,ed)),o.magFilter!==void 0&&(h.magFilter=n(o.magFilter,ed)),o.anisotropy!==void 0&&(h.anisotropy=o.anisotropy),o.flipY!==void 0&&(h.flipY=o.flipY),o.generateMipmaps!==void 0&&(h.generateMipmaps=o.generateMipmaps),o.premultiplyAlpha!==void 0&&(h.premultiplyAlpha=o.premultiplyAlpha),o.unpackAlignment!==void 0&&(h.unpackAlignment=o.unpackAlignment),o.compareFunction!==void 0&&(h.compareFunction=o.compareFunction),o.userData!==void 0&&(h.userData=o.userData),i[o.uuid]=h}return i}parseObject(t,e,n,i,r){let a;function o(u){return e[u]===void 0&&console.warn("THREE.ObjectLoader: Undefined geometry",u),e[u]}function l(u){if(u!==void 0){if(Array.isArray(u)){const f=[];for(let m=0,_=u.length;m<_;m++){const p=u[m];n[p]===void 0&&console.warn("THREE.ObjectLoader: Undefined material",p),f.push(n[p])}return f}return n[u]===void 0&&console.warn("THREE.ObjectLoader: Undefined material",u),n[u]}}function c(u){return i[u]===void 0&&console.warn("THREE.ObjectLoader: Undefined texture",u),i[u]}let h,d;switch(t.type){case"Scene":a=new sh,t.background!==void 0&&(Number.isInteger(t.background)?a.background=new ft(t.background):a.background=c(t.background)),t.environment!==void 0&&(a.environment=c(t.environment)),t.fog!==void 0&&(t.fog.type==="Fog"?a.fog=new Wr(t.fog.color,t.fog.near,t.fog.far):t.fog.type==="FogExp2"&&(a.fog=new el(t.fog.color,t.fog.density)),t.fog.name!==""&&(a.fog.name=t.fog.name)),t.backgroundBlurriness!==void 0&&(a.backgroundBlurriness=t.backgroundBlurriness),t.backgroundIntensity!==void 0&&(a.backgroundIntensity=t.backgroundIntensity),t.backgroundRotation!==void 0&&a.backgroundRotation.fromArray(t.backgroundRotation),t.environmentIntensity!==void 0&&(a.environmentIntensity=t.environmentIntensity),t.environmentRotation!==void 0&&a.environmentRotation.fromArray(t.environmentRotation);break;case"PerspectiveCamera":a=new Ne(t.fov,t.aspect,t.near,t.far),t.focus!==void 0&&(a.focus=t.focus),t.zoom!==void 0&&(a.zoom=t.zoom),t.filmGauge!==void 0&&(a.filmGauge=t.filmGauge),t.filmOffset!==void 0&&(a.filmOffset=t.filmOffset),t.view!==void 0&&(a.view=Object.assign({},t.view));break;case"OrthographicCamera":a=new jo(t.left,t.right,t.top,t.bottom,t.near,t.far),t.zoom!==void 0&&(a.zoom=t.zoom),t.view!==void 0&&(a.view=Object.assign({},t.view));break;case"AmbientLight":a=new Mp(t.color,t.intensity);break;case"DirectionalLight":a=new Sh(t.color,t.intensity),a.target=t.target||"";break;case"PointLight":a=new yp(t.color,t.intensity,t.distance,t.decay);break;case"RectAreaLight":a=new bp(t.color,t.intensity,t.width,t.height);break;case"SpotLight":a=new vp(t.color,t.intensity,t.distance,t.angle,t.penumbra,t.decay),a.target=t.target||"";break;case"HemisphereLight":a=new Mh(t.color,t.groundColor,t.intensity);break;case"LightProbe":a=new wp().fromJSON(t);break;case"SkinnedMesh":h=o(t.geometry),d=l(t.material),a=new qf(h,d),t.bindMode!==void 0&&(a.bindMode=t.bindMode),t.bindMatrix!==void 0&&a.bindMatrix.fromArray(t.bindMatrix),t.skeleton!==void 0&&(a.skeleton=t.skeleton);break;case"Mesh":h=o(t.geometry),d=l(t.material),a=new at(h,d);break;case"InstancedMesh":h=o(t.geometry),d=l(t.material);const u=t.count,f=t.instanceMatrix,m=t.instanceColor;a=new Yf(h,d,u),a.instanceMatrix=new Bs(new Float32Array(f.array),16),m!==void 0&&(a.instanceColor=new Bs(new Float32Array(m.array),m.itemSize));break;case"BatchedMesh":h=o(t.geometry),d=l(t.material),a=new Zf(t.maxInstanceCount,t.maxVertexCount,t.maxIndexCount,d),a.geometry=h,a.perObjectFrustumCulled=t.perObjectFrustumCulled,a.sortObjects=t.sortObjects,a._drawRanges=t.drawRanges,a._reservedRanges=t.reservedRanges,a._visibility=t.visibility,a._active=t.active,a._bounds=t.bounds.map(_=>{const p=new Ke;p.min.fromArray(_.boxMin),p.max.fromArray(_.boxMax);const g=new We;return g.radius=_.sphereRadius,g.center.fromArray(_.sphereCenter),{boxInitialized:_.boxInitialized,box:p,sphereInitialized:_.sphereInitialized,sphere:g}}),a._maxInstanceCount=t.maxInstanceCount,a._maxVertexCount=t.maxVertexCount,a._maxIndexCount=t.maxIndexCount,a._geometryInitialized=t.geometryInitialized,a._geometryCount=t.geometryCount,a._matricesTexture=c(t.matricesTexture.uuid),t.colorsTexture!==void 0&&(a._colorsTexture=c(t.colorsTexture.uuid));break;case"LOD":a=new Xf;break;case"Line":a=new Bn(o(t.geometry),l(t.material));break;case"LineLoop":a=new $f(o(t.geometry),l(t.material));break;case"LineSegments":a=new kn(o(t.geometry),l(t.material));break;case"PointCloud":case"Points":a=new lh(o(t.geometry),l(t.material));break;case"Sprite":a=new Wf(l(t.material));break;case"Group":a=new pe;break;case"Bone":a=new ah;break;default:a=new ee}if(a.uuid=t.uuid,t.name!==void 0&&(a.name=t.name),t.matrix!==void 0?(a.matrix.fromArray(t.matrix),t.matrixAutoUpdate!==void 0&&(a.matrixAutoUpdate=t.matrixAutoUpdate),a.matrixAutoUpdate&&a.matrix.decompose(a.position,a.quaternion,a.scale)):(t.position!==void 0&&a.position.fromArray(t.position),t.rotation!==void 0&&a.rotation.fromArray(t.rotation),t.quaternion!==void 0&&a.quaternion.fromArray(t.quaternion),t.scale!==void 0&&a.scale.fromArray(t.scale)),t.up!==void 0&&a.up.fromArray(t.up),t.castShadow!==void 0&&(a.castShadow=t.castShadow),t.receiveShadow!==void 0&&(a.receiveShadow=t.receiveShadow),t.shadow&&(t.shadow.intensity!==void 0&&(a.shadow.intensity=t.shadow.intensity),t.shadow.bias!==void 0&&(a.shadow.bias=t.shadow.bias),t.shadow.normalBias!==void 0&&(a.shadow.normalBias=t.shadow.normalBias),t.shadow.radius!==void 0&&(a.shadow.radius=t.shadow.radius),t.shadow.mapSize!==void 0&&a.shadow.mapSize.fromArray(t.shadow.mapSize),t.shadow.camera!==void 0&&(a.shadow.camera=this.parseObject(t.shadow.camera))),t.visible!==void 0&&(a.visible=t.visible),t.frustumCulled!==void 0&&(a.frustumCulled=t.frustumCulled),t.renderOrder!==void 0&&(a.renderOrder=t.renderOrder),t.userData!==void 0&&(a.userData=t.userData),t.layers!==void 0&&(a.layers.mask=t.layers),t.children!==void 0){const u=t.children;for(let f=0;f<u.length;f++)a.add(this.parseObject(u[f],e,n,i,r))}if(t.animations!==void 0){const u=t.animations;for(let f=0;f<u.length;f++){const m=u[f];a.animations.push(r[m])}}if(t.type==="LOD"){t.autoUpdate!==void 0&&(a.autoUpdate=t.autoUpdate);const u=t.levels;for(let f=0;f<u.length;f++){const m=u[f],_=a.getObjectByProperty("uuid",m.object);_!==void 0&&a.addLevel(_,m.distance,m.hysteresis)}}return a}bindSkeletons(t,e){Object.keys(e).length!==0&&t.traverse(function(n){if(n.isSkinnedMesh===!0&&n.skeleton!==void 0){const i=e[n.skeleton];i===void 0?console.warn("THREE.ObjectLoader: No skeleton found with UUID:",n.skeleton):n.bind(i,n.bindMatrix)}})}bindLightTargets(t){t.traverse(function(e){if(e.isDirectionalLight||e.isSpotLight){const n=e.target,i=t.getObjectByProperty("uuid",n);i!==void 0?e.target=i:e.target=new ee}})}}const vM={UVMapping:Vo,CubeReflectionMapping:ti,CubeRefractionMapping:_i,EquirectangularReflectionMapping:xr,EquirectangularRefractionMapping:vr,CubeUVReflectionMapping:ks},td={RepeatWrapping:yr,ClampToEdgeWrapping:vn,MirroredRepeatWrapping:Mr},ed={NearestFilter:Fe,NearestMipmapNearestFilter:Bc,NearestMipmapLinearFilter:Es,LinearFilter:Re,LinearMipmapNearestFilter:lr,LinearMipmapLinearFilter:Ln};class yM extends on{constructor(t){super(t),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(t){return this.options=t,this}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const r=this,a=Kn.get(t);if(a!==void 0){if(r.manager.itemStart(t),a.then){a.then(c=>{e&&e(c),r.manager.itemEnd(t)}).catch(c=>{i&&i(c)});return}return setTimeout(function(){e&&e(a),r.manager.itemEnd(t)},0),a}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;const l=fetch(t,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){return Kn.add(t,c),e&&e(c),r.manager.itemEnd(t),c}).catch(function(c){i&&i(c),Kn.remove(t),r.manager.itemError(t),r.manager.itemEnd(t)});Kn.add(t,l),r.manager.itemStart(t)}}let Na;class wh{static getContext(){return Na===void 0&&(Na=new(window.AudioContext||window.webkitAudioContext)),Na}static setContext(t){Na=t}}class MM extends on{constructor(t){super(t)}load(t,e,n,i){const r=this,a=new ni(this.manager);a.setResponseType("arraybuffer"),a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(t,function(l){try{const c=l.slice(0);wh.getContext().decodeAudioData(c,function(d){e(d)}).catch(o)}catch(c){o(c)}},n,i);function o(l){i?i(l):console.error(l),r.manager.itemError(t)}}}const nd=new Bt,id=new Bt,Pi=new Bt;class bM{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new Ne,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new Ne,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(t){const e=this._cache;if(e.focus!==t.focus||e.fov!==t.fov||e.aspect!==t.aspect*this.aspect||e.near!==t.near||e.far!==t.far||e.zoom!==t.zoom||e.eyeSep!==this.eyeSep){e.focus=t.focus,e.fov=t.fov,e.aspect=t.aspect*this.aspect,e.near=t.near,e.far=t.far,e.zoom=t.zoom,e.eyeSep=this.eyeSep,Pi.copy(t.projectionMatrix);const i=e.eyeSep/2,r=i*e.near/e.focus,a=e.near*Math.tan($i*e.fov*.5)/e.zoom;let o,l;id.elements[12]=-i,nd.elements[12]=i,o=-a*e.aspect+r,l=a*e.aspect+r,Pi.elements[0]=2*e.near/(l-o),Pi.elements[8]=(l+o)/(l-o),this.cameraL.projectionMatrix.copy(Pi),o=-a*e.aspect-r,l=a*e.aspect-r,Pi.elements[0]=2*e.near/(l-o),Pi.elements[8]=(l+o)/(l-o),this.cameraR.projectionMatrix.copy(Pi)}this.cameraL.matrixWorld.copy(t.matrixWorld).multiply(id),this.cameraR.matrixWorld.copy(t.matrixWorld).multiply(nd)}}class Ah{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=sd(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=sd();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function sd(){return performance.now()}const Ii=new C,rd=new sn,SM=new C,Li=new C;class wM extends ee{constructor(){super(),this.type="AudioListener",this.context=wh.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._clock=new Ah}getInput(){return this.gain}removeFilter(){return this.filter!==null&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this}getFilter(){return this.filter}setFilter(t){return this.filter!==null?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=t,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this}updateMatrixWorld(t){super.updateMatrixWorld(t);const e=this.context.listener,n=this.up;if(this.timeDelta=this._clock.getDelta(),this.matrixWorld.decompose(Ii,rd,SM),Li.set(0,0,-1).applyQuaternion(rd),e.positionX){const i=this.context.currentTime+this.timeDelta;e.positionX.linearRampToValueAtTime(Ii.x,i),e.positionY.linearRampToValueAtTime(Ii.y,i),e.positionZ.linearRampToValueAtTime(Ii.z,i),e.forwardX.linearRampToValueAtTime(Li.x,i),e.forwardY.linearRampToValueAtTime(Li.y,i),e.forwardZ.linearRampToValueAtTime(Li.z,i),e.upX.linearRampToValueAtTime(n.x,i),e.upY.linearRampToValueAtTime(n.y,i),e.upZ.linearRampToValueAtTime(n.z,i)}else e.setPosition(Ii.x,Ii.y,Ii.z),e.setOrientation(Li.x,Li.y,Li.z,n.x,n.y,n.z)}}class Ep extends ee{constructor(t){super(),this.type="Audio",this.listener=t,this.context=t.context,this.gain=this.context.createGain(),this.gain.connect(t.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(t){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=t,this.connect(),this}setMediaElementSource(t){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(t),this.connect(),this}setMediaStreamSource(t){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(t),this.connect(),this}setBuffer(t){return this.buffer=t,this.sourceType="buffer",this.autoplay&&this.play(),this}play(t=0){if(this.isPlaying===!0){console.warn("THREE.Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){console.warn("THREE.Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+t;const e=this.context.createBufferSource();return e.buffer=this.buffer,e.loop=this.loop,e.loopStart=this.loopStart,e.loopEnd=this.loopEnd,e.onended=this.onEnded.bind(this),e.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=e,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){console.warn("THREE.Audio: this Audio has no playback control.");return}return this.isPlaying===!0&&(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0&&(this._progress=this._progress%(this.duration||this.buffer.duration)),this.source.stop(),this.source.onended=null,this.isPlaying=!1),this}stop(t=0){if(this.hasPlaybackControl===!1){console.warn("THREE.Audio: this Audio has no playback control.");return}return this._progress=0,this.source!==null&&(this.source.stop(this.context.currentTime+t),this.source.onended=null),this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let t=1,e=this.filters.length;t<e;t++)this.filters[t-1].connect(this.filters[t]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected!==!1){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let t=1,e=this.filters.length;t<e;t++)this.filters[t-1].disconnect(this.filters[t]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}}getFilters(){return this.filters}setFilters(t){return t||(t=[]),this._connected===!0?(this.disconnect(),this.filters=t.slice(),this.connect()):this.filters=t.slice(),this}setDetune(t){return this.detune=t,this.isPlaying===!0&&this.source.detune!==void 0&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(t){return this.setFilters(t?[t]:[])}setPlaybackRate(t){if(this.hasPlaybackControl===!1){console.warn("THREE.Audio: this Audio has no playback control.");return}return this.playbackRate=t,this.isPlaying===!0&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1}getLoop(){return this.hasPlaybackControl===!1?(console.warn("THREE.Audio: this Audio has no playback control."),!1):this.loop}setLoop(t){if(this.hasPlaybackControl===!1){console.warn("THREE.Audio: this Audio has no playback control.");return}return this.loop=t,this.isPlaying===!0&&(this.source.loop=this.loop),this}setLoopStart(t){return this.loopStart=t,this}setLoopEnd(t){return this.loopEnd=t,this}getVolume(){return this.gain.gain.value}setVolume(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this}}const Di=new C,ad=new sn,AM=new C,Ui=new C;class TM extends Ep{constructor(t){super(t),this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){super.connect(),this.panner.connect(this.gain)}disconnect(){super.disconnect(),this.panner.disconnect(this.gain)}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(t){return this.panner.refDistance=t,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(t){return this.panner.rolloffFactor=t,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(t){return this.panner.distanceModel=t,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(t){return this.panner.maxDistance=t,this}setDirectionalCone(t,e,n){return this.panner.coneInnerAngle=t,this.panner.coneOuterAngle=e,this.panner.coneOuterGain=n,this}updateMatrixWorld(t){if(super.updateMatrixWorld(t),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(Di,ad,AM),Ui.set(0,0,1).applyQuaternion(ad);const e=this.panner;if(e.positionX){const n=this.context.currentTime+this.listener.timeDelta;e.positionX.linearRampToValueAtTime(Di.x,n),e.positionY.linearRampToValueAtTime(Di.y,n),e.positionZ.linearRampToValueAtTime(Di.z,n),e.orientationX.linearRampToValueAtTime(Ui.x,n),e.orientationY.linearRampToValueAtTime(Ui.y,n),e.orientationZ.linearRampToValueAtTime(Ui.z,n)}else e.setPosition(Di.x,Di.y,Di.z),e.setOrientation(Ui.x,Ui.y,Ui.z)}}class EM{constructor(t,e=2048){this.analyser=t.context.createAnalyser(),this.analyser.fftSize=e,this.data=new Uint8Array(this.analyser.frequencyBinCount),t.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let t=0;const e=this.getFrequencyData();for(let n=0;n<e.length;n++)t+=e[n];return t/e.length}}class Cp{constructor(t,e,n){this.binding=t,this.valueSize=n;let i,r,a;switch(e){case"quaternion":i=this._slerp,r=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(t,e){const n=this.buffer,i=this.valueSize,r=t*i+i;let a=this.cumulativeWeight;if(a===0){for(let o=0;o!==i;++o)n[r+o]=n[o];a=e}else{a+=e;const o=e/a;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=a}accumulateAdditive(t){const e=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(e,i,0,t,n),this.cumulativeWeightAdditive+=t}apply(t){const e=this.valueSize,n=this.buffer,i=t*e+e,r=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){const l=e*this._origIndex;this._mixBufferRegion(n,i,l,1-r,e)}a>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*e,1,e);for(let l=e,c=e+e;l!==c;++l)if(n[l]!==n[l+e]){o.setValue(n,i);break}}saveOriginalState(){const t=this.binding,e=this.buffer,n=this.valueSize,i=n*this._origIndex;t.getValue(e,i);for(let r=n,a=i;r!==a;++r)e[r]=e[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const t=this.valueSize*3;this.binding.setValue(this.buffer,t)}_setAdditiveIdentityNumeric(){const t=this._addIndex*this.valueSize,e=t+this.valueSize;for(let n=t;n<e;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const t=this._origIndex*this.valueSize,e=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[e+n]=this.buffer[t+n]}_select(t,e,n,i,r){if(i>=.5)for(let a=0;a!==r;++a)t[e+a]=t[n+a]}_slerp(t,e,n,i){sn.slerpFlat(t,e,t,e,t,n,i)}_slerpAdditive(t,e,n,i,r){const a=this._workIndex*r;sn.multiplyQuaternionsFlat(t,a,t,e,t,n),sn.slerpFlat(t,e,t,e,t,a,i)}_lerp(t,e,n,i,r){const a=1-i;for(let o=0;o!==r;++o){const l=e+o;t[l]=t[l]*a+t[n+o]*i}}_lerpAdditive(t,e,n,i,r){for(let a=0;a!==r;++a){const o=e+a;t[o]=t[o]+t[n+a]*i}}}const Th="\\[\\]\\.:\\/",CM=new RegExp("["+Th+"]","g"),Eh="[^"+Th+"]",RM="[^"+Th.replace("\\.","")+"]",PM=/((?:WC+[\/:])*)/.source.replace("WC",Eh),IM=/(WCOD+)?/.source.replace("WCOD",RM),LM=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Eh),DM=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Eh),UM=new RegExp("^"+PM+IM+LM+DM+"$"),NM=["material","materials","bones","map"];class FM{constructor(t,e,n){const i=n||jt.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(t,e)}bind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){const t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}}class jt{constructor(t,e,n){this.path=e,this.parsedPath=n||jt.parseTrackName(e),this.node=jt.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new jt.Composite(t,e,n):new jt(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(CM,"")}static parseTrackName(t){const e=UM.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);const n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const r=n.nodeName.substring(i+1);NM.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){const n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){const n=function(r){for(let a=0;a<r.length;a++){const o=r[a];if(o.name===e||o.uuid===e)return o;const l=n(o.children);if(l)return l}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node;const e=this.parsedPath,n=e.objectName,i=e.propertyName;let r=e.propertyIndex;if(t||(t=jt.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}const a=t[i];if(a===void 0){const c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}jt.Composite=FM;jt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};jt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};jt.prototype.GetterByBindingType=[jt.prototype._getValue_direct,jt.prototype._getValue_array,jt.prototype._getValue_arrayElement,jt.prototype._getValue_toArray];jt.prototype.SetterByBindingTypeAndVersioning=[[jt.prototype._setValue_direct,jt.prototype._setValue_direct_setNeedsUpdate,jt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_array,jt.prototype._setValue_array_setNeedsUpdate,jt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_arrayElement,jt.prototype._setValue_arrayElement_setNeedsUpdate,jt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_fromArray,jt.prototype._setValue_fromArray_setNeedsUpdate,jt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class OM{constructor(){this.isAnimationObjectGroup=!0,this.uuid=fn(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;const t={};this._indicesByUUID=t;for(let n=0,i=arguments.length;n!==i;++n)t[arguments[n].uuid]=n;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};const e=this;this.stats={objects:{get total(){return e._objects.length},get inUse(){return this.total-e.nCachedObjects_}},get bindingsPerObject(){return e._bindings.length}}}add(){const t=this._objects,e=this._indicesByUUID,n=this._paths,i=this._parsedPaths,r=this._bindings,a=r.length;let o,l=t.length,c=this.nCachedObjects_;for(let h=0,d=arguments.length;h!==d;++h){const u=arguments[h],f=u.uuid;let m=e[f];if(m===void 0){m=l++,e[f]=m,t.push(u);for(let _=0,p=a;_!==p;++_)r[_].push(new jt(u,n[_],i[_]))}else if(m<c){o=t[m];const _=--c,p=t[_];e[p.uuid]=m,t[m]=p,e[f]=_,t[_]=u;for(let g=0,v=a;g!==v;++g){const x=r[g],y=x[_];let E=x[m];x[m]=y,E===void 0&&(E=new jt(u,n[g],i[g])),x[_]=E}}else t[m]!==o&&console.error("THREE.AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=c}remove(){const t=this._objects,e=this._indicesByUUID,n=this._bindings,i=n.length;let r=this.nCachedObjects_;for(let a=0,o=arguments.length;a!==o;++a){const l=arguments[a],c=l.uuid,h=e[c];if(h!==void 0&&h>=r){const d=r++,u=t[d];e[u.uuid]=h,t[h]=u,e[c]=d,t[d]=l;for(let f=0,m=i;f!==m;++f){const _=n[f],p=_[d],g=_[h];_[h]=p,_[d]=g}}}this.nCachedObjects_=r}uncache(){const t=this._objects,e=this._indicesByUUID,n=this._bindings,i=n.length;let r=this.nCachedObjects_,a=t.length;for(let o=0,l=arguments.length;o!==l;++o){const c=arguments[o],h=c.uuid,d=e[h];if(d!==void 0)if(delete e[h],d<r){const u=--r,f=t[u],m=--a,_=t[m];e[f.uuid]=d,t[d]=f,e[_.uuid]=u,t[u]=_,t.pop();for(let p=0,g=i;p!==g;++p){const v=n[p],x=v[u],y=v[m];v[d]=x,v[u]=y,v.pop()}}else{const u=--a,f=t[u];u>0&&(e[f.uuid]=d),t[d]=f,t.pop();for(let m=0,_=i;m!==_;++m){const p=n[m];p[d]=p[u],p.pop()}}}this.nCachedObjects_=r}subscribe_(t,e){const n=this._bindingsIndicesByPath;let i=n[t];const r=this._bindings;if(i!==void 0)return r[i];const a=this._paths,o=this._parsedPaths,l=this._objects,c=l.length,h=this.nCachedObjects_,d=new Array(c);i=r.length,n[t]=i,a.push(t),o.push(e),r.push(d);for(let u=h,f=l.length;u!==f;++u){const m=l[u];d[u]=new jt(m,t,e)}return d}unsubscribe_(t){const e=this._bindingsIndicesByPath,n=e[t];if(n!==void 0){const i=this._paths,r=this._parsedPaths,a=this._bindings,o=a.length-1,l=a[o],c=t[o];e[c]=n,a[n]=l,a.pop(),r[n]=r[o],r.pop(),i[n]=i[o],i.pop()}}}class Rp{constructor(t,e,n=null,i=e.blendMode){this._mixer=t,this._clip=e,this._localRoot=n,this.blendMode=i;const r=e.tracks,a=r.length,o=new Array(a),l={endingStart:Hi,endingEnd:Hi};for(let c=0;c!==a;++c){const h=r[c].createInterpolant(null);o[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=pf,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(t){return this._startTime=t,this}setLoop(t,e){return this.loop=t,this.repetitions=e,this}setEffectiveWeight(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(t){return this._scheduleFading(t,0,1)}fadeOut(t){return this._scheduleFading(t,1,0)}crossFadeFrom(t,e,n){if(t.fadeOut(e),this.fadeIn(e),n){const i=this._clip.duration,r=t._clip.duration,a=r/i,o=i/r;t.warp(1,a,e),this.warp(o,1,e)}return this}crossFadeTo(t,e,n){return t.crossFadeFrom(this,e,n)}stopFading(){const t=this._weightInterpolant;return t!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}setEffectiveTimeScale(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(t){return this.timeScale=this._clip.duration/t,this.stopWarping()}syncWith(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()}halt(t){return this.warp(this._effectiveTimeScale,0,t)}warp(t,e,n){const i=this._mixer,r=i.time,a=this.timeScale;let o=this._timeScaleInterpolant;o===null&&(o=i._lendControlInterpolant(),this._timeScaleInterpolant=o);const l=o.parameterPositions,c=o.sampleValues;return l[0]=r,l[1]=r+n,c[0]=t/a,c[1]=e/a,this}stopWarping(){const t=this._timeScaleInterpolant;return t!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(t,e,n,i){if(!this.enabled){this._updateWeight(t);return}const r=this._startTime;if(r!==null){const l=(t-r)*n;l<0||n===0?e=0:(this._startTime=null,e=n*l)}e*=this._updateTimeScale(t);const a=this._updateTime(e),o=this._updateWeight(t);if(o>0){const l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case Zc:for(let h=0,d=l.length;h!==d;++h)l[h].evaluate(a),c[h].accumulateAdditive(o);break;case Zo:default:for(let h=0,d=l.length;h!==d;++h)l[h].evaluate(a),c[h].accumulate(i,o)}}}_updateWeight(t){let e=0;if(this.enabled){e=this.weight;const n=this._weightInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=e,e}_updateTimeScale(t){let e=0;if(!this.paused){e=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopWarping(),e===0?this.paused=!0:this.timeScale=e)}}return this._effectiveTimeScale=e,e}_updateTime(t){const e=this._clip.duration,n=this.loop;let i=this.time+t,r=this._loopCount;const a=n===mf;if(t===0)return r===-1?i:a&&(r&1)===1?e-i:i;if(n===ff){r===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));t:{if(i>=e)i=e;else if(i<0)i=0;else{this.time=i;break t}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(r===-1&&(t>=0?(r=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),i>=e||i<0){const o=Math.floor(i/e);i-=e*o,r+=Math.abs(o);const l=this.repetitions-r;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=t>0?e:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(l===1){const c=t<0;this._setEndings(c,!c,a)}else this._setEndings(!1,!1,a);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this.time=i;if(a&&(r&1)===1)return e-i}return i}_setEndings(t,e,n){const i=this._interpolantSettings;n?(i.endingStart=Gi,i.endingEnd=Gi):(t?i.endingStart=this.zeroSlopeAtStart?Gi:Hi:i.endingStart=Sr,e?i.endingEnd=this.zeroSlopeAtEnd?Gi:Hi:i.endingEnd=Sr)}_scheduleFading(t,e,n){const i=this._mixer,r=i.time;let a=this._weightInterpolant;a===null&&(a=i._lendControlInterpolant(),this._weightInterpolant=a);const o=a.parameterPositions,l=a.sampleValues;return o[0]=r,l[0]=e,o[1]=r+t,l[1]=n,this}}const BM=new Float32Array(1);class zM extends zn{constructor(t){super(),this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(t,e){const n=t._localRoot||this._root,i=t._clip.tracks,r=i.length,a=t._propertyBindings,o=t._interpolants,l=n.uuid,c=this._bindingsByRootAndName;let h=c[l];h===void 0&&(h={},c[l]=h);for(let d=0;d!==r;++d){const u=i[d],f=u.name;let m=h[f];if(m!==void 0)++m.referenceCount,a[d]=m;else{if(m=a[d],m!==void 0){m._cacheIndex===null&&(++m.referenceCount,this._addInactiveBinding(m,l,f));continue}const _=e&&e._propertyBindings[d].binding.parsedPath;m=new Cp(jt.create(n,f,_),u.ValueTypeName,u.getValueSize()),++m.referenceCount,this._addInactiveBinding(m,l,f),a[d]=m}o[d].resultBuffer=m.buffer}}_activateAction(t){if(!this._isActiveAction(t)){if(t._cacheIndex===null){const n=(t._localRoot||this._root).uuid,i=t._clip.uuid,r=this._actionsByClip[i];this._bindAction(t,r&&r.knownActions[0]),this._addInactiveAction(t,i,n)}const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const r=e[n];r.useCount++===0&&(this._lendBinding(r),r.saveOriginalState())}this._lendAction(t)}}_deactivateAction(t){if(this._isActiveAction(t)){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const r=e[n];--r.useCount===0&&(r.restoreOriginalState(),this._takeBackBinding(r))}this._takeBackAction(t)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}}_isActiveAction(t){const e=t._cacheIndex;return e!==null&&e<this._nActiveActions}_addInactiveAction(t,e,n){const i=this._actions,r=this._actionsByClip;let a=r[e];if(a===void 0)a={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,r[e]=a;else{const o=a.knownActions;t._byClipCacheIndex=o.length,o.push(t)}t._cacheIndex=i.length,i.push(t),a.actionByRoot[n]=t}_removeInactiveAction(t){const e=this._actions,n=e[e.length-1],i=t._cacheIndex;n._cacheIndex=i,e[i]=n,e.pop(),t._cacheIndex=null;const r=t._clip.uuid,a=this._actionsByClip,o=a[r],l=o.knownActions,c=l[l.length-1],h=t._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),t._byClipCacheIndex=null;const d=o.actionByRoot,u=(t._localRoot||this._root).uuid;delete d[u],l.length===0&&delete a[r],this._removeInactiveBindingsForAction(t)}_removeInactiveBindingsForAction(t){const e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){const r=e[n];--r.referenceCount===0&&this._removeInactiveBinding(r)}}_lendAction(t){const e=this._actions,n=t._cacheIndex,i=this._nActiveActions++,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_takeBackAction(t){const e=this._actions,n=t._cacheIndex,i=--this._nActiveActions,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_addInactiveBinding(t,e,n){const i=this._bindingsByRootAndName,r=this._bindings;let a=i[e];a===void 0&&(a={},i[e]=a),a[n]=t,t._cacheIndex=r.length,r.push(t)}_removeInactiveBinding(t){const e=this._bindings,n=t.binding,i=n.rootNode.uuid,r=n.path,a=this._bindingsByRootAndName,o=a[i],l=e[e.length-1],c=t._cacheIndex;l._cacheIndex=c,e[c]=l,e.pop(),delete o[r],Object.keys(o).length===0&&delete a[i]}_lendBinding(t){const e=this._bindings,n=t._cacheIndex,i=this._nActiveBindings++,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_takeBackBinding(t){const e=this._bindings,n=t._cacheIndex,i=--this._nActiveBindings,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_lendControlInterpolant(){const t=this._controlInterpolants,e=this._nActiveControlInterpolants++;let n=t[e];return n===void 0&&(n=new xh(new Float32Array(2),new Float32Array(2),1,BM),n.__cacheIndex=e,t[e]=n),n}_takeBackControlInterpolant(t){const e=this._controlInterpolants,n=t.__cacheIndex,i=--this._nActiveControlInterpolants,r=e[i];t.__cacheIndex=i,e[i]=t,r.__cacheIndex=n,e[n]=r}clipAction(t,e,n){const i=e||this._root,r=i.uuid;let a=typeof t=="string"?Fr.findByName(i,t):t;const o=a!==null?a.uuid:t,l=this._actionsByClip[o];let c=null;if(n===void 0&&(a!==null?n=a.blendMode:n=Zo),l!==void 0){const d=l.actionByRoot[r];if(d!==void 0&&d.blendMode===n)return d;c=l.knownActions[0],a===null&&(a=c._clip)}if(a===null)return null;const h=new Rp(this,a,e,n);return this._bindAction(h,c),this._addInactiveAction(h,o,r),h}existingAction(t,e){const n=e||this._root,i=n.uuid,r=typeof t=="string"?Fr.findByName(n,t):t,a=r?r.uuid:t,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[i]||null}stopAllAction(){const t=this._actions,e=this._nActiveActions;for(let n=e-1;n>=0;--n)t[n].stop();return this}update(t){t*=this.timeScale;const e=this._actions,n=this._nActiveActions,i=this.time+=t,r=Math.sign(t),a=this._accuIndex^=1;for(let c=0;c!==n;++c)e[c]._update(i,t,r,a);const o=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)o[c].apply(a);return this}setTime(t){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(t)}getRoot(){return this._root}uncacheClip(t){const e=this._actions,n=t.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){const a=r.knownActions;for(let o=0,l=a.length;o!==l;++o){const c=a[o];this._deactivateAction(c);const h=c._cacheIndex,d=e[e.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,d._cacheIndex=h,e[h]=d,e.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(t){const e=t.uuid,n=this._actionsByClip;for(const a in n){const o=n[a].actionByRoot,l=o[e];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}const i=this._bindingsByRootAndName,r=i[e];if(r!==void 0)for(const a in r){const o=r[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(t,e){const n=this.existingAction(t,e);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}}class Ch{constructor(t){this.value=t}clone(){return new Ch(this.value.clone===void 0?this.value:this.value.clone())}}let kM=0;class VM extends zn{constructor(){super(),this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:kM++}),this.name="",this.usage=Er,this.uniforms=[]}add(t){return this.uniforms.push(t),this}remove(t){const e=this.uniforms.indexOf(t);return e!==-1&&this.uniforms.splice(e,1),this}setName(t){return this.name=t,this}setUsage(t){return this.usage=t,this}dispose(){return this.dispatchEvent({type:"dispose"}),this}copy(t){this.name=t.name,this.usage=t.usage;const e=t.uniforms;this.uniforms.length=0;for(let n=0,i=e.length;n<i;n++){const r=Array.isArray(e[n])?e[n]:[e[n]];for(let a=0;a<r.length;a++)this.uniforms.push(r[a].clone())}return this}clone(){return new this.constructor().copy(this)}}class HM extends nl{constructor(t,e,n=1){super(t,e),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}clone(t){const e=super.clone(t);return e.meshPerAttribute=this.meshPerAttribute,e}toJSON(t){const e=super.toJSON(t);return e.isInstancedInterleavedBuffer=!0,e.meshPerAttribute=this.meshPerAttribute,e}}class GM{constructor(t,e,n,i,r){this.isGLBufferAttribute=!0,this.name="",this.buffer=t,this.type=e,this.itemSize=n,this.elementSize=i,this.count=r,this.version=0}set needsUpdate(t){t===!0&&this.version++}setBuffer(t){return this.buffer=t,this}setType(t,e){return this.type=t,this.elementSize=e,this}setItemSize(t){return this.itemSize=t,this}setCount(t){return this.count=t,this}}const od=new Bt;class WM{constructor(t,e,n=0,i=1/0){this.ray=new Hs(t,e),this.near=n,this.far=i,this.camera=null,this.layers=new Jo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return od.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(od),this}intersectObject(t,e=!0,n=[]){return Dc(t,this,n,e),n.sort(ld),n}intersectObjects(t,e=!0,n=[]){for(let i=0,r=t.length;i<r;i++)Dc(t[i],this,n,e);return n.sort(ld),n}}function ld(s,t){return s.distance-t.distance}function Dc(s,t,e,n){let i=!0;if(s.layers.test(t.layers)&&s.raycast(t,e)===!1&&(i=!1),i===!0&&n===!0){const r=s.children;for(let a=0,o=r.length;a<o;a++)Dc(r[a],t,e,!0)}}class XM{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(xe(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class qM{constructor(t=1,e=0,n=0){return this.radius=t,this.theta=e,this.y=n,this}set(t,e,n){return this.radius=t,this.theta=e,this.y=n,this}copy(t){return this.radius=t.radius,this.theta=t.theta,this.y=t.y,this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+n*n),this.theta=Math.atan2(t,n),this.y=e,this}clone(){return new this.constructor().copy(this)}}class Rh{constructor(t,e,n,i){Rh.prototype.isMatrix2=!0,this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){const r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=i,this}}const cd=new Q;class YM{constructor(t=new Q(1/0,1/0),e=new Q(-1/0,-1/0)){this.isBox2=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=cd.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(t){return this.isEmpty()?t.set(0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,cd).distanceTo(t)}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const hd=new C,Fa=new C;class ZM{constructor(t=new C,e=new C){this.start=t,this.end=e}set(t,e){return this.start.copy(t),this.end.copy(e),this}copy(t){return this.start.copy(t.start),this.end.copy(t.end),this}getCenter(t){return t.addVectors(this.start,this.end).multiplyScalar(.5)}delta(t){return t.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(t,e){return this.delta(e).multiplyScalar(t).add(this.start)}closestPointToPointParameter(t,e){hd.subVectors(t,this.start),Fa.subVectors(this.end,this.start);const n=Fa.dot(Fa);let r=Fa.dot(hd)/n;return e&&(r=xe(r,0,1)),r}closestPointToPoint(t,e,n){const i=this.closestPointToPointParameter(t,e);return this.delta(n).multiplyScalar(i).add(this.start)}applyMatrix4(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this}equals(t){return t.start.equals(this.start)&&t.end.equals(this.end)}clone(){return new this.constructor().copy(this)}}const ud=new C;class $M extends ee{constructor(t,e){super(),this.light=t,this.matrixAutoUpdate=!1,this.color=e,this.type="SpotLightHelper";const n=new Xt,i=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let a=0,o=1,l=32;a<l;a++,o++){const c=a/l*Math.PI*2,h=o/l*Math.PI*2;i.push(Math.cos(c),Math.sin(c),1,Math.cos(h),Math.sin(h),1)}n.setAttribute("position",new Pt(i,3));const r=new ze({fog:!1,toneMapped:!1});this.cone=new kn(n,r),this.add(this.cone),this.update()}dispose(){this.cone.geometry.dispose(),this.cone.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent?(this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld)):this.matrix.copy(this.light.matrixWorld),this.matrixWorld.copy(this.light.matrixWorld);const t=this.light.distance?this.light.distance:1e3,e=t*Math.tan(this.light.angle);this.cone.scale.set(e,e,t),ud.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(ud),this.color!==void 0?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}}const fi=new C,Oa=new Bt,uc=new Bt;class KM extends kn{constructor(t){const e=Pp(t),n=new Xt,i=[],r=[],a=new ft(0,0,1),o=new ft(0,1,0);for(let c=0;c<e.length;c++){const h=e[c];h.parent&&h.parent.isBone&&(i.push(0,0,0),i.push(0,0,0),r.push(a.r,a.g,a.b),r.push(o.r,o.g,o.b))}n.setAttribute("position",new Pt(i,3)),n.setAttribute("color",new Pt(r,3));const l=new ze({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(n,l),this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=t,this.bones=e,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1}updateMatrixWorld(t){const e=this.bones,n=this.geometry,i=n.getAttribute("position");uc.copy(this.root.matrixWorld).invert();for(let r=0,a=0;r<e.length;r++){const o=e[r];o.parent&&o.parent.isBone&&(Oa.multiplyMatrices(uc,o.matrixWorld),fi.setFromMatrixPosition(Oa),i.setXYZ(a,fi.x,fi.y,fi.z),Oa.multiplyMatrices(uc,o.parent.matrixWorld),fi.setFromMatrixPosition(Oa),i.setXYZ(a+1,fi.x,fi.y,fi.z),a+=2)}n.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(t)}dispose(){this.geometry.dispose(),this.material.dispose()}}function Pp(s){const t=[];s.isBone===!0&&t.push(s);for(let e=0;e<s.children.length;e++)t.push.apply(t,Pp(s.children[e]));return t}class JM extends at{constructor(t,e,n){const i=new Ie(e,4,2),r=new he({wireframe:!0,fog:!1,toneMapped:!1});super(i,r),this.light=t,this.color=n,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){this.geometry.dispose(),this.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.color!==void 0?this.material.color.set(this.color):this.material.color.copy(this.light.color)}}const QM=new C,dd=new ft,fd=new ft;class jM extends ee{constructor(t,e,n){super(),this.light=t,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=n,this.type="HemisphereLightHelper";const i=new Ws(e);i.rotateY(Math.PI*.5),this.material=new he({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0&&(this.material.vertexColors=!0);const r=i.getAttribute("position"),a=new Float32Array(r.count*3);i.setAttribute("color",new se(a,3)),this.add(new at(i,this.material)),this.update()}dispose(){this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){const t=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{const e=t.geometry.getAttribute("color");dd.copy(this.light.color),fd.copy(this.light.groundColor);for(let n=0,i=e.count;n<i;n++){const r=n<i/2?dd:fd;e.setXYZ(n,r.r,r.g,r.b)}e.needsUpdate=!0}this.light.updateWorldMatrix(!0,!1),t.lookAt(QM.setFromMatrixPosition(this.light.matrixWorld).negate())}}class tb extends kn{constructor(t=10,e=10,n=4473924,i=8947848){n=new ft(n),i=new ft(i);const r=e/2,a=t/e,o=t/2,l=[],c=[];for(let u=0,f=0,m=-o;u<=e;u++,m+=a){l.push(-o,0,m,o,0,m),l.push(m,0,-o,m,0,o);const _=u===r?n:i;_.toArray(c,f),f+=3,_.toArray(c,f),f+=3,_.toArray(c,f),f+=3,_.toArray(c,f),f+=3}const h=new Xt;h.setAttribute("position",new Pt(l,3)),h.setAttribute("color",new Pt(c,3));const d=new ze({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class eb extends kn{constructor(t=10,e=16,n=8,i=64,r=4473924,a=8947848){r=new ft(r),a=new ft(a);const o=[],l=[];if(e>1)for(let d=0;d<e;d++){const u=d/e*(Math.PI*2),f=Math.sin(u)*t,m=Math.cos(u)*t;o.push(0,0,0),o.push(f,0,m);const _=d&1?r:a;l.push(_.r,_.g,_.b),l.push(_.r,_.g,_.b)}for(let d=0;d<n;d++){const u=d&1?r:a,f=t-t/n*d;for(let m=0;m<i;m++){let _=m/i*(Math.PI*2),p=Math.sin(_)*f,g=Math.cos(_)*f;o.push(p,0,g),l.push(u.r,u.g,u.b),_=(m+1)/i*(Math.PI*2),p=Math.sin(_)*f,g=Math.cos(_)*f,o.push(p,0,g),l.push(u.r,u.g,u.b)}}const c=new Xt;c.setAttribute("position",new Pt(o,3)),c.setAttribute("color",new Pt(l,3));const h=new ze({vertexColors:!0,toneMapped:!1});super(c,h),this.type="PolarGridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}const pd=new C,Ba=new C,md=new C;class nb extends ee{constructor(t,e,n){super(),this.light=t,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=n,this.type="DirectionalLightHelper",e===void 0&&(e=1);let i=new Xt;i.setAttribute("position",new Pt([-e,e,0,e,e,0,e,-e,0,-e,-e,0,-e,e,0],3));const r=new ze({fog:!1,toneMapped:!1});this.lightPlane=new Bn(i,r),this.add(this.lightPlane),i=new Xt,i.setAttribute("position",new Pt([0,0,0,0,0,1],3)),this.targetLine=new Bn(i,r),this.add(this.targetLine),this.update()}dispose(){this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),pd.setFromMatrixPosition(this.light.matrixWorld),Ba.setFromMatrixPosition(this.light.target.matrixWorld),md.subVectors(Ba,pd),this.lightPlane.lookAt(Ba),this.color!==void 0?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(Ba),this.targetLine.scale.z=md.length()}}const za=new C,_e=new Qo;class ib extends kn{constructor(t){const e=new Xt,n=new ze({color:16777215,vertexColors:!0,toneMapped:!1}),i=[],r=[],a={};o("n1","n2"),o("n2","n4"),o("n4","n3"),o("n3","n1"),o("f1","f2"),o("f2","f4"),o("f4","f3"),o("f3","f1"),o("n1","f1"),o("n2","f2"),o("n3","f3"),o("n4","f4"),o("p","n1"),o("p","n2"),o("p","n3"),o("p","n4"),o("u1","u2"),o("u2","u3"),o("u3","u1"),o("c","t"),o("p","c"),o("cn1","cn2"),o("cn3","cn4"),o("cf1","cf2"),o("cf3","cf4");function o(m,_){l(m),l(_)}function l(m){i.push(0,0,0),r.push(0,0,0),a[m]===void 0&&(a[m]=[]),a[m].push(i.length/3-1)}e.setAttribute("position",new Pt(i,3)),e.setAttribute("color",new Pt(r,3)),super(e,n),this.type="CameraHelper",this.camera=t,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=a,this.update();const c=new ft(16755200),h=new ft(16711680),d=new ft(43775),u=new ft(16777215),f=new ft(3355443);this.setColors(c,h,d,u,f)}setColors(t,e,n,i,r){const o=this.geometry.getAttribute("color");o.setXYZ(0,t.r,t.g,t.b),o.setXYZ(1,t.r,t.g,t.b),o.setXYZ(2,t.r,t.g,t.b),o.setXYZ(3,t.r,t.g,t.b),o.setXYZ(4,t.r,t.g,t.b),o.setXYZ(5,t.r,t.g,t.b),o.setXYZ(6,t.r,t.g,t.b),o.setXYZ(7,t.r,t.g,t.b),o.setXYZ(8,t.r,t.g,t.b),o.setXYZ(9,t.r,t.g,t.b),o.setXYZ(10,t.r,t.g,t.b),o.setXYZ(11,t.r,t.g,t.b),o.setXYZ(12,t.r,t.g,t.b),o.setXYZ(13,t.r,t.g,t.b),o.setXYZ(14,t.r,t.g,t.b),o.setXYZ(15,t.r,t.g,t.b),o.setXYZ(16,t.r,t.g,t.b),o.setXYZ(17,t.r,t.g,t.b),o.setXYZ(18,t.r,t.g,t.b),o.setXYZ(19,t.r,t.g,t.b),o.setXYZ(20,t.r,t.g,t.b),o.setXYZ(21,t.r,t.g,t.b),o.setXYZ(22,t.r,t.g,t.b),o.setXYZ(23,t.r,t.g,t.b),o.setXYZ(24,e.r,e.g,e.b),o.setXYZ(25,e.r,e.g,e.b),o.setXYZ(26,e.r,e.g,e.b),o.setXYZ(27,e.r,e.g,e.b),o.setXYZ(28,e.r,e.g,e.b),o.setXYZ(29,e.r,e.g,e.b),o.setXYZ(30,e.r,e.g,e.b),o.setXYZ(31,e.r,e.g,e.b),o.setXYZ(32,n.r,n.g,n.b),o.setXYZ(33,n.r,n.g,n.b),o.setXYZ(34,n.r,n.g,n.b),o.setXYZ(35,n.r,n.g,n.b),o.setXYZ(36,n.r,n.g,n.b),o.setXYZ(37,n.r,n.g,n.b),o.setXYZ(38,i.r,i.g,i.b),o.setXYZ(39,i.r,i.g,i.b),o.setXYZ(40,r.r,r.g,r.b),o.setXYZ(41,r.r,r.g,r.b),o.setXYZ(42,r.r,r.g,r.b),o.setXYZ(43,r.r,r.g,r.b),o.setXYZ(44,r.r,r.g,r.b),o.setXYZ(45,r.r,r.g,r.b),o.setXYZ(46,r.r,r.g,r.b),o.setXYZ(47,r.r,r.g,r.b),o.setXYZ(48,r.r,r.g,r.b),o.setXYZ(49,r.r,r.g,r.b),o.needsUpdate=!0}update(){const t=this.geometry,e=this.pointMap,n=1,i=1;_e.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),Me("c",e,t,_e,0,0,-1),Me("t",e,t,_e,0,0,1),Me("n1",e,t,_e,-n,-i,-1),Me("n2",e,t,_e,n,-i,-1),Me("n3",e,t,_e,-n,i,-1),Me("n4",e,t,_e,n,i,-1),Me("f1",e,t,_e,-n,-i,1),Me("f2",e,t,_e,n,-i,1),Me("f3",e,t,_e,-n,i,1),Me("f4",e,t,_e,n,i,1),Me("u1",e,t,_e,n*.7,i*1.1,-1),Me("u2",e,t,_e,-n*.7,i*1.1,-1),Me("u3",e,t,_e,0,i*2,-1),Me("cf1",e,t,_e,-n,0,1),Me("cf2",e,t,_e,n,0,1),Me("cf3",e,t,_e,0,-i,1),Me("cf4",e,t,_e,0,i,1),Me("cn1",e,t,_e,-n,0,-1),Me("cn2",e,t,_e,n,0,-1),Me("cn3",e,t,_e,0,-i,-1),Me("cn4",e,t,_e,0,i,-1),t.getAttribute("position").needsUpdate=!0}dispose(){this.geometry.dispose(),this.material.dispose()}}function Me(s,t,e,n,i,r,a){za.set(i,r,a).unproject(n);const o=t[s];if(o!==void 0){const l=e.getAttribute("position");for(let c=0,h=o.length;c<h;c++)l.setXYZ(o[c],za.x,za.y,za.z)}}const ka=new Ke;class sb extends kn{constructor(t,e=16776960){const n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),i=new Float32Array(8*3),r=new Xt;r.setIndex(new se(n,1)),r.setAttribute("position",new se(i,3)),super(r,new ze({color:e,toneMapped:!1})),this.object=t,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(t){if(t!==void 0&&console.warn("THREE.BoxHelper: .update() has no longer arguments."),this.object!==void 0&&ka.setFromObject(this.object),ka.isEmpty())return;const e=ka.min,n=ka.max,i=this.geometry.attributes.position,r=i.array;r[0]=n.x,r[1]=n.y,r[2]=n.z,r[3]=e.x,r[4]=n.y,r[5]=n.z,r[6]=e.x,r[7]=e.y,r[8]=n.z,r[9]=n.x,r[10]=e.y,r[11]=n.z,r[12]=n.x,r[13]=n.y,r[14]=e.z,r[15]=e.x,r[16]=n.y,r[17]=e.z,r[18]=e.x,r[19]=e.y,r[20]=e.z,r[21]=n.x,r[22]=e.y,r[23]=e.z,i.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(t){return this.object=t,this.update(),this}copy(t,e){return super.copy(t,e),this.object=t.object,this}dispose(){this.geometry.dispose(),this.material.dispose()}}class rb extends kn{constructor(t,e=16776960){const n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),i=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],r=new Xt;r.setIndex(new se(n,1)),r.setAttribute("position",new Pt(i,3)),super(r,new ze({color:e,toneMapped:!1})),this.box=t,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(t){const e=this.box;e.isEmpty()||(e.getCenter(this.position),e.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(t))}dispose(){this.geometry.dispose(),this.material.dispose()}}class ab extends Bn{constructor(t,e=1,n=16776960){const i=n,r=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],a=new Xt;a.setAttribute("position",new Pt(r,3)),a.computeBoundingSphere(),super(a,new ze({color:i,toneMapped:!1})),this.type="PlaneHelper",this.plane=t,this.size=e;const o=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],l=new Xt;l.setAttribute("position",new Pt(o,3)),l.computeBoundingSphere(),this.add(new at(l,new he({color:i,opacity:.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(t){this.position.set(0,0,0),this.scale.set(.5*this.size,.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(t)}dispose(){this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}}const gd=new C;let Va,dc;class ob extends ee{constructor(t=new C(0,0,1),e=new C(0,0,0),n=1,i=16776960,r=n*.2,a=r*.2){super(),this.type="ArrowHelper",Va===void 0&&(Va=new Xt,Va.setAttribute("position",new Pt([0,0,0,0,1,0],3)),dc=new Be(0,.5,1,5,1),dc.translate(0,-.5,0)),this.position.copy(e),this.line=new Bn(Va,new ze({color:i,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new at(dc,new he({color:i,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(t),this.setLength(n,r,a)}setDirection(t){if(t.y>.99999)this.quaternion.set(0,0,0,1);else if(t.y<-.99999)this.quaternion.set(1,0,0,0);else{gd.set(t.z,0,-t.x).normalize();const e=Math.acos(t.y);this.quaternion.setFromAxisAngle(gd,e)}}setLength(t,e=t*.2,n=e*.2){this.line.scale.set(1,Math.max(1e-4,t-e),1),this.line.updateMatrix(),this.cone.scale.set(n,e,n),this.cone.position.y=t,this.cone.updateMatrix()}setColor(t){this.line.material.color.set(t),this.cone.material.color.set(t)}copy(t){return super.copy(t,!1),this.line.copy(t.line),this.cone.copy(t.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}}class lb extends kn{constructor(t=1){const e=[0,0,0,t,0,0,0,0,0,0,t,0,0,0,0,0,0,t],n=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],i=new Xt;i.setAttribute("position",new Pt(e,3)),i.setAttribute("color",new Pt(n,3));const r=new ze({vertexColors:!0,toneMapped:!1});super(i,r),this.type="AxesHelper"}setColors(t,e,n){const i=new ft,r=this.geometry.attributes.color.array;return i.set(t),i.toArray(r,0),i.toArray(r,3),i.set(e),i.toArray(r,6),i.toArray(r,9),i.set(n),i.toArray(r,12),i.toArray(r,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}}class cb{constructor(){this.type="ShapePath",this.color=new ft,this.subPaths=[],this.currentPath=null}moveTo(t,e){return this.currentPath=new Pr,this.subPaths.push(this.currentPath),this.currentPath.moveTo(t,e),this}lineTo(t,e){return this.currentPath.lineTo(t,e),this}quadraticCurveTo(t,e,n,i){return this.currentPath.quadraticCurveTo(t,e,n,i),this}bezierCurveTo(t,e,n,i,r,a){return this.currentPath.bezierCurveTo(t,e,n,i,r,a),this}splineThru(t){return this.currentPath.splineThru(t),this}toShapes(t){function e(g){const v=[];for(let x=0,y=g.length;x<y;x++){const E=g[x],A=new Ki;A.curves=E.curves,v.push(A)}return v}function n(g,v){const x=v.length;let y=!1;for(let E=x-1,A=0;A<x;E=A++){let w=v[E],P=v[A],L=P.x-w.x,M=P.y-w.y;if(Math.abs(M)>Number.EPSILON){if(M<0&&(w=v[A],L=-L,P=v[E],M=-M),g.y<w.y||g.y>P.y)continue;if(g.y===w.y){if(g.x===w.x)return!0}else{const b=M*(g.x-w.x)-L*(g.y-w.y);if(b===0)return!0;if(b<0)continue;y=!y}}else{if(g.y!==w.y)continue;if(P.x<=g.x&&g.x<=w.x||w.x<=g.x&&g.x<=P.x)return!0}}return y}const i=Nn.isClockWise,r=this.subPaths;if(r.length===0)return[];let a,o,l;const c=[];if(r.length===1)return o=r[0],l=new Ki,l.curves=o.curves,c.push(l),c;let h=!i(r[0].getPoints());h=t?!h:h;const d=[],u=[];let f=[],m=0,_;u[m]=void 0,f[m]=[];for(let g=0,v=r.length;g<v;g++)o=r[g],_=o.getPoints(),a=i(_),a=t?!a:a,a?(!h&&u[m]&&m++,u[m]={s:new Ki,p:_},u[m].s.curves=o.curves,h&&m++,f[m]=[]):f[m].push({h:o,p:_[0]});if(!u[0])return e(r);if(u.length>1){let g=!1,v=0;for(let x=0,y=u.length;x<y;x++)d[x]=[];for(let x=0,y=u.length;x<y;x++){const E=f[x];for(let A=0;A<E.length;A++){const w=E[A];let P=!0;for(let L=0;L<u.length;L++)n(w.p,u[L].p)&&(x!==L&&v++,P?(P=!1,d[L].push(w)):g=!0);P&&d[x].push(w)}}v>0&&g===!1&&(f=d)}let p;for(let g=0,v=u.length;g<v;g++){l=u[g].s,c.push(l),p=f[g];for(let x=0,y=p.length;x<y;x++)l.holes.push(p[x].h)}return c}}class hb extends zn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}class ub extends Tn{constructor(t=1,e=1,n=1,i={}){console.warn('THREE.WebGLMultipleRenderTargets has been deprecated and will be removed in r172. Use THREE.WebGLRenderTarget and set the "count" parameter to enable MRT.'),super(t,e,{...i,count:n}),this.isWebGLMultipleRenderTargets=!0}get texture(){return this.textures}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ko}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ko);const db=Object.freeze(Object.defineProperty({__proto__:null,ACESFilmicToneMapping:lf,AddEquation:mi,AddOperation:sf,AdditiveAnimationBlendMode:Zc,AdditiveBlending:vc,AgXToneMapping:hf,AlphaFormat:Hc,AlwaysCompare:Af,AlwaysDepth:ja,AlwaysStencilFunc:Sc,AmbientLight:Mp,AnimationAction:Rp,AnimationClip:Fr,AnimationLoader:hM,AnimationMixer:zM,AnimationObjectGroup:OM,AnimationUtils:aM,ArcCurve:Kf,ArrayCamera:Vf,ArrowHelper:ob,AttachedBindMode:bc,Audio:Ep,AudioAnalyser:EM,AudioContext:wh,AudioListener:wM,AudioLoader:MM,AxesHelper:lb,BackSide:Ae,BasicDepthPacking:gf,BasicShadowMap:sm,BatchedMesh:Zf,Bone:ah,BooleanKeyframeTrack:is,Box2:YM,Box3:Ke,Box3Helper:rb,BoxGeometry:Pe,BoxHelper:sb,BufferAttribute:se,BufferGeometry:Xt,BufferGeometryLoader:Tp,ByteType:zc,Cache:Kn,Camera:Qo,CameraHelper:ib,CanvasTexture:Ya,CapsuleGeometry:al,CatmullRomCurve3:hh,CineonToneMapping:of,CircleGeometry:ol,ClampToEdgeWrapping:vn,Clock:Ah,Color:ft,ColorKeyframeTrack:vh,ColorManagement:ne,CompressedArrayTexture:Ry,CompressedCubeTexture:Py,CompressedTexture:sl,CompressedTextureLoader:uM,ConeGeometry:rn,ConstantAlphaFactor:tf,ConstantColorFactor:Qd,Controls:hb,CubeCamera:Df,CubeReflectionMapping:ti,CubeRefractionMapping:_i,CubeTexture:Hr,CubeTextureLoader:dM,CubeUVReflectionMapping:ks,CubicBezierCurve:uh,CubicBezierCurve3:Jf,CubicInterpolant:mp,CullFaceBack:xc,CullFaceFront:Fd,CullFaceFrontBack:im,CullFaceNone:Nd,Curve:En,CurvePath:jf,CustomBlending:Bd,CustomToneMapping:cf,CylinderGeometry:Be,Cylindrical:qM,Data3DTexture:Jc,DataArrayTexture:Ko,DataTexture:Un,DataTextureLoader:fM,DataUtils:xg,DecrementStencilOp:xm,DecrementWrapStencilOp:ym,DefaultLoadingManager:xp,DepthFormat:Zi,DepthStencilFormat:ji,DepthTexture:eh,DetachedBindMode:df,DirectionalLight:Sh,DirectionalLightHelper:nb,DiscreteInterpolant:gp,DisplayP3ColorSpace:$o,DodecahedronGeometry:ll,DoubleSide:xn,DstAlphaFactor:Yd,DstColorFactor:$d,DynamicCopyUsage:Nm,DynamicDrawUsage:Rm,DynamicReadUsage:Lm,EdgesGeometry:tp,EllipseCurve:rl,EqualCompare:Mf,EqualDepth:eo,EqualStencilFunc:wm,EquirectangularReflectionMapping:xr,EquirectangularRefractionMapping:vr,Euler:pn,EventDispatcher:zn,ExtrudeGeometry:hl,FileLoader:ni,Float16BufferAttribute:wg,Float32BufferAttribute:Pt,FloatType:nn,Fog:Wr,FogExp2:el,FramebufferTexture:Cy,FrontSide:jn,Frustum:Gr,GLBufferAttribute:GM,GLSL1:Om,GLSL3:wc,GreaterCompare:bf,GreaterDepth:io,GreaterEqualCompare:wf,GreaterEqualDepth:no,GreaterEqualStencilFunc:Cm,GreaterStencilFunc:Tm,GridHelper:tb,Group:pe,HalfFloatType:Vs,HemisphereLight:Mh,HemisphereLightHelper:jM,IcosahedronGeometry:ul,ImageBitmapLoader:yM,ImageLoader:Or,ImageUtils:Cf,IncrementStencilOp:_m,IncrementWrapStencilOp:vm,InstancedBufferAttribute:Bs,InstancedBufferGeometry:Ap,InstancedInterleavedBuffer:HM,InstancedMesh:Yf,Int16BufferAttribute:bg,Int32BufferAttribute:Sg,Int8BufferAttribute:vg,IntType:Ho,InterleavedBuffer:nl,InterleavedBufferAttribute:ts,Interpolant:qr,InterpolateDiscrete:br,InterpolateLinear:Lo,InterpolateSmooth:Wa,InvertStencilOp:Mm,KeepStencilOp:Oi,KeyframeTrack:Cn,LOD:Xf,LatheGeometry:Xr,Layers:Jo,LessCompare:yf,LessDepth:to,LessEqualCompare:$c,LessEqualDepth:Ji,LessEqualStencilFunc:Am,LessStencilFunc:Sm,Light:Mi,LightProbe:wp,Line:Bn,Line3:ZM,LineBasicMaterial:ze,LineCurve:dh,LineCurve3:Qf,LineDashedMaterial:dp,LineLoop:$f,LineSegments:kn,LinearDisplayP3ColorSpace:Vr,LinearFilter:Re,LinearInterpolant:xh,LinearMipMapLinearFilter:lm,LinearMipMapNearestFilter:om,LinearMipmapLinearFilter:Ln,LinearMipmapNearestFilter:lr,LinearSRGBColorSpace:si,LinearToneMapping:rf,LinearTransfer:wr,Loader:on,LoaderUtils:Lc,LoadingManager:yh,LoopOnce:ff,LoopPingPong:mf,LoopRepeat:pf,LuminanceAlphaFormat:Xc,LuminanceFormat:Wc,MOUSE:em,Material:Xe,MaterialLoader:_l,MathUtils:Ts,Matrix2:Rh,Matrix3:Yt,Matrix4:Bt,MaxEquation:Hd,Mesh:at,MeshBasicMaterial:he,MeshDepthMaterial:nh,MeshDistanceMaterial:ih,MeshLambertMaterial:hp,MeshMatcapMaterial:up,MeshNormalMaterial:cp,MeshPhongMaterial:lp,MeshPhysicalMaterial:op,MeshStandardMaterial:gh,MeshToonMaterial:ns,MinEquation:Vd,MirroredRepeatWrapping:Mr,MixOperation:nf,MultiplyBlending:Mc,MultiplyOperation:zr,NearestFilter:Fe,NearestMipMapLinearFilter:am,NearestMipMapNearestFilter:rm,NearestMipmapLinearFilter:Es,NearestMipmapNearestFilter:Bc,NeutralToneMapping:uf,NeverCompare:vf,NeverDepth:Qa,NeverStencilFunc:bm,NoBlending:Jn,NoColorSpace:Zn,NoToneMapping:Qn,NormalAnimationBlendMode:Zo,NormalBlending:Yi,NotEqualCompare:Sf,NotEqualDepth:so,NotEqualStencilFunc:Em,NumberKeyframeTrack:Ur,Object3D:ee,ObjectLoader:xM,ObjectSpaceNormalMap:xf,OctahedronGeometry:Ws,OneFactor:Wd,OneMinusConstantAlphaFactor:ef,OneMinusConstantColorFactor:jd,OneMinusDstAlphaFactor:Zd,OneMinusDstColorFactor:Kd,OneMinusSrcAlphaFactor:Ja,OneMinusSrcColorFactor:qd,OrthographicCamera:jo,P3Primaries:Tr,PCFShadowMap:Oc,PCFSoftShadowMap:Od,PMREMGenerator:Ac,Path:Pr,PerspectiveCamera:Ne,Plane:pi,PlaneGeometry:On,PlaneHelper:ab,PointLight:yp,PointLightHelper:JM,Points:lh,PointsMaterial:oh,PolarGridHelper:eb,PolyhedronGeometry:yi,PositionalAudio:TM,PropertyBinding:jt,PropertyMixer:Cp,QuadraticBezierCurve:fh,QuadraticBezierCurve3:ph,Quaternion:sn,QuaternionKeyframeTrack:Yr,QuaternionLinearInterpolant:_p,RED_GREEN_RGTC2_Format:Po,RED_RGTC1_Format:Yc,REVISION:ko,RGBADepthPacking:_f,RGBAFormat:$e,RGBAIntegerFormat:Yo,RGBA_ASTC_10x10_Format:wo,RGBA_ASTC_10x5_Format:Mo,RGBA_ASTC_10x6_Format:bo,RGBA_ASTC_10x8_Format:So,RGBA_ASTC_12x10_Format:Ao,RGBA_ASTC_12x12_Format:To,RGBA_ASTC_4x4_Format:fo,RGBA_ASTC_5x4_Format:po,RGBA_ASTC_5x5_Format:mo,RGBA_ASTC_6x5_Format:go,RGBA_ASTC_6x6_Format:_o,RGBA_ASTC_8x5_Format:xo,RGBA_ASTC_8x6_Format:vo,RGBA_ASTC_8x8_Format:yo,RGBA_BPTC_Format:fr,RGBA_ETC2_EAC_Format:uo,RGBA_PVRTC_2BPPV1_Format:lo,RGBA_PVRTC_4BPPV1_Format:oo,RGBA_S3TC_DXT1_Format:hr,RGBA_S3TC_DXT3_Format:ur,RGBA_S3TC_DXT5_Format:dr,RGBDepthPacking:fm,RGBFormat:Gc,RGBIntegerFormat:cm,RGB_BPTC_SIGNED_Format:Eo,RGB_BPTC_UNSIGNED_Format:Co,RGB_ETC1_Format:co,RGB_ETC2_Format:ho,RGB_PVRTC_2BPPV1_Format:ao,RGB_PVRTC_4BPPV1_Format:ro,RGB_S3TC_DXT1_Format:cr,RGDepthPacking:pm,RGFormat:qc,RGIntegerFormat:qo,RawShaderMaterial:ap,Ray:Hs,Raycaster:WM,Rec709Primaries:Ar,RectAreaLight:bp,RedFormat:Xo,RedIntegerFormat:kr,ReinhardToneMapping:af,RenderTarget:Rf,RepeatWrapping:yr,ReplaceStencilOp:gm,ReverseSubtractEquation:kd,RingGeometry:An,SIGNED_RED_GREEN_RGTC2_Format:Io,SIGNED_RED_RGTC1_Format:Ro,SRGBColorSpace:_n,SRGBTransfer:de,Scene:sh,ShaderChunk:$t,ShaderLib:wn,ShaderMaterial:an,ShadowMaterial:rp,Shape:Ki,ShapeGeometry:dl,ShapePath:cb,ShapeUtils:Nn,ShortType:kc,Skeleton:il,SkeletonHelper:KM,SkinnedMesh:qf,Source:Wi,Sphere:We,SphereGeometry:Ie,Spherical:XM,SphericalHarmonics3:Sp,SplineCurve:mh,SpotLight:vp,SpotLightHelper:$M,Sprite:Wf,SpriteMaterial:rh,SrcAlphaFactor:Ka,SrcAlphaSaturateFactor:Jd,SrcColorFactor:Xd,StaticCopyUsage:Um,StaticDrawUsage:Er,StaticReadUsage:Im,StereoCamera:bM,StreamCopyUsage:Fm,StreamDrawUsage:Pm,StreamReadUsage:Dm,StringKeyframeTrack:ss,SubtractEquation:zd,SubtractiveBlending:yc,TOUCH:nm,TangentSpaceNormalMap:vi,TetrahedronGeometry:fl,Texture:ve,TextureLoader:pM,TextureUtils:oy,TorusGeometry:pl,TorusKnotGeometry:ml,Triangle:en,TriangleFanDrawMode:dm,TriangleStripDrawMode:um,TrianglesDrawMode:hm,TubeGeometry:gl,UVMapping:Vo,Uint16BufferAttribute:Qc,Uint32BufferAttribute:jc,Uint8BufferAttribute:yg,Uint8ClampedBufferAttribute:Mg,Uniform:Ch,UniformsGroup:VM,UniformsLib:gt,UniformsUtils:Lf,UnsignedByteType:Fn,UnsignedInt248Type:Qi,UnsignedInt5999Type:Vc,UnsignedIntType:ei,UnsignedShort4444Type:Go,UnsignedShort5551Type:Wo,UnsignedShortType:Ns,VSMShadowMap:In,Vector2:Q,Vector3:C,Vector4:te,VectorKeyframeTrack:Nr,VideoTexture:Ey,WebGL3DRenderTarget:lg,WebGLArrayRenderTarget:og,WebGLCoordinateSystem:Dn,WebGLCubeRenderTarget:Uf,WebGLMultipleRenderTargets:ub,WebGLRenderTarget:Tn,WebGLRenderer:Hf,WebGLUtils:kf,WebGPUCoordinateSystem:Cr,WireframeGeometry:sp,WrapAroundEnding:Sr,ZeroCurvatureEnding:Hi,ZeroFactor:Gd,ZeroSlopeEnding:Gi,ZeroStencilOp:mm,createCanvasElement:Ef},Symbol.toStringTag,{value:"Module"})),Y={renderer:{antialias:!0,pixelRatioCap:2},scene:{background:12575730,fogColor:12575730,fogNear:120,fogFar:420},camera:{fov:60,near:.1,far:1e3,position:[10,8,14],lookAt:[0,0,0]},debugPlaceholder:{spinSpeed:.6},water:{size:600,segments:180,waves:[[.55,42,.55,0],[.35,23,.8,1.1],[.22,13,1.2,2.6],[.12,7,1.9,4.2],[.05,4.5,2.6,.9],[.035,3,3.4,2.2]],colorDeep:2785192,colorShallow:7328728,crestColor:16777215,foamColor:16055295},boat:{color:16038210,maxSpeed:33.3,maxReverse:7,accel:15,brake:24,drag:.62,turnRate:1.5,turnSpdRef:9,inertiaLerp:3.2,bobFreq:1.6,pitchLerp:4,drift:{minSpeed:9,latInject:.6,latClamp:14,turnBoost:1.55,drag:1.15,chargePerSec:.8,chargeMax:1.6,minHold:.35,boostForce:14,boostDecay:1.6,boostMax:20},air:{gravity:22,launchMinSpeed:10,splashSpeed:9,splashUpTime:.9,splashSlow:.55,airVScale:.14}},ai:{speedCap:[22.5,19.5,16.5],kP:.35,kD:1.4,gain:2,lookAhead:25,inner:3},trackFeatures:{boost:{padHalfWidth:4.5,padLength:14,speedAdd:14,decay:.55,maxTotal:24,cooldown:1.5},ramps:[{t:.3,height:1.7}],colliderRadius:1.1,boatDeflect:.6,obBounce:.35,obSpeedKeep:.55},raceFlow:{countdown:3,goFlash:.8,autoStart:!0,start:{revRamp:8,revDrop:1.2,revMax:17,rpmGreenLo:7.4,rpmGreenHi:13.2,rpmBlow:15.5,penaltyRatio:.35,penaltyMax:1,boostSpeedAdd:10,boostForce:8,boostDuration:1.6,launchKeepRatio:.85,launchMin:4,aiFalseStartChance:.3,swellBoatScale:.6,swellMotorScale:1,swellShake:.06,blowPopScale:.7,launchStretch:1.5,launchSquash:.88,launchForward:2.4,launchRestoreTime:5,popDriverTime:1,popHeadZ:.25,popHeadY:.55,popPeriod:.24}},items:{boxes:{ts:[.16,.37,.62,.88],lanes:[0,-5.6,5.6],radius:3,respawn:7},weights:{speed:1,missile:1,bubble:1,shield:1,wave:1,turbo:1,lightning:1,giant:1,bomb:1},speed:{speedAdd:12,decay:.1},missile:{speed:45,range:75,radius:3.2,slowKeep:.3,spin:1.5},bubble:{speed:30,range:68,radius:3.6,floatTime:2.2,popDrop:8,homing:5.5,targetMinAhead:4,targetMaxAhead:70},trap:{slowKeep:.18},shield:{duration:6},wave:{radius:16,push:12,slowKeep:.4},turbo:{speedAdd:10,duration:5},stars:{spawnInterval:[7,11],chance:.72,chainMin:3,chainMax:5,aheadMin:12,aheadMax:20,spacing:7,lateral:1.6,radius:2.4,life:10,speedAdd:8,boostDuration:2,maxDuration:10},lightning:{duration:3.2,slowDecay:1.2},giant:{speedAdd:9,duration:4,shrinkTime:2.2,scale:1.55},bomb:{fuse:2,radius:12,throwSpeed:25,throwRange:34,slowKeep:.32,push:8},ai:{useDelay:[.8,2.2],missileMinAhead:6,missileMaxAhead:45,bubbleBehind:[-45,-4],shieldWhenHit:!0}},flyingFish:{enabled:!0,rankChancePerSec:[.12,.08,.05],cooldown:[5,8],ahead:[24,38],crossTime:1.8,life:2.6,radius:2,jumpHeight:3.1,laneJitter:3,slowKeep:.35,push:5.5},audio:{engineGain:.13},quality:{low:{name:"low",waterSegments:90,detailNormals:!1,particles:300},high:{name:"high",waterSegments:180,detailNormals:!0,particles:1400},auto:{name:"auto",waterSegments:140,detailNormals:!0,particles:900}},defaultQuality:"high",spray:{gravity:14,wakePerSec:26,splashPerMs:2.2,splashMax:60},followCam:{backDist:9,height:4.2,lookHeight:1.2,posLerp:3.5,lookLerp:6,speedPush:.12}},fb={throttle:["KeyW","ArrowUp"],brake:["KeyS","ArrowDown"],left:["KeyA","ArrowLeft"],right:["KeyD","ArrowRight"],drift:["ShiftLeft","ShiftRight"],item:["Space"],reset:["KeyR"],pause:["Escape"]};class pb{constructor(){this.down=new Set,this.pressed=new Set,this.binds=fb,this._keyToAction=new Map;for(const[t,e]of Object.entries(this.binds))for(const n of e)this._keyToAction.set(n,t);window.addEventListener("keydown",t=>{if(t.repeat)return;const e=this._keyToAction.get(t.code);e&&(t.preventDefault(),this.down.add(e),this.pressed.add(e))}),window.addEventListener("keyup",t=>{const e=this._keyToAction.get(t.code);e&&this.down.delete(e)}),window.addEventListener("blur",()=>this.down.clear())}isDown(t){return this.down.has(t)}wasPressed(t){return this.pressed.has(t)}endFrame(){this.pressed.clear()}}const mb=()=>typeof window<"u"&&(window.AudioContext||window.webkitAudioContext)||null;function gb(){const s=mb();let t=null,e=null,n=null,i=!1;function r(){if(s){if(!t)try{t=new s,e=t.createGain(),e.gain.value=g()?a():0,e.connect(t.destination),o(),l(),i=!0}catch{i=!1}t&&t.state==="suspended"&&t.resume()}}function a(){try{const x=parseFloat(localStorage.getItem("swr-volume"));return Number.isFinite(x)?Math.max(0,Math.min(1,x)):.6}catch{return .6}}function o(){const x=t.createOscillator();x.type="sawtooth",x.frequency.value=46;const y=t.createBiquadFilter();y.type="lowpass",y.frequency.value=380;const E=t.createGain();E.gain.value=0,x.connect(y),y.connect(E),E.connect(e),x.start(),n={osc:x,lp:y,g:E}}function l(){const x=t.sampleRate*2,y=t.createBuffer(1,x,t.sampleRate),E=y.getChannelData(0);for(let b=0;b<x;b++)E[b]=Math.random()*2-1;const A=t.createBufferSource();A.buffer=y,A.loop=!0;const w=t.createBiquadFilter();w.type="lowpass",w.frequency.value=420;const P=t.createGain();P.gain.value=.05;const L=t.createOscillator();L.frequency.value=.13;const M=t.createGain();M.gain.value=.025,L.connect(M),M.connect(P.gain),A.connect(w),w.connect(P),P.connect(e),A.start(),L.start()}function c(x,y){if(!i||!n)return;const E=t.currentTime,A=Math.min(Math.abs(x)/y,1),w=Y.audio.engineGain*A;n.g.gain.setTargetAtTime(x>.5?w:0,E,.09),n.osc.frequency.setTargetAtTime(42+A*105,E,.11),n.lp.frequency.setTargetAtTime(280+A*1300,E,.12)}const h=[],d=new Set;function u(x,y){if(!i)return;const E=setTimeout(()=>{d.delete(E),y()},x);d.add(E)}function f({f0:x=440,f1:y=null,dur:E=.12,type:A="square",gain:w=.2,sweep:P="exp"}){if(!i)return;const L=t.currentTime,M=t.createOscillator();M.type=A,M.frequency.setValueAtTime(x,L),y&&(P==="exp"?M.frequency.exponentialRampToValueAtTime(Math.max(1,y),L+E):M.frequency.linearRampToValueAtTime(y,L+E));const b=t.createGain();b.gain.setValueAtTime(w,L),b.gain.exponentialRampToValueAtTime(1e-4,L+E),M.connect(b),b.connect(e),M.start(L),M.stop(L+E+.02),h.push({stop:()=>{try{M.stop(0),b.gain.value=0}catch{}}})}function m({dur:x=.3,cutoff:y=900,gain:E=.3,sweepTo:A=120,q:w=.8}){if(!i)return;const P=t.currentTime,L=Math.max(1,Math.floor(t.sampleRate*x)),M=t.createBuffer(1,L,t.sampleRate),b=M.getChannelData(0);for(let q=0;q<L;q++)b[q]=Math.random()*2-1;const B=t.createBufferSource();B.buffer=M;const N=t.createBiquadFilter();N.type="bandpass",N.Q.value=w,N.frequency.setValueAtTime(y,P),N.frequency.exponentialRampToValueAtTime(Math.max(40,A),P+x);const U=t.createGain();U.gain.setValueAtTime(E,P),U.gain.exponentialRampToValueAtTime(1e-4,P+x),B.connect(N),N.connect(U),U.connect(e),B.start(P),B.stop(P+x+.02),h.push({stop:()=>{try{B.stop(0),U.gain.value=0}catch{}}})}const _={go:()=>{f({f0:880,f1:1320,dur:.4,type:"square",gain:.3})},count:x=>f({f0:300+(3-x)*90,dur:.14,gain:.22}),drift:()=>{m({dur:.45,cutoff:2200,sweepTo:500,gain:.24}),f({f0:220,f1:560,dur:.35,type:"sawtooth",gain:.16})},pad:()=>f({f0:340,f1:1500,dur:.5,type:"sawtooth",gain:.26}),launch:()=>f({f0:240,f1:900,dur:.5,type:"sine",gain:.3}),splash:()=>m({dur:.55,cutoff:1500,sweepTo:160,gain:.42,q:.6}),hit:()=>{m({dur:.22,cutoff:500,sweepTo:90,gain:.4,q:1.4}),f({f0:130,f1:60,dur:.2,type:"square",gain:.25})},pickup:()=>{f({f0:660,dur:.07,gain:.2}),u(70,()=>f({f0:990,dur:.09,gain:.2}))},use:()=>f({f0:520,f1:880,dur:.16,type:"triangle",gain:.24}),missile:()=>{m({dur:.6,cutoff:300,sweepTo:3600,gain:.3,q:3})},missileHit:()=>{m({dur:.3,cutoff:2600,sweepTo:220,gain:.45}),f({f0:90,dur:.25,type:"square",gain:.3})},bubble:()=>{f({f0:300,f1:150,dur:.5,type:"sine",gain:.28})},bubblePop:()=>{f({f0:900,f1:1800,dur:.1,type:"sine",gain:.2}),m({dur:.18,cutoff:4e3,sweepTo:800,gain:.18})},block:()=>{f({f0:700,f1:1100,dur:.22,type:"square",gain:.3}),f({f0:350,f1:550,dur:.3,type:"square",gain:.18})},waveBurst:()=>{m({dur:.7,cutoff:200,sweepTo:2600,gain:.4,q:1.2})},shield:()=>f({f0:400,f1:1200,dur:.4,type:"sine",gain:.24}),turbo:()=>{f({f0:200,f1:2400,dur:.7,type:"sawtooth",gain:.3}),m({dur:.7,cutoff:400,sweepTo:5e3,gain:.2})},speed:()=>f({f0:260,f1:1900,dur:.55,type:"sawtooth",gain:.3}),lap:()=>{[523,659,784].forEach((x,y)=>u(y*90,()=>f({f0:x,dur:.12,type:"square",gain:.22})))},finish:()=>{[523,659,784,1046,1318].forEach((x,y)=>u(y*110,()=>f({f0:x,dur:.16,type:"square",gain:.26})))},click:()=>f({f0:600,dur:.05,gain:.14}),falseStart:()=>{m({dur:.5,cutoff:700,sweepTo:60,gain:.55,q:1.6}),f({f0:160,f1:40,dur:.5,type:"square",gain:.34})},explosion(){i&&(m({dur:.4,cutoff:900,sweepTo:45,gain:.65,q:1.1}),f({f0:140,f1:32,dur:.42,type:"square",gain:.4}),u(60,()=>m({dur:.3,cutoff:2400,sweepTo:300,gain:.3,q:2.2})),u(140,()=>m({dur:.22,cutoff:1700,sweepTo:240,gain:.22,q:2.6})),u(30,()=>m({dur:.9,cutoff:220,sweepTo:55,gain:.4,q:.7})))},perfectStart:()=>{f({f0:300,f1:1500,dur:.45,type:"sawtooth",gain:.28}),m({dur:.3,cutoff:400,sweepTo:3200,gain:.16,q:1.1})},engineSwell(x){if(!i||!n)return;const y=t.currentTime,E=Math.max(0,Math.min(1,x));n.g.gain.setTargetAtTime(Y.audio.engineGain*(.35+.9*E),y,.1),n.osc.frequency.setTargetAtTime(42+E*30,y,.15),n.lp.frequency.setTargetAtTime(220+E*500,y,.15)},reset:()=>{f({f0:500,f1:200,dur:.3,type:"triangle",gain:.22})},trapped:()=>f({f0:180,f1:70,dur:.6,type:"sine",gain:.3})};let p=g();function g(){try{return localStorage.getItem("swr-sound")!=="0"}catch{return!0}}function v(){e&&(e.gain.value=p?a():0)}return{unlock:r,engineUpdate:c,sfx:_,stopAllSfx(){for(const x of d)clearTimeout(x);d.clear();for(const x of h)try{x.stop()}catch{}h.length=0},get ready(){return i},isEnabled:()=>p,setEnabled(x){p=!!x;try{localStorage.setItem("swr-sound",x?"1":"0")}catch{}v()},toggleSound(){p=!p;try{localStorage.setItem("swr-sound",p?"1":"0")}catch{}return v(),p},setVolume(x){try{localStorage.setItem("swr-volume",String(x))}catch{}e&&(e.gain.value=Math.max(0,Math.min(1,x)))},getVolume:a}}function gi(s,t,e){let n=0,i=0,r=0;const a=Y.water.waves;for(let l=0;l<a.length;l++){const[c,h,d,u]=a[l];if(h<2*Math.PI)continue;const f=Math.PI*2/h,m=Math.cos(u)*s+Math.sin(u)*t,_=f*m-d*e,p=Math.sin(_),g=Math.cos(_);n+=c*p,i+=c*f*g*Math.cos(u),r+=c*f*g*Math.sin(u)}const o=1/Math.sqrt(i*i+1+r*r);return{y:n,nx:-i*o,ny:o,nz:-r*o}}function _b(s){const e=[],n=[],i=[];for(let r=0;r<8;r++){const a=s[r];if(a){const[o,l,c,h]=a,d=Math.PI*2/l;e.push(o),n.push(new Q(d*Math.cos(h),d*Math.sin(h))),i.push(c)}else e.push(0),n.push(new Q(0,0)),i.push(0)}return{amps:e,kdirs:n,speeds:i,count:Math.min(s.length,8)}}function Ip(s=null){const{size:t,segments:e,colorDeep:n,colorShallow:i,crestColor:r,foamColor:a}=Y.water,o=s||Y.quality.high,l=o?o.waterSegments:e,c=new On(t,t,l,l);c.rotateX(-Math.PI/2);const h=_b(Y.water.waves),d=new an({uniforms:{uTime:{value:0},uDeep:{value:new ft(n)},uShallow:{value:new ft(i)},uCrest:{value:new ft(r)},uFoam:{value:new ft(a)},uSky:{value:new ft(Y.scene.background)},uSunDir:{value:new C(.5,.7,.35).normalize()},uFogColor:{value:new ft(Y.scene.fogColor)},uFogNear:{value:Y.scene.fogNear},uFogFar:{value:Y.scene.fogFar},uAmp:{value:h.amps},uKdir:{value:h.kdirs},uSpeed:{value:h.speeds},uWaveCount:{value:h.count},uDetail:{value:o.detailNormals?1:0}},vertexShader:`
      uniform float uTime;
      uniform float uAmp[8];
      uniform vec2 uKdir[8];
      uniform float uSpeed[8];
      uniform int uWaveCount;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vCrest;

      // CONFIG.water.waves 经 uniform 数组注入（单一来源，无手工同步）。
      float waveHeight(vec2 p, out vec3 grad) {
        float h = 0.0; grad = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          if (i >= uWaveCount) break;
          float k = length(uKdir[i]);
          if (k <= 0.0) continue;
          vec2 d = uKdir[i] / k;
          float ph = k * dot(p, d) - uSpeed[i] * uTime;
          float s = sin(ph); float c = cos(ph);
          h += uAmp[i] * s;
          grad += vec3(uAmp[i] * k * c * d.x, 0.0, uAmp[i] * k * c * d.y);
        }
        return h;
      }

      void main() {
        vec3 pos = position;
        vec3 grad;
        pos.y = waveHeight(pos.xz, grad);
        vNormal = normalize(vec3(-grad.x, 1.0, -grad.z));
        vCrest = clamp(pos.y / 0.9, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uCrest;
      uniform vec3 uFoam;
      uniform vec3 uSky;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform float uTime;
      uniform float uDetail;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vCrest;

      // ---- 程序化波纹噪声（双层：细碎近波 + 中频涌动）----
      // 梯度扰动基波法线 = "法线波纹"（无贴图，纯解析，成本极小）。
      float nhash(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = nhash(i), b = nhash(i + vec2(1, 0));
        float c = nhash(i + vec2(0, 1)), d = nhash(i + vec2(1, 1));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      // 噪声梯度（中心差分）→ 法线扰动量
      vec3 rippleNormal(vec2 p, float scale, float t, float amp) {
        float e = 0.35 / scale;
        float n0 = vnoise(p * scale + vec2(t * 0.7, t * 0.35));
        float nx = vnoise((p + vec2(e, 0.0)) * scale + vec2(t * 0.7, t * 0.35));
        float nz = vnoise((p + vec2(0.0, e)) * scale + vec2(t * 0.7, t * 0.35));
        return vec3(-(nx - n0) / e, 0.0, -(nz - n0) / e) * amp;
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);

        // ---- 细节波纹法线（Phase 6 核心：近景碎波闪动）----
        vec2 wp = vWorldPos.xz;
        if (uDetail > 0.5) {
          vec3 r1 = rippleNormal(wp, 0.45, uTime * 0.9, 0.30); // 中频涌动
          vec3 r2 = rippleNormal(wp * 1.7 + 13.7, 1.4, uTime * 1.6, 0.18); // 近景碎波
          N = normalize(N + vec3(r1.x + r2.x, 0.0, r1.z + r2.z));
        }

        // 深浅双色随坡度混合（浅滩感）
        float slope = 1.0 - N.y;
        vec3 base = mix(uDeep, uShallow, clamp(slope * 3.5, 0.0, 1.0));

        // ---- 菲涅耳 + 环境反射感（天穹色/日光带两段环境）----
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 R = reflect(-V, N);
        vec3 envUp = uSky;                                   // 朝上 = 天光
        vec3 envSun = uSky * 0.55 + uCrest * 0.45;           // 朝 = 太阳带
        float sunBand = pow(max(dot(R, uSunDir), 0.0), 6.0); // 太阳方位偏色
        vec3 env = mix(envUp, envSun, sunBand);
        base = mix(base, env, fres * 0.6);

        // 半郎伯 + 太阳高光条带（波纹法线让高光随碎波闪动）
        float lam = dot(N, uSunDir) * 0.5 + 0.5;
        base *= 0.75 + 0.35 * lam;
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 120.0);
        base += vec3(1.0, 0.98, 0.9) * spec * 1.1;

        // 波峰白帽 + 泡沫条（坡度大的地方挂泡沫，随时间蠕动）
        base = mix(base, uCrest, vCrest * vCrest * 0.35);
        if (uDetail > 0.5) {
          float foamBand = smoothstep(0.30, 0.62, slope * 2.2 + 0.22 * vnoise(wp * 0.7 + uTime * 0.4));
          base = mix(base, uFoam, clamp(foamBand, 0.0, 1.0) * 0.35);
        }

        // 手动雾
        float dist = length(cameraPosition - vWorldPos);
        float fogF = smoothstep(uFogNear, uFogFar, dist);
        vec3 col = mix(base, uFogColor, fogF);

        gl_FragColor = vec4(col, 1.0);
      }
    `}),u=new at(c,d);return u.position.y=0,u.frustumCulled=!1,{mesh:u,update(f){d.uniforms.uTime.value=f}}}function xb(s){const t=s.particles,e=new Float32Array(t*3),n=new Float32Array(t*3),i=new Float32Array(t),r=new Float32Array(t),a=new Float32Array(t),o=new Uint8Array(t);for(let m=0;m<t;m++)i[m]=0;const l=new Xt;l.setAttribute("position",new se(e,3)),l.setAttribute("aSize",new se(r,1)),l.setAttribute("aAlpha",new se(a,1)),l.setAttribute("aDark",new se(o,1));const c=new an({transparent:!0,depthWrite:!1,uniforms:{uColor:{value:new ft(Y.water.foamColor)},uPix:{value:Math.min(window.devicePixelRatio||1,2)}},vertexShader:`
      attribute float aSize;
      attribute float aAlpha;
      attribute float aDark;
      varying float vAlpha;
      varying float vDark;
      uniform float uPix;
      void main() {
        vAlpha = aAlpha;
        vDark = aDark;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPix * (140.0 / max(-mv.z, 1.0));
        gl_Position = projectionMatrix * mv;
      }
    `,fragmentShader:`
      uniform vec3 uColor;
      varying float vAlpha;
      varying float vDark;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5 || vAlpha <= 0.0) discard;
        float edge = smoothstep(0.5, 0.32, r); // 软边圆点
        vec3 col = mix(uColor, vec3(0.16, 0.15, 0.14), vDark); // 爆缸黑烟
        gl_FragColor = vec4(col, vAlpha * edge);
      }
    `}),h=new lh(l,c);h.frustumCulled=!1;let d=0;function u(m,_,p,g,v,x,y,E,A=0){if(t===0)return;const w=d;d=(d+1)%t,e[w*3]=m,e[w*3+1]=_,e[w*3+2]=p,n[w*3]=g,n[w*3+1]=v,n[w*3+2]=x,i[w]=y,r[w]=E,a[w]=1,o[w]=A}const f=(()=>{let m=12345;return()=>(m=m*16807%2147483647)/2147483647})();return{points:h,emitWake(m,_,p){const g=Math.abs(m.speed);if(g<3||m.trapped>0)return;const v=Y.spray,x=Math.min(v.wakePerSec,Math.round(g*v.wakePerSec/20)),y=-Math.sin(m.heading),E=-Math.cos(m.heading);for(let A=0;A<x;A++){if(f()>_*v.wakePerSec)continue;const w=f()<.5?1:-1,P=Math.cos(m.heading)*w,L=-Math.sin(m.heading)*w,M=m.position.x-y*1.6+P*.8,b=m.position.z-E*1.6+L*.8,B=gi(M,b,p);u(M,B.y+.15,b,-y*g*.25+(f()-.5)*1.5,1.2+f()*1.6,-E*g*.25+(f()-.5)*1.5,.5+f()*.5,5+f()*6)}if(Math.abs(m.lateral)>2.5&&g>5){const A=Math.sign(m.lateral),w=Math.cos(m.heading)*A,P=-Math.sin(m.heading)*A,L=m.position.x+w*1.1,M=m.position.z+P*1.1,b=gi(L,M,p);u(L,b.y+.2,M,w*3.5+(f()-.5)*2,2.5+f()*2.5,P*3.5+(f()-.5)*2,.5+f()*.4,7+f()*7)}},emitSplash(m,_){const p=Y.spray,g=Math.round(Math.min(p.splashMax,Math.abs(_)*p.splashPerMs));for(let v=0;v<g;v++){const x=v/Math.max(1,g)*Math.PI*2+f()*.6,y=.7+f()*.9,E=m.position.x+Math.cos(x)*y,A=m.position.z+Math.sin(x)*y,w=gi(E,A,0);u(E,Math.max(0,w.y)+.25,A,Math.cos(x)*(2+_*.12)+(f()-.5)*1.5,3+Math.abs(_)*.4+f()*2.5,Math.sin(x)*(2+_*.12)+(f()-.5)*1.5,.6+f()*.5,8+f()*8)}},emitHit(m,_){for(let p=0;p<14;p++){const g=f()*Math.PI*2;u(m+Math.cos(g)*.6,.4,_+Math.sin(g)*.6,Math.cos(g)*3.5,4+f()*3,Math.sin(g)*3.5,.5+f()*.4,7+f()*6)}},emitBlast(m,_){for(let p=0;p<26;p++){const g=f()*Math.PI*2,v=f()*.7;u(m+Math.cos(g)*v,.5+f()*.5,_+Math.sin(g)*v,Math.cos(g)*(.5+f()),2.6+f()*2.4,Math.sin(g)*(.5+f()),1.4+f()*1.2,14+f()*14,1)}for(let p=0;p<22;p++){const g=p/22*Math.PI*2+f()*.3;u(m+Math.cos(g)*.8,.4+f()*.4,_+Math.sin(g)*.8,Math.cos(g)*(2.6+f()*1.8),1.2+f()*1.6,Math.sin(g)*(2.6+f()*1.8),1.1+f()*.9,10+f()*12,1)}for(let p=0;p<18;p++){const g=p/18*Math.PI*2+f()*.25;u(m+Math.cos(g)*.6,.25,_+Math.sin(g)*.6,Math.cos(g)*4.2,4.5+f()*3,Math.sin(g)*4.2,.5+f()*.4,7+f()*7,0)}},update(m){const _=Y.spray.gravity;for(let p=0;p<t;p++){if(i[p]<=0){a[p]=0;continue}i[p]-=m;const g=p*3;o[p]?(n[g+1]+=(.6-n[g+1])*Math.min(1,2*m),n[g]*=Math.exp(-.7*m),n[g+2]*=Math.exp(-.7*m),r[p]+=9*m,a[p]=i[p]>0?Math.min(.85,i[p]*1.1):0):(n[g+1]-=_*m,e[g+1]<-.05&&(n[g+1]*=Math.exp(-3*m),n[g]*=Math.exp(-2.5*m),n[g+2]*=Math.exp(-2.5*m)),a[p]=i[p]>0?Math.min(1,i[p]*2.2):0),e[g]+=n[g]*m,e[g+1]+=n[g+1]*m,e[g+2]+=n[g+2]*m,i[p]<=0&&(a[p]=0)}l.attributes.position.needsUpdate=!0,l.attributes.aAlpha.needsUpdate=!0,l.attributes.aSize.needsUpdate=!0,l.attributes.aDark.needsUpdate=!0},liveCount(){let m=0;for(let _=0;_<t;_++)i[_]>0&&m++;return m}}}const Lp=3025446;function ws(s,t=.03){const e=new at(s.geometry,new he({color:Lp,side:Ae}));return e.scale.multiplyScalar(1+t),s.add(e),e}function Ni(s){return new ns({color:s})}function Dp(s){const t=new pe,e=new at(new Pe(1.4,.5,3),Ni(s));e.position.y=.25,ws(e,.04),t.add(e);const n=new at(new rn(.7,1.2,4),Ni(s));n.rotation.x=Math.PI/2,n.rotation.y=Math.PI/4,n.scale.y=.5,n.position.set(0,.25,-2.05),n.userData.baseY=n.position.y,n.userData.baseZ=n.position.z,n.userData.baseScale=n.scale.clone(),ws(n,.06),t.add(n);const i=new at(new Pe(1.5,.22,3.1),Ni(8376800));i.position.y=-.02,ws(i,.05),t.add(i);const r=new at(new Pe(.9,.45,1),Ni(16777215));r.position.set(0,.7,.2),ws(r,.05),t.add(r);const a=new at(new Ie(.26,10,8),Ni(14964526));a.position.set(0,1.1,.2),a.userData.baseY=a.position.y,a.userData.baseZ=a.position.z,a.userData.baseScale=a.scale.clone(),ws(a,.07),t.add(a);const o=new at(new Pe(.4,.5,.4),Ni(4475474));o.position.set(0,.4,1.55),o.userData.baseScale=o.scale.clone(),o.userData.baseY=o.position.y,ws(o,.06),t.add(o);const l=new at(new Be(.03,.03,1,6),Ni(Lp));l.position.set(.3,1.2,.5),l.userData.baseY=l.position.y,t.add(l);const c=new at(new On(.5,.3),new he({color:3519052,side:xn}));c.position.set(.55,1.55,.5),c.userData.baseY=c.position.y,c.rotation.y=Math.PI/2,t.add(c);const h=new pe;h.visible=!1,h.position.set(0,.62,-2.45);for(let ct=0;ct<12;ct++){const Et=ct%2===0,V=new at(new Pe(Et?.09:.06,Et?.09:.06,Et?1.1:.75),new he({color:Et?16773222:16739116,transparent:!0,opacity:0})),Z=ct/12*Math.PI*2;V.position.set(Math.cos(Z)*.2,Math.sin(Z)*.2,-.25),V.rotation.z=Z,V.rotation.y=Math.PI/2,V.userData.baseX=V.position.x,V.userData.baseY=V.position.y,V.userData.baseZ=V.position.z,h.add(V)}t.add(h);let d=0,u=0,f=0,m=0,_=0,p=0,g=0,v=0,x=1,y=0,E=0,A=1,w=1,P=-1/0;function L(ct){const Et=Y.raceFlow.start;d=ct;const V=1+ct*(.55+Et.swellMotorScale*.45);o.scale.set(V,V*(1+ct*.3),V),o.position.y=o.userData.baseY+ct*.14;const Z=1+ct*Et.swellBoatScale;t.scale.set(Z,Z,Z),u=(Z-1)*.55}function M(ct=1){w=Math.max(1,Math.min(2.2,ct||1))}function b(ct,Et){if(Et===P)return;P=Et;const V=Y.raceFlow.start;if(u>0&&(t.position.y+=u),d>.02&&(t.position.y+=Math.sin(Et*47)*d*V.swellShake),f>0&&(f=Math.max(0,f-ct),t.position.y+=Math.abs(Math.sin(Et*60))*.22*(f/.5)),m>0){m=Math.max(0,m-ct);const Z=m/.45,ut=1+(V.blowPopScale+.45)*Math.sin(Z*Math.PI)*Z;t.scale.set(ut,ut,ut)}if(_>0){_=Math.max(0,_-ct),p+=ct;const Z=Math.min(1,p/.45),ut=.25+1.85*Math.sin(Z*Math.PI*.72),rt=Math.max(0,1-Z*1.15);h.visible=rt>.02,h.scale.set(ut,ut,ut),h.rotation.z=Et*8;for(const vt of h.children)vt.material.opacity=rt,vt.position.x=vt.userData.baseX*(1+Z*2.2),vt.position.y=vt.userData.baseY*(1+Z*2.2),vt.position.z=vt.userData.baseZ-Z*.55}else if(h.visible){h.visible=!1;for(const Z of h.children)Z.material.opacity=0}if(g>0){v=(v||0)+ct;const Z=V.launchRestoreTime||5,ut=Math.min(1,v/Z),rt=1-ut*ut*(3-2*ut);if(ut>=1)g=0,t.scale.set(1,1,1),t.rotation.x=0;else{const vt=Math.max(.35,Math.min(1,x||1)),Nt=1+(1+vt*(V.swellBoatScale||0)-1)*rt,kt=Nt+(V.launchStretch-1)*vt*rt;t.scale.set(Nt,Nt,kt),t.translateZ(-(V.launchForward||0)*vt*rt),t.rotation.x=-.12*vt*rt}}if(y>0){E+=ct;const Z=A||V.popDriverTime||1,ut=V;if(E>Z)y=0,B();else{const rt=Math.min(1,E/Z),vt=Math.pow(1-rt,.58),Lt=Math.exp(-E/.35),Nt=Math.sin(E/(ut.popPeriod||.24)*Math.PI*2),kt=Math.max(0,vt*(1+.22*Nt*Lt));n.position.z=n.userData.baseZ-1.45*kt,n.position.y=n.userData.baseY+.42*kt+.08*Lt*Nt,n.scale.set(n.userData.baseScale.x*(1+.55*kt),n.userData.baseScale.y*(1+2.35*kt),n.userData.baseScale.z*(1+.55*kt));const j=mt=>mt*mt*(3-2*mt),I=(mt,pt,R)=>mt+(pt-mt)*R,ht=Z*.36,ot=Z*.72,nt=.05,dt=a.userData.baseZ-4.2;if(a.visible=!0,E<ht){const mt=Math.min(1,E/ht),pt=j(mt);a.position.set(.75*Math.sin(mt*Math.PI*1.15),I(a.userData.baseY,nt,pt)+5.2*Math.sin(mt*Math.PI),I(a.userData.baseZ,dt,pt)),a.rotation.set(5.6*mt*Math.PI,0,9*mt*Math.PI),a.scale.setScalar(1+1.25*Math.sin(mt*Math.PI))}else if(E<ot){const mt=Math.min(1,(E-ht)/Math.max(.01,ot-ht));a.position.set(.45*Math.sin(mt*Math.PI*2.2),nt+.08*Math.sin(E*7.5),dt+.28*Math.sin(mt*Math.PI*1.6)),a.rotation.set(.25*Math.sin(E*5),0,.5*Math.sin(E*4.2)),a.scale.setScalar(1.25+.08*Math.sin(E*6))}else{const mt=Math.min(1,(E-ot)/Math.max(.01,Z-ot)),pt=j(mt);a.visible=Math.floor(mt*14)%2===0||mt>.88,a.position.set(I(0,0,pt),I(nt,a.userData.baseY,pt),I(dt,a.userData.baseZ,pt)),a.rotation.set(0,0,(1-pt)*6),a.scale.setScalar(1+(1-pt)*.55)}l.position.y=l.userData.baseY+.1*Lt*(1-Nt)*.5,c.position.y=c.userData.baseY+.1*Lt*(1-Nt)*.5,t.position.y+=.12*Lt*Math.abs(Nt),t.rotation.x=-.08*Lt*Nt}}w>1.001&&(t.scale.multiplyScalar(w),t.position.y+=(w-1)*.55)}function B(){n.position.z=n.userData.baseZ,n.position.y=n.userData.baseY,n.scale.copy(n.userData.baseScale),a.position.set(0,a.userData.baseY,a.userData.baseZ),a.rotation.set(0,0,0),a.scale.copy(a.userData.baseScale),a.visible=!0,l.position.y=l.userData.baseY,c.position.y=c.userData.baseY,U()}function N(){n.position.z=n.userData.baseZ,n.position.y=n.userData.baseY,n.scale.copy(n.userData.baseScale),a.position.set(0,a.userData.baseY,a.userData.baseZ),a.rotation.set(0,0,0),a.scale.copy(a.userData.baseScale),a.visible=!0,l.position.y=l.userData.baseY,c.position.y=c.userData.baseY}function U(){h.visible=!1;for(const ct of h.children)ct.material.opacity=0}function q(){y<=0&&g<=0&&B()}const z=()=>y>0||g>0,X=()=>({spring:y>0,springT:E,launch:{active:g>0,power:x,t:v},itemScale:w,bow:{z:n.position.z-n.userData.baseZ,y:n.position.y-n.userData.baseY,scale:n.scale.y/n.userData.baseScale.y},blast:{visible:h.visible,scale:h.scale.x,opacity:h.children[0]?.material.opacity||0},driver:{y:a.position.y-a.userData.baseY,z:a.position.z-a.userData.baseZ,visible:a.visible,tumble:a.rotation.z,landed:a.position.y<a.userData.baseY-.7}});function W(){f=.5,m=.45,_=.45,p=0}function _t(ct=1){y=1,E=0,A=Math.max(.35,Math.min(1,ct||1)),N()}function yt(ct=1){g=1,v=0,x=Math.max(.35,Math.min(1,ct||1))}function it(ct){ct&&ct.launchPop&&(ct.launchPop=!1,yt(ct.launchPower||ct.swell||1),ct.launchPower=0)}return{group:t,flag:c,setEngineSwell:L,setItemScale:M,applySwellShake:b,triggerBlowUp:W,triggerSpringHead:_t,restoreHead:q,animActive:z,animState:X,triggerLaunchStretch:yt,syncLaunchPop:it,collider:{type:"cylinder",radius:1.1,halfHeight:.4}}}class Up{constructor(t,e,n={}){this.obj=t,this.view=n.view||null,this.input=e,this.track=n.track||null,this.features=n.features||null,this.race=n.race||null,this.raceId=n.raceId||null,this.collision=n.collision||null,this.mates=n.mates||null,this.position=new C(0,0,0),this.heading=0,this.speed=0,this.lateral=0,this.steer=0,this.roll=0,this.pitch=0,this.bobPhase=Math.random()*Math.PI*2,this.drifting=!1,this.driftTime=0,this.driftCharge=0,this.driftBoost=0,this.padBoost=0,this.airborne=!1,this.airV=0,this.airPos=0,this.splashUp=0,this.lastEvent=null,this._hitCool=-9,this.itemSpeed=0,this.shield=0,this.trapped=0,this._trappedFrom=0,this.item=null,this.turboLeft=0,this.starBoostLeft=0,this.lightningSlow=0,this.giantTime=0,this.giantShrink=0,this.giantScale=1,this._arcReanchor=!1,this.onSplash=null,this.blownUp=0,this.popT=0,this.popDur=1,this.startBoost=0,this.startBoostAdd=0,this.startBoostForce=0,this.launchPop=!1,this.launchPower=0,this.swell=0,this._vel=new C}setPose(t,e){this.position.copy(t),this.heading=e,this.speed=0,this.lateral=0,this.steer=0,this.drifting=!1,this.driftTime=0,this.driftCharge=0,this.driftBoost=0,this.airborne=!1,this.airV=0,this.airPos=0,this.splashUp=0,this.itemSpeed=0,this.turboLeft=0,this.starBoostLeft=0,this.lightningSlow=0,this.giantTime=0,this.giantShrink=0,this.giantScale=1,this.view?.setItemScale&&this.view.setItemScale(1),this.shield=0,this.trapped=0}_throttle(){return(this.override?.throttle??(this.input.isDown("throttle")?1:0))-(this.override?.brake??(this.input.isDown("brake")?1:0))}_steerInput(){return this.override?.steer??(this.input.isDown("right")?1:0)-(this.input.isDown("left")?1:0)}_driftHeld(){return this.override?.drift??(this.input.isDown("drift")?1:0)}update(t,e){const n=Y.boat,i=n.drift,r=n.air,a=!this.race||this.race.started!==!1,o=Y.items;if(a){if(this.starBoostLeft>0&&(this.starBoostLeft=Math.max(0,this.starBoostLeft-t)),this.lightningSlow>0){this.lightningSlow=Math.max(0,this.lightningSlow-t);const U=o.lightning?.slowDecay??1.1;this.speed*=Math.exp(-U*t),this.lateral*=Math.exp(-U*.8*t)}if(this.giantTime>0){const U=this.giantTime;this.giantTime=Math.max(0,this.giantTime-t),U>0&&this.giantTime===0&&(this.giantShrink=Math.max(this.giantShrink||0,o.giant?.shrinkTime??2))}else this.giantShrink>0&&(this.giantShrink=Math.max(0,this.giantShrink-t))}const l=o.giant?.scale??1.5,c=Math.max(.01,o.giant?.shrinkTime??2);if(this.giantScale=this.giantTime>0?l:this.giantShrink>0?1+(l-1)*(this.giantShrink/c):1,this.view?.setItemScale&&this.view.setItemScale(this.giantScale),this.popT>0){this.popT=Math.max(0,this.popT-t),this.speed=0,this.lateral=0;const U=gi(this.position.x,this.position.z,e);return this.position.y+=(U.y+.18-this.position.y)*Math.min(1,4*t),this.obj.position.copy(this.position),this.obj.rotation.set(this.pitch,this.heading,this.roll,"YXZ"),this.view?.setEngineSwell&&this.view.setEngineSwell(0),this.view?.applySwellShake&&this.view.applySwellShake(t,e),this}if(this.trapped>0){this.trapped-=t,this.trapped<=0&&(this.trapped=0,this.speed>Y.items.bubble.popDrop&&(this.speed=Y.items.bubble.popDrop),this.lastEvent="bubblepop");const U=gi(this.position.x,this.position.z,e);return this.position.y+=(U.y+.18-this.position.y)*Math.min(1,4*t),this.lateral*=Math.exp(-3*t),this.drifting=!1,this.driftCharge=0,this.driftTime=0,this.obj.position.copy(this.position),this.obj.rotation.set(this.pitch,this.heading,this.roll,"YXZ"),this}this.shield>0&&(this.shield=Math.max(0,this.shield-t)),this.startBoost>0&&a&&(this.startBoost=Math.max(0,this.startBoost-t)),this.blownUp>0&&(this.blownUp=Math.max(0,this.blownUp-t)),this.turboLeft>0?(this.turboLeft-=t,this.turboLeft<=0&&this.itemSpeed>0&&(this.itemSpeed=0)):this.itemSpeed>0&&(this.itemSpeed=Math.max(0,this.itemSpeed-Y.items.speed.decay*this.itemSpeed*t));const h=this._steerInput(),d=!!this._driftHeld()&&a&&!this.airborne&&Math.abs(this.speed)>=i.minSpeed&&Math.abs(h)>.5;if(d?(this.drifting||(this.driftTime=0),this.driftTime+=t,this.driftCharge=Math.min(i.chargeMax,this.driftCharge+i.chargePerSec*t)):this.drifting&&(this.driftTime>=i.minHold&&this.speed>0&&(this.driftBoost=Math.min(i.boostMax/i.boostForce,this.driftCharge),this.lastEvent="driftboost"),this.driftCharge=0,this.driftTime=0),this.drifting=d,this.driftBoost>0&&(this.driftBoost=Math.max(0,this.driftBoost-t)),this.padBoost>0){const U=Y.trackFeatures.boost;this.padBoost=Math.max(0,this.padBoost-U.decay*this.padBoost*t)}const u=this.startBoost>0&&this.startBoostAdd||0,f=this.starBoostLeft>0&&Y.items.stars?.speedAdd||0,m=this.giantTime>0&&Y.items.giant?.speedAdd||0;let _=n.maxSpeed+this.padBoost+(this.itemSpeed||0)+f+m+(this.driftBoost>0?i.boostForce:0)+u;this.blownUp>0&&(_=Math.min(_,8));let p=a?this._throttle():0;this.blownUp>0&&p>0&&(p=0),this.airborne?(this.airV-=r.gravity*t,this.airPos+=this.airV*t,this.airPos<=0&&(this.airborne=!1,this.airPos=0,Math.abs(this.airV)>r.splashSpeed&&(this.lastEvent="splash"),this.onSplash?.(this.airV),this.splashUp=Math.min(r.splashUpTime,Math.abs(this.airV)*.1),this.speed*=r.splashSlow,this.airV=0)):(this.startBoost>0&&p>0&&(this.speed+=(this.startBoostForce||0)*t),p>0?this.speed+=n.accel*t:p<0&&(this.speed>.5?this.speed-=n.brake*t:this.speed-=n.accel*.5*t),p===0&&(this.speed*=Math.exp(-(d?i.drag:n.drag)*t),Math.abs(this.speed)<.05&&(this.speed=0))),this.speed=Ts.clamp(this.speed,-n.maxReverse,_);const g=Ts.clamp(Math.abs(this.speed)/n.turnSpdRef,0,1);this.steer+=(h-this.steer)*Math.min(1,n.inertiaLerp*t);const v=d?i.turnBoost:1,x=this.steer*n.turnRate*g*v*(this.speed<0?-1:1);this.heading-=x*t;const y=new C(-Math.sin(this.heading),0,-Math.cos(this.heading)),E=new C(Math.cos(this.heading),0,-Math.sin(this.heading));if(d?(this.lateral+=-x*this.speed*i.latInject*t,this.lateral=Ts.clamp(this.lateral,-i.latClamp,i.latClamp)):(this.lateral+=-x*this.speed*.35*t,this.lateral*=Math.exp(-2.8*t)),this._vel.copy(y).multiplyScalar(this.speed).addScaledVector(E,this.lateral),this.position.addScaledVector(this._vel,t),!this.airborne&&this.features&&this.track){const U=this.track.nearest(this.position.x,this.position.z),q=this.features.rampAt(U.arc,U.dist,U.side);if(q&&U.arc>=q.ramp.arc-2&&this.speed>=r.launchMinSpeed&&(this.airborne=!0,this.airPos=Math.max(0,q.h),this.airV=2.2+Math.min(this.speed,34)*(r.airVScale??.14)+q.ramp.height*1.6,this.lastEvent="launch"),this.race&&this.raceId){const z=this.race.entryOf(this.raceId);if(z&&z._arcN!==void 0&&z._arcFeat!==void 0&&this.features.checkBoostCrossing(z._arcFeat,z._arcN,U.dist,this.track.length,this.race.time)){const W=Y.trackFeatures.boost;this.padBoost=Math.min(W.maxTotal,this.padBoost+W.speedAdd),this.lastEvent="boostpad"}z&&(z._arcFeat=z._arcN)}}if(this.collision&&!this.airborne){const U={x:this._vel.x,z:this._vel.z};if(this.collision.resolveObstacles(this.position,U)){const X={x:-Math.sin(this.heading),z:-Math.cos(this.heading)},W={x:Math.cos(this.heading),z:-Math.sin(this.heading)};this.speed=U.x*X.x+U.z*X.z,this.lateral=U.x*W.x+U.z*W.z,this._flagHit(e)}const z=this.mates?this.mates():[];z.length&&this.collision.resolveBoatPairs([this,...z]).length&&this._flagHit(e)}const A=gi(this.position.x,this.position.z,e);let w=0;if(this.splashUp>0){this.splashUp=Math.max(0,this.splashUp-t);const U=this.splashUp/r.splashUpTime;w=Math.sin(U*Math.PI)*.6}const P=Math.sin(e*n.bobFreq+this.bobPhase)*.06*(1-Math.min(Math.abs(this.speed)/n.maxSpeed,1)*.6);if(this.airborne)this.position.y=A.y+.18+this.airPos;else{const U=A.y+.18+P+w;this.position.y+=(U-this.position.y)*Math.min(1,6*t)}const L=gi(this.position.x-.8,this.position.z,e),M=gi(this.position.x+.8,this.position.z,e);let b=Math.atan2(M.y-L.y,1.6)*.8;const B=-this.steer*g*(d?.36:.18);let N=Ts.clamp(p*.08,-.1,.12);return this.airborne&&(N=Ts.clamp(-this.airV*.03,-.35,.3)),this.splashUp>0&&(N=-.18),this.roll+=(b+B-this.roll)*Math.min(1,n.pitchLerp*t),this.pitch+=(N-this.pitch)*Math.min(1,n.pitchLerp*t),this.obj.position.copy(this.position),this.obj.rotation.set(this.pitch,this.heading,this.roll,"YXZ"),this.view?.setEngineSwell&&this.view.setEngineSwell(this.swell||0),this}_flagHit(t){t-this._hitCool>.5&&(this.lastEvent="hit",this._hitCool=t)}get speedKmh(){return Math.abs(this.speed)*3.6}}class vb{constructor(t){this.cam=t,this.focus=new C,this._desired=new C,this._lookAt=new C,this._initialized=!1}update(t,e){const n=Y.followCam,i=Math.min(Math.abs(e.speed)/Y.boat.maxSpeed,1),r=n.backDist*(1+i*n.speedPush*2),a=n.height*(1+i*n.speedPush);this._desired.set(e.position.x+Math.sin(e.heading)*r,e.position.y+a,e.position.z+Math.cos(e.heading)*r),this._initialized||(this.cam.position.copy(this._desired),this.focus.copy(e.position),this._initialized=!0);const o=1-Math.exp(-n.posLerp*t);this.cam.position.lerp(this._desired,o),this._lookAt.set(e.position.x-Math.sin(e.heading)*i*6,e.position.y+n.lookHeight,e.position.z-Math.cos(e.heading)*i*6);const l=1-Math.exp(-n.lookLerp*t);this.focus.lerp(this._lookAt,l),this.cam.lookAt(this.focus);const c=e.position.y+1.2;this.cam.position.y<c&&(this.cam.position.y=c)}}function yb(){const s=new pe,t=new Ie(480,24,16),e=new an({side:Ae,depthWrite:!1,fog:!1,uniforms:{uTop:{value:new ft(6797288)},uHorizon:{value:new ft(12575730)},uWarm:{value:new ft(16771012)},uSunDir:{value:new C(.5,.7,.35).normalize()}},vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uWarm; uniform vec3 uSunDir;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.7));
        // 地平线暖色带
        col = mix(col, uWarm, smoothstep(0.12, 0.0, vDir.y));
        // 太阳光晕
        float s = max(dot(normalize(vDir), uSunDir), 0.0);
        col += vec3(1.0, 0.9, 0.7) * pow(s, 200.0) * 1.2;
        col += vec3(1.0, 0.85, 0.6) * pow(s, 8.0) * 0.15;
        gl_FragColor = vec4(col, 1.0);
      }
    `}),n=new at(t,e);return n.frustumCulled=!1,s.add(n),s}function Mb(s){const e=a=>new ns({color:a}),n=(a,o=.04)=>{const l=new at(a.geometry,new he({color:3025446,side:Ae}));l.scale.multiplyScalar(1+o),a.add(l)},i=bb(20250923),r=new pe;for(let a=0;a<14;a++){const o=a/14*Math.PI*2+i()*.4,l=220+i()*130,c=new pe,h=new at(new rn(6+i()*10,8+i()*14,7),e(9083758));if(h.position.y=2,n(h,.03),c.add(h),i()>.4){const d=new at(new Be(.4,.6,6,6),e(10251071));d.position.y=10,c.add(d);const u=new at(new Ie(2.4,8,6),e(3519052));u.scale.y=.5,u.position.y=13.2,n(u,.06),c.add(u)}c.position.set(Math.cos(o)*l,0,Math.sin(o)*l),r.add(c)}return s.add(r),r}function bb(s){let t=s>>>0;return function(){t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Sb=[[0,-140],[80,-130],[140,-90],[150,-20],[110,30],[60,60],[20,110],[-40,140],[-110,130],[-150,80],[-140,10],[-90,-40],[-60,-90],[-20,-140]],be=15,wb=3;class Ab{constructor(t={}){this.configure(t)}configure(t={}){this.map={id:t.id||"cartoon-bay",name:t.name||"卡通海湾环线",style:t.style||"bay",difficulty:t.difficulty||1,controlPoints:t.controlPoints||Sb},this.curve=new hh(this.map.controlPoints.map(([e,n])=>new C(e,0,n)),!0,"centripetal",.5),this.length=this.curve.getLength(),this.SAMPLES=800,this.points=this.curve.getSpacedPoints(this.SAMPLES).slice(0,this.SAMPLES),this.CP_COUNT=10,this.checkpoints=[];for(let e=0;e<this.CP_COUNT;e++){const n=e/this.CP_COUNT,i=this.curve.getPointAt(n),r=this.curve.getTangentAt(n).normalize();this.checkpoints.push({index:e,t:n,pos:i.clone(),tangent:r,normal:new C(-r.z,0,r.x)})}return this.startLine=this.checkpoints[0],this}nearest(t,e,n=-1){const i=this.points,r=this.SAMPLES;let a=-1,o=1/0;if(n>=0){const c=Math.round(n*r);for(let m=-8;m<=8;m++){const _=((c+m)%r+r)%r,p=this._segProj(t,e,_);p.d2<o&&(o=p.d2,a=_)}let h=1/0;for(let m=0;m<r;m+=4){const _=i[m],p=_.x-t,g=_.z-e,v=p*p+g*g;v<h&&(h=v)}const d=this.length/r/2,u=Math.sqrt(h)-d,f=Math.sqrt(o);u<f-1e-9&&(a=-1)}if(a<0){o=1/0;for(let l=0;l<r;l++){const c=this._segProj(t,e,l);c.d2<o&&(o=c.d2,a=l)}}return this._segResult(t,e,a)}_segProj(t,e,n){const i=this.points,r=i[n],a=i[(n+1)%this.SAMPLES],o=a.x-r.x,l=a.z-r.z,c=o*o+l*l;let h=0;c>1e-12&&(h=Math.max(0,Math.min(1,((t-r.x)*o+(e-r.z)*l)/c)));const d=r.x+o*h,u=r.z+l*h,f=t-d,m=e-u;return{d2:f*f+m*m,u:h,i:n}}_segResult(t,e,n){const i=this.points,r=this.SAMPLES,a=this._segProj(t,e,n),o=i[n],l=i[(n+1)%r],c=l.x-o.x,h=l.z-o.z,d=Math.sqrt(c*c+h*h)||1,u=c/d,f=h/d,m=o.x+c*a.u,_=o.z+h*a.u,p=t-m,g=e-_,v=p*u+g*f,x=p*-f+g*u,y=d/2,E=Math.max(-y,Math.min(y,v)),A=(n+a.u)/r*this.length+E;return{t:(A/this.length%1+1)%1,arc:A,dist:Math.abs(x),side:Math.sign(x),hint:((n+a.u)/r%1+1)%1}}pointAt(t){return this.curve.getPointAt((t%1+1)%1)}tangentAt(t){return this.curve.getTangentAt((t%1+1)%1).normalize()}isOnTrack(t,e,n=0){return this.nearest(t,e).dist<=be+n}}const fc=[["贝壳杯","珊瑚海湾"],["浪花杯","礁石峡谷"],["星潮杯","跳台群岛"],["泡泡杯","月牙潟湖"],["海风杯","彩带水道"],["灯塔杯","回旋港"]];function Tb(s=3,t=Date.now()^Math.floor(Math.random()*1e9)){const e=Cb(t>>>0),n=["speed","technical","islands"],i=[];for(let r=0;r<s;r++){const a=n[r%n.length];i.push(Eb(a,r,e))}return i}function Eb(s="speed",t=0,e=Math.random){const n=fc[(t+Math.floor(e()*fc.length))%fc.length],i={speed:{pts:13,base:142,amp:22,wobble:.13,difficulty:1,label:"高速宽弯"},technical:{pts:16,base:132,amp:34,wobble:.22,difficulty:2,label:"连续 S 弯"},islands:{pts:15,base:150,amp:30,wobble:.18,difficulty:3,label:"跳台群岛"}}[s]||{pts:14,base:140,amp:26,wobble:.16,difficulty:1,label:"随机水道"},r=[],a=i.base+Fi(e,-8,8);r.push([0,-a]);for(let o=1;o<i.pts;o++){let c=-Math.PI/2+o/i.pts*Math.PI*2+Fi(e,-i.wobble,i.wobble),h=i.base+Math.sin(o*1.7+e()*2)*i.amp+Fi(e,-i.amp*.45,i.amp*.45);s==="technical"?(h+=(o%2===0?1:-1)*Fi(e,12,24),c+=(o%3===0?1:-1)*Fi(e,.04,.1)):s==="islands"?(h+=Math.sin(o*2.4)*18,(o===5||o===10)&&(h-=Fi(e,18,28))):(o===3||o===9)&&(h+=Fi(e,14,26)),h=Math.max(86,Math.min(188,h)),r.push([_d(Math.cos(c)*h),_d(Math.sin(c)*h)])}return r.length>=3&&(r[1][0]=Math.max(48,Math.abs(r[1][0]))*Math.sign(r[1][0]||1),r[r.length-1][0]=-Math.max(36,Math.abs(r[r.length-1][0]))),{id:`${s}-${t}-${Math.floor(e()*1e6).toString(36)}`,name:`${n[0]} · ${n[1]}`,style:s,label:i.label,difficulty:i.difficulty,controlPoints:r}}function Fi(s,t,e){return t+s()*(e-t)}function _d(s){return Math.round(s*10)/10}function Cb(s){return function(){let e=s+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}class Rb{constructor(t){this.track=t,this.rebuild(t)}rebuild(t=this.track){this.track=t,this.boosts=[.1,.42,.8].map((n,i)=>({index:i,t:n,arc:n*t.length,halfWidth:Y.trackFeatures.boost.padHalfWidth,length:Y.trackFeatures.boost.padLength,lastTrigger:-1/0}));const e=Y.trackFeatures.ramps;return this.ramps=e.map((n,i)=>{const r=t.pointAt(n.t),a=t.tangentAt(n.t);return{index:i,t:n.t,arc:n.t*t.length,height:n.height,pos:r,tangent:a,normal:new C(-a.z,0,a.x),halfWidth:be*.6}}),this}rampAt(t,e){for(const n of this.ramps){const i=t-n.arc;if(i<-8||i>2||Math.abs(e)>n.halfWidth)continue;const r=(i+8)/10;return{ramp:n,h:n.height*r,along01:r}}return null}checkBoostCrossing(t,e,n,i,r){let a=null;const o=c=>(c%i+i)%i,l=o(e-t);if(l<=0||l>25)return null;for(const c of this.boosts){const h=o(c.arc-o(t));if(h>0&&h<=l){if(n>c.halfWidth||r-c.lastTrigger<=Y.trackFeatures.boost.cooldown)continue;c.lastTrigger=r,a=c}}return a}}const Np=3025446,Ce=s=>new ns({color:s});function Rn(s,t=.05){const e=new at(s.geometry,new he({color:Np,side:Ae}));e.scale.multiplyScalar(1+t),s.add(e)}function Fp(s,t){const e=new pe;t.add(e);{const r=[],a=[];for(let h=0;h<=240;h++){const d=h/240,u=s.curve.getPointAt(d),f=s.curve.getTangentAt(d),m=-f.z,_=f.x;for(const p of[-1,1])r.push(u.x+m*be*p,.02,u.z+_*be*p);if(h<240){const p=h*2;a.push(p,p+1,p+2,p+1,p+3,p+2)}}const o=new Xt;o.setAttribute("position",new Pt(r,3)),o.setIndex(a);const l=new he({color:9427176,transparent:!0,opacity:.45,depthWrite:!1}),c=new at(o,l);c.renderOrder=1,e.add(c)}const n=[];for(let r=0;r<120;r++){const a=r/120,o=s.curve.getPointAt(a),l=s.curve.getTangentAt(a),c=-l.z,h=l.x;for(const d of[-1,1]){const u=new pe,f=d<0,m=new at(new Ie(.7,10,8),Ce(f?14964526:3519052));m.position.y=.2,Rn(m,.08),u.add(m);const _=new at(new Be(.05,.05,1.1,5),Ce(Np));_.position.y=1,u.add(_),u.position.set(o.x+c*be*d,0,o.z+h*be*d),u.userData.base=u.position.clone(),e.add(u),n.push(u)}}{const i=s.startLine,r=new pe;for(const d of[-1,1]){const u=new at(new Be(.5,.6,9,8),Ce(14964526));u.position.set(i.normal.x*be*d,4.5,i.normal.z*be*d),Rn(u,.04),r.add(u)}const a=new at(new Pe(be*2,2.2,.4),Ce(16777215));a.position.y=8.5,a.rotation.y=Math.atan2(i.tangent.x,i.tangent.z),Rn(a,.03),r.add(a);const o=document.createElement("canvas");o.width=256,o.height=64;const l=o.getContext("2d");for(let d=0;d<4;d++)for(let u=0;u<16;u++)l.fillStyle=(u+d)%2?"#2e2a26":"#f6efe2",l.fillRect(u*16,d*16,16,16);a.material=[Ce(16777215),Ce(16777215),new he({map:new Ya(o)}),Ce(16777215),Ce(16777215),Ce(16777215)],r.position.copy(i.pos),e.add(r);const c=new On(be*2,1.6);c.rotateX(-Math.PI/2),c.rotateY(Math.atan2(i.tangent.x,i.tangent.z));const h=new at(c,new he({map:new Ya(o),transparent:!0,opacity:.9,depthWrite:!1}));h.position.set(i.pos.x,.05,i.pos.z),h.renderOrder=2,e.add(h)}for(const i of s.checkpoints){if(i.index===0)continue;const r=new pe;for(const o of[-1,1]){const l=new at(new Be(.25,.3,5,6),Ce(16038210));l.position.set(i.normal.x*be*o,2.5,i.normal.z*be*o),Rn(l,.06),r.add(l)}const a=new at(new Pe(be*2,.5,.5),Ce(16038210));a.position.y=4.8,a.rotation.y=Math.atan2(i.tangent.x,i.tangent.z),Rn(a,.06),r.add(a),r.position.copy(i.pos),r.userData.cp=i.index,e.add(r)}{const i=new pe,r=new at(new rn(26,22,9),Ce(9083758));r.position.y=6,Rn(r,.02),i.add(r);const a=new at(new Be(30,34,2,12),Ce(15916974));a.position.y=-.5,i.add(a);for(let o=0;o<5;o++){const l=o/5*Math.PI*2,c=new at(new Be(.4,.7,8,6),Ce(10251071));c.position.set(Math.cos(l)*16,6,Math.sin(l)*16),c.rotation.z=Math.cos(l)*.18,i.add(c);const h=new at(new Ie(3,8,6),Ce(3519052));h.scale.y=.45,h.position.set(Math.cos(l)*16+Math.cos(l)*1.4,10.3,Math.sin(l)*16+Math.sin(l)*1.4),Rn(h,.05),i.add(h)}e.add(i)}for(let i=0;i<5;i++){const r=.55+i*.035,a=s.curve.getPointAt(r),o=s.curve.getTangentAt(r),l=-o.z,c=o.x,h=i%2===0?1:-1,d=new at(new Be(.6,.8,3.4,7),Ce(10251071));d.position.set(a.x+l*be*.45*h,1,a.z+c*be*.45*h),Rn(d,.04),e.add(d)}for(const i of Y.trackFeatures.ramps){const r=s.pointAt(i.t),a=s.tangentAt(i.t),o=new pe,l=new at(new Pe(be*1.2,.5,10),Ce(15916974));l.rotation.x=-Math.atan2(i.height,10),l.position.set(0,i.height/2,-4+i.height/2*.4),Rn(l,.03),o.add(l);const c=new at(new Pe(be*1.2,.6,1.6),Ce(14964526));c.position.set(0,i.height,.4),Rn(c,.05),o.add(c);for(const h of[-1,1]){const d=new at(new Be(.08,.08,2.4,5),Ce(3025446));d.position.set(be*.6*h,i.height+1.2,.4),o.add(d);const u=new at(new Pe(1.2,.7,.06),Ce(16038210));u.position.set(be*.6*h+.6,i.height+2,.4),o.add(u)}o.position.set(r.x,0,r.z),o.rotation.y=Math.atan2(a.x,a.z),e.add(o)}{const i=document.createElement("canvas");i.width=128,i.height=256;const r=i.getContext("2d");r.clearRect(0,0,128,256),r.fillStyle="#f4b942",r.strokeStyle="#2e2a26",r.lineWidth=6;for(const o of[200,120,40])r.beginPath(),r.moveTo(64,o-40),r.lineTo(112,o+16),r.lineTo(84,o+16),r.lineTo(84,o+48),r.lineTo(44,o+48),r.lineTo(44,o+16),r.lineTo(16,o+16),r.closePath(),r.fill(),r.stroke();const a=new Ya(i);for(const o of[.1,.42,.8]){const l=s.pointAt(o),c=s.tangentAt(o),h=new On(Y.trackFeatures.boost.padHalfWidth*2,Y.trackFeatures.boost.padLength);h.rotateX(-Math.PI/2),h.rotateY(Math.atan2(c.x,c.z)+Math.PI);const d=new at(h,new he({map:a,transparent:!0,opacity:.85,depthWrite:!1}));d.position.set(l.x,.06,l.z),d.renderOrder=2,e.add(d)}}return{group:e,buoys:n,update(i){for(const r of n){const a=r.userData.base;r.position.y=.15+.5*Math.sin(a.x*.15+i*1.1)*Math.cos(a.z*.13+i*.9)}}}}const xd=()=>Y.trackFeatures.colliderRadius;class Pb{constructor(t){this.track=t,this.obstacles=[],this.rebuild(t)}rebuild(t=this.track){this.track=t,this.obstacles=[];for(let e=0;e<5;e++){const n=.55+e*.035,i=t.curve.getPointAt(n),r=t.curve.getTangentAt(n),a=e%2===0?1:-1,o=-r.z,l=r.x;this.obstacles.push({x:i.x+o*15*.45*a,z:i.z+l*15*.45*a,r:.85,kind:"stake"})}return this.obstacles.push({x:0,z:0,r:30,kind:"island"}),this}addObstacle(t,e,n,i="rock"){return this.obstacles.push({x:t,z:e,r:n,kind:i}),this.obstacles[this.obstacles.length-1]}resolveObstacles(t,e){const n=xd(),i=Y.trackFeatures.obBounce,r=Y.trackFeatures.obSpeedKeep;let a=null;for(const o of this.obstacles){let l=t.x-o.x,c=t.z-o.z;const h=Math.hypot(l,c),d=o.r+n;if(h>=d)continue;h<1e-6&&(l=1,c=0);const u=l/(h||1),f=c/(h||1);t.x=o.x+u*d,t.z=o.z+f*d;const m=e.x*u+e.z*f;m<0&&(e.x-=(1+i)*m*u,e.z-=(1+i)*m*f,e.x*=r,e.z*=r),a={kind:o.kind,nx:u,nz:f}}return a}resolveBoatPairs(t){const e=[],n=xd(),i=Y.trackFeatures.boatDeflect;for(let r=0;r<t.length;r++)for(let a=r+1;a<t.length;a++){const o=t[r],l=t[a];if(o.airborne||l.airborne)continue;let c=l.position.x-o.position.x,h=l.position.z-o.position.z,d=Math.hypot(c,h);const u=n*2;if(d>=u)continue;d<1e-6&&(c=1,h=0,d=1e-6);const f=c/d,m=h/d,_=(u-d)/2;o.position.x-=f*_,o.position.z-=m*_,l.position.x+=f*_,l.position.z+=m*_;const p=vd(o),g=vd(l),v=p.x*f+p.z*m,y=(g.x*f+g.z*m-v)*.5*i;y!==0&&(yd(o,f*y,m*y),yd(l,-f*y,-m*y)),e.push({a:r,b:a,nx:f,nz:m})}return e}}function vd(s){const t=-Math.sin(s.heading),e=-Math.cos(s.heading),n=Math.cos(s.heading),i=-Math.sin(s.heading);return{x:t*s.speed+n*s.lateral,z:e*s.speed+i*s.lateral}}function yd(s,t,e){const n=-Math.sin(s.heading),i=-Math.cos(s.heading),r=Math.cos(s.heading),a=-Math.sin(s.heading);s.speed+=t*n+e*i,s.lateral+=t*r+e*a}const Md=25,Ib=(s,t,e)=>Math.max(t,Math.min(e,s));class Lb{constructor(t,e){this.track=t,this.laps=wb,this.time=0,this.started=!1,this.phase="countdown",this.countdown=Y.raceFlow.countdown,this._goLeft=0,this.finishedOrder=[],this.held={},this.heldSince={},this.perfectStart={},this.blown={},this.entries=e.map(n=>({...n,nextCp:1,lap:1,progress:0,total:0,lapStart:0,bestLap:null,finished:!1,finishTime:null,place:1,offCourse:0,outOfBounds:!1,_arcN:void 0,_s:0,_s_prev:0,_hint:void 0})),this.rebuildTrackGeometry(),this._placeSorted=[],this.event=null}rebuildTrackGeometry(t=this.track){this.track=t,this.cpArc=t.checkpoints.map(n=>(t.nearest(n.pos.x,n.pos.z).arc%t.length+t.length)%t.length);let e=0;for(let n=0;n<t.points.length;n++){const i=t.points[n],r=t.points[(n+1)%t.points.length];e+=i.x*r.z-r.x*i.z}return this._insideSign=e>0?1:-1,this}_racingLinePoint(t,e,n){const r=((this.track.nearest(t.x,t.z).t+e/this.track.length)%1+1)%1,a=this.track.pointAt(r),o=this.track.tangentAt(r);return{x:a.x+this._insideSign*-o.z*n,z:a.z+this._insideSign*o.x*n,t:r}}_nearestCpIndex(t){const e=this.track.length;let n=0,i=1/0;for(const r of this.track.checkpoints){let a=Math.abs(this.cpArc[r.index]-t);a=Math.min(a,e-a),a<i&&(i=a,n=r.index)}return n}placeAtCheckpoint(t,e){const n=this.track.checkpoints[e],i=n.pos.clone();i.y=.2,t.boat.setPose?.(i,Math.atan2(-n.tangent.x,-n.tangent.z)),t.boat.lateral=0,t.offCourse=0,t.outOfBounds=!1;const r=(this.cpArc[e]%this.track.length+this.track.length)%this.track.length;return t._s=r,t._s_prev=r,t._arcN=r,t.progress=r/this.track.length,t}autopilotKeys(t,e=18,n=4){const i=this._racingLinePoint(t.boat.position,e,n),r=Math.atan2(-(i.x-t.boat.position.x),-(i.z-t.boat.position.z)),a=Math.atan2(Math.sin(r-t.boat.heading),Math.cos(r-t.boat.heading)),o=((i.t-8/this.track.length)%1+1)%1,l=((i.t+8/this.track.length)%1+1)%1,c=this.track.tangentAt(o),h=this.track.tangentAt(l),d=Math.abs(Math.atan2(c.x*h.z-c.z*h.x,c.x*h.x+c.z*h.z));return{throttle:Math.abs(a)<.5&&d<.02?1:0,steer:Math.max(-1,Math.min(1,a*2))}}updateAi(t){const e=Y.ai;for(const n of this.entries){if(!n.ai)continue;const i=n.boat;if(n.finished||!this.started){i.override={throttle:0,brake:0,steer:0};continue}const r=n.ai,a=this.track.nearest(i.position.x,i.position.z,n._hint),o=(a.side||0)*a.dist;r._latPrev=r._latPrev===void 0?o:r._latPrev;const l=(o-r._latPrev)/Math.max(t,.001);r._latPrev=o;const c=((a.t+e.lookAhead/this.track.length)%1+1)%1,h=this.track.pointAt(c),d=this.track.tangentAt(c),u=Math.atan2(-(h.x+this._insideSign*-d.z*e.inner-i.position.x),-(h.z+this._insideSign*d.x*e.inner-i.position.z)),f=Math.atan2(Math.sin(u-i.heading),Math.cos(u-i.heading));r.launchT=i.speed<4?(r.launchT||0)+t:0;const m=r.launchT<1.6,_=(i.padBoost||0)+(i.itemSpeed||0)+(i.starBoostLeft>0&&Y.items.stars?.speedAdd||0)+(i.giantTime>0&&Y.items.giant?.speedAdd||0)+(i.driftBoost>0?Y.boat.drift.boostForce:0),p=m||i.speed<r.speedCap+_?1:0,g=Ib(f*e.gain-o*e.kP-l*e.kD,-1,1);i.override={throttle:p,brake:0,steer:g},this.itemsAi&&!i.trapped&&!i.airborne&&this.itemsAi(t,n,v=>{const x=this.track.nearest(v.x,v.z);return x.dist<=be+6?x.arc:null})}}_headingErr(t,e){const n=this._racingLinePoint(t.boat.position,t.ai.lookAhead,t.ai.inner);return Math.atan2(-(n.x-t.boat.position.x),-(n.z-t.boat.position.z))-t.boat.heading}addAiRacers(t,e){return t.forEach((n,i)=>{if(!this.entries.some(r=>r.id===n.id)){this.entries.push({id:n.id,label:n.label,color:n.color,boat:n.boat,nextCp:1,lap:1,progress:0,total:0,lapStart:0,bestLap:null,finished:!1,finishTime:null,place:this.entries.length+1,offCourse:0,outOfBounds:!1,_arcN:void 0,_s:0,_s_prev:0,_hint:void 0});const r=this.entries[this.entries.length-1],a=e?.[i]??.6,o=Y.ai.speedCap;return r.ai={skill:a,speedCap:o[Math.min(o.length-1,Math.floor((1-a)*o.length))]},r.held=0,r.heldSince=null,r.perfectStart=!1,r.blownStart=!1,r}}),this.entries}static headingFromTangent(t){return Math.atan2(t.x,t.z)+Math.PI}noteThrottle(t,e){if(this.phase!=="countdown"||!this.startArmed)return;const n=Y.raceFlow.start,i=this.entryOf(t);i&&(e?(i.fated||(i.fated=!0,i.holding=!0,i.holdDone=!1,i.held=0),i.holding&&!i.holdDone&&(i.held+=this._noteDt),i.rev=Math.min(n.revMax,(i.rev||0)+n.revRamp*this._noteDt)):(i.holding&&!i.holdDone&&(i.holdDone=!0),i.rev=Math.max(0,(i.rev||0)-n.revDrop*this._noteDt)))}tickRev(t,e){this.phase==="countdown"&&(this._noteDt=t,this.noteThrottle(this.playerId??"player",!!e))}resetStartLedgers(){this.held={},this.heldSince={},this.perfectStart={},this.blown={},this.startArmed=!1,this._noteDt=1/60;for(const t of this.entries)t.held=0,t.heldSince=null,t.perfectStart=!1,t.blownStart=!1,t.fated=!1,t.holding=!1,t.holdDone=!1,t.since=null,t.rev=0}_resolveStarts(){const t=Y.raceFlow.start,e=[],n=new Set([...this.entries.map(i=>i.id),...Object.keys(this.held)]);for(const i of n){const r=this.entryOf(i);if(!r)continue;const a=r.rev||0,o=r.held||0;if(a>=t.rpmBlow)r.blownStart=!0,e.push({racerId:i,held:o,penalty:Math.min(t.penaltyMax,o*t.penaltyRatio)});else if(a>=t.rpmGreenLo){r.perfectStart=!0;const l=r.boat;l&&(l.startBoost=t.boostDuration,l.startBoostAdd=t.boostSpeedAdd,l.startBoostForce=t.boostForce,l.speed=Math.max(l.speed,a*t.launchKeepRatio),l.launchPower=Math.sqrt(Math.min(1,a/t.revMax)),l.launchPop=!0,l.lastEvent="perfectstart")}}return e}updateFlow(t){if(this.phase==="countdown"){if(this.countdown-=t,this.countdown<=0){this.phase="racing",this.started=!0,this._goLeft=Y.raceFlow.goFlash;const e=this._resolveStarts();this.event={type:"go",blown:e}}return}this._goLeft>0&&(this._goLeft-=t)}flowLabel(){return this.phase==="countdown"?String(Math.ceil(Math.max(this.countdown,0))):this._goLeft>0?"GO!":null}update(t){if(Y.raceFlow.autoStart&&this.phase==="countdown"&&(this.phase="racing",this.countdown=0),this.started=this.phase!=="countdown",this.time===null||!this.started)return;this.time+=t,this.event=null;const e=this.track.length;for(const n of this.entries){if(n.finished)continue;const i=n.boat.position,r=this.track.nearest(i.x,i.z,n._hint);n._hint=r.hint,n.progress=r.t;const a=r.arc;if(n._s=a,n._arcN===void 0||n.boat._arcReanchor)n.boat._arcReanchor=!1,n._arcN=a,n._s_prev=a;else{const l=a-n._s_prev;l>0&&l<=Md?(n._arcN+=l,n._arcN>=e&&(n._arcN-=e)):(l<0||l>Md)&&(n._arcN=a)}if(n._s_prev=a,n.total=n.lap-1+n.progress,this._reached(n._arcN,this.cpArc[n.nextCp])){if(n.nextCp===0){const l=this.time-n.lapStart;n.bestLap=n.bestLap===null?l:Math.min(n.bestLap,l),n.lapStart=this.time,n.lap+=1,n.lap>this.laps?(n.finished=!0,n.finishTime=this.time,this.finishedOrder.push(n.id),this.event={type:"finish",racerId:n.id}):this.event={type:"lap",racerId:n.id,lap:n.lap,lapTime:l}}n.nextCp=(n.nextCp+1)%this.track.CP_COUNT}const o=r.dist>be;if(n.outOfBounds=o,o){n.offCourse+=t;const l=2;n.boat.speed>l&&(n.boat.speed=Math.max(l,n.boat.speed*Math.exp(-1.6*t))),n.offCourse>8&&(this.placeAtCheckpoint(n,this._nearestCpIndex(a)),this.event={type:"reset",racerId:n.id})}else n.offCourse=Math.max(0,n.offCourse-t*2)}this._placeSorted=[...this.entries].sort((n,i)=>n.finished&&i.finished?n.finishTime-i.finishTime:n.finished?-1:i.finished?1:i.total-n.total),this._placeSorted.forEach((n,i)=>n.place=i+1),this.phase==="racing"&&this.entries.length&&this.entries.every(n=>n.finished)&&(this.phase="over",this.event={type:"settled",order:[...this.finishedOrder]})}_reached(t,e){let n=e-t;return n<0&&(n+=this.track.length),n<this.track.length*.25}manualReset(t){const e=this.entries.find(n=>n.id===t);e&&!e.finished&&(this.placeAtCheckpoint(e,this._nearestCpIndex(e._s)),this.event={type:"reset",racerId:e.id})}entryOf(t){return this.entries.find(e=>e.id===t)}formatTime(t){const e=Math.floor(t/60),n=Math.floor(t%60),i=Math.floor(t*100%100);return`${e}:${String(n).padStart(2,"0")}.${String(i).padStart(2,"0")}`}}const Fo={zh:{"hud.lap":"圈","hud.place":"第 {p} 名","hud.time":"时间","hud.warn.offcourse":"⚠ 偏离航道！回赛道 / 8 秒后回到检查点","event.lap":"第 {lap} 圈 ✓","event.finish":"完赛！","event.driftboost":"漂移加速！","event.boostpad":"加速带 +","event.launch":"起飞！","event.splash":"扑通！","event.hit":"咣当！","event.result":"比赛结算","event.pickup":"拾取 {item}","event.itemspeed":"闪电冲刺！","event.itemturbo":"涡轮点火！","event.itemshield":"护盾展开！","event.itemmissile":"水弹发射！","event.itembubble":"放置水牢泡！","event.itemwave":"音爆波！","event.itemlightning":"连锁闪电！","event.itemgiant":"变大冲刺！","event.itembomb":"炸弹投掷！","event.itembombdrop":"放下炸弹！","event.itemstar":"星星加速 +2 秒！","event.hitmissile":"被水弹命中！","event.hitbubble":"被困泡泡里！","event.hitlightning":"被闪电击中！","event.hitbomb":"炸弹爆炸！","event.hitfish":"飞鱼突袭！","event.shieldblock":"护盾挡住！","event.bubblepop":"破泡！","event.falsestart":"抢跑！发动机爆缸了！","event.perfectstart":"完美起步！","menu.title":"简笔画浪速赛艇","menu.start":"开始比赛","menu.resume":"继续（Escape 关闭）","menu.track":"赛道","menu.map.random":"随机水道","menu.map.choose":"选择这张地图","menu.lang":"语言","menu.quality":"画质","menu.sound":"音效","menu.sound.on":"开","menu.sound.off":"关","menu.controls":"W/S 油门·刹车　A/D 转向　Shift 漂移　空格 用道具　R 回到检查点　Esc 菜单","menu.startrule":"起步：倒计时轰油门拉转速——GO 帧转速卡绿区=完美弹射；轰过爆缸线=爆缸熄火；老实等 GO=干净起步","menu.best":"最佳记录","menu.best.none":"暂无记录——去跑一场吧！","menu.best.bestLap":"最快圈速 {t}","menu.best.finishTime":"最佳完赛 {t}","menu.best.place":"最佳名次 第 {p} 名","hud.speed":"速度","minimap.finish":"起终点","result.place":"第 {p} 名","result.bestLap":"最快圈速","result.newBest":"新纪录！","result.total":"总用时","result.again":"再来一局","result.back":"回主菜单",phase:"Phase 7 — 完整比赛体验",controls:"W/S 油门·刹车 A/D 转向 Shift 漂移 空格 用道具 R 回到检查点","item.speed":"闪电冲刺","item.missile":"水弹","item.bubble":"水牢泡","item.shield":"护盾","item.wave":"音爆波","item.turbo":"涡轮","item.lightning":"连锁闪电","item.giant":"变大加速","item.bomb":"定时炸弹"},en:{"hud.lap":"Lap","hud.place":"P{p}","hud.time":"Time","hud.warn.offcourse":"⚠ OFF COURSE! Return — reset in 8s","event.lap":"Lap {lap} ✓","event.finish":"FINISHED!","event.driftboost":"DRIFT BOOST!","event.boostpad":"BOOST PAD +","event.launch":"AIRTIME!","event.splash":"SPLASH!","event.hit":"BONK!","event.result":"RACE RESULTS","event.pickup":"Picked up {item}","event.itemspeed":"LIGHTNING DASH!","event.itemturbo":"TURBO IGNITION!","event.itemshield":"SHIELD UP!","event.itemmissile":"WATER MISSILE!","event.itembubble":"BUBBLE TRAP!","event.itemwave":"WAVE BURST!","event.itemlightning":"CHAIN LIGHTNING!","event.itemgiant":"GIANT DASH!","event.itembomb":"BOMB THROWN!","event.itembombdrop":"BOMB DROPPED!","event.itemstar":"STAR BOOST +2s!","event.hitmissile":"HIT BY MISSILE!","event.hitbubble":"TRAPPED!","event.hitlightning":"ZAPPED!","event.hitbomb":"BOMB BLAST!","event.hitfish":"FLYING FISH!","event.shieldblock":"BLOCKED!","event.bubblepop":"POP!","event.falsestart":"FALSE START! Engine blew!","event.perfectstart":"PERFECT START!","menu.title":"Sketch Wave Racer","menu.start":"START RACE","menu.resume":"Resume (Esc closes)","menu.track":"Track","menu.map.random":"Random Course","menu.map.choose":"Choose this map","menu.lang":"Language","menu.quality":"Graphics","menu.sound":"Sound","menu.sound.on":"ON","menu.sound.off":"OFF","menu.controls":"W/S throttle-brake  A/D steer  Shift drift  SPACE item  R reset  Esc menu","menu.startrule":"START: blip throttle in countdown — green zone at GO = perfect launch; past the red line = engine blow; wait for GO = clean start","menu.best":"Best Records","menu.best.none":"No records yet — go set one!","menu.best.bestLap":"Best lap {t}","menu.best.finishTime":"Best race {t}","menu.best.place":"Best place P{p}","hud.speed":"Speed","minimap.finish":"Finish","result.place":"Place {p}","result.bestLap":"Best lap","result.newBest":"NEW BEST!","result.total":"Total","result.again":"Race Again","result.back":"Return Menu",phase:"Phase 7 — Full Race Experience",controls:"W/S throttle-brake  A/D steer  Shift drift  SPACE item  R reset","item.speed":"Speed Boost","item.missile":"Water Missile","item.bubble":"Bubble Trap","item.shield":"Shield","item.wave":"Wave Burst","item.turbo":"Turbo Charge","item.lightning":"Chain Lightning","item.giant":"Giant Dash","item.bomb":"Timed Bomb"}};function Oo(){const s=localStorage.getItem("swr-lang");return s&&Fo[s]?s:(navigator.language||"en").toLowerCase().startsWith("zh")?"zh":"en"}function Db(s){Fo[s]&&localStorage.setItem("swr-lang",s)}function Ht(s,t){const e=Oo();let n=Fo[e]?.[s]??Fo.en[s]??s;if(t)for(const i in t)n=n.replaceAll(`{${i}}`,String(t[i]));return n}Oo();const bd={lap:null,finish:null,driftboost:"event.driftboost",boostpad:"event.boostpad",launch:"event.launch",splash:"event.splash",hit:"event.hit",pickup:"event.pickup",itemspeed:"event.itemspeed",itemturbo:"event.itemturbo",itemshield:"event.itemshield",itemmissile:"event.itemmissile",itembubble:"event.itembubble",itemwave:"event.itemwave",itemlightning:"event.itemlightning",itemgiant:"event.itemgiant",itembomb:"event.itembomb",itembombdrop:"event.itembombdrop",itemstar:"event.itemstar",hitmissile:"event.hitmissile",hitbubble:"event.hitbubble",hitlightning:"event.hitlightning",hitbomb:"event.hitbomb",hitfish:"event.hitfish",shieldblock:"event.shieldblock",bubblepop:"event.bubblepop",falsestart:"event.falsestart",perfectstart:"event.perfectstart"},Ub={speed:"⚡",missile:"💧",bubble:"🫧",shield:"🛡",wave:"🌀",turbo:"🔥",lightning:"⚡",giant:"⬆",bomb:"●"};function Nb(s,t,e=33.3){const n=document.getElementById("hud-warn"),i=document.getElementById("hud-event"),r=document.getElementById("speedbar"),a=document.getElementById("driftcharge"),o=document.getElementById("hud-countdown"),l=document.getElementById("hud-item"),c=document.getElementById("hud-item-status");let h=0;return{update(){const d=t,u=d.boat,f=s.flowLabel();o&&(o.style.display=f?"block":"none",f&&(o.textContent=f));const m=Math.min(d.lap,s.laps);if(n&&(n.style.display=d.offCourse>.4?"block":"none",d.offCourse>.4&&(n.textContent=Ht("hud.warn.offcourse"))),r&&(r.style.width=`${Math.min(Math.abs(u.speed)/e*100,100)}%`),l){const _=u.item;_?(l.style.display="flex",l.textContent=Ub[_]||"?",l.title=Ht("item."+_)):l.style.display="none"}if(c){const _=[];u.shield>0&&_.push("🛡"+Math.ceil(u.shield)),u.trapped>0&&_.push("🫧"+Math.ceil(u.trapped)),u.starBoostLeft>0&&_.push("★"+Math.ceil(u.starBoostLeft)),u.lightningSlow>0&&_.push("⚡"+Math.ceil(u.lightningSlow)),(u.giantTime>0||u.giantShrink>0)&&_.push("⬆"+Math.ceil(Math.max(u.giantTime||0,u.giantShrink||0))),c.style.display=_.length?"block":"none",_.length&&(c.textContent=_.join("  "))}if(a){const _=u.drifting?u.driftCharge:u.driftBoost>0?1:0;a.style.width=`${Math.min(_*100,100)}%`,a.style.display=_>.02?"block":"none"}if(i){const _=s.event,p=u.lastEvent;u.lastEvent=null,_&&(_.type==="lap"||_.type==="finish")&&_.racerId===d.id?(i.textContent=_.type==="lap"?`${Ht("event.lap",{lap:`${m}/${s.laps}`})} ${s.formatTime(_.lapTime)}`:`🏁 ${Ht("event.finish")} ${Ht("hud.place",{p:d.place})}`,h=performance.now()+2500):p&&bd[p]&&(i.textContent=Ht(bd[p]),h=performance.now()+1200),i.style.display=performance.now()<h?"block":"none"}}}}const dn="#2e2a26",Fb="rgba(246,239,226,0.92)",Ob="#f4b942",Sd="#e4572e",Bb="#35b24c";function zb(s,t,e){const n=s.getContext("2d"),i=s.width,r=s.height,a=i/2,o=78,l=62,c=Math.PI*.82,h=Math.PI*2.18,d=Math.round(Y.boat.maxSpeed*3.6),u=190;let f=0;const m=(E,A,w,P,L=2.5,M=dn)=>{n.strokeStyle=M,n.lineWidth=L,n.beginPath(),n.moveTo(E,A),n.lineTo(w,P),n.stroke()},_=(E,A,w,P,L)=>{n.strokeStyle=L,n.lineWidth=P,n.beginPath(),n.arc(a,o,E,A,w),n.stroke()},p=(E,A,w,P,L=dn,M=!0,b="center")=>{n.fillStyle=L,n.font=`${M?"800":"600"} ${P}px "Comic Sans MS","PingFang SC",sans-serif`,n.textAlign=b,n.textBaseline="middle",n.fillText(E,A,w)};function g(){const E=e,A=E.boat;n.clearRect(0,0,i,r),n.fillStyle=Fb,y(2,2,i-4,r-4,16),n.fill(),n.strokeStyle=dn,n.lineWidth=3.5,y(2,2,i-4,r-4,16),n.stroke(),n.lineWidth=1.5,n.globalAlpha=.35,y(6,6,i-12,r-12,12),n.stroke(),n.globalAlpha=1,n.fillStyle="#ffffff",n.beginPath(),n.arc(a,o,l+9,0,Math.PI*2),n.fill(),m(a-.1,o,a-.1,o,0,dn),n.strokeStyle=dn,n.lineWidth=3.5,n.beginPath(),n.arc(a,o,l+9,0,Math.PI*2),n.stroke();for(let N=0;N<=u;N+=10){const U=c+(h-c)*(N/u),q=N%40===0,z=l-(q?12:7),X=l;if(m(a+Math.cos(U)*z,o+Math.sin(U)*z,a+Math.cos(U)*X,o+Math.sin(U)*X,q?3:1.8),q){const W=l-24;p(String(N),a+Math.cos(U)*W,o+Math.sin(U)*W,10.5,dn,!0)}}if(_(l-3,c+(h-c)*(140/u),h,4,"rgba(228,87,46,0.85)"),t.phase==="countdown"){const N=e,U=N&&N.rev||0,q=Y.raceFlow.start,z=X=>c+(h-c)*(Math.min(X,u)/u);_(l-3,z(q.rpmGreenLo*3.6),z(q.rpmGreenHi*3.6),4,"rgba(53,178,76,0.9)");{const X=z(q.rpmBlow*3.6);m(a+Math.cos(X)*(l-12),o+Math.sin(X)*(l-12),a+Math.cos(X)*(l+1),o+Math.sin(X)*(l+1),3,Sd),p("爆",a+Math.cos(X)*(l-22),o+Math.sin(X)*(l-22),11,Sd)}{const X=z(U*3.6);m(a+Math.cos(X)*(l-14),o+Math.sin(X)*(l-14),a-Math.cos(X)*6,o-Math.sin(X)*6,2,"rgba(244,185,66,0.95)")}p(Math.round(U*3.6)+"",a,o+26,22,"#b0781e",!0),p("RPM",a,o+41,10.5,"#b0781e",!1)}{const N=c+(h-c)*(d/u);n.fillStyle=Ob,n.beginPath(),n.arc(a+Math.cos(N)*(l-3),o+Math.sin(N)*(l-3),3.4,0,Math.PI*2),n.fill(),n.strokeStyle=dn,n.lineWidth=1.5,n.stroke()}const w=t.phase==="countdown"?0:Math.abs(A.speed)*3.6;f+=(w-f)*.22;const P=c+(h-c)*(Math.min(f,u)/u);m(a+Math.cos(P)*(l-16),o+Math.sin(P)*(l-16),a-Math.cos(P)*9,o-Math.sin(P)*9,4),n.fillStyle="#fff",n.beginPath(),n.arc(a,o,5.5,0,Math.PI*2),n.fill(),n.strokeStyle=dn,n.lineWidth=3,n.stroke(),t.phase!=="countdown"&&(p(Math.round(w)+"",a,o+26,22,dn,!0),p("km/h",a,o+41,10.5,dn,!1));const L=A.drifting?Math.min(1,A.driftCharge/Y.boat.drift.chargeMax):A.driftBoost>0?1:0;L>.02&&_(l+4,Math.PI*.78,Math.PI*.78+Math.PI*.44*L,5,Bb);const M=r-34,b=(i-20)/3,B=(N,U,q,z)=>{const X=10+b*N;n.strokeStyle=dn,n.lineWidth=2,n.globalAlpha=.5,y(X+3,M-15,b-6,34,8),n.stroke(),n.globalAlpha=1,p(U,X+b/2,M-6,9.5,dn,!1),p(q,X+b/2,M+9,14,dn,!0)};B(0,"RANK",v(E.place)),B(1,"LAP",`${Math.min(E.lap,t.laps)}/${t.laps}`),B(2,"TIME",x(t.time))}const v=E=>["","1st","2nd","3rd","4th","5th","6th","7th"][E]||E+"th",x=E=>{if(E==null)return"--:--";const A=Math.floor(E/60),w=Math.floor(E%60);return`${A}:${String(w).padStart(2,"0")}`};function y(E,A,w,P,L){n.beginPath(),n.moveTo(E+L,A),n.arcTo(E+w,A,E+w,A+P,L),n.arcTo(E+w,A+P,E,A+P,L),n.arcTo(E,A+P,E,A,L),n.arcTo(E,A,E+w,A,L),n.closePath()}return{draw:g}}const kb=["speed","missile","bubble","shield","wave","turbo","lightning","giant","bomb"];function pc(s=Math.random){const t=Y.items.weights,e=kb.flatMap(n=>Array(Math.round(t[n])||0).fill(n));return e[Math.floor(s()*e.length)%e.length]}class Vb{constructor(t,e,n={}){this.track=t,this.race=e,this.rng=n.rng||Math.random,this.onEvent=n.onEvent||(()=>{}),this.boxes=[],this._buildBoxes(),this.projectiles=[],this.stars=[],this._starId=0;const i=Y.items.stars?.spawnInterval||[7,11];this._starTimer=i[0]+this.rng()*Math.max(0,i[1]-i[0]),this.effects=[],this.log=[]}rebuild(t=this.track){return this.track=t,this._buildBoxes(),this.reset(),this}_buildBoxes(){const t=Y.items;this.boxes=[];let e=0;const n=t.boxes.lanes||[0];for(const[i,r]of t.boxes.ts.entries()){const a=this.track.pointAt(r),o=this.track.tangentAt(r);for(const l of n)this.boxes.push({index:e++,row:i,lane:l,t:r,pos:new C(a.x+-o.z*l,.25,a.z+o.x*l),radius:t.boxes.radius,respawn:0,cooldown:t.boxes.respawn,type:pc(this.rng)})}}reset(){this.projectiles=[],this.stars=[],this.effects=[],this.log=[];const t=Y.items.stars?.spawnInterval||[7,11];this._starTimer=t[0]+this.rng()*Math.max(0,t[1]-t[0]);for(const e of this.boxes)e.respawn=0,e.type=pc(this.rng);for(const e of this.race.entries){const n=e.boat;n.item=null,n.shield=0,n.trapped=0,n.itemSpeed=0,n.turboLeft=0,n._trappedFrom=0,n.starBoostLeft=0,n.lightningSlow=0,n.giantTime=0,n.giantShrink=0,n.giantScale=1,n.view?.setItemScale&&n.view.setItemScale(1)}}update(t){this._updateStars(t),this._updateBoxes(t),this._updateProjectiles(t),this._updateEffects(t)}_updateBoxes(t){for(const e of this.boxes){if(e.respawn>0){e.respawn-=t;continue}for(const n of this.race.entries){if(n.finished)continue;const i=n.boat;if(i.airborne||i.trapped>0||i.item)continue;if(Math.hypot(e.pos.x-i.position.x,e.pos.z-i.position.z)<=e.radius+Y.trackFeatures.colliderRadius){i.item=e.type,e.type=pc(this.rng),e.respawn=e.cooldown,this._emit({type:"pickup",racerId:n.id,item:i.item});break}}}}_updateStars(t){const e=Y.items.stars;if(!e)return;for(const o of this.stars)if(o.alive){if(o.age+=t,o.age>=o.life){o.alive=!1;continue}for(const l of this.race.entries){if(l.finished)continue;const c=l.boat;if(!(c.airborne||c.trapped>0||Math.hypot(o.x-c.position.x,o.z-c.position.z)>o.radius+Y.trackFeatures.colliderRadius)){o.alive=!1,c.starBoostLeft=Math.min(e.maxDuration,(c.starBoostLeft||0)+e.boostDuration),c.lastEvent="itemstar",this._emit({type:"pickup",racerId:l.id,item:"star",boostTime:c.starBoostLeft});break}}}if(this.stars=this.stars.filter(o=>o.alive),!(this.race.started!==!1&&this.race.phase!=="over")||this.race.entries.length<2||(this._starTimer-=t,this._starTimer>0))return;const i=e.spawnInterval||[7,11];if(this._starTimer=i[0]+this.rng()*Math.max(0,i[1]-i[0]),this.rng()>e.chance)return;const r=this._laggingEntries();if(!r.length)return;const a=r[Math.floor(this.rng()*r.length)%r.length];this._spawnStarChain(a)}_spawnStarChain(t,e=null){const n=Y.items.stars;if(!t||!n)return[];const i=e??n.chainMin+Math.floor(this.rng()*(n.chainMax-n.chainMin+1)),r=this.track.nearest(t.boat.position.x,t.boat.position.z),a=n.aheadMin+this.rng()*Math.max(0,n.aheadMax-n.aheadMin),o=[];for(let l=0;l<i;l++){const c=r.arc+a+l*n.spacing,h=(c/this.track.length%1+1)%1,d=this.track.pointAt(h),u=this.track.tangentAt(h),f=((l%2===0?-.5:.5)+(this.rng()-.5)*.35)*(n.lateral||0),m={id:++this._starId,targetId:t.id,x:d.x+-u.z*f,z:d.z+u.x*f,y:.8,arc:(c%this.track.length+this.track.length)%this.track.length,radius:n.radius,age:0,life:n.life,alive:!0};this.stars.push(m),o.push(m)}return this._emit({type:"spawn",item:"star",target:t.id,count:o.length}),o}_laggingEntries(){const t=this.race.entries.filter(i=>!i.finished);if(t.length<2)return[];const e=[...t].sort((i,r)=>this._raceProgress(r)-this._raceProgress(i)),n=e[0];return e.filter(i=>i.id!==n.id&&(i.place>1||this._raceProgress(i)<this._raceProgress(n)-.01))}_raceProgress(t){return Number.isFinite(t.total)&&t.total>0?t.total:this.track.nearest(t.boat.position.x,t.boat.position.z).arc/this.track.length}_isAheadOf(t,e){if(e.finished)return!0;const n=this._raceProgress(t),i=this._raceProgress(e);return Math.abs(i-n)>1e-4?i>n:(e.place||1/0)<(t.place||1/0)}_pickAheadTarget(t){const e=Y.items.bubble,n=this.race.entries.filter(i=>{if(i.id===t.id||i.finished||!this._isAheadOf(t,i))return!1;const r=this._arcDelta(t,i);return r>=(e.targetMinAhead??0)&&r<=(e.targetMaxAhead??70)});return n.length?n[Math.floor(this.rng()*n.length)%n.length]:null}_arcDelta(t,e){const n=this.track.nearest(t.boat.position.x,t.boat.position.z).arc;return((this.track.nearest(e.boat.position.x,e.boat.position.z).arc-n)%this.track.length+this.track.length)%this.track.length}use(t,e={}){const n=this.race.entryOf(t);if(!n||n.finished)return!1;const i=n.boat;if(!i.item||i.trapped>0)return!1;const r=i.item;i.item=null;const a={x:-Math.sin(i.heading),z:-Math.cos(i.heading)};switch(r){case"speed":i.itemSpeed+=Y.items.speed.speedAdd,i.lastEvent="itemspeed";break;case"turbo":i.itemSpeed+=Y.items.turbo.speedAdd,i.turboLeft=Y.items.turbo.duration,i.lastEvent="itemturbo";break;case"lightning":{const o=Y.items.lightning,l=[];for(const c of this.race.entries){if(c.id===t||c.finished||!this._isAheadOf(n,c))continue;const h=c.boat;h.trapped>0||this._blockByShield(h,t,"lightning")||(h.lightningSlow=Math.max(h.lightningSlow||0,o.duration),h.lastEvent="hitlightning",l.push(c.id),this._emit({type:"hit",weapon:"lightning",from:t,target:c.id}))}this.effects.push({type:"lightning",targets:l,age:0,life:o.duration}),i.lastEvent="itemlightning";break}case"giant":i.giantTime=Y.items.giant.duration,i.giantShrink=0,i.giantScale=Y.items.giant.scale,i.view?.setItemScale&&i.view.setItemScale(i.giantScale),i.lastEvent="itemgiant";break;case"shield":i.shield=Y.items.shield.duration,i.lastEvent="itemshield";break;case"missile":this.projectiles.push({kind:"missile",owner:t,x:i.position.x+a.x*2.2,z:i.position.z+a.z*2.2,dx:a.x,dz:a.z,speed:Y.items.missile.speed,travelled:0,alive:!0,age:0}),i.lastEvent="itemmissile";break;case"bubble":this.projectiles.push({kind:"bubble",owner:t,x:i.position.x+a.x*2.2,z:i.position.z+a.z*2.2,dx:a.x,dz:a.z,speed:Y.items.bubble.speed,travelled:0,alive:!0,age:0,target:this._pickAheadTarget(n)?.id||null}),i.lastEvent="itembubble";break;case"bomb":{const o=Y.items.bomb,l=!!e.drop;this.projectiles.push({kind:"bomb",owner:t,x:i.position.x+a.x*(l?-2.4:2.2),z:i.position.z+a.z*(l?-2.4:2.2),dx:a.x,dz:a.z,speed:l?0:o.throwSpeed,travelled:0,alive:!0,age:0,fuse:o.fuse,mode:l?"drop":"throw"}),i.lastEvent=l?"itembombdrop":"itembomb";break}case"wave":{const o=Y.items.wave,l=[];for(const c of this.race.entries){if(c.id===t||c.finished)continue;const h=c.boat;if(h.trapped>0)continue;const d=Math.hypot(h.position.x-i.position.x,h.position.z-i.position.z);if(d>o.radius||this._blockByShield(h,t,"wave"))continue;const u=d<.01?1:(h.position.x-i.position.x)/d,f=d<.01?0:(h.position.z-i.position.z)/d,m=Math.max(0,1-d/o.radius)*o.push;h.speed=Math.max(0,h.speed*o.slowKeep),h.position.x+=u*m*.35,h.position.z+=f*m*.35,l.push(c.id),this._emit({type:"hit",weapon:"wave",from:t,target:c.id})}this.effects.push({type:"wave",x:i.position.x,z:i.position.z,age:0,life:.8}),i.lastEvent="itemwave",l.length&&(i.lastEvent="itemwave");break}default:return!1}return this._emit({type:"use",racerId:t,item:r}),!0}_updateProjectiles(t){const e=this.race.entries;for(const n of this.projectiles){if(!n.alive)continue;if(n.age+=t,n.kind==="bomb"){const r=n.speed*t;r>0&&(n.x+=n.dx*r,n.z+=n.dz*r,n.travelled+=r,n.speed*=Math.exp(-1.5*t),n.travelled>=Y.items.bomb.throwRange&&(n.speed=0)),n.age>=(n.fuse??Y.items.bomb.fuse)&&(this._explodeBomb(n),n.alive=!1);continue}n.kind==="bubble"&&this._steerBubble(n,t);const i=n.speed*t;for(let r=0;r<2;r++){const a=i/2;if(n.x+=n.dx*a,n.z+=n.dz*a,n.travelled+=a,!n.alive)break;const o=n.kind==="bubble"?Y.items.bubble.range:Y.items.missile.range;if(n.travelled>=o){n.alive=!1;break}for(const l of e){if(l.id===n.owner||l.finished)continue;const c=l.boat;if(c.trapped>0||c.airborne)continue;const h=Math.hypot(c.position.x-n.x,c.position.z-n.z),d=n.kind==="bubble"?Y.items.bubble.radius:Y.items.missile.radius;if(!(h>d)){if(n.alive=!1,this._blockByShield(c,n.owner,n.kind))break;n.kind==="missile"?(c.speed=Math.max(1.5,c.speed*Y.items.missile.slowKeep),c.lateral+=(this.rng()<.5?-1:1)*3.5,c.lastEvent="hitmissile",this._pushExplosionEffect(n.x,n.z,5.5,3835647,.55)):(c.trapped=Y.items.bubble.floatTime,c._trappedFrom=c.speed,c.speed*=Y.items.trap.slowKeep,c.lastEvent="hitbubble",this._pushExplosionEffect(n.x,n.z,6.5,10217727,.65)),this._emit({type:"hit",weapon:n.kind,from:n.owner,target:l.id});break}}}}this.projectiles=this.projectiles.filter(n=>n.alive&&n.age<8)}_steerBubble(t,e){const n=t.target?this.race.entryOf(t.target):null;if(!n||n.finished||n.boat.trapped>0)return;const i=n.boat.position.x-t.x,r=n.boat.position.z-t.z,a=Math.hypot(i,r);if(a<.001)return;const o=i/a,l=r/a,c=Math.min(1,(Y.items.bubble.homing||0)*e);let h=t.dx*(1-c)+o*c,d=t.dz*(1-c)+l*c;const u=Math.hypot(h,d)||1;t.dx=h/u,t.dz=d/u}_explodeBomb(t){const e=Y.items.bomb,n=[];for(const i of this.race.entries){if(i.id===t.owner||i.finished)continue;const r=i.boat;if(r.airborne||r.trapped>0)continue;const a=Math.hypot(r.position.x-t.x,r.position.z-t.z);if(a>e.radius||this._blockByShield(r,t.owner,"bomb"))continue;const o=Math.max(0,1-a/e.radius),l=a<.01?1:(r.position.x-t.x)/a,c=a<.01?0:(r.position.z-t.z)/a;r.speed=Math.max(1,r.speed*e.slowKeep),r.lateral+=(this.rng()<.5?-1:1)*(2.5+3.5*o),r.position.x+=l*e.push*o*.35,r.position.z+=c*e.push*o*.35,r.lastEvent="hitbomb",n.push(i.id),this._emit({type:"hit",weapon:"bomb",from:t.owner,target:i.id})}this._pushExplosionEffect(t.x,t.z,e.radius,16739116,.75),this._emit({type:"explode",weapon:"bomb",from:t.owner,targets:n})}_pushExplosionEffect(t,e,n,i,r=.6){this.effects.push({type:"explosion",x:t,z:e,radius:n,color:i,age:0,life:r})}_blockByShield(t,e,n){if(t.shield>0){t.shield=0,t.lastEvent="shieldblock";const i=this.race.entries.find(r=>r.boat===t);return this._emit({type:"block",weapon:n,from:e,target:i?i.id:"?",via:"shield"}),!0}return!1}_updateEffects(t){for(const e of this.effects)e.age+=t;this.effects=this.effects.filter(e=>e.age<e.life)}_emit(t){this.log.push({...t,t:this.race.time}),this.log.length>200&&this.log.shift(),this.onEvent(t)}aiThink(t,e,n){const i=e.boat;if(!i.item||i.trapped>0||i.airborne){e.ai.itemWait=0;return}e.ai.itemWait=(e.ai.itemWait||0)+t;const r=Y.items.ai,a=r.useDelay[0]+(1-e.ai.skill)*(r.useDelay[1]-r.useDelay[0]);if(e.ai.itemWait<a)return;const o=n(i.position);if(o===null)return;const l=this.track.length,c=d=>{const u=n(this.race.entryOf(d).boat.position);if(u===null)return null;let f=u-o;return f=(f%l+l)%l,f>l/2&&(f-=l),f};let h=!1;switch(i.item){case"missile":{for(const d of this.race.entries){if(d.id===e.id)continue;const u=c(d.id);if(u!==null&&u>=r.missileMinAhead&&u<=r.missileMaxAhead){h=!0;break}}break}case"bubble":{for(const d of this.race.entries){if(d.id===e.id)continue;const u=c(d.id);if(u!==null&&u>=Y.items.bubble.targetMinAhead&&u<=Y.items.bubble.targetMaxAhead){h=!0;break}}break}case"shield":h=r.shieldWhenHit&&this._recentHitAgainst(e.id);break;case"wave":for(const d of this.race.entries){if(d.id===e.id)continue;if(Math.hypot(d.boat.position.x-i.position.x,d.boat.position.z-i.position.z)<=Y.items.wave.radius*.9){h=!0;break}}break;case"lightning":h=this.race.entries.some(d=>d.id!==e.id&&!d.finished&&this._isAheadOf(e,d));break;case"bomb":h=this.race.entries.some(d=>{if(d.id===e.id||d.finished)return!1;const u=c(d.id);return u!==null&&u>=5&&u<=Y.items.bomb.throwRange+Y.items.bomb.radius});break;default:{const d=this.track.nearest(i.position.x,i.position.z),u=14/this.track.length,f=this.track.tangentAt(((d.t+u*2)%1+1)%1),m=this.track.tangentAt(((d.t+u*6)%1+1)%1);h=Math.abs(Math.atan2(f.x*m.z-f.z*m.x,f.x*m.x+f.z*m.z))<.05}}h&&(this.use(e.id),e.ai.itemWait=0)}_recentHitAgainst(t){Y.items.ai;for(let e=this.log.length-1;e>=0;e--){const n=this.log[e];if(n.type==="hit"&&n.target===t)return this.race.time-n.t<2}return!1}inventoryOf(t){const n=this.race.entryOf(t)?.boat;return{item:n?.item||null,shield:n?.shield||0,trapped:n?.trapped||0}}}const Op=3025446,zi=s=>new ns({color:s});function Za(s,t=.06){const e=new at(s.geometry,new he({color:Op,side:Ae}));e.scale.multiplyScalar(1+t),s.add(e)}const Us={speed:16038210,missile:3835647,bubble:10217727,shield:3519052,wave:11561688,turbo:14964526,lightning:16773222,giant:16747069,star:16768829,bomb:3355443};function Hb(){const s=new pe,t=new at(new Ws(.75,0),zi(Us.star));Za(t,.08),s.add(t);const e=new at(new An(.78,1.08,5),new he({color:16777215,transparent:!0,opacity:.65,depthWrite:!1}));return e.rotation.x=-Math.PI/2,e.renderOrder=3,s.add(e),s}function Gb(){const s=[new C(0,3.2,0),new C(.42,2.35,0),new C(.08,2.35,0),new C(.5,1.2,0),new C(-.08,2.05,0),new C(.24,2.05,0),new C(0,3.2,0)],t=new Bn(new Xt().setFromPoints(s),new ze({color:Us.lightning,transparent:!0,opacity:.95}));return t.renderOrder=4,t.visible=!1,t}function Pn(s,t=.55){return new he({color:s,transparent:!0,opacity:t,depthWrite:!1,side:xn})}function Wb(s){const t=Us[s]||16777215,e=new pe;if(e.userData.type=s,s==="speed"||s==="lightning"){const n=[new C(-.2,.55,0),new C(.18,.08,0),new C(-.02,.08,0),new C(.22,-.55,0)];e.add(new Bn(new Xt().setFromPoints(n),new ze({color:t,transparent:!0,opacity:.75})))}else if(s==="missile"){const n=new at(new rn(.22,.9,8),Pn(t,.62));n.rotation.x=Math.PI/2,e.add(n)}else if(s==="bubble")e.add(new at(new Ie(.42,12,8),Pn(t,.38)));else if(s==="shield")e.add(new at(new An(.28,.46,18),Pn(t,.55)));else if(s==="wave")for(const n of[.26,.46])e.add(new at(new An(n,n+.035,22),Pn(t,.45)));else if(s==="turbo"){const n=new at(new rn(.34,.8,8),Pn(t,.62));n.rotation.x=Math.PI,e.add(n)}else if(s==="giant"){const n=new at(new rn(.32,.55,4),Pn(t,.62));n.position.y=.2,e.add(n);const i=new at(new Pe(.18,.55,.18),Pn(t,.5));i.position.y=-.2,e.add(i)}else if(s==="bomb"){const n=new at(new Ie(.36,12,8),Pn(2236962,.62));e.add(n);const i=new at(new Be(.035,.035,.42,6),Pn(16773222,.7));i.position.set(.25,.36,0),i.rotation.z=-.75,e.add(i)}else e.add(new at(new An(.26,.42,16),Pn(t,.5)));return e.position.y=2.35,e.renderOrder=4,e}function wd(s,t){if(s.userData.iconType===t)return;s.userData.icon&&s.remove(s.userData.icon);const e=Wb(t);s.add(e),s.userData.icon=e,s.userData.iconType=t}function Bp(s,t,e){const n=new pe;t.add(n);const i=e.boxes.map(u=>{const f=new pe,m=new at(new Pe(1.7,1.7,1.7),zi(Us[u.type]));m.position.y=.9,Za(m,.05),f.add(m);for(const _ of[0,Math.PI/2]){const p=new at(new Pe(1.78,.34,.34),zi(Op));p.position.y=.9,p.rotation.y=_,f.add(p)}return f.position.copy(u.pos),f.userData.cube=m,wd(f,u.type),n.add(f),f}),r=new Map,a=new Map,o=new Map,l=new Map,c=new Map;function h(u){if(c.has(u))return c.get(u);const f={},m=new at(new Ie(2.1,12,10),new he({color:9431208,transparent:!0,opacity:.35,depthWrite:!1}));m.visible=!1,m.renderOrder=3,n.add(m),f.shieldDome=m;const _=new at(new Ie(2.4,12,10),new he({color:12447743,transparent:!0,opacity:.45,depthWrite:!1}));_.visible=!1,_.renderOrder=3,n.add(_),f.trapBubble=_;const p=Gb();n.add(p),f.lightningBolt=p;const g=new An(2,2.55,30);g.rotateX(-Math.PI/2);const v=new at(g,new he({color:Us.giant,transparent:!0,opacity:.55,depthWrite:!1}));return v.visible=!1,v.renderOrder=3,n.add(v),f.giantRing=v,c.set(u,f),f}let d=[];return{group:n,reset(){for(const[,u]of r)n.remove(u);r.clear();for(const[,u]of a)n.remove(u);a.clear();for(const[,u]of o)n.remove(u);o.clear();for(const[,u]of l)n.remove(u);l.clear();for(const{mesh:u}of d)n.remove(u);d=[];for(const u of e.race.entries){const f=c.get(u.id);f&&(f.shieldDome.visible=!1,f.trapBubble.visible=!1,f.lightningBolt.visible=!1,f.giantRing.visible=!1)}},update(u,f){i.forEach((_,p)=>{const g=e.boxes[p],v=_.userData.cube;v.rotation.y=f*1.2+p,v.position.y=.9+Math.sin(f*2+p*1.7)*.25;const x=Us[g.type]||16038210;v.material.color.getHex()!==x&&v.material.color.setHex(x),wd(_,g.type),_.userData.icon&&(_.userData.icon.rotation.y=-_.rotation.y+Math.sin(f*1.4+p)*.2,_.userData.icon.scale.setScalar(1+Math.sin(f*4+p)*.08)),_.visible=g.respawn<=0});for(const _ of e.projectiles){const p=_.kind==="missile"?r:_.kind==="bubble"?a:o;let g=p.get(_);if(g||(_.kind==="missile"?g=(()=>{const v=new pe,x=new at(new Ie(.45,8,7),zi(3835647));Za(x,.1),v.add(x);const y=new at(new rn(.28,1.4,6),zi(10217727));return y.rotation.x=Math.PI/2,y.position.z=.9,v.add(y),n.add(v),v})():_.kind==="bubble"?g=(()=>{const v=new at(new Ie(.9,10,8),new he({color:12447743,transparent:!0,opacity:.5,depthWrite:!1}));return v.renderOrder=3,n.add(v),v})():g=(()=>{const v=new pe,x=new at(new Ie(.62,12,8),zi(3025446));Za(x,.08),v.add(x);const y=new at(new Be(.04,.04,.55,6),zi(16773222));return y.position.set(.35,.45,0),y.rotation.z=-.7,v.add(y),n.add(v),v})(),p.set(_,g)),g.visible=!0,_.kind==="bomb"){const v=Math.max(0,1-_.age/Math.max(.01,_.fuse||2));g.position.set(_.x,.44+Math.sin(f*9)*.04,_.z),g.rotation.y=f*5+_.travelled*.15,g.scale.setScalar(1+(1-v)*.18+Math.sin(f*18)*.035)}else g.position.set(_.x,.5+Math.sin(f*6+_.travelled)*.12,_.z),_.kind==="missile"?g.rotation.y=Math.atan2(-_.dx,-_.dz):g.scale.setScalar(1+Math.sin(f*9+_.travelled)*.08)}for(const[_,p]of[...r,...a,...o])_.alive||(n.remove(p),(_.kind==="missile"?r:_.kind==="bubble"?a:o).delete(_));for(const _ of e.stars||[]){let p=l.get(_);p||(p=Hb(),n.add(p),l.set(_,p));const g=1+Math.sin(f*7+_.id)*.12;p.visible=!0,p.position.set(_.x,(_.y||.8)+Math.sin(f*4+_.id)*.18,_.z),p.rotation.y=f*3.2+_.id,p.rotation.z=Math.sin(f*2+_.id)*.25,p.scale.setScalar(g)}const m=new Set(e.stars||[]);for(const[_,p]of[...l])(!m.has(_)||!_.alive)&&(n.remove(p),l.delete(_));for(const _ of e.race.entries){const p=_.boat,g=p.shield>0||p.trapped>0||p.lightningSlow>0||p.giantScale>1.01,v=c.get(_.id)||(g?h(_.id):null);v&&(v.shieldDome.visible=p.shield>0,v.shieldDome.visible&&(v.shieldDome.position.set(p.position.x,p.position.y+.5,p.position.z),v.shieldDome.material.opacity=.22+.13*Math.sin(f*5)),v.trapBubble.visible=p.trapped>0,v.trapBubble.visible&&(v.trapBubble.position.set(p.position.x,p.position.y+.9,p.position.z),v.trapBubble.scale.setScalar(1+Math.sin(f*4)*.06)),v.lightningBolt.visible=p.lightningSlow>0,v.lightningBolt.visible&&(v.lightningBolt.position.set(p.position.x,p.position.y,p.position.z),v.lightningBolt.rotation.y=f*8+_.id.length,v.lightningBolt.material.opacity=.45+.5*Math.abs(Math.sin(f*18)),v.lightningBolt.scale.setScalar(1+Math.sin(f*12)*.18)),v.giantRing.visible=p.giantScale>1.01,v.giantRing.visible&&(v.giantRing.position.set(p.position.x,p.position.y+.12,p.position.z),v.giantRing.scale.setScalar(.75+(p.giantScale||1)*.3+Math.sin(f*6)*.04),v.giantRing.material.opacity=.25+.25*Math.sin(f*5)**2))}for(const _ of e.effects){if(_.__ring)continue;if(!Number.isFinite(_.x)||!Number.isFinite(_.z)){_.__ring="skip";continue}const p=new An(1,2.2,28);p.rotateX(-Math.PI/2);const g=new at(p,new he({color:_.color??(_.type==="explosion"?16739116:11561688),transparent:!0,opacity:.8,depthWrite:!1}));g.position.set(_.x,.35,_.z),g.renderOrder=3,n.add(g),_.__ring=g,d.push({mesh:g,fx:_})}d=d.filter(({mesh:_,fx:p})=>{const g=p.age/p.life;return g>=1?(n.remove(_),!1):(_.scale.setScalar(1+g*(p.radius??Y.items.wave.radius)),_.material.opacity=.8*(1-g),!0)})}}}const Xb=s=>(s%1+1)%1;class qb{constructor(t,e,n={}){this.track=t,this.race=e,this.rng=n.rng||Math.random,this.onEvent=n.onEvent||(()=>{}),this.fish=[],this._id=0,this._cooldowns=new Map,this.log=[]}reset(){this.fish=[],this._cooldowns.clear(),this.log=[]}update(t,e=0){Y.flyingFish?.enabled&&(this._spawnRanked(t),this._updateFish(t,e))}_spawnRanked(t){const e=Y.flyingFish;if(this.race.started!==!1&&this.race.phase!=="over")for(const i of this._eligibleEntries()){const r=Math.max(0,(this._cooldowns.get(i.id)||0)-t);if(r>0){this._cooldowns.set(i.id,r);continue}const a=Math.max(1,Math.min(3,i.place||3)),o=e.rankChancePerSec[a-1]||0;this.rng()>=o*t||(this._spawnFor(i,a),this._cooldowns.set(i.id,this._rand(e.cooldown[0],e.cooldown[1])))}}_eligibleEntries(){return this.race.entries.filter(t=>!t.finished&&t.place>=1&&t.place<=3).sort((t,e)=>t.place-e.place)}_spawnFor(t,e=t.place||1){const n=Y.flyingFish,i=this.track.nearest(t.boat.position.x,t.boat.position.z),r=this._rand(n.ahead[0],n.ahead[1]),a=i.arc+r,o=Xb(a/this.track.length),l=this.track.pointAt(o),c=this.track.tangentAt(o),h=-c.z,d=c.x,u=this.rng()<.5?-1:1,f=u*12.5,m=-u*12.5,_=(i.side||0)*Math.min(2.2,i.dist||0)+this._rand(-n.laneJitter,n.laneJitter),p={id:++this._id,targetId:t.id,rank:e,arc:(a%this.track.length+this.track.length)%this.track.length,cx:l.x,cz:l.z,nx:h,nz:d,tx:c.x,tz:c.z,startSide:f,endSide:m,midSide:_,x:l.x+h*f,z:l.z+d*f,y:-.3,age:0,life:n.life,alive:!0,hitIds:new Set};return this.fish.push(p),this._emit({type:"spawn",hazard:"flyingFish",target:t.id,rank:e,fishId:p.id}),p}_updateFish(t,e){const n=Y.flyingFish;for(const i of this.fish){if(!i.alive)continue;if(i.age+=t,i.age>=i.life){i.alive=!1;continue}const r=Math.min(1,i.age/Math.max(.01,n.crossTime)),a=Yb(i.startSide,i.midSide,i.endSide,r);i.x=i.cx+i.nx*a,i.z=i.cz+i.nz*a,i.y=-.25+Math.sin(Math.min(1,i.age/i.life)*Math.PI)*n.jumpHeight,i.roll=Math.sin(e*8+i.id)*.35,i.heading=Math.atan2(-i.nx*Math.sign(i.endSide-i.startSide),-i.nz*Math.sign(i.endSide-i.startSide)),this._collide(i)}this.fish=this.fish.filter(i=>i.alive)}_collide(t){const e=Y.flyingFish;if(!(t.y<.15||t.y>2.6))for(const n of this.race.entries){if(n.finished||t.hitIds.has(n.id))continue;const i=n.boat;if(i.airborne||i.trapped>0)continue;const r=Math.hypot(i.position.x-t.x,i.position.z-t.z);if(r>e.radius+Y.trackFeatures.colliderRadius)continue;const a=r<.01?t.nx:(i.position.x-t.x)/r,o=r<.01?t.nz:(i.position.z-t.z)/r;i.position.x+=a*e.push*.35,i.position.z+=o*e.push*.35,i.speed=Math.max(1.5,i.speed*e.slowKeep),i.lateral+=(a*Math.cos(i.heading)+o*-Math.sin(i.heading))*4,i.lastEvent="hitfish",t.hitIds.add(n.id),this._emit({type:"hit",hazard:"flyingFish",target:n.id,fishId:t.id})}}_rand(t,e){return t+this.rng()*(e-t)}_emit(t){const e={...t,t:this.race.time};this.log.push(e),this.log.length>120&&this.log.shift(),this.onEvent(e)}}function Yb(s,t,e,n){const i=1-n;return i*i*s+2*i*n*t+n*n*e}const zp=3025446,Ha=s=>new ns({color:s});function Ga(s,t=.05){const e=new at(s.geometry,new he({color:zp,side:Ae}));e.scale.multiplyScalar(1+t),s.add(e)}function Zb(){const s=new pe,t=new at(new Ie(.75,14,9),Ha(7328728));t.scale.set(.75,.42,1.55),Ga(t,.06),s.add(t);const e=new at(new rn(.42,.65,10),Ha(16055295));e.rotation.x=-Math.PI/2,e.position.z=-1.18,Ga(e,.05),s.add(e);const n=new at(new rn(.55,.75,3),Ha(3835647));n.rotation.x=Math.PI/2,n.position.z=1.28,n.scale.x=.7,Ga(n,.05),s.add(n);for(const o of[-1,1]){const l=new at(new rn(.22,.72,3),Ha(10217727));l.rotation.z=o*Math.PI/2,l.rotation.y=o*.55,l.position.set(o*.58,0,.05),Ga(l,.05),s.add(l)}const i=new Ie(.08,8,6);for(const o of[-1,1]){const l=new at(i,new he({color:zp}));l.position.set(o*.28,.18,-1.1),s.add(l)}const r=new An(.5,.75,24);r.rotateX(-Math.PI/2);const a=new at(r,new he({color:16055295,transparent:!0,opacity:.55,depthWrite:!1}));return a.position.y=-.35,a.renderOrder=3,s.add(a),s.userData.splash=a,s}function $b(s,t){const e=new pe;s.add(e);const n=new Map;return{group:e,reset(){for(const[,i]of n)e.remove(i);n.clear()},update(i,r){const a=new Set(t.fish);for(const o of t.fish){let l=n.get(o);l||(l=Zb(),e.add(l),n.set(o,l)),l.visible=!0,l.position.set(o.x,o.y,o.z),l.rotation.set(o.roll||0,o.heading||0,Math.sin(r*9+o.id)*.18,"YXZ");const c=1+Math.sin(r*16+o.id)*.04;l.scale.setScalar(c);const h=l.userData.splash;if(h){const d=Math.max(0,1-Math.abs(o.y)/1.1);h.visible=d>.05,h.material.opacity=.55*d,h.scale.setScalar(1+(1-d)*1.8)}}for(const[o,l]of[...n])(!a.has(o)||!o.alive)&&(e.remove(l),n.delete(o))}}}const Ad=[14964526,3519052,5928664,11561688,14203196,3982528];function Kb(s,t,e=3,n){const i=s.startLine,r=i.tangent.clone().cross(new i.pos.constructor(0,1,0)).normalize(),a=[];for(let o=0;o<Math.max(1,Math.min(6,e));o++){const l=Ad[o%Ad.length],c=Dp(l),h=new t.BoatClass(c.group,{isDown:()=>!1},{...t,raceId:`ai${o}`,view:c}),d=i.pos.clone().addScaledVector(i.tangent,-10-o*3).addScaledVector(r,(o%2-.5)*3*((o>>1)+1)*.8);d.y=.2,h.setPose(d,Math.atan2(-i.tangent.x,-i.tangent.z)),a.push({id:`ai${o}`,label:`AI ${o+1}`,color:l,boat:h,view:c,skill:.9-o*.12})}return a}const kp="swr-be…Loop";function Jb(s,t,e){const n=Ph(),i={newBestLap:!1,newBestTime:!1,newBestPlace:!1,best:{...n}};typeof t=="number"&&(n.bestLap===null||t<n.bestLap)&&(n.bestLap=t,i.newBestLap=!0),typeof e=="number"&&(n.finishTime===null||e<n.finishTime)&&(n.finishTime=e,i.newBestTime=!0),typeof s=="number"&&(n.place===null||s<n.place)&&(n.place=s,i.newBestPlace=!0);try{localStorage.setItem(kp,JSON.stringify(n))}catch{}return Uc=n,i.best=n,i}let Uc=null;function Ph(){if(Uc)return{...Uc};try{const s=localStorage.getItem(kp);if(s){const t=JSON.parse(s);if(t&&typeof t=="object")return{bestLap:typeof t.bestLap=="number"?t.bestLap:null,finishTime:typeof t.finishTime=="number"?t.finishTime:null,place:typeof t.place=="number"?t.place:null}}}catch{}return{bestLap:null,finishTime:null,place:null}}function Qb(){const s=Ph();return s.bestLap!==null||s.finishTime!==null||s.place!==null}function $a(){try{const s=localStorage.getItem("swr-quality");return s&&jb().includes(s)?s:null}catch{return null}}function Td(s){try{localStorage.setItem("swr-quality",s)}catch{}}function jb(){return["low","auto","high"]}function ce(s,t,e,n,i){const r=document.createElement(s);return t&&(r.id=t),e&&(r.className=e),i!==void 0&&(r.textContent=i),n&&n.appendChild(r),r}function tS(s,{onStart:t,onResume:e,onLangChange:n,onQualityChange:i,onSound:r,isSoundOn:a=()=>!0,onMapChange:o,maps:l=[],selectedMapIndex:c=0,race:h}){const d=ce("div","menu","menu-overlay",s),u=ce("div",null,"menu-card",d);ce("h1","menu-title",null,u,""),ce("div","menu-track","menu-sub",u,"");const f=ce("div","menu-maps","menu-maps",u),m=ce("div","menu-controls","menu-controls",u,""),_=ce("div","menu-startrule","menu-startrule",u,""),p=ce("div","menu-best","menu-best",u,""),g=ce("div","menu-row","menu-row",u),v=ce("button","btn-start","btn btn-primary",g,""),x=ce("button","btn-resume","btn",g,"");x.style.display="none";const y=ce("div",null,"menu-row menu-row-set",u);ce("span",null,"menu-label",y,"").textContent="";const E=ce("button","btn-lang","btn btn-mini",y,""),A=ce("button","btn-sound","btn btn-mini",y,""),w=ce("span","lbl-quality","menu-label",y,""),P=ce("button","btn-quality","btn btn-mini",y,"");let L=c;const M=[];l.forEach((it,ct)=>{const Et=ce("button",null,"map-card",f);Et.type="button";const V=ce("span",null,"map-card-title",Et,it.name),Z=ce("span",null,"map-card-meta",Et,"");Et.dataset.mapIndex=String(ct),Et.addEventListener("click",()=>{L=ct,o?.(ct,it),W(),X()}),M.push({btn:Et,title:V,meta:Z,map:it})});let b=null,B=null,N=null,U=null,q=null,z=null;function X(){const it=Oo();document.title=Ht("menu.title")+" — Sketch Wave Racer";const ct=l[L]||l[0];d.querySelector("#menu-title").textContent=Ht("menu.title"),d.querySelector("#menu-track").textContent=ct?`${Ht("menu.track")}: ${ct.name}`:Ht("menu.track"),W(),m.textContent=Ht("menu.controls"),_.textContent=Ht("menu.startrule"),v.textContent=Ht("menu.start"),x.textContent=Ht("menu.resume"),E.textContent=`${Ht("menu.lang")}: ${it==="zh"?"中文 ▸ English":"English ▸ 中文"}`;const Et=$a()||Y.defaultQuality;w.textContent=Ht("menu.quality"),P.textContent=Et,A.textContent=Ht("menu.sound")+": "+(a()?Ht("menu.sound.on"):Ht("menu.sound.off"));const V=Ph();if(!Qb())p.innerHTML=`<b>${Ht("menu.best")}</b><br><span class="menu-dim">${Ht("menu.best.none")}</span>`;else{const Z=[`<b>${Ht("menu.best")}</b>`];V.bestLap!==null&&Z.push(Ht("menu.best.bestLap",{t:As(V.bestLap)})),V.finishTime!==null&&Z.push(Ht("menu.best.finishTime",{t:As(V.finishTime)})),V.place!==null&&Z.push(Ht("menu.best.place",{p:V.place})),p.innerHTML=Z.join("<br>")}B&&(B.textContent=Ht("result.again")),N&&(N.textContent=Ht("result.back"))}function W(){for(const{btn:it,meta:ct,map:Et}of M){const V=Number(it.dataset.mapIndex);it.classList.toggle("selected",V===L),ct.textContent=`${Et.label||Ht("menu.map.random")} · ${"★".repeat(Et.difficulty||1)}`,it.title=Ht("menu.map.choose")}}const _t=()=>{b&&(b.style.display="none"),d.style.display="none"};v.addEventListener("click",()=>{_t(),t()}),x.addEventListener("click",()=>{d.style.display="none",e()}),E.addEventListener("click",()=>{const it=Oo()==="zh"?"en":"zh";Db(it),X(),n?.(it)}),A.addEventListener("click",()=>{const it=r();A.textContent=Ht("menu.sound")+": "+Ht(it?"menu.sound.on":"menu.sound.off")}),P.addEventListener("click",()=>{const it=["high","auto","low"],ct=$a()||Y.defaultQuality,Et=it[(it.indexOf(ct)+1)%it.length];Td(Et),X(),i?.(Et)}),$a()||Td(Y.defaultQuality);function yt(it,ct,Et){const V=ct;b=ce("div","result","menu-overlay",s),b.style.display="none",b.addEventListener("click",()=>{b.style.display="none"});const Z=ce("div",null,"menu-card",b);U=ce("div","result-place","result-place",Z,""),q=ce("div","result-body","result-body",Z,""),z=ce("div","result-best","menu-best",Z,"");const ut=ce("div",null,"menu-row",Z);B=ce("button","btn-again","btn btn-primary",ut,Ht("result.again")),N=ce("button","btn-back","btn",ut,Ht("result.back")),B.addEventListener("click",()=>{_t(),t()}),N.addEventListener("click",()=>{b.style.display="none",d.style.display="flex"}),U.innerHTML=`${Ht("result.place",{p:V.place})}`+(Et.newBestPlace?` <span class="new-best">★ ${Ht("result.newBest")}</span>`:"");const rt=it.slice().sort((vt,Lt)=>vt.place-Lt.place).map(vt=>{const Lt=vt.bestLap!==null&&vt.bestLap!==void 0?`${Ht("result.bestLap")} ${As(vt.bestLap)}`:"",Nt=vt.id==="player"&&Et.newBestLap;return`<div class="result-line"><span class="rp-dot" style="background:#${(vt.color||0).toString(16).padStart(6,"0")}"></span><b>${vt.place}.</b> ${vt.label} — ${vt.finishTime?As(vt.finishTime):"--"} <span class="menu-dim">${Lt}</span>${Nt?` <span class="new-best">★ ${Ht("result.newBest")}</span>`:""}</div>`});q.innerHTML=rt.join(""),z.innerHTML=Et.newBestTime?`★ ${Ht("result.newBest")} ${Ht("result.total")} ${As(V.finishTime)}`:`${Ht("result.total")} ${V.finishTime?As(V.finishTime):"--"}`,b.style.display="flex"}return{refresh:X,showPauseMenu(it){x.style.display=it?"inline-block":"none",v.textContent=it?"↻ "+Ht("menu.start"):Ht("menu.start"),d.style.display="flex"},hideMenu(){d.style.display="none"},showResult:yt,hideResult(){b&&(b.style.display="none")},forceCloseAll:_t,menuOpen:()=>d.style.display==="flex",resultOpen:()=>!!b&&b.style.display==="flex"}}function As(s){if(s==null)return"--";const t=Math.floor(s/60),e=Math.floor(s%60),n=Math.floor(s*100%100);return`${t}:${String(e).padStart(2,"0")}.${String(n).padStart(2,"0")}`}function eS(s,t,e){const n=s.getContext("2d"),i=s.width,r=10;let a=null;function o(){const h=[];let d=1/0,u=-1/0,f=1/0,m=-1/0;for(let g=0;g<=120;g++){const v=t.curve.getPointAt(g/120);h.push(v),d=Math.min(d,v.x),u=Math.max(u,v.x),f=Math.min(f,v.z),m=Math.max(m,v.z)}const _=Math.max(u-d,m-f)||1,p=(i-r*2)/_;a={key:`${t.map?.id||"track"}:${t.length.toFixed(3)}`,pts:h,minX:d,minZ:f,scale:p}}o();const l=(h,d)=>[r+(h-a.minX)*a.scale,r+(d-a.minZ)*a.scale],c=h=>i-h;return{draw(){const h=`${t.map?.id||"track"}:${t.length.toFixed(3)}`;(!a||a.key!==h)&&o();const d=1;n.clearRect(0,0,i*d,i*d),n.fillStyle="rgba(246,239,226,0.88)",n.strokeStyle="#2e2a26",n.lineWidth=3,Ed(n,1.5,1.5,i-3,i-3,12),n.fill(),n.stroke(),n.beginPath(),a.pts.forEach((u,f)=>{const[m,_]=l(u.x,u.z);f===0?n.moveTo(m,c(_)):n.lineTo(m,c(_))}),n.closePath(),n.strokeStyle="rgba(58,134,255,0.75)",n.lineWidth=6,n.stroke();{const u=t.startLine;u.tangent;const f=t.pointAt(((0-9/t.length)%1+1)%1),m=t.pointAt(9/t.length%1),[_,p]=l(f.x,f.z),[g,v]=l(m.x,m.z),x=c(p),y=c(v),E=5;for(let B=0;B<E;B++){const N=B/E,U=(B+1)/E;n.strokeStyle=B%2?"#2e2a26":"#ffffff",n.lineWidth=6,n.beginPath(),n.moveTo(_+(g-_)*N,x+(y-x)*N),n.lineTo(_+(g-_)*U,x+(y-x)*U),n.stroke()}n.globalCompositeOperation="destination-over",n.strokeStyle="rgba(46,42,38,0.85)",n.lineWidth=8.5,n.beginPath(),n.moveTo(_,x),n.lineTo(g,y),n.stroke(),n.globalCompositeOperation="source-over";const A=Ht("minimap.finish");n.font='700 10px "Comic Sans MS","PingFang SC",sans-serif',n.textAlign="center",n.textBaseline="middle";const[w,P]=l(u.pos.x,u.pos.z),L=w+20,M=c(P)+15,b=n.measureText(A).width+8;n.fillStyle="rgba(246,239,226,0.92)",n.strokeStyle="#2e2a26",n.lineWidth=1.5,Ed(n,L-b/2,M-7,b,14,4),n.fill(),n.stroke(),n.fillStyle="#2e2a26",n.fillText(A,L,M+.5)}for(const u of e.entries){const[f,m]=l(u.boat.position.x,u.boat.position.z),_=u.id==="player",p=c(m);_?nS(n,f,p,u.boat.heading||0):(n.beginPath(),n.arc(f,p,3.5,0,Math.PI*2),n.fillStyle="#"+(u.color||14964526).toString(16).padStart(6,"0"),n.fill())}}}}function nS(s,t,e,n){s.beginPath(),s.arc(t,e,6.2,0,Math.PI*2),s.fillStyle="#f4b942",s.fill(),s.lineWidth=2,s.strokeStyle="#2e2a26",s.stroke();const i=-Math.sin(n),r=-Math.cos(n),a=Math.cos(n),o=-Math.sin(n),l=[t+i*8.5,e-r*8.5],c=[t-i*4.2+a*4.4,e+r*4.2-o*4.4],h=[t-i*4.2-a*4.4,e+r*4.2+o*4.4];s.beginPath(),s.moveTo(l[0],l[1]),s.lineTo(c[0],c[1]),s.lineTo(h[0],h[1]),s.closePath(),s.fillStyle="#fff3b0",s.fill(),s.lineWidth=1.7,s.strokeStyle="#2e2a26",s.stroke()}function Ed(s,t,e,n,i,r){s.beginPath(),s.moveTo(t+r,e),s.arcTo(t+n,e,t+n,e+i,r),s.arcTo(t+n,e+i,t,e+i,r),s.arcTo(t,e+i,t,e,r),s.arcTo(t,e,t+n,e,r),s.closePath()}const iS=document.getElementById("game-canvas"),Xs=new Hf({canvas:iS,antialias:Y.renderer.antialias});Xs.setPixelRatio(Math.min(window.devicePixelRatio,Y.renderer.pixelRatioCap));Xs.setSize(window.innerWidth,window.innerHeight);const we=new sh;we.background=new ft(Y.scene.background);we.fog=new Wr(Y.scene.fogColor,Y.scene.fogNear,Y.scene.fogFar);const zs=new Ne(Y.camera.fov,window.innerWidth/window.innerHeight,Y.camera.near,Y.camera.far);zs.position.set(...Y.camera.position);we.add(new Mh(16777215,8368841,.85));const Vp=new Sh(16773849,1.8);Vp.position.set(120,160,80);we.add(Vp);we.add(yb());const Hp=dS();let Vi=Ip(Hp);we.add(Vi.mesh);Mb(we);const Bo=Tb(3);let _r=0;const Se=new Ab(Bo[_r]);let Nc=Fp(Se,we);const qi=new pb,Fc=Dp(Y.boat.color);we.add(Fc.group);const xl=new Rb(Se),vl=new Pb(Se),tn=new Up(Fc.group,qi,{track:Se,features:xl,collision:vl,raceId:"player",view:Fc});{const s=Se.startLine,t=s.pos.clone().addScaledVector(s.tangent,-6);t.y=.2,tn.setPose(t,Math.atan2(-s.tangent.x,-s.tangent.z))}Y.raceFlow.autoStart=!1;const Rt=new Lb(Se,[{id:"player",label:"Player",color:Y.boat.color,boat:tn}]),Gp=Rt.entryOf("player");tn.race=Rt;const sS=3,ii=Kb(Se,{input:qi,track:Se,features:xl,collision:vl,BoatClass:Up},sS);for(const s of ii)we.add(s.view.group),s.boat.race=Rt;Rt.addAiRacers(ii.map(({id:s,label:t,color:e,boat:n})=>({id:s,label:t,color:e,boat:n})),ii.map(s=>s.skill));const Wp=[tn,...ii.map(s=>s.boat)];tn.mates=()=>Wp.filter(s=>s!==tn);for(const s of ii)s.boat.mates=()=>Wp.filter(t=>t!==s.boat);const rS=new vb(zs),aS=Nb(Rt,Gp,Y.boat.maxSpeed),Cd=document.getElementById("hud-gauge"),Rd=Cd?zb(Cd,Rt,Gp):null,Is=xb(Hp);we.add(Is.points);const oS=[tn,...ii.map(s=>s.boat)];for(const s of oS)s.onSplash=t=>Is.emitSplash(s,t);const ie=gb(),Xp=()=>ie.unlock();window.addEventListener("pointerdown",Xp,{once:!0});window.addEventListener("keydown",Xp,{once:!0});const xi=new Vb(Se,Rt,{onEvent:s=>{if(s.type==="pickup"&&s.racerId==="player"&&ie.sfx.pickup(),s.type==="use"&&s.racerId==="player"){const t={speed:"speed",turbo:"turbo",shield:"shield",missile:"missile",bubble:"bubble",wave:"waveBurst"}[s.item];(ie.sfx[t]||ie.sfx.use)()}if((s.type==="hit"||s.type==="block")&&s.target==="player"){const t={missile:"missileHit",bubble:"trapped",wave:"waveBurst"}[s.weapon];(s.type==="block"?ie.sfx.block:ie.sfx[t]||ie.sfx.hit)()}}});Rt.itemsAi=(s,t,e)=>xi.aiThink(s,t,e);let zo=Bp(Se,we,xi);const Zr=new qb(Se,Rt,{onEvent:s=>{s.type==="hit"&&s.target==="player"&&ie.sfx.hit()}}),Ih=$b(we,Zr),Pd=document.getElementById("minimap"),Id=Pd?eS(Pd,Se,Rt):null;let Br=!1;const Ge=tS(document.getElementById("app"),{onStart:()=>{ie.unlock(),ie.sfx.click(),hS(),Br=!0,Rt.startArmed=!0},onResume:()=>{ie.unlock(),ie.sfx.click(),Br=!0,Rt.startArmed=!0},onMapChange:s=>{ie.sfx.click(),cS(s)},maps:Bo,selectedMapIndex:_r,onLangChange:()=>{qp()},onQualityChange:s=>lS(s),onSound:()=>ie.toggleSound(),isSoundOn:()=>ie.isEnabled(),race:Rt});function qp(){document.getElementById("hud-title").textContent=Ht("menu.title"),document.getElementById("hud-controls").textContent=Ht("controls")}function lS(s){const t=Y.quality[s]||Y.quality[Y.defaultQuality];we.remove(Vi.mesh),Vi.mesh.geometry.dispose(),Vi.mesh.material.dispose(),Vi=Ip(t),we.add(Vi.mesh),Xs.setPixelRatio(Math.min(window.devicePixelRatio,t===Y.quality.low?1:Y.renderer.pixelRatioCap))}function cS(s){s===_r||!Bo[s]||(_r=s,Se.configure(Bo[_r]),xl.rebuild(Se),vl.rebuild(Se),Rt.rebuildTrackGeometry(Se),we.remove(Nc.group),Nc=Fp(Se,we),we.remove(zo.group),xi.rebuild(Se),zo=Bp(Se,we,xi),Zr.reset(),Ih.reset(),Rt.time=0,Rt.phase="countdown",Rt.countdown=Y.raceFlow.countdown,Rt.started=!1,Rt._goLeft=0,Rt.finishedOrder=[],Rt.event=null,Br=!1,Yp(),Zp(),Ls=!1)}function hS(){ie.stopAllSfx(),ie.engineUpdate(0,1);for(const s of Rt.entries)s.finished=!1,s.finishTime=null,s.lap=1,s.nextCp=1,s.lapStart=0,s.bestLap=null,s.total=0,s.progress=0,s.offCourse=0,s.outOfBounds=!1,s._arcN=void 0,s._s=0,s._s_prev=0,s._hint=void 0;Rt.time=0,Rt.phase="countdown",Rt.countdown=Y.raceFlow.countdown,Rt.started=!1,Rt._goLeft=0,Rt.finishedOrder=[],Rt.event=null,Yp(),Zp(),xi.reset(),zo.reset(),Zr.reset(),Ih.reset(),Ls=!1,Ge.hideResult(),Ge.hideMenu()}function Yp(){const s=Se.startLine,t=Object.getPrototypeOf(s.pos).constructor,e=new t(-s.tangent.x===0?0:-s.tangent.z,0,s.tangent.x);Rt.entries.forEach((n,i)=>{const r=s.pos.clone().addScaledVector(s.tangent,-6-i*3).addScaledVector(e,(i%2-.5)*3);r.y=.2,n.boat.setPose(r,Math.atan2(-s.tangent.x,-s.tangent.z)),n.boat.drifting=!1,n.boat.driftTime=0,n.boat.driftCharge=0,n.boat.driftBoost=0,n.boat.swell=0,n.boat.blownUp=0,n.boat.startBoost=0,n.boat.startBoostAdd=0,n.boat.startBoostForce=0,n.boat.launchPop=!1,n.boat.launchPower=0,n.boat.view?.setEngineSwell&&n.boat.view.setEngineSwell(0),n.boat.view?.applySwellShake&&n.boat.view.group.scale.set(1,1,1)})}const or={};function Zp(){Rt.resetStartLedgers();for(const t of Object.keys(or))delete or[t];const s=Y.raceFlow.start;for(const t of Rt.entries){if(!t.ai)continue;const e=Math.random();if(e<s.aiFalseStartChance)or[t.id]="blow",t.heldStartAt=Y.raceFlow.countdown*(.3+Math.random()*.4),t.revStopAt=null;else if(e<s.aiFalseStartChance+.3){or[t.id]="perfect",t.heldStartAt=1.5+Math.random()*.9;const n=(s.rpmGreenLo+s.rpmGreenHi)/2,i=Math.min(t.heldStartAt,(n+s.revDrop*t.heldStartAt)/(s.revRamp+s.revDrop));t.revStopAt=t.heldStartAt-i}else t.heldStartAt=null,t.revStopAt=null;t.held=0,t.heldSince=null}}function uS(s){const t=Y.raceFlow.start;for(const e of Rt.entries){if(!e.ai||or[e.id]===void 0)continue;e.heldStartAt!==null&&e.heldStartAt!==void 0&&Rt.countdown<=e.heldStartAt&&!(e.revStopAt!==null&&e.revStopAt!==void 0&&Rt.countdown<e.revStopAt)?(e.fated||(e.fated=!0,e.holding=!0,e.holdDone=!1,e.held=0),e.holding&&!e.holdDone&&(e.held+=s),e.rev=Math.min(t.revMax,(e.rev||0)+t.revRamp*s)):(e.holding&&!e.holdDone&&(e.holdDone=!0),e.rev=Math.max(0,(e.rev||0)-t.revDrop*s))}}window.addEventListener("keydown",s=>{Ge.menuOpen()||Ge.resultOpen()||s.code==="KeyR"&&(Rt.manualReset("player"),ie.sfx.reset())});window.addEventListener("keydown",s=>{s.code==="Escape"&&(Ge.resultOpen()||(Ge.menuOpen()?Ge.hideMenu():(ie.stopAllSfx(),ie.engineUpdate(0,1),Ge.showPauseMenu(Br))))});window.addEventListener("resize",()=>{zs.aspect=window.innerWidth/window.innerHeight,zs.updateProjectionMatrix(),Xs.setSize(window.innerWidth,window.innerHeight)});function $p(s){let t=document.getElementById("fatal");t||(t=document.createElement("div"),t.id="fatal",document.getElementById("app").appendChild(t)),t.textContent="⚠ "+s}window.addEventListener("error",s=>{$p(s.message+(s.error?.stack?`
`+String(s.error.stack).split(`
`).slice(1,4).join(`
`):""))});window.addEventListener("unhandledrejection",s=>$p(String(s.reason)));function dS(){const s=$a(),t=Y.quality;return t[s]||t[Y.defaultQuality]||t.high}let Ls=!1,Ld=0;const Dd=document.getElementById("hud-fps");let mc=0,gc=0,_c=0;function Kp(){Ge.forceCloseAll&&!Ge.resultOpen()&&Ls&&(Ls=!1);const s=Math.min(Ud.getDelta(),.1),t=Ud.elapsedTime;if(!(Ge.menuOpen()||Ge.resultOpen()||!Br)){Vi.update(t),Nc.update(t),Rt.updateFlow(s);const n=Rt.event?.type==="go"?Rt.event:null;if(Rt.phase==="countdown"){const i=Math.ceil(Rt.countdown);i!==Ld&&(Ld=i,i>0&&ie.sfx.count(i)),Rt.tickRev(s,qi.isDown("throttle")),uS(s);for(const r of Rt.entries){const a=Math.min(1,(r.rev||0)/Y.raceFlow.start.revMax);r.boat.swell=Math.sqrt(a)}}else if(!n)for(const i of Rt.entries)i.boat.swell=0;if(n){ie.stopAllSfx(),ie.sfx.go();for(const i of n.blown||[]){const r=Rt.entryOf(i.racerId),a=r&&r.boat;if(a){const o=Math.min(Y.raceFlow.start.popDriverTime,Math.max(.35,i.penalty||0));a.popT=Math.max(a.popT||0,o),a.blownUp=Math.max(a.blownUp||0,o),a.view?.setEngineSwell&&a.view.setEngineSwell(a.swell||0),a.swell=0,i.racerId==="player"&&(a.lastEvent="falsestart");const l=a.view;l?.triggerBlowUp&&l.triggerBlowUp(),l?.triggerSpringHead&&l.triggerSpringHead(o),ie.sfx.explosion(),Is.emitBlast(a.position.x,a.position.z)}}}Rt.updateAi(s),tn.update(s,t);for(const i of ii)i.boat.update(s,t);xi.update(s),Rt.update(s),Zr.update(s,t),zo.update(s,t),Ih.update(s,t),Rt.event&&(Rt.event.type==="lap"&&Rt.event.racerId==="player"&&ie.sfx.lap(),Rt.event.type==="finish"&&Rt.event.racerId==="player"&&ie.sfx.finish());{const i=tn.lastEvent;if(i){const r={driftboost:"drift",boostpad:"pad",launch:"launch",splash:"splash",hit:"hit",bubblepop:"bubblePop",shieldblock:"block",hitfish:"hit",hitbomb:"missileHit",itembomb:"missile",itembombdrop:"use",perfectstart:"perfectStart"}[i];r&&ie.sfx[r]()}}if(Rt.phase==="countdown"){let i=0;for(const r of Rt.entries)i=Math.max(i,r.boat.swell||0);i>.02&&ie.sfx.engineSwell(i)}else ie.engineUpdate(tn.speed,Y.boat.maxSpeed+Y.trackFeatures.boost.speedAdd);Is.emitWake(tn,s,t);for(const i of ii)Is.emitWake(i.boat,s,t);if(Is.update(s),rS.update(s,tn),aS.update(),Rd&&Rd.draw(),Id&&Id.draw(),Rt.phase==="over"&&!Ls){Ls=!0,ie.stopAllSfx(),ie.engineUpdate(0,1);const i=Rt.entryOf("player"),r=Jb(i.place,i.bestLap,i.finishTime??Rt.time);Ge.showResult(Rt.entries.map(a=>({place:a.place,label:a.label,color:a.color,finished:a.finished,finishTime:a.finishTime,bestLap:a.bestLap,id:a.id})),i,r)}}for(const n of Rt.entries){const i=n.boat.view;i&&(i.syncLaunchPop&&i.syncLaunchPop(n.boat),i.applySwellShake&&i.applySwellShake(s,t))}Xs.render(we,zs);for(const n of Rt.entries){const i=n.boat.view;i&&i.applySwellShake&&(i.group.position.copy(n.boat.position),i.group.scale.set(1,1,1),i.group.rotation.x=0,i.restoreHead&&i.restoreHead())}mc+=s,gc+=1,_c+=s,_c>=.5&&(Dd&&(Dd.textContent=`FPS: ${(gc/mc).toFixed(0)}  |  ${tn.speedKmh.toFixed(0)} km/h`),mc=0,gc=0,_c=0),qi.wasPressed("item")&&xi.use("player",{drop:qi.isDown("brake")}),qi.endFrame(),requestAnimationFrame(Kp)}const Ud=new Ah;qp();Ge.refresh();Ge.showPauseMenu(!1);requestAnimationFrame(Kp);window.SWR={THREE:db,scene:we,camera:zs,renderer:Xs,CONFIG:Y,boat:tn,input:qi,track:Se,race:Rt,features:xl,collision:vl,aiRacers:ii,items:xi,flyingFish:Zr,menu:Ge,audio:ie,debugPlaceAt:s=>{const t=Rt.entryOf("player");return Rt.placeAtCheckpoint(t,s),{lap:t.lap,nextCp:t.nextCp}}};console.log("%cSketch Wave Racer — Phase 7: full race experience ready. Press START.","color:#e4572e;font-weight:bold");
