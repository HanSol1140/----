#include "HX711.h"
#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h> // 비휘발성 데이터를 저장하기위한 라이브러리
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define DOUT  16 //데이터 핀 <DT>
#define CLK  17 // 클럭 핀 <CLK>
HX711 scale(DOUT, CLK);

IPAddress ip(192, 168, 0, 89);// 고정접속할 IP - 사용중이지 않은 IP여야합니다.
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);

// 접속할 와이파이 / 비밀번호
const char* ssid = "NNX-2.4G";
const char *password = "$@43skshslrtm";

// 접속할 MQTT 주소
const char* mqttServer = "192.168.0.137";
const int mqttPort = 1883;
// loadcell_out 토픽으로 무게값 전송

int serverport =  8083;
WebServer server(serverport);

void handle_root();

float calibration_factor;
float basket = 0.0;
float basketscaleread = 0.0;
int zeroCount = 0; // 10이되면 영점조절
const int averagesize = 10;
float weightValue[averagesize];
float scaleValue[averagesize];
int currentIndex = 0;

float weight;
float weightf;
float currentWeight = 0.0;  // 현재 무게 측정
float currentWeightSum = 0.0;
int currentScale = 0.0;  // 무게 원시값
int currentScaleSum = 0.0;

int zeroscale = 0;
int scaleread = scale.read();
float calibration = 107.2;

// 와이파이 접속
void setWifi(){
  Serial.println("ESP32 WEB Start");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("접속시도중");
    delay(1000);
  }
  Serial.print("Wifi IP: ");
  Serial.print(WiFi.localIP());
  Serial.print(":");
  Serial.println(serverport);
  Serial.println("HTTP server started");
  delay(100); 
}

// MQTT 브로커에 연결
WiFiClient espClient;
PubSubClient client(espClient); // MQTT프로토콜 클래스

void setMQTT(){
  client.setServer(mqttServer, mqttPort);
  // client.setCallback(callback);
  while (!client.connected()) {
    Serial.println("Connecting to MQTT Broker...");
    if (client.connect("ESP32MQTTClient")) {
      Serial.println("Connected to MQTT Broker!");
    }
    else {
      Serial.println("Connection to MQTT Broker failed...");
      delay(1000);
    }
  }
}

void setup() {
  if (!WiFi.config(ip, gateway, subnet)) {
    Serial.println("STA Failed to configure");
  }
  Serial.begin(9600); // 시리얼 통신 초기화(실행), 전송속도 설정;
  setWifi();
  setMQTT();

  EEPROM.begin(4);  
  EEPROM.get(0, basket);
  scale.tare();	//영점잡기. 현재 측정값을 0으로 둔다.
  InitWebServer();

  // 캘리브레이션

  calibration_factor = scaleread/calibration;
  scale.set_scale(calibration_factor); 
  Serial.println(calibration_factor);
  zeroscale = scale.read();
  Serial.println(zeroscale);
  delay(1000);
  zeroscale = scale.read();
  Serial.println(zeroscale);
}

// HTML 페이지
#if 1
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8"><!-- 한글을 출력하기 위한 인코딩설정 -->
  <style>
    button{
        font-weight: bold;
        font-size: 24px;
        padding: 8px;
        border-radius: 12px;
        border: 2px solid #000;
    }
    input{
      font-size: 24px;
      padding: 8px;
      border-radius: 4px;
    }
    section div {
      font-size: 24px;
      font-weight: bold;
      border: 1px solid #000;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 4px;
      width: 200px;
    }
  </style>
</head>

<body>
  <section class="title">
    <h2>ESP32 Load Cell Server</h1>
  </section>

  <script>
    function zeroScale() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/zeroscale", true);
        xhr.send();
    }

    function basketZeroscale(){
        var basketweight = document.getElementById("basketweight").value
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/basketzeroscale?basketweight=" + basketweight, true);
        if(basketweight < 0){
          basketweight = 0.0;
        }
        xhr.send();
    }
    function calibrationControl(){
        var input = document.getElementById("inputValue").value;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/calibrationcontrol?value=" + input, true);
        xhr.send();
    }

    function sendInputValue(){
      var input = document.getElementById("inputValue").value;
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/input?value=" + input, true);
      xhr.send();
    }
  var weight = 0;
  function fetchWeight() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/weight", true);
    xhr.onload = function() {
      if (this.status == 200) {
        var response = JSON.parse(this.responseText);
        document.getElementById("weightDisplay").textContent = response.weight;
        document.getElementById("basketDisplay").textContent = response.basket;
      }
    }
    xhr.send();

  }
  setInterval(fetchWeight, 1000); // 매 1초마다 무게를 업데이트

  function reset() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/reset", true);
    xhr.send();
  }

  </script>
  <section>
    <h2>ESP32 재부팅</h2>
    <p><button onclick="reset()">재부팅</button> </p>
  </section>
  <section>
    <h2>0 잡기</h2>
    <p><button onclick="zeroScale()">현재값을 0으로 조정하기</button> </p>
    <p>
      <input type="number" id="basketweight" placeholder="바스켓의 무게를 등록하여 주세요">
      <button onclick="basketZeroscale()">바스켓 무게 등록</button>
    </p>
  </section>
<!--
  <section>
    <h2>calibration_factor값 재입력하기 </h2>
    <input type="number" id="inputValue" placeholder="전송할 값 입력">
    <button onclick="calibrationControl()">전송</button>
  </section>
-->

  <section>
    <h2>영점 잡기</h2>
    <div>Weight: <span id="weightDisplay"></span>g</div>
    <div>Basket: <span id="basketDisplay"></span>g</div>
  </section>


</body>
</html>
)rawliteral";
#endif

void setZeroScale(){
  Serial.println("수동 영점 잡기");
  scale.tare();
  int cf = scale.read();
  zeroscale = cf - (basket * calibration_factor);
  Serial.print(scale.get_units());
  Serial.print("g");
  Serial.print(" => ");
  Serial.println(scale.read());
  server.send(200, "text/html", index_html);
}

void basketZeroScale(){
    String basketweightS = server.arg("basketweight");
    float basketweightf = basketweightS.toFloat();
    Serial.print("바구니 무게 : ");
    basket = basketweightf;
    Serial.println(basket);
    basketscaleread = scale.read(); // 이 무게를 기준으로 무부하시 무게(원시값)가 0.9이하라면 초기화
    scale.tare();
    EEPROM.put(0, basket);
    EEPROM.commit();
    server.send(200, "text/html", index_html);
}

void calibrationControl() {
  if (server.hasArg("value")) {
    String value = server.arg("value");
    calibration_factor = value.toFloat(); // 문자열 값을 실수로 변환
    scale.set_scale(calibration_factor);
    Serial.print("캘리브레이션 값 조절");
    Serial.println(calibration_factor);
  }
  server.send(200, "text/html", index_html);
}

void handleWeight() {
  if(weight <= 0.1){
    weight = 0;
  }

  String jsonResponse = "{ \"weight\": " + String(weight-basket) + ", \"basket\": " + String(basket) + " }";
  server.send(200, "application/json", jsonResponse);
}

void handleInput() {
  if (server.hasArg("value")) {
    String value = server.arg("value");
    Serial.println("input값 출력");
    Serial.println(value); 
  }
  server.send(200, "text/html", index_html);
}
void reset(){
  ESP.restart();
}

void handle_root(){
  server.send(200, "text/html", index_html);
}

void InitWebServer(){
  server.on("/", handle_root);
  server.on("/zeroscale", HTTP_GET, setZeroScale);
  server.on("/basketzeroscale", HTTP_GET, basketZeroScale);
  server.on("/calibrationcontrol", HTTP_GET, calibrationControl);
  server.on("/input", HTTP_GET, handleInput);
  server.on("/weight", HTTP_GET, handleWeight);
  server.on("/reset", HTTP_GET, reset);
  server.begin();
}

void sendWeightMQTT(){
  // 측정한 무게값 MQTT Broker의 loadcell_out으로 전송
  StaticJsonDocument<200> doc;

  // JSON 오브젝트에 cleaningRobotState 값을 추가
  float roundedWeight = round((weight - basket) * 10.0) / 10.0;
  doc["weight"] = roundedWeight;

  // JSON 형식의 문자열로 변환
  char json[200];
  serializeJson(doc, json);
  // MQTT 브로커에 데이터 전송
  client.publish("mainserver", json);
}

void loop() {
// ──────────────────────────────────────────────────
  //평균 구하기
  // currentWeight = scale.get_units();  // 현재 무게 측정
  // currentWeightSum = 0.0; // 평균무게 구할 값
  // currentScale = scale.read(); // 원시값 무게 측정
  // currentScaleSum = 0.0; // 평균 구할 값

  // for(int i = averagesize - 1; i > 0; i--){
  //   weightValue[i] = weightValue[i-1];
  //   scaleValue[i] = scaleValue[i-1];
  // }
  // weightValue[0] = currentWeight;
  // scaleValue[0] = currentScale;

  // for(int i = 0; i < averagesize; i++){
  //   currentWeightSum += weightValue[i];
  //   currentScaleSum += scaleValue[i];
  // }
  // currentWeight = (currentWeightSum/averagesize);
  // float currentWeightSum = floor(currentWeight * 10)/10;
  // currentScale = (currentScaleSum/averagesize);
// ──────────────────────────────────────────────────
  // //평균 구하기
  currentWeight = scale.get_units();
  currentScale = scale.read();

  float oldWeight = weightValue[currentIndex];
  float oldScale = scaleValue[currentIndex];
  weightValue[currentIndex] = currentWeight;
  scaleValue[currentIndex] = currentScale;

  currentWeightSum = currentWeightSum - oldWeight + currentWeight;
  currentScaleSum = currentScaleSum - oldScale + currentScale;

  currentIndex = (currentIndex + 1) % averagesize;

  currentWeight = currentWeightSum/averagesize;
  currentWeightSum = floor((currentWeightSum/averagesize)*10)/10;
  currentScale = currentScaleSum/averagesize;



// ──────────────────────────────────────────────────
  //변동 캘리브레이션값 구하기
  calibration_factor =  zeroscale / 107.1;
  
  if(currentWeight > 300){
    calibration_factor = zeroscale / 107.8;
  }else if(currentWeight > 200){
    calibration_factor = zeroscale / 107.72;
  }else if(currentWeight > 100){
    calibration_factor = zeroscale / 107.65;
  }else if(currentWeight > 50){
    calibration_factor = zeroscale / 107.51;
  }else if(currentWeight > 30){
    calibration_factor = zeroscale / 107.45;
  }else if(currentWeight > 20){
    calibration_factor =  zeroscale / 107.2;
  }else if(currentWeight > 10){
    calibration_factor =  zeroscale / 107.16;
  }
  weightf = (currentScale - zeroscale)/calibration_factor;
  weight = floor(((currentScale - zeroscale)/calibration_factor)*10)/10;





  Serial.print(weightf-basket);
  Serial.print(" g => ");
  Serial.print(currentScale);
  Serial.print(" : 바구니의 무게 = ");
  Serial.print(basket);
  Serial.print(" 캘리브레이션 값 : ");
  Serial.print(calibration_factor);
  Serial.print(" 영점 값 : ");
  Serial.println(zeroscale);
  


  // 자동 영점잡기
   // 0.2g 이상무게가 10번이상 뜬다면 초기화
  if((weightf-basket) < 0.1 && (weightf-basket) > -0.1){
    currentWeightSum = 0.0f;
  }
  if(zeroCount > 10){
      scale.tare();
      Serial.println("자동 영점 잡기");
      int cf = scale.read();
      zeroscale = cf - (basket * calibration_factor);
    zeroCount = 0;
  }else if((weightf-basket) < -0.1f){
    zeroCount++;
  }else if((weightf-basket) < 1.f && currentWeightSum !=0.0f){
    zeroCount++;
  }else if((weightf-basket) > 1.f){
    zeroCount = 0;
  }
  // 바구니 내림 감지
  if(scale.read() < basketscaleread*0.8){ // 무게가 바구니를 올린 무게의 0. 이하라면 바구니 무게를 초기화 (바구니를 내렸기 때문)
    delay(1000);
    basket = 0.0;
    basketscaleread = 0.0;
    EEPROM.put(0, basket);
    EEPROM.commit();
    scale.tare();
    zeroscale = scale.read();
    Serial.println("바구니 내리기");
  }

  sendWeightMQTT();
  client.loop(); // => MQTT
  server.handleClient();

}