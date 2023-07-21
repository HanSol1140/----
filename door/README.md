# 수화기 ESP32 설정

<a href="https://velog.io/@songhansol/Arduino-ESP32-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0">아두이노 IDE를 사용한 ESP32 코딩방법</a>

해당 페이지를 참조하여 ESP32에 코드를 업로드합니다.
```c
#include <WiFi.h>
#include <WebServer.h>

// 접속할 WIFI Name /  WIFI Password
const char* ssid = "NNX-2.4G";
const char* password = "$@43skshslrtm";

// 고정 IP 설정
IPAddress ip(192, 168, 0, 88);
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);

// 포트 설정
const int serverPort = 8083;
WebServer server(serverPort);

void callCancle() {
  if(!digitalRead(19)){
    digitalWrite(19, HIGH);
    delay(100);
    digitalWrite(19, LOW);
    Serial.println("통화 종료");
    server.send(200, "text/plain", "통화 종료");
  }else{
    digitalWrite(19, LOW);
    delay(100);
    digitalWrite(19, HIGH);
    Serial.println("통화 종료");
    server.send(200, "text/plain", "통화 종료");
  }
}

void setup() {
  pinMode(19, OUTPUT);
  digitalWrite(19, HIGH);
  Serial.begin(9600);
  setup_wifi();
  server.on("/callcancle", callCancle);
  server.begin();
}

void loop() {
  server.handleClient();
}

// 와이파이 접속
void setup_wifi(){
    // 시리얼 통신 초기화(실행), 전송속도 설정

    // 고정 IP 설정
    if (!WiFi.config(ip, gateway, subnet))
    {
        Serial.println("STA Failed to configure");
    }
    // 먼저 WiFi 네트워크에 연결합니다.
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    // 와이파이가 접속이 됬는지 확인
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("연결 시도중!");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Port address: ");
    Serial.println(serverPort);
}
```
해당 코드가 정상적으로 실행이 되었다면 아두이노의 시리얼 모니터는

![image](https://github.com/HanSol1140/door/assets/121269266/dcccaa4a-ff42-4de4-8458-c92f0e88726e)

해당 화면을 출력할 것입니다.

정상적으로 IP와 Port의 Address가 출력되었다면 웹 주소창에 다음 주소를 입력하여 접속해보세요.
>http://192.168.0.88:8083/callcancle

![image](https://github.com/HanSol1140/door/assets/121269266/67aacad7-f739-4b3d-85f0-66dcc96c752e)

시리얼 모니터에 통화 종료가 출력된다면 설정이 성공한 것입니다.

# 라즈베리파이 초기 설치하기

## 1. 라즈베리파이 설치

라즈베리파이와 SD카드, SD카드 리더기를 준비합니다.

<a href="https://www.raspberrypi.com/software/">라즈비안 이미저 다운로드</a>

![image](https://github.com/HanSol1140/door/assets/121269266/2b2aaf33-32da-4439-8a04-645a62e10e3a)

SD카드 리더기에 SD카드를 꽂고, 컴퓨터에 연결하여 자신의 운영체제에 맞는 라즈비안 이미저를 설치합니다.


![image](https://github.com/HanSol1140/door/assets/121269266/5e00314a-60b0-400d-a7e6-d93b373e8e1b)

설치된 라즈비안 이미저를 실행합니다.

![image](https://github.com/HanSol1140/door/assets/121269266/ec3a4469-ff16-4bc1-94ec-c37832c00521)

Rassberry Pi OS Full(32-bit)를 선택합니다.

![image](https://github.com/HanSol1140/door/assets/121269266/d84e43e8-a535-4f41-9fdd-cc02471931d2)

메인화면으로 돌아와서 우측하단 설정모양을 누릅니다

![image](https://github.com/HanSol1140/door/assets/121269266/6303a262-79fd-49d7-88d9-1dbae54d0b34)

두가지 사항만 체크해서 기입후 라즈베리파이를 설치합니다.

설치후 라즈베리파이에 SD카드를 넣고 모니터, 키보드, 마우스 연결하는 과정 생략

라즈비안이 실행되고 바탕화면에 휴지통이 보입니다.

좌측 상단 라즈비안 아이콘 - Preferences - raspberry pi configuration - interfaces - 모든 기능을 사용가능으로 설정 - OK - 재부팅

<br><br>

## 2. 라즈베리파이 설치 후 한글 설정

한글 설정을 해주지 않으면 영어는 사용할 수 있지만

특수문자 키배열이 달라서 각종 설치에 문제가 있으므로 가장 먼저 한글을 설치합니다.

먼저 터미널을 실행 후

```
    sudo apt-get update
    
    sudo apt-get install git
```

### raspi-config을 통한 설정
```
    sudo raspi-config
    5 Localisation Options" > L1 Locale
    ko_KR.UTF-8 UTF-8을 선택하고, Ok를 누릅니다.
    그 다음 =설정할 기본 로캘로 ko_KR.UTF-8을 선택하고 다시 Ok를 누릅니다.
    raspi-config를 종료
```

### 만약, 기본 로캘 설정에 ko_KR.UTF-8이 없다면
```
    터미널을 실행
    locale -a
    
    ko_KR.UTF-8이 있는지 확인하고 만약 없다면
    
    sudo nano /etc/locale.gen
    입력하여 편집기에서 ko_KR.UTF-8이 주석처리 되어있나 확인하고 주석처리를 제거(앞 부분에 #, 공백 제거)
    (Ctrl + S)로 저장 후 (Ctrl + X)로 편집기 종료
    
    sudo locale-gen

    sudo update-locale LANG=ko_KR.UTF-8

```

### 이후 나머지 설치
```
    글꼴 설치 -> 설치후 설정을 해줘야 네모가 출력되지 않음
    sudo apt-get install -y fonts-nanum*

    한글 입력기 설치
    sudo apt-get install -y ibus ibus-hangul
    ibus를 기본 입력방법으로 설정
    im-config -n ibus
    입력기에 한글 추가하기
    터미널에
    ibus-setup
    => input Method => Add => Korean => hangul
    
    원래 있던 언어를 제거합니다. (한글만 설치해도 영어사용가능)
    sudo reboot


    ※ 이때 ibus-setup일때 오류가 뜨면서 안켜질 수 있는데
    1. 재부팅후 다시 실행
    2. 그래도 안된다면 sudo ibus-setup 후 오류메세지가 출력될텐데
       무시하고 Hangul설정후 재부팅후 다시 ibus-setup으로 접속해서 한글이 추가되었는지 확인해보세요.
```


<br><br>

## 3. MAX98357 스피커 연결하기

```
먼저 터미널에 sudo raspi-config를 입력,
system option - audio 확인
0 HeadPhones
1 MAI PCM i2s-HIFI-0
이부분을 확인을 했으면 뭔가를 선택할 필요 없이 <취소> - <Finish>를 눌러서 raspi-config 종료

sudo nano /boot/config.txt
config.txt를 실행해서 편집
편집기의 제일 아래로 내려가서
    dtoverlay=hifiberry-dac
    dtoverlay=i2s-mmap
해당 구문을 입력하고 저장(Ctrl+S) + 종료(Ctrl+X)
재부팅(reboot)

이제 다시 sudo raspi-config - system option - audio 확인
'2 HifiBerry Dac HiFi pcm5102a-hifi-0'가 추가된걸 볼 수 있음
새로 생긴 2번을 선택한뒤 Finish를 선택
reboot
```


<br><br>

## 4. 라즈베리파이 고정 WIFI 접속 설정

### 고정 접속 WIFI설정

터미널을 실행후

>sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

해당 파일의 가장 아래에 해당 문구를 추가합니다
```
// 고정 접속 WIFI정하기
network={
    ssid="접속할WIFI이름"
    psk="접속할WIFI비밀번호"
    key_mgmt=WPA-PSK
}
```
혹은 초기 라즈비안 설치시 wifi설정을 해주었다면 이미 입력되어 있을 것 입니다.

이제 재부팅을 한뒤 터미널을 실행시켜
ip route을 입력합니다.

![image](https://github.com/HanSol1140/door/assets/121269266/2106bcaf-7cc0-43d8-9b84-116a77be5a29)

default via 192.168.0.1을 확인할 수 있습니다
따라서 route ip는 192.168.0.1입니다.

<br>

### 고정 접속 IP 설정

#### 방법 1.

>sudo nano /etc/dhcpcd.conf

가장 아래로 스크롤하여 다음 구문을 추가합니다.
```
interface wlan0
static ip_address = 접속할IP번호/24
static routers= 루트ip
static domain_name_servers=루트ip

예시)
interface wlan0
static ip_address=192.168.0.2/24
static routers=192.168.0.1
static domain_name_servers=192.168.0.1
```
저장(Ctrl + S) + 종료(Ctrl + S)
위에서 wifi를 접속한뒤 ip route를 통해 routers를 확인했으므로 기입하여 줍니다.
이제 재부팅 후에 터미널을 실행시켜
ifconfig 을 입력하여 입력한 ip로 접속이 됬는지 확인해주세요.

만약 설정한 ip를 다른 기기에서 사용중이라면 접속이 안될 수 있습니다.

그때에는 공유기의 관리자페이지로 접속해서 비어있는 ip주소를 찾아주세요.

#### 방법 2.

인터넷창을 켜서 192.168.0.1 공유기 관리자 페이지로 접속(공유기에 따라 관리자 페이지의 접속방법이 다를 수 있습니다)

터미널에 ifconfig을 실행 후 접속한 IP를 확인합니다.

공유기의 관리자 페이지로 접속하여 DHCP 설정으로 이동

자신이 접속한 ip에 해당하는 라즈베리파이 기기를 찾아 IP를 수동으로 설정해주세요.

<a href="https://m.blog.naver.com/siot__/221911877118">참고 블로그</a>

이후 라즈베리파이를 재부팅하면 ip가 설정한 ip로 변경된 것을 볼 수 있습니다.

※ 주의

    수동 설정 후 바로 변경되는것이 아니라 일정시간이 지나야 설정이 됩니다.    
    
    만약 방법 1의 sudo nano /etc/dhcpcd.conf를 통해 고정 IP를 설정해둔 상태라면

    방법 2를 설정하더라도 방법 1로 설정한 ip로 접속합니다.

<br><br>

## 5. node.js 설치
```
sudo apt-get update
sudo apt-get install -y nodejs npm
node -v
npm -v
```
node와 npm이 구버전임을 확인할 수 있습니다.

<a href="https://nodejs.org/en/download">nodejs 다운로드 페이지</a>
Linux Binaries (ARM) - ARM7 다운로드 후 home/hostname 경로로 이동시키기

node-v18.16.1-linux-armv7l.tar.xz 압축해제

터미널을 실행합니다.
>echo 'export PATH=$HOME/node-v18.16.1-linux-armv7l/bin:$PATH' > ~/.bashrc
>
>source ~/.bashrc

버전확인
>node -v
>npm -v

설정한 경로 확인방법
>which node
>which npm

확인됬다면 reboot해주세요.


<br><br>

## 6. github에서 server파일 받아오기

터미널을 실행해서
>git clone https://github.com/HanSol1140/door.git

git을 복제합니다
문제없이 복제 됬다면 /home/사용자명/door 폴더가 생성됬을 것입니다.

터미널을 실행
>cd door
>
>npm i

<br>

### 추가 모듈 설치

>sudo apt-get install python3-bluez


<br><br>

## 7. 포트 개방

iptables-persisten 설치
>sudo apt-get install iptables-persistent


8082 포트 개방
>sudo iptables -A INPUT -p tcp --dport 8082 -j ACCEPT
>
>sudo iptables-save | sudo tee /etc/iptables/rules.v4


설정한 포트는 다음 명령어를 통해 다시 삭제할 수 있습니다.
>sudo iptables -D INPUT -p tcp --dport 8082 -j ACCEPT
>
>sudo iptables-save | sudo tee /etc/iptables/rules.v4

재부팅 후 설정이 저장되었는지 확인해주세요
>sudo iptables -L

## 8. 포트 포워딩 설정

주소창에 192.168.0.1을 입력하여 관리자 페이지로 접속(공유기의 기종에 따라 다를 수 있습니다.)

![image](https://github.com/HanSol1140/door/assets/121269266/af11e4f3-07a4-4cf8-a5a0-8ed90d28d413)

1. 새규칙 추가를 누릅니다
 
2. 규칙이름을 기입합니다.
 
3. 내부 주소 IP를 기입합니다. 
   이 때 IP는 터미널에서 ifconfig으로 확인할 수 잇고, 사전 설정을 통해 고정되어 있어야합니다.

4. 외부 포트 IP
   해당 포트는 공인 IP를 이용하여 내부 IP에 접속할때 사용합니다.

   공인IP 획득방법 : 터미널에 입력
   >curl ifconfig.me
   
   외부 포트 IP는 8082로 설정합니다.<br>   
   (다른 값을 사용할경우 해당 값은 서버실행 후에 설정을 할때 전화수신시 URL알림의 PORT값과 일치해야합니다.)
   
6. 내부 포트 iP

   해당 포트는 8082로 고정해주세요,
   
   다른 포트번호는 사용할 수 없습니다.

7. 적용 - 저장

   모든 값을 기입했다면 적용 버튼을 누르고 저장 버튼을 눌러주세요.

<br><br>



## 9. 서버 설정하기
먼저 터미널을 실행한 뒤
>cd door
>node server.js로 서버를 실행해주세요.
>
사전에 설정한 고정IP:8083으로 접속합니다,

저는 192.168.0.2로 설정을 했으니 192.168.0.2:8083으로 접속하면 다음과 같은 페이지가 보입니다.

![1](https://github.com/HanSol1140/door/assets/121269266/b36db178-69a7-45b8-8637-c738366455db)

해당 페이지에서 각종 설정을 할 수 있습니다.

1. 매장 비밀번호 설정
 
  ![image](https://github.com/HanSol1140/door/assets/121269266/e7d491f8-d08b-41ee-8560-f6b8d3985eef)

  매장 비밀번호를 설정해주세요, 설정한 비밀번호를 번호키에 입력시 문이 열립니다.

2. LGU+ ID / 비밀번호 설정

  ![image](https://github.com/HanSol1140/door/assets/121269266/89430caf-d90c-4414-a3ad-2c6dc8202e20)

  API를 사용할 LGU+ 아이디와 비밀번호를 입력해주세요.



3. ※ <b>중요<b> 전화 수신시 URL 알림설정

  ※ 잘못된 LGU+ ID/PASSWORD를 입력할시 실행되지 않습니다.
   
  ![image](https://github.com/HanSol1140/door/assets/121269266/98b728c9-1783-43fb-acfa-43486e4db45e)

  먼저 라즈베리파이의 터미널을 실행합니다

  >curl ifconfig.me


  여기서 출력되는 IP 번호가 빈칸에 입력할 공인 IP입니다.

  Port 번호는 사전에 설정한 포트포워딩 설정에서 외부 Port로 설정한 번호와 동일해야합니다.

  사전에 설정한대로 8082를 입력해줍니다.

  이제 두 값을 입력 후 '값 설정하기' 버튼을 눌러주면 값이 세팅되고 

  ![image](https://github.com/HanSol1140/door/assets/121269266/1edae933-5b1f-4580-b668-08cd7fc611ff)


  해당 alert창이 출력됩니다. 이제 조회 / 설정 / 삭제 기능을 사용할 수 있습니다.
  <br>

  먼저 F12 - Console로 이동해 화면을 우측에 띄워놓고
   
  'URL알림설정 정보 조회' 버튼을 누릅니다.
   
  ![image](https://github.com/HanSol1140/door/assets/121269266/dfe81cc9-77d8-403d-b179-b519f685d981)

  해당 아직 설정된 값이 없기때문에 NO_DATA가 출력됩니다

  'URL알림설정 정보 설정' 버튼을 누릅니다.

  ![image](https://github.com/HanSol1140/door/assets/121269266/e49c60d9-9aaf-479a-93a3-5e2023e494fd)

  콘솔창에 해당 메세지가 출력되고, 다시 'URL알림설정 정보 조회' 버튼을 누르면

  ![image](https://github.com/HanSol1140/door/assets/121269266/f22dd60e-6529-46ad-b029-263193c2b85a)

  더이상 NO_DATA가 아닌 다른 값이 출력되는 것을 볼 수 있습니다.   

  
5. MQTT IP:PORT 설정
   
   ![image](https://github.com/HanSol1140/door/assets/121269266/c7556bad-b33e-4d4d-8a79-5d5a51212b3f)

   사전에 약속된 MQTT Broker주소를 설정해주세요.

6. ESP32
   
   ![image](https://github.com/HanSol1140/door/assets/121269266/db9f16bd-23bd-4903-967a-c91ab64b01e5)
   
   ESP32의 고정IP로 설정된 IP와 PORT를 입력하여주세요.
   여기서는 상단의 설정에 따라 '192.168.0.88:8083'로 설정합니다.

7. 타이머 설정

  ![image](https://github.com/HanSol1140/door/assets/121269266/dc1faa75-8fe9-44d3-b6e4-1393aef88e5f)

  빈칸에 원하는 시간(초)를 입력하고, 설정하고싶은 값에 해당하는 버튼을 누르면 해당 타이머가 설정됩니다.

미 설정시 기본값은
  
  DOOR 입장가능 대기시간 : 30초
  
  DOOR 열려있는 시간 : 15초
  
  라즈베리파이(door)서버에 입장고객 데이터 저장시간 = 14400초(4시간)
  
  승인번호 입력 대기시간 : 30초

지금까지 설정에 문제가 없엇다면 콘솔에 다음과 같이 출력될 것입니다.

![image](https://github.com/HanSol1140/door/assets/121269266/c5b98e63-1c1d-49ca-898e-1305063dd310)


## 10. 서버 실행 테스트하기

터미널을 실행
>cd door
>node server.js

휴대폰을 꺼내 주변 장치에서 휴대폰의 블루투스 장치를 조회할 수 있도록 블루투스를 실행해주세요.

잠시 기다리면 터미널에 블루투스장치의 MAC Address가 조회되는걸 볼 수 있습니다.

iPhone의 경우 설정 - bluetooth로 접속해서 해당 페이지를 실행중이면

주변 장치에서 아이폰의 블루투스 장치를 조회할 수 있습니다.<br>
(페이지를 종료하거나 화면이 꺼지면 조회가 안됩니다)

이제 해당 서버(터미널)를 종료하지 않은 상태로 웹 브라우저를 실행하여 '고정설정한IP:8083'으로 접속해주세요.

저의 경우에는 192.168.0.2으로 설정하여 192.168.0.2:8083으로 접속합니다.

이때, 서버가 실행중이고 같은 WIFI에 접속중인 기기가 있다면

라즈베리파이 외부에서도 192.168.0.2:8083으로 접속하여 설정을 변경할 수 있습니다.

단, 설정을 변경한 후 라즈베리파이를 재시작해주세요.

모든 설정이 끝났다면 마지막으로 서버를 실행한 뒤

웹 브라우저를 실행해
>http://1.212.172.134:8082/nanonix.html?sender=00000000000

해당 주소로 접속합니다.
   
![image](https://github.com/HanSol1140/door/assets/121269266/196e6784-57a5-46a8-8954-0a21eebd4758)

Sender로 시작하는 값이 들어온다면 성공적으로 전화수신시 URL설정이 된것입니다.

<br><br><br>

# 서버 자동실행 설정

nodejs 자동실행을 위한 pm2 설치

터미널을 실행
>sudo npm install -g pm2
>
>npm audit fix
>
>pm2 start /home/nanonix/door/server.js
>
>pm2 startup
>
>여기까지 입력하면 다음 코드가 출력됩니다.
>
>sudo env PATH=$PATH:/home/nanonix/node-v18.16.1-linux-armv7l/bin /sur/local/lib/node_modules/pm2/bin startup systemd -u nanonix --hp /home/nanonix
>
>출력되는 코드를 복사하여 터미널에 입력
>
>pm2 save
>
>재부팅

재부팅후 브라우저를 실행하여 다음 url로 접속
>http://192.168.0.2:8083/api/testvoiceon

서버를 실행하지 않았음에도 음성이 출력된다면 제대로 백그라운드 서버가 실행중인 것입니다. 
```
서버 자동실행 설정 취소하기

pm2 stop server.js
pm2 delete server.js
pm2 unstartup
startup과 똑같이 출력되는 명령어를 터미널에 복사붙여넣기해야합니다.
pm2 save
```

이제 마지막으로 터미널을 실행
>sudo raspi-config
>
>1. System Options
>
>S5 Boot / Auto Login
>
>B2 Console Autologin
>
><확인>
>
>재시작하면 이제 라즈베리파이가 콘솔모드로 시작됩니다.
>
>이 상태에서 서버로 사용하면됩니다.
>
>해당 모드에서 다시 raspi-config으로 desktop 모드로 설정을 변경할 수 잇고
>
>혹은 startx를 입력시 GUI모드로 진입합니다
>
>만약 AMP의 볼륨값을 설정하고 싶다면
>
>GUI모드로 진입하여 볼륨설정을 조절하거나
>
>터미널에 'alsamixer'를 입력하여 볼륨을 조절할 수 있습니다
>
>
<br><br><br>
# GPIO PIN

22번핀과 25번핀은 풀업저항

  22번 PIN guestEnteringSensor 입력핀

    NFC장치 스캔시 가까이 있는 사용자 인식해서 HIGH => LOW로 
    LOW로 변할시 일정 시간 이내로 NFC태그에서 휴대폰으로 전송된 전화번호로 전화를 해야 문이 열림
    일정시간 내로 전화하지않을시 다시 인식시켜야함
  
  27번 PIN blueToothEnteringSensor 입력핀

    입장한 고객의 블루투스 장치가 스캔되고, 블루투스 MAC Address를 서버로 전달
    전달받은 서버에서 해당 값(MAC Address)을 보유하고있다면 (회원이라면)
    bluetoothmac, phonenumber 두 값을 mqtt json형식을 통해 전달
    값을 전달받은 door측 서버(라즈베리파이)는 MemberEnteringTime를 true로 설정하고(일정시간후에 false로 변함)
    일정시간 내로 27번 PIN센서에 감지가 된다면(HIGH => LOW) 문을 개방

  
  25번 PIN DoorState 출력핀(문 열고 닫힘)

    0(LOW)일때 열림
    1(HIGH)일때 닫힘
    

# 1. 블루투스 장치로 스캔하여 입장하기(어플 회원 전용)
```javascript
let options = {
  mode: 'text',
  pythonPath: '/usr/bin/python3', // 여기에 실제 Python 경로를 넣어주세요
  pythonOptions: ['-u'], // unbuffered, 실시간으로 결과를 받기 위해 사용
  scriptPath: '/home/nanonix/door', // 여기에 실제 Python 스크립트 경로를 넣어주세요
};

let pyShell = new PythonShell('./blue.py', options);

pyShell.on('message', function (message) {
  // Python 스크립트에서 print()로 출력한 내용이 message로 전달됩니다.
  console.log(message);
  if (message) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = padZero(currentDate.getMonth() + 1);
    const date = padZero(currentDate.getDate());
    const hours = padZero(currentDate.getHours());
    const mins = padZero(currentDate.getMinutes());

    const newData = {
      timestamp: `${year}-${month}-${date} ${hours}:${mins}`,
      phonenumber: '',
      bluetoothmac: message
    };

    client.publish("mainserver", JSON.stringify(newData));
  }
});

```

해당 코드를 통해 블루투스 장치의 MAC주소를 스캔

MQTT브로커의 'mainserver' 토픽으로 MAC주소(bluetoothmac)를 보냅니다.

서버에서 전달받은 bluetoothmac을 대조하여 회원이 존재한다면

저장된 bluetoothmac - phonenumber값이 있으면 해당 값을 json형식으로 보내줍니다.(회원이 아닐시 무반응)

이후 회원이 해당시간에 입장했다는 것을 서버에 기록합니다.


```javascript
// 보내주실 MQTT 토픽명 = 'door_bluetooth_in', json방식
{
  timestamp: 보내는 당시의 시간
  bluetoothmac: 전달받은 mac주소
  phonenumber: mac주소와 함께 저장된 회원의 휴대폰번호
}
```

해당 양식으로 bluetoothmac, phonenumber값이 라즈베리파이로 전송된다면

전송받은 시간을 기준으로 4시간동안 해당 회원의 번호를 저장하고

문을 일장시간(기본 30초)동안 개방 대기상태(MemberEnteringTime == true)로 변경합니다.

이후 문에 접근센서와 연결된 27번 PIN(blueToothEnteringSensor)이 LOW로 변한다면 문을 개방합니다.

<br><br>

# 2. LGU+ 전화를 통한 문 개방

부착된 NFC태그를 휴대폰으로 읽을 시 휴대폰에 번호가 전송됩니다.

```javascript
guestEnteringSensor.watch((err, value) => {
    if (err) {
        console.log('Error', err);
    }
    if (value == 0) { // 22번핀 기본상태 HIGH에서 감지시 LOW로 변함
        guestDoorTimerOn();
    }
});
```
이때, 22번 핀(guestEnteringSensor)과 연결된 장치로 고객의 입장을 감지(감지시 HIGH => LOW 입력신호)

감지 시 일정시간(기본 30초)동안 문이 개방 대기상태(GuestEnteringTime == true)로 변경되고

이 시간내로 전송된 번호로 전화시 문을 개방합니다.

이때 LGU+ API 설정에 따라 지정된 TCP PORT로 전화한 번호를 수집하여 서버로 전송

서버는 해당 정보를 기록합니다(입장시간, 입장한 고객의 휴대전화번호)

<br><br>

# 3. 번호키 입력을 통한 문 개방
## 매장 비밀번호설정을 통한 입장방법

매장 비밀번호 미설정시 기본 비밀번호 6195

번호키에 6195(변경가능)를 입력시 문 개방

<br>

## 휴대폰 번호 입력을 통한 인증번호 입력방법

번호키에 자신의 휴대폰 번호를 입력하고 #버튼을 누를시

자신의 휴대전화에 인증번호 2자리가 전송됩니다.

인증번호는 일정시간(기본 30초)내로 번호키에 입력하고 #을 눌러서 문을 개방합니다.

문이 개방될때 서버측으로 해당 시간과 입장한 고객의 휴대전화번호를 전송

서버는 해당 정보를 기록합니다.
