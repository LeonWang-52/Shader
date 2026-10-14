from pathlib import Path
shader = Path(__file__).resolve().parents[1] / 'shaders'
(shader / 'fragment.glsl').write_text('#version 300 es\nprecision highp float;\n' + (shader / 'mesh.glsl').read_text() + '\n' + (shader / 'effect.glsl').read_text())
