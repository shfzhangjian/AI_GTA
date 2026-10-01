import assert from 'node:assert/strict';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {addGoal} from '../src/goal.js';
await RAPIER.init();
function simulate(x){
 const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
 const platform=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
 addGoal(new THREE.Group(),world,platform,RAPIER,4,-3.8);
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,1.2,-3.8).setCcdEnabled(true));
 // Isolate vertical contact so a ball on the narrow rim cannot roll off its edge.
 body.setEnabledTranslations(false,true,false,true);
 world.createCollider(RAPIER.ColliderDesc.ball(.28).setRestitution(.18),body);
 let passedBelow=false;for(let i=0;i<180;i++){world.step();if(body.translation().y<-.8)passedBelow=true;}
 const y=body.translation().y;world.free();return {y,passedBelow};
}
const center=simulate(4);assert.ok(center.passedBelow,'Ball must fall through the opening');assert.ok(center.y>-1.3&&center.y<-.9,'Cup floor must catch ball');
const edge=simulate(4.73);assert.ok(!edge.passedBelow,'Solid rim must support ball');assert.ok(edge.y>.2,'Rim must remain at board level');
console.log('PASS: ball falls through opening, lands in cup, and rim supports edge contact.');
