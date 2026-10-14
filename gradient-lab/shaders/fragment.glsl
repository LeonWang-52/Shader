#version 300 es
precision highp float;
// Reference-derived sRGB control points, top-to-bottom.
const ivec2 GRID = ivec2(20, 14);
const vec3 COLORS[280] = vec3[280](
    vec3(0.94510, 0.76078, 0.41961),
    vec3(0.90196, 0.35686, 0.07451),
    vec3(0.94510, 0.61176, 0.05882),
    vec3(0.95294, 0.63529, 0.10196),
    vec3(0.93725, 0.56471, 0.01961),
    vec3(0.91373, 0.40392, 0.02353),
    vec3(0.90196, 0.33725, 0.08627),
    vec3(0.90980, 0.38431, 0.10980),
    vec3(0.90196, 0.33725, 0.07059),
    vec3(0.92157, 0.45098, 0.01176),
    vec3(0.93725, 0.56471, 0.01569),
    vec3(0.93333, 0.53725, 0.00784),
    vec3(0.91373, 0.41176, 0.01961),
    vec3(0.90980, 0.38431, 0.10980),
    vec3(0.94118, 0.69804, 0.33725),
    vec3(0.94902, 0.81961, 0.50196),
    vec3(0.95294, 0.80000, 0.49020),
    vec3(0.95686, 0.76078, 0.45098),
    vec3(0.95294, 0.70980, 0.40392),
    vec3(0.94118, 0.55294, 0.32549),
    vec3(0.92549, 0.50588, 0.17255),
    vec3(0.92549, 0.48235, 0.01176),
    vec3(0.97255, 0.66275, 0.26667),
    vec3(0.98039, 0.66275, 0.31765),
    vec3(0.96471, 0.65490, 0.17647),
    vec3(0.94118, 0.58431, 0.02745),
    vec3(0.92157, 0.44706, 0.01569),
    vec3(0.91373, 0.39608, 0.02745),
    vec3(0.92549, 0.47843, 0.00392),
    vec3(0.94510, 0.61176, 0.05490),
    vec3(0.96078, 0.65490, 0.17647),
    vec3(0.96078, 0.65098, 0.14902),
    vec3(0.93725, 0.56863, 0.01569),
    vec3(0.90980, 0.39216, 0.03529),
    vec3(0.91765, 0.43529, 0.13725),
    vec3(0.94118, 0.70196, 0.34118),
    vec3(0.94510, 0.79608, 0.45882),
    vec3(0.94510, 0.82353, 0.50196),
    vec3(0.94902, 0.83922, 0.52549),
    vec3(0.95294, 0.77255, 0.46275),
    vec3(0.90588, 0.34902, 0.09412),
    vec3(0.94118, 0.58431, 0.04314),
    vec3(0.98431, 0.67059, 0.38824),
    vec3(0.98431, 0.67059, 0.41961),
    vec3(0.98039, 0.66275, 0.32549),
    vec3(0.95686, 0.64706, 0.14118),
    vec3(0.93725, 0.56863, 0.02745),
    vec3(0.92941, 0.52157, 0.00784),
    vec3(0.94118, 0.58824, 0.02745),
    vec3(0.96471, 0.65882, 0.19216),
    vec3(0.98039, 0.66667, 0.32549),
    vec3(0.97647, 0.66275, 0.30196),
    vec3(0.95686, 0.64314, 0.12549),
    vec3(0.92941, 0.51373, 0.01569),
    vec3(0.90588, 0.34902, 0.09020),
    vec3(0.92549, 0.51373, 0.17255),
    vec3(0.93725, 0.63137, 0.26275),
    vec3(0.94118, 0.68235, 0.32157),
    vec3(0.94118, 0.75294, 0.40784),
    vec3(0.94902, 0.82745, 0.50980),
    vec3(0.90588, 0.36471, 0.04706),
    vec3(0.95686, 0.64314, 0.14118),
    vec3(0.98431, 0.66667, 0.45490),
    vec3(0.98431, 0.67059, 0.46667),
    vec3(0.98431, 0.66667, 0.41961),
    vec3(0.97647, 0.66275, 0.28235),
    vec3(0.95294, 0.63529, 0.10588),
    vec3(0.94510, 0.60784, 0.04314),
    vec3(0.95686, 0.64706, 0.13725),
    vec3(0.98039, 0.66275, 0.32549),
    vec3(0.98431, 0.66667, 0.41569),
    vec3(0.98431, 0.66667, 0.40000),
    vec3(0.97255, 0.65882, 0.26667),
    vec3(0.94510, 0.60392, 0.04314),
    vec3(0.91373, 0.40784, 0.02353),
    vec3(0.90588, 0.36078, 0.10588),
    vec3(0.91765, 0.44706, 0.13725),
    vec3(0.92549, 0.49412, 0.15686),
    vec3(0.93333, 0.58431, 0.21961),
    vec3(0.94118, 0.74902, 0.39608),
    vec3(0.92549, 0.49412, 0.00784),
    vec3(0.97647, 0.66275, 0.30196),
    vec3(0.96863, 0.66275, 0.45098),
    vec3(0.96078, 0.65882, 0.43529),
    vec3(0.97647, 0.66667, 0.46275),
    vec3(0.98431, 0.66667, 0.40000),
    vec3(0.97255, 0.65882, 0.27059),
    vec3(0.96471, 0.65490, 0.20000),
    vec3(0.97647, 0.66275, 0.30588),
    vec3(0.98431, 0.66667, 0.42745),
    vec3(0.98039, 0.66667, 0.46667),
    vec3(0.98431, 0.66667, 0.46275),
    vec3(0.98431, 0.66667, 0.40000),
    vec3(0.96471, 0.65490, 0.18824),
    vec3(0.93333, 0.54118, 0.00784),
    vec3(0.90980, 0.36863, 0.03922),
    vec3(0.90196, 0.33333, 0.07451),
    vec3(0.90196, 0.33725, 0.09020),
    vec3(0.90980, 0.37647, 0.10980),
    vec3(0.92941, 0.52941, 0.18039),
    vec3(0.94902, 0.61961, 0.07843),
    vec3(0.98431, 0.67059, 0.43922),
    vec3(0.93333, 0.65098, 0.38039),
    vec3(0.91765, 0.64314, 0.35294),
    vec3(0.94510, 0.65098, 0.40000),
    vec3(0.97647, 0.67059, 0.46667),
    vec3(0.98824, 0.67059, 0.42745),
    vec3(0.98431, 0.66667, 0.38431),
    vec3(0.98431, 0.66667, 0.43922),
    vec3(0.97255, 0.66667, 0.45882),
    vec3(0.94902, 0.65882, 0.41569),
    vec3(0.95294, 0.65490, 0.41569),
    vec3(0.98039, 0.66667, 0.46275),
    vec3(0.98431, 0.66667, 0.37647),
    vec3(0.96078, 0.65098, 0.14510),
    vec3(0.93333, 0.53333, 0.00392),
    vec3(0.92157, 0.46667, 0.00392),
    vec3(0.91765, 0.43529, 0.01961),
    vec3(0.90980, 0.38431, 0.04314),
    vec3(0.90196, 0.33725, 0.09412),
    vec3(0.96471, 0.65490, 0.20000),
    vec3(0.97647, 0.67059, 0.46275),
    vec3(0.90980, 0.64706, 0.34118),
    vec3(0.90196, 0.64314, 0.31765),
    vec3(0.92157, 0.64314, 0.35294),
    vec3(0.96078, 0.66275, 0.43922),
    vec3(0.98431, 0.67451, 0.47059),
    vec3(0.98824, 0.67059, 0.45490),
    vec3(0.98039, 0.66667, 0.46667),
    vec3(0.95294, 0.65882, 0.41961),
    vec3(0.92549, 0.65098, 0.36863),
    vec3(0.92941, 0.64706, 0.36863),
    vec3(0.96078, 0.65882, 0.43529),
    vec3(0.98824, 0.67059, 0.44706),
    vec3(0.97255, 0.66275, 0.27059),
    vec3(0.94510, 0.61176, 0.05098),
    vec3(0.93725, 0.56078, 0.01176),
    vec3(0.93333, 0.53333, 0.01176),
    vec3(0.92549, 0.48627, 0.01569),
    vec3(0.90980, 0.38039, 0.03137),
    vec3(0.94902, 0.62353, 0.08627),
    vec3(0.98431, 0.66667, 0.43137),
    vec3(0.92941, 0.64706, 0.37647),
    vec3(0.92157, 0.64314, 0.35294),
    vec3(0.94510, 0.65490, 0.40392),
    vec3(0.97647, 0.66667, 0.46275),
    vec3(0.98431, 0.66667, 0.41961),
    vec3(0.98431, 0.66275, 0.38039),
    vec3(0.98431, 0.66667, 0.43529),
    vec3(0.96863, 0.66275, 0.45490),
    vec3(0.94902, 0.65490, 0.41176),
    vec3(0.95294, 0.65490, 0.41961),
    vec3(0.97647, 0.66667, 0.46275),
    vec3(0.98431, 0.66275, 0.38039),
    vec3(0.95686, 0.64314, 0.13725),
    vec3(0.93333, 0.53333, 0.00392),
    vec3(0.92157, 0.46275, 0.00784),
    vec3(0.91765, 0.43529, 0.01569),
    vec3(0.90980, 0.38039, 0.03529),
    vec3(0.90196, 0.34510, 0.09020),
    vec3(0.90588, 0.36471, 0.05490),
    vec3(0.95294, 0.62745, 0.10980),
    vec3(0.98431, 0.66667, 0.43137),
    vec3(0.98431, 0.66667, 0.45098),
    vec3(0.98431, 0.66667, 0.39608),
    vec3(0.96863, 0.65882, 0.23137),
    vec3(0.94902, 0.61569, 0.07451),
    vec3(0.94118, 0.58431, 0.03137),
    vec3(0.95294, 0.63137, 0.10588),
    vec3(0.97255, 0.65882, 0.27843),
    vec3(0.98431, 0.66667, 0.38431),
    vec3(0.98431, 0.66275, 0.37255),
    vec3(0.96863, 0.65490, 0.22745),
    vec3(0.94118, 0.57255, 0.03137),
    vec3(0.90980, 0.38824, 0.03529),
    vec3(0.91373, 0.40784, 0.11765),
    vec3(0.92549, 0.49412, 0.16471),
    vec3(0.92941, 0.55686, 0.20784),
    vec3(0.93725, 0.63529, 0.27451),
    vec3(0.94510, 0.77255, 0.43137),
    vec3(0.94118, 0.73725, 0.38824),
    vec3(0.90588, 0.36471, 0.06667),
    vec3(0.94902, 0.62353, 0.08627),
    vec3(0.95686, 0.64314, 0.12157),
    vec3(0.94118, 0.57647, 0.02745),
    vec3(0.91765, 0.43529, 0.02353),
    vec3(0.90588, 0.35294, 0.09412),
    vec3(0.90588, 0.36471, 0.10588),
    vec3(0.90196, 0.34902, 0.06275),
    vec3(0.92549, 0.47059, 0.01569),
    vec3(0.94118, 0.57647, 0.03529),
    vec3(0.93725, 0.55294, 0.01569),
    vec3(0.91765, 0.42353, 0.01961),
    vec3(0.90980, 0.38039, 0.11373),
    vec3(0.94118, 0.67451, 0.31765),
    vec3(0.94902, 0.82745, 0.51373),
    vec3(0.95294, 0.79608, 0.48627),
    vec3(0.95294, 0.77255, 0.46667),
    vec3(0.95294, 0.71765, 0.41569),
    vec3(0.94510, 0.57255, 0.33333),
    vec3(0.94902, 0.82353, 0.50588),
    vec3(0.91373, 0.42353, 0.13333),
    vec3(0.92941, 0.51373, 0.01569),
    vec3(0.93725, 0.55686, 0.01176),
    vec3(0.92157, 0.45490, 0.00784),
    vec3(0.90196, 0.33725, 0.08235),
    vec3(0.92157, 0.47059, 0.15294),
    vec3(0.93333, 0.54902, 0.19216),
    vec3(0.91373, 0.41176, 0.12549),
    vec3(0.90588, 0.34902, 0.06667),
    vec3(0.92157, 0.44706, 0.01961),
    vec3(0.91765, 0.42353, 0.01569),
    vec3(0.90196, 0.33333, 0.07843),
    vec3(0.93333, 0.56863, 0.21176),
    vec3(0.94510, 0.82745, 0.50980),
    vec3(0.95294, 0.73725, 0.42745),
    vec3(0.95294, 0.65490, 0.36471),
    vec3(0.94902, 0.61176, 0.34510),
    vec3(0.94118, 0.55294, 0.32549),
    vec3(0.93333, 0.48235, 0.30196),
    vec3(0.94118, 0.72941, 0.38039),
    vec3(0.90588, 0.36471, 0.05882),
    vec3(0.94902, 0.62353, 0.07843),
    vec3(0.95686, 0.64314, 0.12157),
    vec3(0.94118, 0.58431, 0.02353),
    vec3(0.91765, 0.43922, 0.01176),
    vec3(0.90196, 0.34118, 0.07843),
    vec3(0.90588, 0.35686, 0.09804),
    vec3(0.90588, 0.34902, 0.05882),
    vec3(0.92549, 0.48235, 0.00392),
    vec3(0.94118, 0.58039, 0.01961),
    vec3(0.93725, 0.56078, 0.01176),
    vec3(0.91765, 0.42745, 0.01569),
    vec3(0.90588, 0.36471, 0.10196),
    vec3(0.94118, 0.67451, 0.31373),
    vec3(0.94902, 0.83137, 0.51373),
    vec3(0.95294, 0.80392, 0.49412),
    vec3(0.95294, 0.78431, 0.47451),
    vec3(0.95294, 0.72157, 0.41569),
    vec3(0.94510, 0.58431, 0.33333),
    vec3(0.90980, 0.38039, 0.11373),
    vec3(0.93725, 0.56078, 0.02353),
    vec3(0.98039, 0.66275, 0.35294),
    vec3(0.98431, 0.66667, 0.39216),
    vec3(0.97647, 0.65882, 0.29412),
    vec3(0.95294, 0.63137, 0.09412),
    vec3(0.93333, 0.53333, 0.01176),
    vec3(0.92549, 0.48627, 0.00392),
    vec3(0.93725, 0.56471, 0.01569),
    vec3(0.95686, 0.64706, 0.14510),
    vec3(0.97647, 0.66275, 0.28627),
    vec3(0.97255, 0.65882, 0.26275),
    vec3(0.95294, 0.63137, 0.09412),
    vec3(0.92549, 0.47451, 0.01176),
    vec3(0.90196, 0.34902, 0.09412),
    vec3(0.93333, 0.56078, 0.20392),
    vec3(0.94118, 0.67843, 0.31373),
    vec3(0.94118, 0.72941, 0.37647),
    vec3(0.94510, 0.78431, 0.44706),
    vec3(0.94902, 0.83137, 0.51765),
    vec3(0.90196, 0.33725, 0.07451),
    vec3(0.94510, 0.61176, 0.07059),
    vec3(0.98431, 0.67059, 0.41961),
    vec3(0.98431, 0.67059, 0.44706),
    vec3(0.98039, 0.66275, 0.37255),
    vec3(0.96471, 0.65490, 0.19608),
    vec3(0.94510, 0.60392, 0.04314),
    vec3(0.93725, 0.56078, 0.00784),
    vec3(0.94902, 0.62353, 0.07059),
    vec3(0.96863, 0.65882, 0.24314),
    vec3(0.98431, 0.66667, 0.37255),
    vec3(0.98039, 0.66275, 0.34510),
    vec3(0.96078, 0.65098, 0.18824),
    vec3(0.93333, 0.54902, 0.01569),
    vec3(0.90588, 0.36078, 0.05490),
    vec3(0.91765, 0.44314, 0.13725),
    vec3(0.93333, 0.56078, 0.20392),
    vec3(0.93725, 0.61569, 0.25098),
    vec3(0.94118, 0.67843, 0.30588),
    vec3(0.94902, 0.81961, 0.49804)
);

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
