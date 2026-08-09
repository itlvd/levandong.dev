---
author: "Le Van Dong"
title: "Hướng dẫn setup Dev Container cho mọi dự án"
date: "2026-05-23 03:21:58"
description: "Đồng nhất môi trường phát triển cho cả team, onboard chỉ một cú click."
tags: ["Docker", "Tips", "Linux"]
categories: ["Docker", "Tips"]
---

> Mệt mỏi vì cảnh "máy tôi chạy được nhưng máy anh lại lỗi"? Khám phá cách cấu hình Dev Container để đồng nhất môi trường phát triển (Go, Docker, DB) cho cả team, giúp thành viên mới onboard dự án chỉ trong một cú click.

---

## Dẫn nhập

Tôi không biết mọi người giống như tôi không? Thông thường khi bắt đầu dev một dự án mới hay cài lại hệ điều hành (Ubuntu) thì tôi phải đối mặt với hàng tá thứ để setup môi trường chạy:

* Cài đặt Docker, Golang, gRPC, Protobuf, Buf generate,...
* Xung đột version của library.
* Cài đặt các thư viện mà yêu cầu cài đặt các dependencies cực kỳ phức tạp như magika của Google.
* Thiếu file cấu hình, quên bật biến môi trường, quên chạy lệnh setup ban đầu,...

Đến khi deploy, chúng ta có Docker lo liệu để đảm bảo môi trường production nhất quán. Nhưng trong quá trình code (môi trường dev), chúng ta thường hay bị chịu đựng cảnh "Ơ, sao máy tôi chạy được mà máy anh lại lỗi nhỉ?". Rồi mất hàng giờ để hỏi người này người kia, đọc hàng tá document để chạy được.

Để giải quyết triệt để vấn đề này, giải pháp tối ưu nhất chính là **Dev Container**.

---

## Dev Container là gì?

Nếu bạn đã từng deploy trên môi trường docker, bạn thấy tiện không? Nó sẽ luôn đảm bảo môi trường là nhất quán với nhau và chạy trên máy tôi thì cũng sẽ chạy trên máy của bạn.

Với ý tưởng đó, tại sao chúng ta không dev trong môi trường container của docker luôn nhỉ? Vì nó sẽ giúp chúng ta thống nhất một môi trường dev chung cho cả team.

Hiểu một cách đơn giản, nếu Docker Container giúp bạn đóng gói ứng dụng để mang đi chạy ở mọi server, thì Dev Container là giải pháp đóng gói toàn bộ môi trường phát triển (bao gồm IDE, compiler, công cụ format, linter, extension và các service phụ thuộc như database) vào trong một container.

Hiện tại, Dev Container đã được hỗ trợ rất tốt trên các IDE phổ biến:

* **VSCode:** Hỗ trợ đầy đủ, mượt mà và ổn định nhất (Khuyên dùng).
* **Cursor / Windsurf:** Đã tích hợp sẵn nhưng đôi khi vẫn phát sinh lỗi nhỏ về extension.
* **JetBrains:** Đang phát triển và chưa hỗ trợ toàn diện tất cả tính năng.

---

## Tại sao Developer nên sử dụng Dev Container?

Lý do lớn nhất là để người mới onboard nhanh hơn, thay vì mất nửa buổi hay cả ngày chỉ để thiết lập môi trường thì giờ đây chỉ cần 1 cái click là tất cả những setup môi trường được kéo về, và người mới chỉ cần tập trung làm quen source code và dev mà thôi.

Ngoài ra, Dev Container sẽ giúp môi trường host của bạn sạch sẽ, không bị lỗi xung đột version với nhau. Giả sử máy của bạn cài version 1.0.0, nhưng ở project lại dùng version 2.0.0 chẳng hạn, thì bạn bắt buộc phải cài thêm version 2.0.0 vào máy để có thể chạy được.

Cuối cùng là giúp đồng bộ hoá cấu hình của IDE cho cả team. Tôi có thể chỉ định sẵn một số extension bắt buộc cài đặt và các cấu hình vscode dùng chung cho dự án. Do đó, mọi thành viên trong team của tôi sẽ có cấu hình khi chạy là giống hệt nhau.

---

## Hướng dẫn cấu hình Dev Container

Đầu tiên, bạn phải chuẩn bị môi trường như sau:

* Docker.
* Visual Studio Code.
* [Dev Container Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers&ref=levandong.dev) (Với Windsurf, Cursor thì thường được tích hợp sẵn bên trong).

### Bước 1: Khởi tạo cấu hình cấu trúc thư mục

Đầu tiên, bạn tạo thư mục `.devcontainer` trong thư mục root của project. Bên trong thư mục này, chúng ta sẽ tạo 4 file cốt lõi: `devcontainer.json`, `docker-compose.yml`, `setup.sh` và cuối cùng `Dockerfile`.

```text
Dự án của bạn/
├── .devcontainer/
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── setup.sh
├── main.go
└── go.mod

```

### Bước 2: Cấu hình file `devcontainer.json`

Tôi sẽ giới thiệu sơ lược qua một vài tính năng của file config dev container:

* **service:** Tức là service (container môi trường dev) mà bạn muốn attach vào.
* **workspaceFolder:** Thư mục mà bạn làm việc, ví dụ bình thường trên máy host của các bạn là `/home/levandong/project/test` thì bây giờ trong container bạn sẽ là thư mục `workspaces/test` để code.
* **features:** Một số tính năng thêm bạn muốn cài đặt, ví dụ tôi muốn khi start môi trường sẽ có thêm NodeJS bên cạnh Golang, Claude Code, fzf, zsh,...
* **vscode:** Đây là nơi bạn custom vscode theo ý của bạn, ví dụ bạn muốn khi start container thì sẽ tự động cài extension golang, tự động có indent rainbow, gitlens,...
* **postCreateCommand:** Là lệnh sẽ tự động được chạy, sau khi container của bạn được khởi tạo. Tôi thường dùng để cài một số tool như `golines`, `swaggo` và chạy `go mod tidy` để tự động kéo thư viện về.
* **forwardPorts** và **portsAttribute:** Nhằm mục đích forward port trong container ra ngoài host để test api chẳng hạn.

```json
{
  "name": "test project",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "features": {
    "ghcr.io/devcontainers/features/node:2": {},
    "ghcr.io/devcontainer-community/devcontainer-features/fzf:1": {},
    "ghcr.io/anthropics/devcontainer-features/claude-code:1": {},
    "ghcr.io/devcontainers/features/common-utils": {
      "installZsh": true,
      "installOhMyZsh": true,
      "installOhMyZshConfig": true,
      "configureZshAsDefaultShell": true
    }
  },
  "customizations": {
    "vscode": {
      "settings": {
        "go.formatTool": "custom",
        "go.formatFlags": [
          "-m",
          "128"
        ],
        "go.alternateTools": {
          "customFormatter": "golines"
        }
      },
      "extensions": [
        "oderwat.indent-rainbow",
        "eamodio.gitlens",
        "anhkhoatranle30.reference-grouper",
        "golang.Go",
        "naumovs.color-highlight"
      ]
    }
  },
  "postCreateCommand": "/bin/bash /workspaces/${localWorkspaceFolderBasename}/.devcontainer/setup.sh",
  "forwardPorts": [
    8080
  ],
  "portsAttributes": {
    "8080": {
      "label": "API"
    }
  }
}

```

### Bước 3: Cấu hình file `docker-compose.yml`

File này giúp bạn định nghĩa môi trường đa container. Thông thường, một ứng dụng backend sẽ cần đi kèm với một hệ quản trị cơ sở dữ liệu (ví dụ: PostgreSQL).

Tôi setup sau khi start devcontainer nó sẽ chạy 2 container là `app` và `db`. Với `app` thì ở máy host có port là `28080` và map với port `8080` trong container. Còn với `db` thì map với port `15433` ở máy host.

```yaml
volumes:
  test-postgres-data:

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
    ports:
      - "28080:8080"
    volumes:
      - ../..:/workspaces:cached
    command: sleep infinity
    network_mode: service:db

  db:
    image: postgis/postgis:16-3.4-alpine
    restart: unless-stopped
    volumes:
      - test-postgres-data:/var/lib/postgresql
    ports:
      - "15433:5432"
    env_file:
      - .env

```

### Bước 4: Viết `Dockerfile`

Hiện tại, vì môi trường của tôi chưa phức tạp, cho nên `Dockerfile` của tôi dùng mặc định của microsoft. Nếu sau này tôi phải setup thêm môi trường cài `magika` của google chẳng hạn thì tôi sẽ sửa trong `Dockerfile` này.

```dockerfile
FROM mcr.microsoft.com/devcontainers/go:2-1.26-trixie

```

### Bước 5: Viết script tự động hóa `setup.sh`

File script này sẽ tự động cài đặt các công cụ bổ trợ cho Golang.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Install Go debugger
go install github.com/go-delve/delve/cmd/dlv@latest
go install github.com/swaggo/swag/cmd/swag@latest

go install github.com/golangci/golines@latest

# Setup go can pull library in internal network
go env -w GOPRIVATE='192.168.1.11'
go env -w GOINSECURE='192.168.1.11'

git config --global url."ssh://git@192.168.1.11/".insteadOf "https://192.168.1.11/"

go mod tidy

```

Trong đây tôi cài `dlv` để debug, `swaggo` để generate swagger, `golines` để format code dễ nhìn hơn. Ngoài ra, tôi còn setup để go có thể kéo library ở `gitlab local` của mình. Và cuối cùng là tôi chạy lệnh để kéo các library về máy.

---

## Cách khởi tạo Dev Container

Khi các file cấu hình đã nằm đúng vị trí:

1. Bạn mở thư mục dự án bằng VSCode.
2. Nhấn tổ hợp phím `Ctrl + Shift + P` (hoặc `Cmd + Shift + P` trên Mac).
3. Gõ và chọn lệnh: **`Dev Containers: Open Workspace in Container`**.

Lúc này, VSCode sẽ tự động tải các Image cần thiết, chạy script `setup.sh` và tải các extension. Một khi quá trình hoàn tất, bạn đã chính thức đứng bên trong Container để làm việc.

Một điểm cộng lớn của Dev Container là toàn bộ thông tin Git (SSH keys, GPG keys, Git config) từ máy thật của bạn sẽ tự động được chia sẻ an toàn vào bên trong Dev Container. Bạn hoàn toàn có thể thực hiện các thao tác `git pull`, `git commit`, `git push` một cách bình thường mà không cần config lại từ đầu.

---

## Kết luận

Việc dành thời gian setup Dev Container một lần, sẽ giúp cho cả team đồng nhất môi trường làm việc, tiết kiệm hàng chục tiếng đồng hồ lãng phí cho việc xử lý các vấn đề liên quan đến môi trường làm việc. Tôi đã áp dụng cho rất nhiều project khác nhau và cảm nhận rất hài lòng, tôi có thể cài lại hệ điều hành và chạy lại project rất đơn giản.
