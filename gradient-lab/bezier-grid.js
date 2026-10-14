const B=t=>[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3];
const D=t=>[-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t];
const combine=(p,u,v,w,a,b)=>p.map((n,k)=>n+a*u[k]+b*v[k]+a*b*w[k]);
export function createGrid(){
  return {xs:[0,1/3,2/3,1],ys:[0,1/3,2/3,1],nodes:Array.from({length:16},(_,i)=>({p:[i%4/3,Math.floor(i/4)/3],du:[1,0],dv:[0,1],duv:[0,0]}))};
}
export function controls(g,x,y){
  const nx=g.xs.length,dx=(g.xs[x+1]-g.xs[x])/3,dy=(g.ys[y+1]-g.ys[y])/3;
  return Array.from({length:4},(_,j)=>Array.from({length:4},(_,i)=>{
    const n=g.nodes[(y+(j>=2?1:0))*nx+x+(i>=2?1:0)];
    return combine(n.p,n.du,n.dv,n.duv,i===1?dx:i===2?-dx:0,j===1?dy:j===2?-dy:0);
  }));
}
export function point(c,u,v){return evaluate(c,B(u),B(v));}
function evaluate(c,bu,bv){const p=[0,0];for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<2;k++)p[k]+=c[j][i][k]*bu[i]*bv[j];return p;}
function interval(knots,t){for(let i=0;i<knots.length-1;i++)if(t<=knots[i+1])return i;return knots.length-2;}
export function sample(g,uv){
  const x=interval(g.xs,uv[0]),y=interval(g.ys,uv[1]),dx=g.xs[x+1]-g.xs[x],dy=g.ys[y+1]-g.ys[y];
  const u=(uv[0]-g.xs[x])/dx,v=(uv[1]-g.ys[y])/dy,c=controls(g,x,y),bu=B(u),bv=B(v),du=D(u).map(a=>a/dx),dv=D(v).map(a=>a/dy);
  return {p:evaluate(c,bu,bv),du:evaluate(c,du,bv),dv:evaluate(c,bu,dv),duv:evaluate(c,du,dv)};
}
// Exact cubic subdivision: preserve positions and all Hermite derivatives.
export function insertGrid(g,axis,index){
  const knots=axis==='x'?g.xs:g.ys;if(knots.length>=8)return g;
  index=Math.min(index,knots.length-2);
  const added=(knots[index]+knots[index+1])/2;
  const xs=[...g.xs],ys=[...g.ys];(axis==='x'?xs:ys).splice(index+1,0,added);
  return {xs,ys,nodes:ys.flatMap(y=>xs.map(x=>sample(g,[x,y])))};
}
