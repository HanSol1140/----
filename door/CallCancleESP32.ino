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