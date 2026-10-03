importScripts('./vendor/cube.js','./vendor/solve.js');
try { Cube.initSolver(); postMessage({type:'ready'}); }
catch(error) { postMessage({type:'init-error',error:error.message}); }
onmessage = ({data}) => {
  try {
    const cube=Cube.fromString(data.state);
    const algorithm=cube.isSolved() ? '' : cube.solve();
    const check=Cube.fromString(data.state).move(algorithm);
    if(!check.isSolved()) throw new Error('还原结果校验失败');
    postMessage({type:'solution',id:data.id,state:data.state,moves:algorithm.trim().split(/\s+/).filter(Boolean)});
  } catch(error) { postMessage({type:'error',id:data.id,error:error.message}); }
};
