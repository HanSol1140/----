# ESP32를 이용한 로드셀 무게 측정

## Aruduiono ESP32에 코드를 업로드

<a href="https://velog.io/@songhansol/Arduino-ESP32-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0">아두이노 IDE를 사용한 ESP32 코딩방법</a>

해당 페이지를 참조하여 ESP32에 코드를 업로드합니다.

## 라이브러리 설치

### HX711 라이브러리 설치

<a href="http://lhdangerous.godohosting.com/wiki/index.php/%ED%8C%8C%EC%9D%BC:HX711.zip">HX711 라이브러리 다운로드</a>

해당 파일을 받은 후 

![image](https://github.com/HanSol1140/loadcell/assets/121269266/29ab4b7c-f23b-4d62-a038-88265ad13693)

.zip 라이브러리 추가를 해줍니다.

### Arduinojson / PubSubClient 라이브러리 설치

![image](https://github.com/HanSol1140/loadcell/assets/121269266/f70df1bf-92b2-4c0a-9820-ad535e940411)

라이브러리 매니저를 실행(Ctrl + Shift + I)
>Arduinojson
>
>PubSubClient

두 라이브러리를 검색하여 설치합니다.

# 코드 업로드

git에 올라온 'loadcell_HanSol_final.ino'파일의 코드를 ESP32에 업로드합니다.

![image](https://github.com/HanSol1140/loadcell/assets/121269266/f9abbb43-018f-4d83-8455-5b922835c75e)

코드의 상단 해당 부분을 수정해서 통해 IP 주소 / MQTT Broker 주소 / 접속할 WIFi를 설정해줍니다.

혹은

![image](https://github.com/HanSol1140/20230721loadcell/assets/121269266/f8792513-6dd2-4251-9cc0-03b272cbfccc)

해당 부분을 주석처리하여 공유기 설정을 통한 포트포워딩을 통해 IP를 설정할 수 있습니다.

# 사용방법

ESP32가 실행되면 웹브라우저를 실행해 설정한주소(예제에서는 192.168.0.89:8083)로 접속합니다.

![image](https://github.com/HanSol1140/loadcell/assets/121269266/f5cbe997-8c8a-4783-bb7f-5c0e8c67d9b2)

재부팅 버튼 : 수동으로 로드셀을 재시작하기 위한 버튼입니다. 무게가 제대로 측정되지 않는다면 눌러주세요.

현재 값을 0으로 조정하기 : 로드셀의 무게가 0으로 돌아가지 않는다면 눌러주세요.

바스켓 무게 등록 : 로드셀에 올라간 바스켓의 무게를 올린 후 측정하여 측정된 무게값을 기입하여주세요.

바구니를 내릴시 사라진 바구니 무게를 측정하여 바구니무게를 0으로 설정합니다.

측정된 무게는 설정된 MQTT Broker를 통해 mainserver 토픽으로 'weight: 무게'와 같이 json형식으로 전송됩니다.

![image](https://github.com/HanSol1140/loadcell/assets/121269266/11aa8107-e589-4562-90a7-5c301526b561)
