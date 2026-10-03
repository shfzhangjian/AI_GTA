(function(root){
  'use strict';
  const size=14, board=280, strokeWidth=14, labels=[1,2,3,4,5,6,7,8,9,0];
  // Hand-authored pen trajectories, interpolated into smooth handwritten strokes.
  const anchors=[
    [[[88,91],[113,70],[141,42],[137,95],[131,155],[125,223]]],
    [[[65,87],[81,53],[119,42],[160,56],[175,83],[163,114],[130,149],[96,181],[67,220],[112,222],[165,216],[192,219]]],
    [[[69,61],[110,44],[158,51],[174,77],[159,104],[124,128],[104,134],[143,129],[179,153],[181,186],[153,219],[111,226],[72,209]]],
    [[[143,44],[111,83],[79,122],[61,155],[107,156],[156,153],[199,151]],[[168,53],[162,113],[155,166],[150,229]]],
    [[[185,51],[144,48],[98,50],[85,99],[81,128],[118,112],[160,117],[182,147],[181,182],[154,216],[116,227],[74,209]]],
    [[[171,46],[140,53],[109,83],[86,126],[76,166],[84,205],[113,225],[145,220],[171,195],[170,164],[145,145],[113,146],[80,170]]],
    [[[67,55],[107,49],[153,52],[192,50],[169,88],[147,130],[129,175],[113,225]]],
    [[[134,132],[99,108],[87,77],[105,49],[139,44],[168,61],[172,87],[151,113],[113,147],[88,180],[97,212],[132,229],[168,211],[181,180],[162,153],[134,132]]],
    [[[176,104],[160,64],[128,47],[96,58],[78,87],[83,119],[111,137],[147,125],[176,95],[174,136],[158,181],[137,226]]],
    [[[132,46],[99,61],[78,101],[70,150],[79,198],[107,226],[143,220],[170,183],[182,135],[178,89],[158,56],[132,46]]]
  ];
  function smooth(points){
    const out=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
      for(let j=0;j<8;j++) {const t=j/8;out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}
    }
    return [...out,points.at(-1)];
  }
  const samples=anchors.map(strokes=>strokes.map(smooth));
  function bounds(strokes){
    const points=strokes.flat();if(!points.length)return null;
    return {x:Math.min(...points.map(p=>p[0]))-7,y:Math.min(...points.map(p=>p[1]))-7,right:Math.max(...points.map(p=>p[0]))+7,bottom:Math.max(...points.map(p=>p[1]))+7};
  }
  function normalize(strokes){
    const b=bounds(strokes);if(!b)return {strokes:[],bounds:null,scale:1,width:0};
    const scale=224/Math.max(b.right-b.x,b.bottom-b.y),cx=(b.x+b.right)/2,cy=(b.y+b.bottom)/2;
    return {strokes:strokes.map(s=>s.map(p=>[(p[0]-cx)*scale+140,(p[1]-cy)*scale+140])),bounds:b,scale,width:strokeWidth*scale};
  }
  function distance2(x,y,a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
    const t=den?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/den)):0;
    return (x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2;
  }
  function raster(normalized){
    const segments=normalized.strokes.flatMap(s=>s.length===1?[[s[0],s[0]]]:s.slice(1).map((p,i)=>[s[i],p]));
    const radius2=(normalized.width/2)**2;
    return Array.from({length:196},(_,i)=>{
      const cx=i%14*20,cy=Math.floor(i/14)*20;
      const near=segments.filter(([a,b])=>Math.max(a[0],b[0])+normalized.width/2>=cx&&Math.min(a[0],b[0])-normalized.width/2<=cx+20&&Math.max(a[1],b[1])+normalized.width/2>=cy&&Math.min(a[1],b[1])-normalized.width/2<=cy+20);
      let covered=0;
      for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(near.some(([a,b])=>distance2(cx+x*4+2,cy+y*4+2,a,b)<=radius2))covered++;
      return covered/25;
    });
  }
  const kernels=[[[1,1,1],[0,0,0],[-1,-1,-1]],[[1,0,-1],[1,0,-1],[1,0,-1]]];
  function extract(pixels){
    const signed=kernels.map(k=>Array.from({length:144},(_,i)=>{let sum=0;for(let r=0;r<3;r++)for(let c=0;c<3;c++)sum+=pixels[(Math.floor(i/12)+r)*14+i%12+c]*k[r][c];return sum;}));
    const maps=signed.map(m=>m.map(Math.abs));
    const pooled=maps.map(m=>Array.from({length:36},(_,i)=>{const r=Math.floor(i/6)*2,c=i%6*2;return Math.max(m[r*12+c],m[r*12+c+1],m[(r+1)*12+c],m[(r+1)*12+c+1]);}));
    return {signed,maps,pooled,features:pooled.flat()};
  }
  function preprocess(strokes){const normalized=normalize(strokes),gray=raster(normalized),pixels=gray.map(v=>v>=.2?1:0);return {normalized,gray,pixels,...extract(pixels)};}
  const templates=samples.map(preprocess);
  function classify(input){
    const distances=templates.map(t=>t.features.reduce((sum,v,i)=>sum+(input.features[i]-v)**2,0));
    const logits=distances.map(d=>-d/12), max=Math.max(...logits),weights=logits.map(s=>Math.exp(s-max)),total=weights.reduce((s,v)=>s+v,0);
    const winners=distances.map((d,i)=>d===Math.min(...distances)?i:-1).filter(i=>i>=0);
    return {...input,distances,logits,probabilities:weights.map(v=>v/total),winners};
  }
  const model={size,board,strokeWidth,labels,samples,kernels,templates,bounds,normalize,raster,extract,preprocess,classify};
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  root.HandwritingModel=model;
})(typeof window==='undefined'?globalThis:window);
