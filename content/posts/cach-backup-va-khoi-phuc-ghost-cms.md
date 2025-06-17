---
author: "Le Van Dong"
title: "Cách backup và khôi phục Ghost CMS"
date: "2023-11-15 09:29:48"
tags: ["Linux", "VPS"]
categories: ["Linux", "Tips"]
ShowToc: false
TocOpen: false
---

Ghost đã không còn support SQLite trên production nữa. Bạn cần phải sử dụng MySQL 8 để cài đặt blog của mình. Dù vậy, bài viết này vẫn có giá trị với bạn, ngoại trừ phần SQL

Nhắc đến thì đây là một nỗi buồn của tôi 🥲. Vào một ngày đẹp trời, với việc nhầm lẫn không cần thiết của mình, tôi đã nhấn nút xoá đi trang blog mà tôi đã chạy bao năm. Bùm, tất cả bài viết của tôi đã không còn nữa. Một nỗi tiếc nuối không thể tả, tôi đã viết khá nhiều bài viết trong khoảng thời gian dài và không có sao lưu dữ liệu cho nên không thể khôi phục lại được nữa. Nỗi đau cùng sự tiếc nuối của mình, tôi xin hứa sẽ không để chuyện đó xảy ra nữa. Cho nên bài viết này ra đời.

> 💡 **Lưu ý**: Hướng dẫn này chỉ phù hợp cho các bạn nào sử dụng SQLite3 cho Ghost CMS. Các bạn sử dụng SQL khác thì ở bước tạo file script sẽ khác một chút.

## Cài đặt Rclone

Đầu tiên, các bạn cần phải cài đặt Rclone vào server. Có rất nhiều cách để cài đặt, các bạn có thể tham khảo ở [trang chủ Rclone](https://rclone.org/install/#linux). Nếu như sử dụng máy chủ chạy Linux, bạn có thể chạy 1 dòng duy nhất sau đây, nó sẽ giúp bạn làm tất cả các bước thay vì làm thủ công.

```bash
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```

## Thiết lập Rclone

Sau khi cài đặt thành công, bạn cần phải thiết lập Rclone để Rclone biết các bạn muốn lưu trữ dữ liệu ở đâu. Các bạn chỉ cần chạy lệnh bên dưới:

```bash
rclone config
```

Nó sẽ ra bảng sau, các bạn nhấn **n** để tạo remote mới:

```text
No remotes found, make a new one?
n) New remote
s) Set configuration password
q) Quit config
n/s/q> n
```

Tiếp theo nó sẽ hỏi các bạn muốn đặt tên là gì, các bạn chọn tên bất kì, ở đây mình chọn là **dropboxdaily**:

```txt
Enter name for new remote.
name> dropboxdaily
```

Sau đó, nó sẽ liệt kê danh sách các dịch vụ lưu trữ được hỗ trợ, các bạn kiếm dịch vụ mà mình mong muốn, ở đây mình sử dụng dropbox - nó ở số 13, nên mình nhập **13**:

```txt
Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
 1 / 1Fichier
   \ (fichier)
 2 / Akamai NetStorage
   \ (netstorage)
 3 / Alias for an existing remote
   \ (alias)
 4 / Amazon Drive
   \ (amazon cloud drive)
 5 / Amazon S3 Compliant Storage Providers including AWS, Alibaba, ArvanCloud, Ceph, China Mobile, Cloudflare, GCS, DigitalOcean, Dreamhost, Huawei OBS, IBM COS, IDrive e2, IONOS Cloud, Leviia, Liara, Lyve Cloud, Minio, Netease, Petabox, RackCorp, Scaleway, SeaweedFS, StackPath, Storj, Synology, Tencent COS, Qiniu and Wasabi
   \ (s3)
 6 / Backblaze B2
   \ (b2)
 7 / Better checksums for other remotes
   \ (hasher)
 8 / Box
   \ (box)
 9 / Cache a remote
   \ (cache)
10 / Citrix Sharefile
   \ (sharefile)
11 / Combine several remotes into one
   \ (combine)
12 / Compress a remote
   \ (compress)
13 / Dropbox
   \ (dropbox)
14 / Encrypt/Decrypt a remote
   \ (crypt)
15 / Enterprise File Fabric
   \ (filefabric)
16 / FTP
   \ (ftp)
17 / Google Cloud Storage (this is not Google Drive)
   \ (google cloud storage)

Storage> 13
```

Tiếp theo, nó sẽ hỏi client_id, **nhấn Enter** để bỏ qua:

```txt
Option client_id.
OAuth Client Id.
Leave blank normally.
Enter a value. Press Enter to leave empty.
client_id>

Option client_secret.
OAuth Client Secret.
Leave blank normally.
Enter a value. Press Enter to leave empty.
client_secret>
```

Nó sẽ hỏi bạn muốn chỉnh sửa nâng cao không, bấm **n** để bỏ qua:

```txt
Edit advanced config?
y) Yes
n) No (default)
y/n> n
```

Tiếp theo nó sẽ gửi link để bạn đăng nhập account của mình, nếu vps của bạn có GUI thì chọn **Y**, không thì chọn **N**, không biết chọn gì thì cứ **N**:

```txt
Use web browser to automatically authenticate rclone with remote?
 * Say Y if the machine running rclone has a web browser you can use
 * Say N if running rclone on a (remote) machine without web browser access
If not sure try Y. If Y failed, try N.

y) Yes (default)
n) No
y/n> n
```

Sau đó, các bạn tải rclone vào máy Windows của mình và chạy lệnh:

```txt
rclone authorize "dropbox"
```

Nó sẽ xuất ra kết quả như sau:

```batch
C:\Users\lvd\Downloads\rclone-v1.64.2-windows-amd64\rclone-v1.64.2-windows-amd64>rclone authorize "dropbox"
2023/11/15 17:02:50 NOTICE: Config file "C:\\Users\\lvd\\AppData\\Roaming\\rclone\\rclone.conf" not found - using defaults
2023/11/15 17:02:50 NOTICE: If your browser doesn't open automatically go to the following link: http://127.0.0.1:53682/auth?state=X4W1GeNWKRjXPPYL7nRWfg
2023/11/15 17:02:50 NOTICE: Log in and authorize rclone for access
2023/11/15 17:02:50 NOTICE: Waiting for code...
2023/11/15 17:03:29 NOTICE: Got code
Paste the following into your remote machine --->
{"access_token":"sl.Bp6vngCippPF6QZmfrl13ZSaC-Avw5lRlcWF8419YkJ6raKD5MQe  bí mật EX41AqY","token_type":"bearer","refresh_token":"Y0esXLi3pKN21nr","expiry":"2023-11-15T21:03:30.0143114+07:00"}
<---End paste

C:\Users\lvd\Downloads\rclone-v1.64.2-windows-amd64\rclone-v1.64.2-windows-amd64>
```

Sau đó các bạn **dán token** vào terminal ở vps, và chọn **y**:

```txt
Option config_token.
For this to work, you will need rclone available on a machine that has
a web browser available.
For more help and alternate methods see: https://rclone.org/remote_setup/
Execute the following on the machine with the web browser (same rclone
version recommended):
        rclone authorize "dropbox"
Then paste the result.
Enter a value.
config_token> {"access_token":"sl.Bp6jUEX41AqY","token_type":"bearer","refresh_token":"Y0eN21nr","expiry":"2023-11-15T21:03:30.0143114+07:00"}

Configuration complete.
Options:
- type: dropbox
- token: {"access_token":"sl.Bp6UEX41AqY","token_type":"bearer","refresh_token":"Y0e21nr","expiry":"2023-11-15T21:03:30.0143114+07:00"}
Keep this "dropboxdaily" remote?
y) Yes this is OK (default)
e) Edit this remote
d) Delete this remote
y/e/d> y
```

Cuối củng chọn **q** để thoát:

```bash
Current remotes:

Name                 Type
====                 ====
dropboxdaily         dropbox

e) Edit existing remote
n) New remote
d) Delete remote
r) Rename remote
c) Copy remote
s) Set configuration password
q) Quit config
e/n/d/r/c/s/q> q
```

Bước cuối cùng là test xem các bạn đã config đúng chưa bằng cách chạy lệnh sau để liệt kê thư mục trong Dropbox. Nhớ **_thay_ dropboxdaily** thành tên remote của bạn:

```txt
rclone lsd dropboxdaily:
```

## Tạo script để tự động zip và upload lên dropbox

Các bạn thay đổi:

> \- **REMOTE_NAME**(tên remote tạo ở trên)

> \- **FOLDER_SAVE**(tên folder dropbox của bạn)

> \- **GHOST_DIR**(nơi bạn cài đặt web)

> \- **NAME_PREFIX**(đặt gì cũng được) thành của bạn là được.

Bạn nhớ đặt file ở thư mục HOME.

```bash
#!/bin/bash
cwd=$(pwd)
DATE=`date +%Y-%m-%d`
TIMESTAMP=$(date +%F)
REMOTE_NAME=dropboxdaily
FOLDER_SAVE=levandong
GHOST_DIR=/var/www/lvd
BACKUP_DIR=$GHOST_DIR/backup
NAME_PREFIX=levandongcom
SECONDS=0

mkdir $GHOST_DIR/backup

echo "Starting Zip Backup Website";
zip -r -y -q $BACKUP_DIR/${NAME_PREFIX}_$TIMESTAMP.zip $GHOST_DIR/content/ $GHOST_DIR/config.production.json
echo "Finished";
echo '';

echo "Starting Backup Uploading";
rclone copy ${BACKUP_DIR}/${NAME_PREFIX}_${TIMESTAMP}.zip "$REMOTE_NAME:/$FOLDER_SAVE/"
rclone -q delete --min-age 1w "$REMOTE_NAME:/$FOLDER_SAVE/"
find ${BACKUP_DIR} -mindepth 1 -mtime +6 -delete
echo "Finished";
echo '';

duration=$SECONDS
echo "$(($duration/60)) minutes and $(($duration%60)) seconds elapsed."
```

## Đặt cronjob

Cuối cùng đặt crobjob để chạy hàng ngày là xong.

Bạn chạy lệnh này để mở crontab

```bash
crontab -e
```

Và nhập đoạn sau:

```bash
0 2 * * * ~/test.sh > /tmp/backup_ghost_log.log
```

## Khôi phục

Để khôi phục, các bạn chỉ cần cài đặt ghost như bình thường. Sau đó copy thư mục content ghi đè vào thư mục content cài đặt ghost. Chỉnh file config.production.json cho phù hợp nữa là xong. Nếu bị lỗi, các bạn hãy kiểm tra xem tên file database trong file config đã đúng hay chưa.

## Tổng kết

Vậy là hoàn thành cách backup dữ liệu của ghost CMS. Các bạn lưu ý, cách này chỉ áp dụng khi bạn cài đặt ghost CMS với Sqlite3, còn nếu sử dụng MySQL thì sẽ phức tạp hơn.

## Tham khảo

[\[Linux\] Auto Backup dữ liệu lên Google Drive với Rclone](https://viblo.asia/p/linux-auto-backup-du-lieu-len-google-drive-voi-rclone-RQqKLBJml7z)

[Rclone](https://rclone.org/)