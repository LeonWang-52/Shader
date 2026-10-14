#version 300 es
  in vec2 a_position; in vec2 a_uv; out vec2 v_uv;
  void main(){v_uv=a_uv;gl_Position=vec4(a_position.x*2.0-1.0,1.0-a_position.y*2.0,0.0,1.0);}
