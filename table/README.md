# ESP32 사용방법

<a href="https://velog.io/@songhansol/Arduino-ESP32-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0">아두이노 IDE를 사용한 ESP32 코딩방법</a>

해당 페이지를 참조하여 ESP32에 코드를 업로드합니다.

## ESP32의 SPIFFS 저장공간에 음성파일 업로드하기.

### 아두이노 구버전 설치

먼저 아두이노 IDE 2.0 이전버전을 설치합니다.

<a href="https://www.arduino.cc/en/software">아두이노 다운로드 페이지</a>

![image](https://github.com/HanSol1140/table/assets/121269266/101d55ae-e6f2-43a7-815e-cac9943dc635)

해당 파일을 받아서 설치합니다.


<br>

### ESP32FS 플러그인 설치

<a href="https://github.com/me-no-dev/arduino-esp32fs-plugin/releases/">ESP32FS 플러그인 다운로드</a>

ESP32FS-1.1.zip 버전을 받아서 documnet(내문서) - arduino - tools(해당 폴더를 만들어서) - 여기에 압축해제

Tools - ESP32FS - tool - esp32fs.jar 경로로 파일이 세팅되었다면 완료됩니다.

이후 아두이노를 재실행하면 도구(Tools)에 ESP32 sketch Data Upload 메뉴가 생성됩니다

### 추가보드 관리자 설치

환경설정(기본설정) - 추가 보드 관리자 URL

>https://dl.espressif.com/dl/package_esp32_index.json


<br>

### ESP32 보드 설치 & 세팅

도구 - 보드 -  보드매니저(Ctrl + shift + B) - ESP32 설치

도구 - 보드 - ESP32 Aruduino- Esp32 dev module
    upload Speed 설정
    port 설정 해주기


<br>

### 업로드할 데이터 파일 설정

먼저 빈 스케치 저장을 누른뒤 업로드할 프로젝트 생성

ex) spiffs라는 프로젝트를 생성하면 spiffs.ino(코드파일)이 생김

해당 파일 경로에 data라는 폴더를 생성후 그안에 저장하고싶은 파일을 넣습니다. (1.2MB이내로)

이제 아두이노 IDE로 돌아와서 Tools - ESP32 sketch Data Upload 실행

data 폴더 안에 있는 파일들이 ESP32의 SPIFFS공간으로 업로드됩니다.

만약 비어잇는 폴더를 업로드한다면 이전에 업로드한 파일들도 모두 제거됩니다.

여기까지 실행하였다면 구버전 아두이노 IDE를 사용하지 않아도 됩니다.


<br>

### SPIFFS공간에 파일 업로드가 되었는지 확인
```c
#include "SPIFFS.h"

void setup() {
    Serial.begin(9600);  // 시리얼 포트 초기화

    // Mount SPIFFS
    if (!SPIFFS.begin(true)) {
    Serial.println("An error has occurred while mounting SPIFFS");
    return;
    }

    // List all files
    File root = SPIFFS.open("/");
    File file = root.openNextFile();

    while (file) {
    Serial.print("File: ");
    Serial.println(file.name()); // Print file name
    file = root.openNextFile();
    }
}

void loop() {
    // put your main code here, to run repeatedly:
}
```

이제 해당 코드를 ESP32에 업로드한 후 시리얼 모니터에 업로드된 파일명이 모두 출력됩니다.

시리얼 모니터를 실행하지 않은 상태로 업로드가 완료되면 ESP32가 부팅될때 파일명이 단 한번 시리얼 모니터로 출력되니 

확인을 못했다면 ESP32를 재부팅하거나 시리얼 모니터를 실행한채로 업로드해주세요.

<br>


<br><br><br>

## ESP32에 테이블 코드 업로드하기

### 라이브러리 설치

![image](https://github.com/HanSol1140/table/assets/121269266/cff36c0f-5f2a-47af-b40c-50e700446fda)

라이브러리 매니저를 실행해서 MQTT통신을 위한 PubSubClient 라이브러리를 다운받습니다.

<br>

![image](https://github.com/HanSol1140/table/assets/121269266/1cb8774e-7534-4a25-aa3f-bbc008d92699)

MQTT통신을 할 때 JSON으로 통신을 하기위한 Arduinojson 라이브러리를 설치합니다.

<br><br>

## ESP32 고정IP 설정하기

![image](https://github.com/HanSol1140/20230721table/assets/121269266/f348bda4-d839-4a01-8691-97d05a1040ae)

코드의 상단 해당 부분을 수정해서 통해 고정할 IP 주소 / 접속할 MQTT Broker 주소 / 접속할 WIFi를 설정해줍니다.

코드의 기본 상태는  고정IP 설정이 주석처리되어 않습니다. (자동으로 IP가 할당됩니다.)

접속할 MQTT BroKer주소와 접속할 와이파이/와이파이 비밀번호를 설정해주세요.

### 방법 1

공유기 설정을 통해 IP를 설정할 수 있습니다.

여러대의 테이블이 한번에 들어오면 

인터넷창을 켜서 192.168.0.1 공유기 관리자 페이지로 접속(공유기에 따라 관리자 페이지의 접속방법이 다를 수 있습니다)

공유기의 관리자 페이지로 접속하여 DHCP 설정으로 이동

자신이 접속한 ip에 해당하는 기기를 찾아 IP를 수동으로 설정해주세요.

코드 업로드 후 ESP32 부팅시 시리얼 모니터를 통해 접속한 IP주소를 확인할 수 있습니다.

<a href="https://m.blog.naver.com/siot__/221911877118">참고 블로그</a>

이후 기기를 재부팅하면 ip가 설정한 ip로 변경된 것을 볼 수 있습니다.

※ 설정 후 일정시간이 지나야 IP가 변경됩니다.

<br>

### 방법 2

![image](https://github.com/HanSol1140/20230721table/assets/121269266/a399cb89-74b3-42de-a107-3d395b8efa45)
코드에 해당 주석처리된 부분의 주석을 해제합니다.

설정값을 접속할 IP에 맞게 설정해줍니다.


※ 주의

    수동 설정 후 바로 변경되는것이 아니라 일정시간이(10분  이내) 지나야 설정이 됩니다.    
    
    ESP32로 WIFI에 접속한적이 있어야 관리자페이지에서 해당기기를 확인할 수 있습니다.
    
<br>

### 코드 업로드

 git에 올라온 'Table_Touch_Kiosk_HanSol_final'의 코드를 ESP32에 업로드해주세요


# GPIO

```c
// Pins for I2S
#define I2S_BCLK_PIN 26
#define I2S_LRCLK_PIN 25
#define I2S_DATA_PIN 16

// 로봇 호출(17) / 호출취소(18) /
//(input)
#define callCleanBot 17
#define callCleanBotCancel 18

// 키오스크상승(19) / 키오스크 하강(21) / 키오스크 정지(23)
// (input)
#define kioskUp 19
#define kioskDown 21
#define kioskStop 22

// Lift 키오스크 정지(12) / Lift 키오스크 하강(13) / Lift 키오스크 상승(14)
// (output)
#define liftKioskUp 14
#define liftKioskDown 13
#define liftKioskStop 12

// 키오스크 상승 / 하강 감지
#define checkUp 2
#define checkDown 4
```

26, 25 16번핀은 단순 스피커 연결핀입니다.

<br>

모든 핀은 풀업저항(미입력시 HIGH)상태 입니다.




17번 핀 callCleanBot

    해당 버튼을 3초간 누르고 있을 시 로봇 호출이 됩니다.
    
    호출이 됬을시 지정된 MQTT브로커의 mainserver 토픽으로
    
    서버에 json형식 데이터 cleaningRobotState : true를 전송합니다.(서버에 호출됬다고 알림)
    

    그리고 기기의 호출 상태를 cleaningRobotState = true로 변경합니다.

<br>

18번 핀 callCleanBotCancel

    해당 버튼을 눌렀을때, cleaningRobotState == true라면 로봇호출을 취소합니다.

    서버에 json형식 데이터 cleaningRobotState : false를 전송합니다.(서버에 호출취소 알림) 

    그리고 기기의 호출 상태를 cleaningRobotState = false로 변경합니다

<br>

19번 핀 kioskUp(키오스크 상승버튼)

    키오스크 상승 버튼
    
    버튼을 눌렀을때 2번 핀(checkUp)과 4번 핀(checkDown)을 감지하여 동작을 수행합니다.
    
    키오스크 상승 =  14번 핀 liftKioskUp에 출력을 펄스로 줍니다 => 기본 HIGH => 입력시 LOW후 다시 HIGH로 변경
    
    1. 2번핀이 입력상태(LOW)라면 이미 키오스크가 올라와 있으므로 이미 키오스크가 올라와 있다는 경고메세지 출력

    2. 4번핀이 입력상태(LOW)라면 키오스크가 내려가 있으므로, 경고메세지를 출력 후 키오스크를 상승시킵니다.

    3. 2번핀과 4번핀이 모두 입력상태가 아니라면
       
       키오스크가 상승과 하강사이(중간)에 있으므로 일시 정지하고 stopState = true;로 변경합니다

    4. 이후 2번핀과 4번핀이 모두 HIGH고 stopState = true;라면 키오스크가 중간에 정지 되어있으므로
    
       상승/하강중 입력된 버튼에 따라 동작을 수행합니다

<br>

21번 핀 kioskDown

    키오스크 하강 버튼
    
    버튼을 눌렀을때 2번 핀(checkUp)과 4번 핀(checkDown)을 감지하여 동작을 수행합니다.
    
    키오스크 하강 =  13번 핀 liftKioskUp에 출력을 펄스로 줍니다 => 기본 HIGH => 입력시 LOW후 다시 HIGH로 변경

    1. 4번핀이 입력상태(LOW)라면 이미 키오스크가 올라와 있으므로 이미 키오스크가 올라와 있다는 경고메세지 출력

    2. 2번핀이 입력상태(LOW)라면 키오스크가 내려가 있으므로, 경고메세지를 출력 후 키오스크를 상승시킵니다.

    3. 2번핀과 4번핀이 모두 입력상태가 아니라면
       
       키오스크가 상승과 하강사이(중간)에 있으므로 일시 정지하고 stopState = true;로 변경합니다

    4. 이후 2번핀과 4번핀이 모두 HIGH고 stopState = true;라면 키오스크가 중간에 정지 되어있으므로
    
       상승/하강중 입력된 버튼에 따라 동작을 수행합니다

<br>

22번 핀 kioskStop

    일시 정지 버튼
    
    버튼을 눌럿을 때 
    
    12번 핀 liftKioskStop 에 출력을 펄스로 줍니다 => 기본 HIGH => 입력시 LOW후 다시 HIGH로 변경


<br>

## 키오스크 상승 대기타이머 설정

![image](https://github.com/HanSol1140/table/assets/121269266/79499a2a-3d8a-4ace-a947-6d337e738a3e)

이렇게 ESP32가 실행된걸 확인했다면 브라우저를 실행해 출력된 IP:PORT로 접속해주세요.

![image](https://github.com/HanSol1140/table/assets/121269266/d765bab8-cc40-4f47-97b8-b3ab115dbd81)

키오스크 상승전 대기시간을 설정할 수 있습니다.
<br><br><br>
# ----------------------------------------------------------------
# ----------------------------------------------------------------
<br><br><br>


# 라즈베리파이로 사용하기

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
>git clone https://github.com/HanSol1140/table.git

git을 복제합니다
문제없이 복제 됬다면 /home/사용자명/table 폴더가 생성됬을 것입니다.

터미널을 다시 실행
>cd door
>
>npm i

<br>

## 7. 설정

![image](https://github.com/HanSol1140/table/assets/121269266/b31ff614-fc0c-4756-877b-8b2820a3b6e0)

서버를 실행후 

사전 설정으로 해당 기기에 고정한 IP:8084로 접속하여 타이머를 설정할 수 잇습니다.

해당 미설정시 기본값은 5000(5초)입니다.


<br><br>



# 서버 자동실행 설정

nodejs 자동실행을 위한 pm2 설치

터미널을 실행
>sudo npm install -g pm2
>
>npm audit fix
>
>pm2 start /home/nanonix/table/server.js
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



<br><br><br>



# GPIO 설명

```javascript
// 핀 설정
// 로봇 호출 / 호출취소 버튼
const callCleanBotBtn = new Gpio(23, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const callCleanbotCancleBtn = new Gpio(24, 'in', 'both', { debounceTimeout: 100, activeLow: false });

// 키오스크 상승/하강 감지센서
const checkUpState = new Gpio(5, 'in', 'none', { debounceTimeout: 100, activeLow: false });
const checkDownState = new Gpio(6, 'in', 'none', { debounceTimeout: 100, activeLow: false });

// 키오스크 상승/ 하강/ 정지 버튼
const kioskUpBtn = new Gpio(17, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const kioskDownBtn = new Gpio(27, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const kioskStopBtn = new Gpio(22, 'in', 'both', { debounceTimeout: 100, activeLow: false });

// 키오스크 상승 / 하강/ 정지 출력(펄스)
const kioskUpPower = new Gpio(16, 'out');
const kioskDownPower = new Gpio(26, 'out');
const kioskStopPower = new Gpio(20, 'out');

kioskUpPower.writeSync(1);
kioskDownPower.writeSync(1);
kioskStopPower.writeSync(1);
```
모든 버튼은 풀업저항입니다. 기본상태 HIGH(1)

GPIO 23 PIN : 로봇 호출 버튼<br>
GPIO 24 PIN : 로봇 호출 취소 버튼

GPIO 5 PIN : 테이블이 끝까지 상승했다면 LOW(0)<br>
GPIO 6 PIN : 테이블이 끝까지 하강했다면 LOW(0)

GPIO 17 PIN : 버튼을 누를시 테이블 상승<br>
GPIO 27 PIN : 버튼을 누를 시 테이블 하강<br>
GPIO 22 PIN : 버튼을 누를시 일시 정지

GPIO 16 PIN : 22번 PIN 눌릴시 LOW - HIGH로 변함<br>
GPIO 26 PIN : 27번 PIN 눌릴시 LOW - HIGH로 변함<br>
GPIO 20 PIN : 22번 PIN 눌릴시 LOW - HIGH로 변함


# 로봇 호출 / 취소
```javascript
// 로봇 호출
callCleanBotBtn.watch((err, value) => {
    if (err) {
        console.log('청소봇 호출 Error', err);
    }
    if (value == 0) {
        if (cleaningBotState == false) {
            console.log("로봇 호출");
            callCleaningBotBtnPressed = true;
            clearTimeout(callCleanBotBtnTimeout);
            
            callCleanBotBtnTimeout = setTimeout(() => {
                
                if(callCleaningBotBtnPressed == true){
                    // 호출이 되었습니다.
                    playWav("callcleaningbot")
                    cleaningBotState = true;
                    var message = {
                        cleaningBotState: "true"
                    }
                    client.publish('mainserver', JSON.stringify(message));
                }else{
                    console.log("버튼이 3초간 눌리지 않았습니다");
                }

            }, 3000);
        } else {
            console.log("로봇이 이미 호출중입니다.");
        }
    } else {
        console.log("!!!");
        callCleaningBotBtnPressed = false;
        clearTimeout(callCleanBotBtnTimeout);
    }    
});

// 로봇 호출 취소
callCleanbotCancleBtn.watch((err, value) => {
    if (err) {
        console.log('청소봇 호출 취소 Error', err);
    }
    if (value == 0) {
        if (cleaningBotState == true) {
            console.log("호출을 취소합니다.");
            playWav("canclecallcleaningbot");
            var message = {
                cleaningBotState: "false"
            }
            client.publish('mainserver', JSON.stringify(message));
        } else {
            console.log("호출중이 아닙니다.")
        }
    }
});
```
GPIO 23번 핀(callCleanBotBtn)에 로봇 호출 버튼,
GPIO 24번 핀(callCleanbotCancleBtn)에 로봇 호출 취소 버튼을 연결합니다.


## 호출

호출 버튼을 3초간 누를시 청소봇이 호출됩니다.(cleaningBotState = true)

```javascript
// 호출 되었다는 신호를 서버에 전달
var message = {
    cleaningBotState: "true"
}
client.publish('mainserver', JSON.stringify(message));
```

서버에 'mainserver' 토픽으로 cleaningBotState : "true"를 전달합니다.

3초 이전에 손을 놓을시 호출이 취소됩니다.
로봇이 이미 호출중이라면 반응없음


<br>

## 호출 취소

로봇이 호출 된 상태일때(cleaningBotState = true) 취소 버튼을 누르면 
```javascript
cleaningBotState = false;
var message = {
    cleaningBotState: "false"
}
client.publish('mainserver', JSON.stringify(message));
```
cleaningBotState = true를 통해 로봇의 호출상태를 false(미호출)로 설정하고
서버에 호출이 취소되었다는 신호를 보냅니다.

<br>

# 키오스크 상승/하강/정지

## 키오스크 상승

```javascript
kioskUpBtn.watch((err, value) => {
    if (err) {
        console.log('키오스크 상승 Error', err);
    }
    if(value == 0){
        if (checkDownState.readSync() == 0) {
            // 경고메세지 출력, 음성메세지 변경해야합니다,
            playWav("kioskupalert");
            setTimeout(() => { // 메세지를 출력하고 5초뒤에 움직임 => 상승만 경고메세지 출력
                kioskUpPower.writeSync(0);
                setTimeout(() => {
                    kioskUpPower.writeSync(1);
                }, 100);
            }, 3000);
        } else if (checkUpState.readSync() == 0) {
            console.log("키오스크가 이미 상승한 상태입니다");
            playWav("alreadykioskup");
        } else if(stopState == true){
            kioskUpPower.writeSync(0);
            setTimeout(() => {
                kioskUpPower.writeSync(1);
            }, 100);
            stopState = false;
        } else{
            console.log("키오스크가 이동중입니다.");
            playWav("kioskmoving");
            kioskStopPower.writeSync(0);
            setTimeout(() => {
                kioskStopPower.writeSync(1);
            }, 100);
            stopState = true;
        };
    }
});
```

GPIO 17 PIN(kioskUpBtn)이 눌린다면(테이블 상승 버튼)

    checkDownState(GPIO 6) = LOW일때 (테이블이 하강한 상태)

    경고 메세지를 출력후 5초후에 테이블을 상승시킵니다.



    checkUpState(GPIO 5) = LOW일때 (테이블이 이미 올라간 상태)

    테이블이 이미 올라간 상태임을 알려주는 음성메세지 출력



    checkDownState(GPIO 6) / checkUpState(GPIO 5)가 둘다 HIGH일때

    키오스크가 이동중이라는 음성을 출력하고 키오스크를 일시 정지 시킵니다.

    이때 stopState = true로 키오스크가 중간에 멈췃음을 선언하고

    다시 버튼(상승,하강)을 누를시 
```javascript
else if(stopState == true){
    kioskUpPower.writeSync(0);
    setTimeout(() => {
        kioskUpPower.writeSync(1);
    }, 100);
    stopState = false;
}
```
해당 로직에 의해 상승/하강이 재실행됩니다.


<br>

## 키오스크 하강

```javascript
kioskDownBtn.watch((err, value) => {
    if (err) {
        console.log('키오스크 상승 Error', err);
    }
    if(value == 0){
        if (checkUpState.readSync() == 0) {
            // 경고메세지 출력, 음성메세지 변경해야합니다,
            playWav("kioskupalert");
            setTimeout(() => { // 메세지를 출력하고 5초뒤에 움직임 => 상승만 경고메세지 출력
                kioskDownPower.writeSync(0);
                setTimeout(() => {
                    kioskDownPower.writeSync(1);
                }, 100);
            }, 2000);
        } else if (checkDownState.readSync() == 0) {
            console.log("키오스크가 이미 하강 상태입니다");
            playWav("alreadykioskdown");
        } else if(stopState == true){
            kioskDownPower.writeSync(0);
            setTimeout(() => {
                kioskDownPower.writeSync(1);
            }, 100);
            stopState = false;
        } else{
            console.log("키오스크가 이동중입니다.");
            playWav("kioskmoving");
            kioskStopPower.writeSync(0);
            setTimeout(() => {
                kioskStopPower.writeSync(1);
            }, 100);
            stopState = true;
        };
    }
});
```

GPIO 27 PIN(kioskDownBtn)이 눌린다면(테이블 하강 버튼)

    checkUpState(GPIO 5) = LOW일때 (테이블이 하강한 상태)

    테이블을 바로 하강시킵니다.



    checkDownState(GPIO 6) = LOW일때 (테이블이 이미 내려간 상태)

    테이블이 이미 내려간 상태임을 알려주는 음성메세지 출력



    checkDownState(GPIO 6) / checkUpState(GPIO 5)가 둘다 HIGH일때

    키오스크가 이동중이라는 음성을 출력하고 키오스크를 일시 정지 시킵니다.

    이때 stopState = true로 키오스크가 중간에 멈췃음을 선언하고

    다시 버튼(상승,하강)을 누를시

```javascript
else if(stopState == true){
    kioskUpPower.writeSync(0);
    setTimeout(() => {
        kioskUpPower.writeSync(1);
    }, 100);
    stopState = false;
}
```
해당 로직에 의해 상승/하강이 재실행됩니다.


<br>

## 키오스크 정지
```javascript
kioskStopBtn.watch((err, value) => {
    if (err) {
        console.log('키오스크 정지 Error', err);
    }
    if (value == 0) {
        console.log("키오스크 정지");
        kioskStopPower.writeSync(0);
        setTimeout(() => {
            kioskStopPower.writeSync(1);
        }, 100);
    }
});
```
GPIO 22 PIN(kioskStopBtn)이 눌렸을때 
GPIO 20 PIN(kioskStopPower)을 일시적으로 LOW로 만든뒤 다시 HIGH로 만듭니다.(펄스)
