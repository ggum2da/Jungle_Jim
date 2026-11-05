export type Vec = {x:number;y:number};
export const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y);
export const WORLD={w:2400,h:1600};
export const objectives=['잔해를 벗어나 이동 표식 두 곳 통과','장비 보관함에서 소총 확보','의료 상자 확보 후 Q로 치료, 준호와 대화','위장한 스토커 3마리 처치','북동쪽 집결지에 도착'];
export const markers=[{x:430,y:1240},{x:650,y:1150}];
export const sites={rifle:{x:790,y:1120},med:{x:970,y:1070},junho:{x:1110,y:1040},ammo:{x:1250,y:1010},exit:{x:2090,y:340}};
export const walls=[{x:490,y:960,w:145,h:95},{x:940,y:770,w:200,h:80},{x:1430,y:1040,w:190,h:85},{x:1710,y:590,w:100,h:180},{x:1320,y:510,w:170,h:90}];
export type Enemy=Vec&{id:number;hp:number;state:'chase'|'windup'|'leap'|'recover'|'dead';timer:number;target:Vec;angle:number;hit:boolean;navigation?:Vec;navigationAt?:number};
export type Ammo={loaded:number;reserve:number};
export type Save={version:1;stage:number;health:number;rifle:boolean;ammo:Ammo[];medkits:number;dead:number[];medTaken:boolean;ammoLeft:number;emergency:boolean;healed:boolean;checkpoint:Vec;completed:boolean};
export type Controls={x:number;y:number;aim:Vec;fire:boolean;sprint:boolean;aiming:boolean};
export function lineCircle(a:Vec,b:Vec,c:Vec,r:number):number|null{
 const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-c.x,fy=a.y-c.y,A=dx*dx+dy*dy;
 if(A===0)return null; const B=2*(fx*dx+fy*dy),C=fx*fx+fy*fy-r*r,D=B*B-4*A*C;
 if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;
}
function rectHit(a:Vec,b:Vec,rects:typeof walls):number{
 let first=1;
 for(const w of rects){let lo=0,hi=1;for(const [p,d,min,max] of [[a.x,b.x-a.x,w.x,w.x+w.w],[a.y,b.y-a.y,w.y,w.y+w.h]]){
 if(Math.abs(d)<1e-9){if(p<min||p>max){lo=2;break;}}else{const u=(min-p)/d,v=(max-p)/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
 if(lo<=hi&&lo>=0)first=Math.min(first,lo);
 }return first;
}
export const wallHit=(a:Vec,b:Vec)=>rectHit(a,b,walls);
const expanded=walls.map(w=>({x:w.x-29,y:w.y-29,w:w.w+58,h:w.h+58}));
export function navigate(from:Vec,to:Vec):Vec{
 if(rectHit(from,to,expanded)===1)return to;
 const nodes=[from,to,...expanded.flatMap(w=>[{x:w.x-2,y:w.y-2},{x:w.x+w.w+2,y:w.y-2},{x:w.x-2,y:w.y+w.h+2},{x:w.x+w.w+2,y:w.y+w.h+2}])];
 const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),done=new Set<number>();costs[0]=0;
 for(let step=0;step<nodes.length;step++){
 let current=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(current<0||costs[i]<costs[current]))current=i;
 if(current<0||!Number.isFinite(costs[current]))break;if(current===1)break;done.add(current);
 for(let i=0;i<nodes.length;i++){if(done.has(i)||i===current||rectHit(nodes[current],nodes[i],expanded)<1)continue;const cost=costs[current]+distance(nodes[current],nodes[i]);if(cost<costs[i]){costs[i]=cost;previous[i]=current;}}
 }
 if(previous[1]<0)return from;let n=1;while(previous[n]>0)n=previous[n];return nodes[n];
}
export class GameModel {
 player={x:280,y:1300};health=70;stage=0;markers=0;rifle=false;weapon=0;ammo:Ammo[]=[{loaded:12,reserve:36},{loaded:30,reserve:90}];medkits=0;medTaken=false;healed=false;ammoLeft=30;emergency=false;enemies:Enemy[]=[];dead:number[]=[];checkpoint={x:280,y:1300};completed=false;
 time=0;reload=0;healing=0;shotCooldown=0;dodge=0;dodgeCooldown=0;jump=0;angle=0;dodgeDirection={x:0,y:0};
 notice='태건 · 전원 응답해. 생존자는 집결지로 이동한다.';noticeUntil=8;saveRequested=false;lastTrace:{a:Vec;b:Vec;weak:boolean;time:number}|null=null;damageFlash=0;
 get current(){return this.ammo[this.weapon]};
 get capacity(){return this.weapon===1?30:12};
 say(text:string){this.notice=text;this.noticeUntil=this.time+7;}
 snapshot():Save{return {version:1,stage:this.stage,health:this.health,rifle:this.rifle,ammo:structuredClone(this.ammo),medkits:this.medkits,dead:[...this.dead],medTaken:this.medTaken,ammoLeft:this.ammoLeft,emergency:this.emergency,healed:this.healed,checkpoint:{...this.checkpoint},completed:this.completed};}
 restore(s:Save){this.stage=s.stage;this.health=s.health;this.rifle=s.rifle;this.weapon=s.rifle?1:0;this.ammo=structuredClone(s.ammo);this.medkits=s.medkits;this.dead=[...s.dead];this.medTaken=s.medTaken;this.ammoLeft=s.ammoLeft;this.emergency=s.emergency;this.healed=s.healed;this.checkpoint={...s.checkpoint};this.player={...s.checkpoint};this.completed=s.completed;this.markers=s.stage>0?2:0;if(this.stage===3)this.spawn();}
 checkpointAt(p:Vec){this.checkpoint={...p};this.saveRequested=true;}
 spawn(){for(const [id,x,y] of [[1,1450,810],[2,1660,870],[3,1710,400]])if(!this.dead.includes(id)&&!this.enemies.some(e=>e.id===id))this.enemies.push({id,x,y,hp:100,state:'chase',timer:0,target:{x,y},angle:0,hit:false});}
 startReload(){if(this.health<=0||this.reload||this.healing||this.dodge||this.current.loaded===this.capacity||!this.current.reserve)return;this.reload=this.weapon===1?2.2:1.5;this.say('재장전 중…');}
 heal(){if(this.health<=0||this.health>=100||!this.medkits||this.healing||this.dodge)return;this.reload=0;this.healing=2;this.say('치료 중 · 피격 시 중단됩니다');}
 switchWeapon(){if(!this.rifle||this.health<=0)return;this.weapon=1-this.weapon;this.reload=0;this.healing=0;this.shotCooldown=.4;}
 evade(x:number,y:number){if(this.health<=0||this.dodgeCooldown>0)return;const n=Math.hypot(x,y);this.dodgeDirection=n?{x:x/n,y:y/n}:{x:-Math.cos(this.angle),y:-Math.sin(this.angle)};this.dodge=.45;this.dodgeCooldown=1.5;this.reload=0;this.healing=0;}
 jumpNow(){if(!this.jump&&this.health>0)this.jump=.65;}
 move(p:Vec,dx:number,dy:number,r:number){for(const axis of ['x','y'] as const){const delta=axis==='x'?dx:dy;const steps=Math.max(1,Math.ceil(Math.abs(delta)/8));for(let i=0;i<steps;i++){const next={...p,[axis]:p[axis]+delta/steps};if(next.x<r||next.y<r||next.x>WORLD.w-r||next.y>WORLD.h-r)break;if(walls.some(w=>next.x+r>w.x&&next.x-r<w.x+w.w&&next.y+r>w.y&&next.y-r<w.y+w.h))break;p[axis]=next[axis];}}}
 interact(){if(this.health<=0)return;const p=this.player;
 if(this.stage===1&&distance(p,sites.rifle)<85){this.rifle=true;this.weapon=1;this.stage=2;this.checkpointAt({x:830,y:1180});this.say('소총 확보. 준호가 동쪽에서 치료를 기다리고 있다.');}
 else if(this.stage===2&&distance(p,sites.med)<85){if(!this.medTaken){this.medkits=2;this.medTaken=true;}else if(!this.healed&&!this.medkits)this.medkits=1;this.say('회복약 확보 · Q 또는 치료 버튼을 1회 사용하세요');}
 else if(this.stage===2&&distance(p,sites.junho)<85){if(!this.healed){this.say('준호 · 대장님, 먼저 상처부터 치료하세요.');return;}this.stage=3;this.spawn();this.say('준호 · 나무에서 체온이… “살려줘…” / 태건 · 저건 사람이 아니야!');}
 else if(distance(p,sites.ammo)<85){const a=this.ammo[1];if(this.ammoLeft>0){const take=Math.min(this.ammoLeft,180-a.reserve);a.reserve+=take;this.ammoLeft-=take;this.say(`소총 예비탄 +${take}`);}else if(this.stage===3&&!this.emergency&&a.loaded+a.reserve<=10){a.reserve+=30;this.emergency=true;this.say('비상 탄약 30발 확보 · 1회 한정');}else this.say('보급함 · 추가 보급 없음');}
 }
 damage(amount:number){this.health=Math.max(0,this.health-amount);this.healing=0;this.damageFlash=.35;this.say(this.health?'피격! 공격 예고를 보고 옆으로 회피하세요.':'작전 실패 · 마지막 체크포인트에서 재시작하세요.');}
 fire(target:Vec){if(this.shotCooldown>0||this.reload||this.healing||this.dodge||this.health<=0)return;if(!this.current.loaded){this.say('탄창이 비었습니다 · R 재장전');return;}this.current.loaded--;this.shotCooldown=this.weapon===1?.1:.25;
 const a={...this.player},theta=Math.atan2(target.y-a.y,target.x-a.x),b={x:a.x+Math.cos(theta)*1900,y:a.y+Math.sin(theta)*1900};let t=wallHit(a,b);let hit:Enemy|undefined;
 for(const e of this.enemies){if(e.state==='dead'||(e.id>1&&!this.dead.includes(1)))continue;const q=lineCircle(a,b,e,25);if(q!==null&&q<t){t=q;hit=e;}}
 let weak=false;if(hit){weak=hit.state==='windup'||hit.state==='recover';hit.hp-=(this.weapon===1?20:24)*(weak?1.5:1);if(hit.hp<=0){hit.hp=0;hit.state='dead';if(!this.dead.includes(hit.id))this.dead.push(hit.id);this.say(`스토커 무력화 · ${this.dead.length}/3`);}}
 this.lastTrace={a,b:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},weak,time:this.time};
 }
 step(dt:number,c:Controls){if(this.health<=0||this.completed)return;dt=Math.min(dt,.05);this.time+=dt;this.damageFlash=Math.max(0,this.damageFlash-dt);this.shotCooldown=Math.max(0,this.shotCooldown-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);this.jump=Math.max(0,this.jump-dt);
 if(this.reload>0){this.reload=Math.max(0,this.reload-dt);if(this.reload===0){const n=Math.min(this.capacity-this.current.loaded,this.current.reserve);this.current.loaded+=n;this.current.reserve-=n;}}
 if(this.healing>0){this.healing=Math.max(0,this.healing-dt);if(this.healing===0){this.health=Math.min(100,this.health+40);this.medkits--;this.healed=true;this.say('치료 완료 · 준호와 대화하세요');}}
 this.angle=Math.atan2(c.aim.y-this.player.y,c.aim.x-this.player.x);
 const n=Math.hypot(c.x,c.y);const speed=c.aiming?100:c.sprint&&!c.fire&&!this.reload?260:160;
 if(this.dodge>0){this.move(this.player,this.dodgeDirection.x*267*dt,this.dodgeDirection.y*267*dt,16);this.dodge=Math.max(0,this.dodge-dt);}else if(n)this.move(this.player,c.x/n*speed*dt,c.y/n*speed*dt,16);
 if(c.fire&&!c.sprint)this.fire(c.aim);
 if(this.stage===0&&distance(this.player,markers[this.markers])<65){this.markers++;if(this.markers===2){this.stage=1;this.say('장비 보관함에서 소총을 확보한다.');}}
 if(this.stage===3){for(const e of this.enemies){if(e.state==='dead'||(e.id>1&&!this.dead.includes(1)))continue;const d=distance(e,this.player);e.timer-=dt;
 if(e.state==='chase'){if(d>600)continue;if(!e.navigation||this.time>(e.navigationAt??0)||distance(e,e.navigation)<12){e.navigation=navigate(e,this.player);e.navigationAt=this.time+.5;}e.angle=Math.atan2(e.navigation.y-e.y,e.navigation.x-e.x);if(d<170&&wallHit(e,this.player)===1){e.angle=Math.atan2(this.player.y-e.y,this.player.x-e.x);e.state='windup';e.timer=.8;e.target={...this.player};e.hit=false;}else this.move(e,Math.cos(e.angle)*105*dt,Math.sin(e.angle)*105*dt,25);}
 else if(e.state==='windup'&&e.timer<=0){e.state='leap';e.timer=.4;}
 else if(e.state==='leap'){this.move(e,Math.cos(e.angle)*420*dt,Math.sin(e.angle)*420*dt,25);if(distance(e,this.player)<42&&!e.hit){this.damage(18);e.hit=true;}if(e.timer<=0){e.state='recover';e.timer=1.2;}}
 else if(e.state==='recover'&&e.timer<=0)e.state='chase';
 }
 if(this.dead.length===3){this.stage=4;this.checkpointAt({x:1800,y:470});this.say('윤아 · 집결 신호 보냅니다. 북동쪽 계류를 따라오세요.');}}
 if(this.stage===4&&distance(this.player,sites.exit)<85){this.completed=true;this.checkpointAt(sites.exit);this.say('CH01 완료 · 생존자 집결');}
 }
 target():Vec{return this.stage===0?markers[Math.min(1,this.markers)]:this.stage===1?sites.rifle:this.stage===2?(!this.medTaken?sites.med:!this.healed?this.player:sites.junho):this.stage===3?this.enemies.find(e=>e.state!=='dead'&&(e.id===1||this.dead.includes(1)))??sites.exit:sites.exit;}
}
export function validateSave(s:unknown):s is Save{
 if(!s||typeof s!=='object')return false;const v=s as Save;
 return v.version===1&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=4&&Number.isFinite(v.health)&&v.health>0&&v.health<=100&&typeof v.rifle==='boolean'&&Array.isArray(v.ammo)&&v.ammo.length===2&&v.ammo.every((a,i)=>a&&Number.isInteger(a.loaded)&&a.loaded>=0&&a.loaded<=(i?30:12)&&Number.isInteger(a.reserve)&&a.reserve>=0&&a.reserve<=(i?180:72))&&Number.isInteger(v.medkits)&&v.medkits>=0&&v.medkits<=3&&Array.isArray(v.dead)&&v.dead.every(id=>[1,2,3].includes(id))&&new Set(v.dead).size===v.dead.length&&!!v.checkpoint&&Number.isFinite(v.checkpoint.x)&&v.checkpoint.x>=0&&v.checkpoint.x<=WORLD.w&&Number.isFinite(v.checkpoint.y)&&v.checkpoint.y>=0&&v.checkpoint.y<=WORLD.h&&['medTaken','emergency','healed','completed'].every(k=>typeof (v as unknown as Record<string,unknown>)[k]==='boolean')&&Number.isInteger(v.ammoLeft)&&v.ammoLeft>=0&&v.ammoLeft<=30;
}
