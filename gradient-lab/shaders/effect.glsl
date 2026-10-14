// All colors are in display sRGB, matching the supplied artwork.
// u_resolution: physical framebuffer pixels; u_time: seconds.
// u_grain: color-coordinate noise 0..0.3; u_dots: 0..1.
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform float u_dots;
uniform int u_dotCount;
uniform vec3 u_dotColor;
uniform int u_dotShape;
uniform float u_dotSize;
uniform float u_dotOpacity;
uniform float u_flow;
uniform float u_posterPreset;
uniform float u_ribCount;
uniform float u_ribDepth;
uniform float u_posterGrid;
uniform float u_posterLevels;
uniform float u_printGrain;
// Extra feather radius in reference pixels (0 preserves original transitions).
uniform float u_feather;
uniform int u_engine;
uniform sampler2D u_curveLut;
uniform sampler2D u_noise;
uniform sampler2D u_paletteLut;
uniform int u_customBase;
uniform vec3 u_baseColor;
uniform int u_colorCount;
uniform vec4 u_colorStops[16]; // mesh UV xy, radius z
uniform vec3 u_stopColors[16];
uniform int u_blendMode;
uniform vec3 u_blendColor;
uniform float u_blendAmount;
in vec2 v_uv;
out vec4 fragColor;

vec3 control(ivec2 p) {
    p = clamp(p, ivec2(0), GRID - 1);
    return COLORS[p.y * GRID.x + p.x];
}
vec3 cubic(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return b + 0.5*t*(c-a+t*(2.0*a-5.0*b+4.0*c-d+t*(3.0*(b-c)+d-a)));
}
vec3 mesh(vec2 uv) {
    vec2 p = clamp(uv, 0.0, 1.0) * vec2(GRID-1);
    ivec2 i = ivec2(floor(p));
    vec2 f = fract(p);
    vec3 row[4];
    for (int y=0; y<4; y++) {
        ivec2 q=i+ivec2(0,y-1);
        row[y]=cubic(control(q+ivec2(-1,0)),control(q),control(q+ivec2(1,0)),control(q+ivec2(2,0)),f.x);
    }
    return cubic(row[0],row[1],row[2],row[3],f.y);
}
float blendChannel(float b,float s);
float hash(vec2 p);
float curveSample(float t,int channel){
    float q=clamp(t,0.0,1.0)*1023.0;int i=int(floor(q));
    vec2 c=mix(texelFetch(u_curveLut,ivec2(i,0),0).rg,texelFetch(u_curveLut,ivec2(min(i+1,1023),0),0).rg,fract(q));
    return channel==0?c.r:c.g;
}
// Noise perturbs the color coordinate BEFORE palette lookup, never display RGB.
float edgeNoise(vec2 field){
    vec2 coord=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y);
    float screenNoise=texture(u_noise,coord/256.0).r;
    vec2 jitter=fract(sin(vec2(
        dot(coord*.017,vec2(127.1,311.7))+dot(coord*.017,vec2(269.5,183.3)),
        dot(coord*.019,vec2(127.1,311.7))+dot(coord*.019,vec2(269.5,183.3))
    ))*43758.5453)*.25;
    float fieldNoise=texture(u_noise,field*75.0+jitter).r;
    return mix(screenNoise,fieldNoise,.53)-.5;
}
vec3 proceduralField(vec2 p){
    vec2 uv=clamp(p,0.0,1.0);
    float x=curveSample(uv.x,0),y=curveSample(uv.y,1);
    if(u_feather>0.0){
        float exponent=u_feather/100.0;
        x=mix(x,pow(max(sin(uv.x*3.14159265),0.0),exponent),0.2);
        y=mix(y,pow(max(sin(uv.y*3.14159265),0.0),exponent),0.2);
    }
    float combined=blendChannel(x,y);
    if(u_blendMode==0)combined=(x+y)*0.5;
    // Colir's soft-light convention for scalar fields.
    if(u_blendMode==5)combined=y<0.5?2.0*x*y+x*x*(1.0-2.0*y):sqrt(x)*(2.0*y-1.0)+2.0*x*(1.0-y);
    float value=mix((x+y)*0.5,combined,u_blendAmount);
    // The original GPU path samples texture coordinates without texel offsets.
    value=clamp(value+edgeNoise(vec2(x,y))*u_grain,0.0,1.0);
    return texture(u_paletteLut,vec2(value,.5)).rgb;
}
// New colors participate in the same UV field, feathering and blend pipeline.
vec3 colorField(vec2 p){
    vec3 base=u_customBase==1 ? u_baseColor : (u_engine==1?proceduralField(p):mesh(p+vec2(edgeNoise(p),edgeNoise(p.yx+0.37))*u_grain*0.12));
    if(u_colorCount==0)return base;
    float aspect=u_resolution.x/u_resolution.y,refAspect=1242.0/856.0;
    vec2 fit=aspect>refAspect?vec2(1.0,refAspect/aspect):vec2(aspect/refAspect,1.0);
    if(u_engine==1)fit=vec2(1.0);
    vec2 uv=(p-0.5)/fit+0.5;
    vec3 sum=vec3(0.0);float weight=0.0;
    for(int i=0;i<16;i++){
        if(i>=u_colorCount)break;
        vec2 delta=(uv-u_colorStops[i].xy)*vec2(aspect,1.0);
        float radius=u_colorStops[i].z+(u_engine==1?u_feather*0.0012:0.0);
        float w=1.0-smoothstep(0.0,radius,length(delta));
        sum+=u_stopColors[i]*w;weight+=w;
    }
    return base*(1.0-min(weight,1.0))+sum/max(weight,1.0);
}
// Smooth only the color field, before grain and the fixed dot overlay.
vec3 featheredColor(vec2 p) {
    if (u_engine==1 || u_feather <= 0.0) return colorField(p);
    vec2 r=vec2(u_feather)/vec2(1242.0,856.0);
    vec3 c=colorField(p)*0.25;
    c+=(colorField(p+vec2(r.x,0.0))+colorField(p-vec2(r.x,0.0))
       +colorField(p+vec2(0.0,r.y))+colorField(p-vec2(0.0,r.y)))*0.125;
    c+=(colorField(p+r)+colorField(p-r)+colorField(p+vec2(r.x,-r.y))
       +colorField(p+vec2(-r.x,r.y)))*0.0625;
    return c;
}
// Channel-wise blend functions, operating on display sRGB in [0,1].
float blendChannel(float b, float s) {
    if(u_blendMode==1) return (b+s)*0.5; // Average
    if(u_blendMode==2) return b*s; // Multiply
    if(u_blendMode==3) return b+s-b*s; // Screen
    if(u_blendMode==4) return b<=0.5 ? 2.0*b*s : 1.0-2.0*(1.0-b)*(1.0-s); // Overlay
    if(u_blendMode==5) { // Soft Light
        float d=b<=0.25 ? ((16.0*b-12.0)*b+4.0)*b : sqrt(b);
        return s<=0.5 ? b-(1.0-2.0*s)*b*(1.0-b) : b+(2.0*s-1.0)*(d-b);
    }
    if(u_blendMode==6) return s<=0.5 ? 2.0*b*s : 1.0-2.0*(1.0-b)*(1.0-s); // Hard Light
    if(u_blendMode==7) return abs(b-s); // Difference
    if(u_blendMode==8) return b+s-2.0*b*s; // Exclusion
    if(u_blendMode==9) return min(b,s); // Darken
    if(u_blendMode==10) return max(b,s); // Lighten
    if(u_blendMode==11) { // Color Burn: defined endpoint behavior, no zero division
        if(b>=1.0) return 1.0;
        if(s<=0.0) return 0.0;
        return 1.0-min(1.0,(1.0-b)/s);
    }
    if(u_blendMode==12) { // Color Dodge
        if(b<=0.0) return 0.0;
        if(s>=1.0) return 1.0;
        return min(1.0,b/(1.0-s));
    }
    return b;
}
vec3 globalBlend(vec3 base) {
    if(u_blendMode==0 || u_blendAmount<=0.0) return base;
    vec3 b=clamp(base,0.0,1.0),s=clamp(u_blendColor,0.0,1.0);
    vec3 blended=vec3(blendChannel(b.r,s.r),blendChannel(b.g,s.g),blendChannel(b.b,s.b));
    return mix(b,blended,clamp(u_blendAmount,0.0,1.0));
}

float hash(vec2 p) {
    vec3 p3=fract(vec3(p.xyx)*0.1031);
    p3+=dot(p3,p3.yzx+33.33);
    return fract((p3.x+p3.y)*p3.z);
}

// Quantized color fields under cylindrical vertical ridges, in output pixels.
vec3 posterColor(vec2 uv){
    float aspect=u_resolution.x/u_resolution.y;
    vec2 grid=vec2(u_posterGrid,max(4.0,u_posterGrid/aspect));
    vec2 p=(floor(uv*grid)+.5)/grid;
    float t=u_time*.22;
    float v;
    if(u_posterPreset<.5){
        float edge=.40+.14*sin(p.x*4.5+t)+.06*cos(p.x*9.0-t);
        v=clamp((p.y-edge)*3.3+.27,0.0,1.0);
    }else if(u_posterPreset<1.5){
        float edge=.5+.20*cos(p.x*3.5+t);
        v=exp(-pow((p.y-edge)*4.0,2.0))*.95;
    }else{
        float field=sin(p.x*5.5+sin(p.y*5.0+t)*1.8+t)+cos(p.y*7.0-p.x*2.0-t*.7);
        v=clamp(.5+field*.28,0.0,1.0);
    }
    v=floor(v*(u_posterLevels-1.0)+.5)/(u_posterLevels-1.0);
    vec3 c=texture(u_paletteLut,vec2(v,.5)).rgb;
    float phase=fract(uv.x*u_ribCount);
    float wave=.5+.5*cos(phase*6.2831853);
    float depth=u_ribDepth*.01;
    c*=mix(1.0,.22+.78*pow(wave,.65),depth);
    float glint=exp(-pow((phase-.18)*17.0,2.0));
    c+=vec3(.19,.16,.13)*glint*depth;
    float grain=hash(gl_FragCoord.xy)-.5;
    c+=grain*u_printGrain*.006;
    return c;
}

void main() {
    vec2 uv=v_uv;
    // Cover the viewport without stretching the reference's proportions.
    float aspect=u_resolution.x/u_resolution.y;
    const float referenceAspect=1242.0/856.0;
    vec2 fit=aspect>referenceAspect ? vec2(1.0,referenceAspect/aspect) : vec2(aspect/referenceAspect,1.0);
    uv=(uv-0.5)*(u_engine==1?vec2(1.0):fit)+0.5;
    vec2 p=uv;
    float t=u_time*0.18;
    // Zero displacement at t=0. Slow, continuous, bounded domain warping.
    p+=u_flow*vec2(
        0.068*(sin(uv.y*7.0+t)-sin(uv.y*7.0)),
        0.052*(sin(uv.x*8.0+t*0.73)-sin(uv.x*8.0))
    );
    vec3 color=u_engine==2?posterColor(v_uv):featheredColor(p);
    if(u_engine==0)color=globalBlend(color);
    // Dots live in screen space, independent of Bezier UVs and color animation.
    vec2 screenUV=vec2(gl_FragCoord.x/u_resolution.x,1.0-gl_FragCoord.y/u_resolution.y);
    // Integer cell indices give an exact total count, independent of UV warping.
    float count=float(max(u_dotCount,1));
    float columns=ceil(sqrt(count*aspect));
    float rows=ceil(count/columns);
    vec2 grid=vec2(columns,rows),cell=floor(screenUV*grid);
    vec2 q=(fract(screenUV*grid)-0.5)*u_resolution/grid;
    float radius=min(u_dotSize*0.5,min(u_resolution.x/columns,u_resolution.y/rows)*0.45);
    vec2 a=abs(q);float d=length(q)-radius;
    if(u_dotShape==1)d=max(a.x,a.y)-radius;
    if(u_dotShape==2)d=(a.x+a.y-radius)*0.70710678;
    if(u_dotShape==3)d=min(max(a.x-radius*.28,a.y-radius),max(a.x-radius,a.y-radius*.28));
    if(u_dotShape==4)d=abs(length(q)-radius*.72)-radius*.22;
    if(u_dotShape==5){float angle=atan(q.y,q.x);float edge=radius*(.25+.75*pow(abs(cos(angle*2.0)),4.0));d=length(q)-edge;}
    float aa=max(fwidth(d),0.75);
    float dots=(1.0-smoothstep(-aa*.5,aa*.5,d))*step(cell.y*columns+cell.x+.5,float(u_dotCount));
    color=mix(color,u_dotColor,dots*u_dotOpacity*u_dots);
    fragColor=vec4(clamp(color,0.0,1.0),1.0);
}
