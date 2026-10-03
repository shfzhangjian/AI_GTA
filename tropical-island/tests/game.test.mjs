import test from 'node:test';
import assert from 'node:assert/strict';
import {IslandGame,PEARLS,LOCATIONS,ISLETS,waterAllowed,findWaterPath} from '../src/game-state.js';

test('all eight pearls are on reachable water and routes avoid the island',()=>{
 for(const [x,z]of PEARLS){assert.ok(waterAllowed(x,z));const route=findWaterPath({x:0,z:9.4},{x,z});assert.ok(route.length);for(const point of route)assert.ok(waterAllowed(point.x,point.z));}
 assert.deepEqual(findWaterPath({x:0,z:9.4},{x:0,z:-2}),[]);
 for(const [x,z]of ISLETS)assert.equal(waterAllowed(x,z),false);
});
test('a full journey collects every pearl and restores all four landmarks',()=>{
 const game=new IslandGame();game.start();
 for(const [x,z]of PEARLS){assert.ok(game.sailTo(x,z));for(let i=0;i<4000&&game.path.length;i++)game.update(1/60);assert.ok(Math.hypot(game.boat.x-x,game.boat.z-z)<.2);}
 assert.equal(game.collected.length,8);assert.equal(game.pearls,8);
 for(const place of LOCATIONS.filter(l=>l.cost)){assert.equal(game.repair(place.id),true);assert.equal(game.repair(place.id),false);}
 assert.equal(game.complete,true);assert.equal(game.pearls,0);assert.equal(game.events.filter(e=>e.type==='complete').length,1);
 const loaded=new IslandGame(JSON.parse(JSON.stringify(game.serialize())));assert.equal(loaded.complete,true);assert.deepEqual(loaded.boat,game.boat);
});
test('pause, affordability, coastline collision and storage corruption are safe',()=>{
 const game=new IslandGame();assert.equal(game.repair('harbor'),false);game.start();assert.equal(game.repair('harbor'),false);game.paused=true;const before=game.serialize();game.update(.06,{up:true});assert.deepEqual(game.serialize(),before);assert.equal(game.sailTo(0,7),false);
 game.paused=false;for(let i=0;i<3000;i++)game.update(.06,{up:true});assert.ok(waterAllowed(game.boat.x,game.boat.z));
 const corrupt=new IslandGame({version:1,started:true,collected:[0,0,-1,9,'3'],restored:['harbor','unknown','wheel'],boat:{x:Infinity,z:NaN},elapsed:-1});assert.deepEqual(corrupt.collected,[0]);assert.deepEqual(corrupt.restored,[]);assert.equal(corrupt.pearls,1);assert.ok(waterAllowed(corrupt.boat.x,corrupt.boat.z));
});
