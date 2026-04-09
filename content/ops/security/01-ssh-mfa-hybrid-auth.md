---
title: 服务器运维 - 安全的 SSH 配置 | Linux 服务器运维
tags:
  - Linux
  - Security
  - SSH
description: 文章围绕SSH暴力破解致服务器卡顿的问题，给出基于fail2ban与google-authenticator的双层防护方案：通过日志统计一周8025次失败密码请求，配置fail2ban以10分钟内失败3次封禁30天，并结合密码+2FA提升SSH登录安全性与资源可用性。
---
## 背景描述

最近使用 SSH 登录服务器发现十分卡顿，但是没有找到问题的根源，偶然翻阅 SSH 日志，发现即使没有使用默认端口 22，仍有大量脚本在撞密码库，由于本身机器性能并不强，这么多次数的扫描又消耗了大量的服务器资源，影响了自己的远程连接，一周内有 8000 多次请求：

``` shell
sudo journalctl -u ssh | grep "Failed password" | wc -l
[sudo] password for ******: 
8025
```

## 解决方法

`fail2ban` + `google-authenticator` 

```
连接请求 -> [SSH 服务]
           |
           +-- 有 SSH Key? ----> [直接登录]
           |
           +-- 无 SSH Key? ----> [第一关：密码] 
                                    |
                                    +-- [第二关：2FA 验证码] ----> [成功登录]
```

**注意：请在修改前确保自己可以通过服务商的 VNC 等途径连接服务器，一旦配置错误还有补救的空间** 
### fail2ban 配置

首先，安装 `fail2ban` ：

```shell
sudo apt update
sudo apt install fail2ban -y
```

之后，对 `fail2ban` 进行配置：

```shell
sudo vim /etc/fail2ban/jail.local
```

输入：

```toml
[DEFAULT]
# 忽略本地的回环地址
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
# 填入实际 SSH 端口
port = your_port
filter = sshd
backend = systemd
# 统计窗口，单位为秒
findtime = 600
# 最大容错次数：10分钟内失败 3 次就触发封禁
maxretry = 3
# 封禁时间：直接拉满，封禁 30 天
bantime = 30d
```

之后，重启 `fail2ban`，并且配置开机自动运行：

```shell
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

成功后，可以通过 `sudo fail2ban-client status sshd` 命令查看当前封禁的个数等信息，如果不小心误封了自己的 IP，可以通过流量等其他网络环境或者服务器提供商提供的 VNC 等途径登录远程服务器，使用 `sudo fail2ban-client set sshd unbanip 你的IP地址` 解封

### Google Authenticator 配置

为了更强的安全性，我们可以配置 `google-authenticator`，即使密码输对了，还得再输一个六位数的验证码，提供极佳的安全性。为了方便，这里配置密钥优先，使用密码+2FA 作为备选项。

首先，安装相关依赖：

```shell
sudo apt update
sudo apt install libpam-google-authenticator -y
```

之后，进行配置：

``` shell
google-authenticator
```

这里推荐选择（显示为英文，这里做了个意译）：

	1. 是否需要基于时间的token刷新机制？ -> y
	
	2. 扫描二维码
	
	3. 是否更新相关文件？ -> y
	
	4. 是否禁止同一令牌多次使用？ -> y
	
	5. 是否允许存在时间误差？ -> n（如果手机时间不准则输入 y）
	
	6. 是否开启速率限制？ -> y（默认 30s 3次）

之后，配置 PAM，引入验证码机制：

```shell
sudo vim /etc/pam.d/sshd
```

注释掉原有的 `@include common-auth`，在文件末尾添加：

```shell
# @include common-auth <-- 注释掉这一行（如果它在文件中间） 
# ... 在文件末尾添加以下两行 ... 
@include common-auth
auth required pam_google_authenticator.so
```

这样就会先输入密码，密码输对进入第二关，输入验证码，如果想反一下顺序，把这两行反一下即可。

随后，配置 SSHD：

```shell
sudo vim /etc/ssh/sshd_config
```

确保以下参数设定正确：

```
# 需要支持键盘交互模式，不然不能进入 2FA
KbdInteractiveAuthentication yes

# 允许使用 PAM
UsePAM yes

# 端口保证正确，禁止 root 远程登录
Port your_port
PermitRootLogin no

# 关闭单向密码验证
PasswordAuthentication no

# 允许使用 ssh key 直接登录
PubkeyAuthentication yes

# 自定义验证逻辑，优先使用 key，key 不匹配则进入密码+2FA 逻辑
AuthenticationMethods publickey keyboard-interactive
```

随后，保存并重启服务：`sudo systemctl restart ssh` 

### SSH Key添加

配置完成后，可以在常用设备使用命令添加 SSH Key，以便快速登录：

```shell
ssh-copy-id -p your_port your_username@your_ip
```

> **注意：** 如果报错 `WARNING: UNPROTECTED PRIVATE KEY FILE!`，请在本地执行 `chmod 600 ~/.ssh/id_rsa` 修复权限，或者将 `id_rsa` 改为你自己的私钥文件名

## 状态速查

- **查询被封 IP 列表**：`sudo fail2ban-client status sshd` 
- **查看登录失败统计**：`sudo journalctl -u ssh | grep "Failed password" | wc -l` 
- **手动解封**：`sudo fail2ban-client set sshd unbanip <IP>` 