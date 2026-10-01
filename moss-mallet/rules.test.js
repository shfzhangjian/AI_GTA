import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connected,selection,expandSpecials,collapseBoard} from './rules.js';
const makeBoard=()=>Array.from({length:49},(_,id)=>({id,row:Math.floor(id/7),col:id%7,type:'wood'}));
test('chains use four neighbours, never diagonal contacts',()=>{
  const board=makeBoard();for(const id of [0,1,7,16])board[id].type='grass';
  assert.deepEqual(connected(board,board[0]).map(t=>t.id).sort((a,b)=>a-b),[0,1,7]);
  assert.equal(connected(board,board[16]).length,1);
});
test('corner bombs are clipped and rainbow tools remove only matching types',()=>{
  const board=makeBoard();board[0].type='grass';board[48].type='grass';
  assert.equal(selection(board,board[0],'bomb').length,4);
  assert.deepEqual(selection(board,board[0],'rainbow').map(t=>t.id),[0,48]);
  board[0].type='bomb';board[48].type='bomb';
  assert.deepEqual(selection(board,board[0],'rainbow').map(t=>t.id),[0,48]);
});
test('cross-clears trigger neighbouring bombs without duplicating tiles or looping',()=>{
  const board=makeBoard();board[24].type='rainbow';board[25].type='bomb';board[18].type='bomb';
  const affected=expandSpecials(board,selection(board,board[24]));
  assert.equal(new Set(affected).size,affected.length);
  assert.ok(affected.includes(board[10]));assert.ok(affected.includes(board[26]));
  assert.ok(!affected.includes(board[0]));
});
test('refill keeps exactly 49 unique cells over 500 mixed chain removals',()=>{
  let board=makeBoard(),nextId=49,seed=42;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const types=['wood','grass','pink','blue','gold','bomb','rainbow'];
  for(let step=0;step<500;step++){
    const tile=board[Math.floor(rand()*49)];
    const removed=expandSpecials(board,selection(board,tile,step%11===0?'bomb':'hammer'));
    const keptOrder=board.filter(t=>!removed.includes(t)&&t.col===tile.col).sort((a,b)=>a.row-b.row).map(t=>t.id);
    const result=collapseBoard(board,removed,(row,col)=>({id:nextId++,row,col,type:types[Math.floor(rand()*types.length)]}));
    board=result.board;
    assert.equal(board.length,49);assert.equal(new Set(board).size,49);
    assert.equal(new Set(board.map(t=>`${t.row},${t.col}`)).size,49);
    assert.ok(board.every(t=>t.row>=0&&t.row<7&&t.col>=0&&t.col<7&&!t.removed));
    assert.deepEqual(board.filter(t=>keptOrder.includes(t.id)).sort((a,b)=>a.row-b.row).map(t=>t.id),keptOrder);
  }
});
