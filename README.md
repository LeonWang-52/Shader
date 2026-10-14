着色器

基于 web 端的开箱即用的着色器，可以生成视频和静态图片。
支持图片、视频、3d 素材的导入


![Uploading ascii_render (2) 1.png…]()


## 本地运行与效果切换
运行 `python3 server.py`，打开 http://127.0.0.1:8010/pro-0.html 。
类型栏包含 ASCII、Halftone、双曲线渐变、网格渐变和光栅海报。
后三种功能源码位于 `gradient-lab/`；不依赖原 4173 项目。导出图片、视频及选择保存文件夹使用同一个本地服务。MP4 转码需要 ffmpeg，macOS 文件夹选择器首次使用需要 Swift 编译工具。
