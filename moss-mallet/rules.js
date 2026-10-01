// Pure board operations shared by gameplay and the regression checks.
export function connected(board,tile) {
  if(!tile)return[];
  const at=(row,col)=>board.find(t=>t.row===row&&t.col===col&&!t.removed);
  const found=new Set([tile]),queue=[tile];
  while(queue.length){const t=queue.shift();for(const [r,c] of [[t.row-1,t.col],[t.row+1,t.col],[t.row,t.col-1],[t.row,t.col+1]]){const n=at(r,c);if(n&&n.type===tile.type&&!found.has(n)){found.add(n);queue.push(n);}}}
  return [...found];
}
export function selection(board,tile,tool='hammer') {
  if(!tile)return[];
  if(tool==='bomb')return board.filter(t=>Math.abs(t.row-tile.row)<=1&&Math.abs(t.col-tile.col)<=1);
  if(tool==='rainbow')return board.filter(t=>t.type===tile.type);
  if(tile.type==='bomb')return board.filter(t=>Math.abs(t.row-tile.row)<=1&&Math.abs(t.col-tile.col)<=1);
  if(tile.type==='rainbow')return board.filter(t=>t.row===tile.row||t.col===tile.col);
  return connected(board,tile);
}
export function expandSpecials(board,selected){
  const set=new Set(selected),queue=selected.filter(t=>['bomb','rainbow'].includes(t.type)),processed=new Set();
  while(queue.length){const t=queue.shift();if(processed.has(t))continue;processed.add(t);
    const more=t.type==='bomb'?board.filter(n=>Math.abs(n.row-t.row)<=1&&Math.abs(n.col-t.col)<=1):board.filter(n=>n.row===t.row||n.col===t.col);
    for(const n of more)if(!set.has(n)){set.add(n);if(['bomb','rainbow'].includes(n.type))queue.push(n);}
  }
  return [...set];
}
export function collapseBoard(board,removed,createTile) {
  const set=new Set(removed),remaining=board.filter(t=>!set.has(t)),fresh=[];
  for(let col=0;col<7;col++){
    const existing=remaining.filter(t=>t.col===col).sort((a,b)=>b.row-a.row);let row=6;
    for(const t of existing)t.row=row--;
    while(row>=0){const tile=createTile(row--,col);remaining.push(tile);fresh.push(tile);}
  }
  return {board:remaining,fresh};
}
