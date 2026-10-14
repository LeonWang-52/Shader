// Xorshift32 with a fixed seed makes exported grain match the preview.
export function noiseField(seed=1337){
 const bytes=new Uint8Array(256*256);
 for(let i=0;i<bytes.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;bytes[i]=seed&255;}
 return bytes;
}
export function installNoise(gl,program){
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,256,256,0,gl.RED,gl.UNSIGNED_BYTE,noiseField());
 for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.LINEAR);
 for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.REPEAT);
 gl.uniform1i(gl.getUniformLocation(program,'u_noise'),2);
}
