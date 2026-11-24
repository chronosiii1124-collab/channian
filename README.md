# 馋念 · 城市觅食地图

把抖音里收藏的城市、店和菜，重新放回一张可以点的地图上。

这是 **公开样例版**，只包含 30 条脱敏样例数据，不包含完整收藏、账号凭据或本地采集服务。

## 在线演示

部署 GitHub Pages 后地址形如：

`https://<你的用户名>.github.io/<仓库名>/`

## 本地运行

```bash
npm install
npm run dev
```

默认打开 `http://127.0.0.1:8775/`。

## 构建

完整本地版：

```bash
npm run build
```

公开样例版：

```bash
npm run build:public
```

`build:public` 会使用 `public/data.sample.json`，并在构建后删除 `dist-public/data.json`，避免把完整数据带进公开产物。

## 数据

- `public/data.sample.json`：30 条公开样例，覆盖 20 个城市、10 条地点待定、6 条在家做。
- `public/data.json`：完整 261 条，本地私用，已在 `.gitignore` 中忽略。
- 公开版不包含自动提取抖音数据、登录凭据或本地解析服务。

## 隐私

样例数据不含手机号、邮箱、身份证号、Cookie、token 或账号密码；仍包含公开视频的标题、作者、封面 URL 和城市线索。第三方内容的版权归原作者，公开演示前请自行确认使用范围。

## License

代码许可证暂未指定，添加前请不要默认可以商用或再分发。
