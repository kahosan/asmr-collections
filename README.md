<h1 align="center">ASMR Collectinos</h1>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/image/dark.png">
  <img alt="normal" src=".github/image/light.png">
</picture>

<p align="center">用于方便回顾音声作品的工具网页</p>

## 准备事项

- 需要一个 postgres 数据库，本地或白嫖网上的都可以
- 运行的机器需要安装 `pm2` 和 [`bun`](https://bun.sh/docs/installation)

## 使用方法

```bash
# 将 repo clone 到本地
git clone git@github.com:kahosan/asmr-collections.git

# 安装依赖
cd asmr-collections && pnpm i # npm i
```

把 postgres 的连接 URL 填入 `.env` 文件

> [!WARNING]
> 如果是第一次使用，需要运行一次下面的命令

```bash
pnpm run server:migration
```

使用 pm2 管理运行 app

```bash
pm2 start pnpm --name asmr-collections -- run server:build
```

## 使用提示

> [!IMPORTANT]
> 网站内的所有删除操作都只会操作数据库，不会删除本地内容

本地库功能需要在 `.env` 文件中填写本地库的路径与你部署的网站的域名

第一次使用时可以在网站右上角的菜单 -> 设置中打开「使用本地音声库」选项并点击「同步音声库」按钮

此操作可以将所有本地音声库的作品同步到数据库中

## TODO

- [ ] Docker 支持

...
