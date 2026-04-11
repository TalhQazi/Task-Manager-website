import{c as m,n as $}from"./index-CqZb6qNq.js";import{r as i,j as v,u as B,s as C}from"./vendor-ui-cvMH3t5E.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=m("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=m("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=m("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=m("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=m("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=m("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);function F(e,t=[]){let r=[];function s(n,u){const o=i.createContext(u);o.displayName=n+"Context";const c=r.length;r=[...r,u];const d=l=>{var L;const{scope:f,children:g,...y}=l,x=((L=f==null?void 0:f[e])==null?void 0:L[c])||o,N=i.useMemo(()=>y,Object.values(y));return v.jsx(x.Provider,{value:N,children:g})};d.displayName=n+"Provider";function S(l,f){var x;const g=((x=f==null?void 0:f[e])==null?void 0:x[c])||o,y=i.useContext(g);if(y)return y;if(u!==void 0)return u;throw new Error(`\`${l}\` must be used within \`${n}\``)}return[d,S]}const a=()=>{const n=r.map(u=>i.createContext(u));return function(o){const c=(o==null?void 0:o[e])||n;return i.useMemo(()=>({[`__scope${e}`]:{...o,[e]:c}}),[o,c])}};return a.scopeName=e,[s,H(a,...t)]}function H(...e){const t=e[0];if(e.length===1)return t;const r=()=>{const s=e.map(a=>({useScope:a(),scopeName:a.scopeName}));return function(n){const u=s.reduce((o,{useScope:c,scopeName:d})=>{const l=c(n)[`__scope${d}`];return{...o,...l}},{});return i.useMemo(()=>({[`__scope${t.scopeName}`]:u}),[u])}};return r.scopeName=t.scopeName,r}var O=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],E=O.reduce((e,t)=>{const r=$(`Primitive.${t}`),s=i.forwardRef((a,n)=>{const{asChild:u,...o}=a,c=u?r:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),v.jsx(c,{...o,ref:n})});return s.displayName=`Primitive.${t}`,{...e,[t]:s}},{}),A={exports:{}},b={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var p=i;function V(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var q=typeof Object.is=="function"?Object.is:V,D=p.useState,T=p.useEffect,z=p.useLayoutEffect,G=p.useDebugValue;function K(e,t){var r=t(),s=D({inst:{value:r,getSnapshot:t}}),a=s[0].inst,n=s[1];return z(function(){a.value=r,a.getSnapshot=t,h(a)&&n({inst:a})},[e,r,t]),T(function(){return h(a)&&n({inst:a}),e(function(){h(a)&&n({inst:a})})},[e]),G(r),r}function h(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!q(e,r)}catch{return!0}}function U(e,t){return t()}var W=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?U:K;b.useSyncExternalStore=p.useSyncExternalStore!==void 0?p.useSyncExternalStore:W;A.exports=b;var J=A.exports;function Q(){return J.useSyncExternalStore(X,()=>!0,()=>!1)}function X(){return()=>{}}var w="Avatar",[Y]=F(w),[Z,_]=Y(w),R=i.forwardRef((e,t)=>{const{__scopeAvatar:r,...s}=e,[a,n]=i.useState("idle");return v.jsx(Z,{scope:r,imageLoadingStatus:a,onImageLoadingStatusChange:n,children:v.jsx(E.span,{...s,ref:t})})});R.displayName=w;var I="AvatarImage",M=i.forwardRef((e,t)=>{const{__scopeAvatar:r,src:s,onLoadingStatusChange:a=()=>{},...n}=e,u=_(I,r),o=ee(s,n),c=B(d=>{a(d),u.onImageLoadingStatusChange(d)});return C(()=>{o!=="idle"&&c(o)},[o,c]),o==="loaded"?v.jsx(E.img,{...n,ref:t,src:s}):null});M.displayName=I;var j="AvatarFallback",P=i.forwardRef((e,t)=>{const{__scopeAvatar:r,delayMs:s,...a}=e,n=_(j,r),[u,o]=i.useState(s===void 0);return i.useEffect(()=>{if(s!==void 0){const c=window.setTimeout(()=>o(!0),s);return()=>window.clearTimeout(c)}},[s]),u&&n.imageLoadingStatus!=="loaded"?v.jsx(E.span,{...a,ref:t}):null});P.displayName=j;function k(e,t){return e?t?(e.src!==t&&(e.src=t),e.complete&&e.naturalWidth>0?"loaded":"loading"):"error":"idle"}function ee(e,{referrerPolicy:t,crossOrigin:r}){const s=Q(),a=i.useRef(null),n=s?(a.current||(a.current=new window.Image),a.current):null,[u,o]=i.useState(()=>k(n,e));return C(()=>{o(k(n,e))},[n,e]),C(()=>{const c=l=>()=>{o(l)};if(!n)return;const d=c("loaded"),S=c("error");return n.addEventListener("load",d),n.addEventListener("error",S),t&&(n.referrerPolicy=t),typeof r=="string"&&(n.crossOrigin=r),()=>{n.removeEventListener("load",d),n.removeEventListener("error",S)}},[n,r,t]),u}var ie=R,de=M,le=P;export{re as B,oe as C,le as F,de as I,ue as L,ce as M,ie as R,se as a,ae as b};
