# Centos配置turn服务器

网址：	https://www.cnblogs.com/idignew/p/7440048.html

**使用ssh工具，进入命令行,安装下面的就是可以配置turn-server（coturn）**

## **1.安装centos必须的库文件**

```shell
#mysql-server 可以不用装，目前不使用数据库
yum install -y make gcc cc gcc-c++ wget openssl-devel libevent libevent-devel mysql-devel mysql-server
```

## **2. 下载并安装 LibEvent modules**

版本地址：https://github.com/libevent/libevent

```shell
#下载
wget https://github.com/downloads/libevent/libevent/libevent-2.0.21-stable.tar.gz
#解压
tar zxvf libevent-2.0.21-stable.tar.gz
#编译安装
cd libevent-2.0.21-stable && ./configure
make && make install && cd ..
```

## **3.下载并安装 TURN modules**

**另外具体版面可以到： http://turnserver.open-sys.org/downloads/ 查看**

```shell
#下载
wget http://turnserver.open-sys.org/downloads/v4.4.5.2/turnserver-4.4.5.2.tar.gz
#解压
tar -zxvf turnserver-4.4.5.2.tar.gz
#编译安装
cd turnserver-4.4.5.2 && ./configure
make && make install
```

安装成功后出现：

```shell
==================================================================

1) If you system supports automatic start-up system daemon services,

the, to enable the turnserver as an automatically started system

service, you have to:
a) Create and edit /etc/turnserver.conf or
/usr/local/etc/turnserver.conf .
Use /usr/local/etc/turnserver.conf.default as an example.
b) For user accounts settings: set up SQLite or PostgreSQL or
MySQL or MongoDB or Redis database for user accounts.
Use /usr/local/share/turnserver/schema.sql as SQL database schema,
or use /usr/local/share/turnserver/schema.userdb.redis as Redis
database schema description and/or
/usr/local/share/turnserver/schema.stats.redis
as Redis status & statistics database schema description.

 
If you are using SQLite, the default database location is in
/var/db/turndb or in /usr/local/var/db/turndb or in /var/lib/turn/turndb.

c) add whatever is necessary to enable start-up daemon for the
/usr/local/bin/turnserver.

2) If you do not want the turnserver to be a system service,
  then you can start/stop it "manually", using the "turnserver"
  executable with appropriate options (see the documentation).
3) To create database schema, use schema in file
/usr/local/share/turnserver/schema.sql.
4) For additional information, run:

  $ man turnserver
  $ man turnadmin
  $ man turnutils
==================================================================
```

## **4.配置“turnserver.conf” file**

```shell
cp /usr/local/etc/turnserver.conf.default  /etc/turnserver.conf
```

```shell
vim /etc/turnserver.conf
```

```shell
#监听端口可以不设置会默认的使用3478
listening-port=3478
#listening-ip,注意必须是你的内网IP地址如(如果你是阿里云的，就是私网地址）：
listening-ip=172.xx.xx.xx
#relay-ip可以不设置，默认会使用你的外网ip地址作为转发包的中继地址,建议不设置，使用默认就可以：
#external-ip，注意必须使用你的外网IP地址如：
external-ip=xxx.xxx.xxx.xxx
#设置用户名及密码，这个是作为TURN服务器使用必须设置的,可以设置多个，我这里配置2个
user=user:simon
user=user:simon2
```

## **5.启动 turn server** 

```shell
turnserver -v -r 外网地址:3478 -a -o -c /etc/turnserver.conf
```

## **6.停止turn sever**

```shell
ps -ef|grep turnserver
kill -9 xxxx
```

## **7.测试服务器地址：**

https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

配置成功后会出现

 ![img](https://images2017.cnblogs.com/blog/1037556/201708/1037556-20170829164303374-838057727.png)