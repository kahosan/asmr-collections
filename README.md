<h1 align="center">ASMR Collectinos</h1>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/image/dark.png">
  <img alt="normal" src=".github/image/light.png">
</picture>

<p align="center">用于方便回顾音声作品的工具网页</p>

## 准备事项

- 需要一个 postgres 数据库，本地或白嫖网上的都可以
- 运行的机器需要安装 `pm2` 和 [`bun`](https://bun.sh/docs/installation)
- 或者直接使用 Docker

## 使用方法

### Docker

```bash
mkdir asmr-collections
cd asmr-collections

# 创建 covers 目录用于存放封面
mkdir covers

# 复制 docker-compose.yaml 文件到当前目录
curl -O https://raw.githubusercontent.com/kahosan/asmr-collections/main/docker-compose.yaml

# 修改 docker-compose.yaml 中的环境变量
# JINA_API_KEY 填入从 jina.ai 获取的 key
# 如果要使用本地库，取消注释 VOICE_LIBRARY_PATH 和 HOST_URL 两行，并将 HOST_URL 修改为你的访问地址

# 启动服务
docker compose up -d
```

### 本地运行

```bash
# 将 repo clone 到本地
git clone git@github.com:kahosan/asmr-collections.git

# 安装依赖
cd asmr-collections && pnpm i # npm i
```

从 [jina.ai](https://jina.ai) 白嫖一个免费的 key

然后把 postgres 的连接 URL 和 jina 的 key 填入 `.env` 文件


使用 pm2 管理运行 app

```bash
pm2 start pnpm --name asmr-collections -- run server:build-start
```

- `pnpm run server:build-start` 命令会重构建前端然后复制到 server 目录，并启动服务
- `pnpm run server:build` 不会启动服务只会构建并复制
- `pnpm run server` 只启动服务

可根据需要自行选择，不过一般只使用 `server:build-start` 即可

## 使用提示

> [!IMPORTANT]
> 网站内的所有删除操作都只会操作数据库，不会删除本地内容

### 本地库

当没有启用本地库时，会从 [asmr.one](https://asmr.one) 获取作品数据，并支持在线播放

本地库功能需要在 `.env` 文件中或 compose 文件中填写本地库的路径与你部署的网站的域名（默认是本地地址，如果你部署在局域网内的某部机器上并且没有配置反向代理，可以用 <机器 IP>:3000）

本地库内的文件夹，都需要是以 RJ、VJ、BJ 号命名的文件夹，否则无法识别

第一次使用时可以在网站右上角的菜单 -> 设置中打开「使用本地音声库」选项并点击「同步音声库」按钮

此操作可以将所有本地音声库的作品同步到数据库中

### 向量搜索

当作品被添加的同时会使用 jina 的 api 将作品的信息向量化存入数据库中，在网站的搜索框左边有个闪电图标，点击后在搜索就是语义化搜索，实验性功能不保证可用性

## TODO

- [x] Docker 支持

...

## 感谢

- 非常感谢 [asmr.one](https://asmr.one) 的无私奉献