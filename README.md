# 北师育荣猫咪档案 / BNU CAT ARCHIVE

北师大育荣校区校园猫静态数字档案网站。

## 生成数据

在项目目录运行：

```powershell
python .\scripts\build-data.py
```

脚本只读取上一级目录中的 `网站封面.jpg`、`档案/` 与 `post/`，并将可发布副本写入本站目录；不会修改原始素材。

## 本地预览

```powershell
python -m http.server 4173
```

然后访问 `http://localhost:4173/`。

## GitHub Pages

将本目录作为仓库根目录推送到 GitHub，然后在仓库的 **Settings → Pages** 中选择：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

网站全部使用相对路径，可在 GitHub Pages 的仓库子路径下直接运行。
