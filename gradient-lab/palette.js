const clamp=x=>Math.max(0,Math.min(1,x));
const lin=x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;
const gamma=x=>x<=0.0031308?12.92*x:1.055*x**(1/2.4)-0.055;
export function toLch(hex){
 const [r,g,b]=[1,3,5].map(i=>lin(parseInt(hex.slice(i,i+2),16)/255));
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,c=.0259040371*l+.7827717662*m-.808675766*s;
 return [L,Math.hypot(a,c),Math.atan2(c,a)];
}
function rgb(L,C,H){const a=C*Math.cos(H),b=C*Math.sin(H),l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];}
export function fromLch(lch){let [L,C,H]=lch,channels=rgb(L,C,H);if(channels.some(v=>v<0||v>1)){let low=0,high=C;for(let i=0;i<26;i++){const mid=(low+high)/2,c=rgb(L,mid,H);if(c.every(v=>v>=0&&v<=1))low=mid;else high=mid;}channels=rgb(L,low,H);}return channels.map(v=>clamp(gamma(v)));}
// Positions are independent of color values; dragging a stop changes this mapping.
export function paletteLut(hexes,size=2048,positions=hexes.map((_,i)=>i/(hexes.length-1))){
 const stops=hexes.map((hex,i)=>({color:toLch(hex),position:positions[i]})).sort((a,b)=>a.position-b.position),data=new Uint8Array(size*4);
 for(let i=0;i<size;i++){
  const t=i/(size-1);let j=0;while(j<stops.length-2&&t>stops[j+1].position)j++;
  const a=stops[j].color,b=stops[j+1].color,f=clamp((t-stops[j].position)/Math.max(1e-9,stops[j+1].position-stops[j].position));
  let dh=((b[2]-a[2]+3*Math.PI)%(2*Math.PI))-Math.PI;
  const c=fromLch([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+dh*f]);
  data.set([...c.map(v=>Math.round(v*255)),255],i*4);
 }return data;
}
export function curveValue(points,t,smooth=true){let i=0;while(i<points.length-2&&t>points[i+1][0])i++;const a=points[i],b=points[i+1],f=clamp((t-a[0])/(b[0]-a[0]));if(!smooth)return a[1]+(b[1]-a[1])*f;const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+2)],m0=(b[1]-prev[1])*.5,m1=(next[1]-a[1])*.5;return clamp((2*f**3-3*f*f+1)*a[1]+(f**3-2*f*f+f)*m0+(-2*f**3+3*f*f)*b[1]+(f**3-f*f)*m1);}
