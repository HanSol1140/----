#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
// 스피커
#include <FS.h>
#include <SPIFFS.h>
#include "driver/i2s.h"
// 비 휘발성 데이터 저장
#include <EEPROM.h>

#define READ_BUF_LEN (64 * 1024)

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

bool stopState = false;

// 스피커
struct WAVHeader
{
    uint32_t sampleRate;
    uint16_t numChannels;
    uint16_t bitsPerSample;
};

bool readWAVHeader(File &file, WAVHeader &header)
{
    file.seek(22);
    if (file.read((uint8_t *)&header.numChannels, sizeof(header.numChannels)) != sizeof(header.numChannels))
        return false;

    if (file.read((uint8_t *)&header.sampleRate, sizeof(header.sampleRate)) != sizeof(header.sampleRate))
        return false;

    file.seek(34);
    if (file.read((uint8_t *)&header.bitsPerSample, sizeof(header.bitsPerSample)) != sizeof(header.bitsPerSample))
        return false;

    file.seek(44);
    return true;
}

void playWav(const char *fileName)
{
    String filePath = "/" + String(fileName) + ".wav";

    // Open file
    File file = SPIFFS.open(filePath);
    if (!file)
    {
        Serial.println("Failed to open file for reading");
        return;
    }

    // Read WAV header
    WAVHeader header;
    if (!readWAVHeader(file, header))
    {
        Serial.println("Failed to read WAV header");
        return;
    }

    // Setup I2S
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = header.sampleRate,
        .bits_per_sample = header.bitsPerSample == 16 ? I2S_BITS_PER_SAMPLE_16BIT : I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = header.numChannels == 1 ? I2S_CHANNEL_FMT_ONLY_RIGHT : I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = (i2s_comm_format_t)(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
        .intr_alloc_flags = 0,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0};

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK_PIN,
        .ws_io_num = I2S_LRCLK_PIN,
        .data_out_num = I2S_DATA_PIN,
        .data_in_num = I2S_PIN_NO_CHANGE};

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
    i2s_set_clk(I2S_NUM_0, header.sampleRate, (i2s_bits_per_sample_t)header.bitsPerSample, (i2s_channel_t)header.numChannels);

    // Buffer for data
    uint8_t *buffer = (uint8_t *)malloc(READ_BUF_LEN);

    // Read data and write to I2S
    while (file.available())
    {
        int read = file.read(buffer, READ_BUF_LEN);
        if (read > 0)
        {
            size_t written = 0;
            i2s_write(I2S_NUM_0, buffer, read, &written, portMAX_DELAY);
        }
    }

    // Close file
    file.close();

    // Free buffer
    free(buffer);

    // Uninstall I2S driver after playing sound
    i2s_driver_uninstall(I2S_NUM_0);
}

// Timer

int timer = 5000;

// 로봇 상태변화 감지
bool cleaningRobotState = false;

// SSID & Password
const char *ssid = "NNX-2.4G";
const char *password = "$@43skshslrtm";
const char *mqttServer = "192.168.0.137";
const int mqttPort = 1883;

// 고정 IP 설정
// IPAddress ip(192, 168, 0, 2);
// IPAddress gateway(192, 168, 0, 1);
// IPAddress subnet(255, 255, 255, 0);

int port = 8083;
WebServer server(port); // Object of WebServer(HTTP port, 80 is defult)

WiFiClient espClient;
PubSubClient client(espClient);

void handle_root();
// HTML 페이지
#if 1
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8"><!-- 한글을 출력하기 위한 인코딩설정 -->
    <style>
        *{
            margin:0 auto;
            padding:0;
        }
        h2{
            /* background: linear-gradient(to right, #51ebff, #3b6cd4); */
            background-color: #ccc;
            font-weight: bold;
            padding:8px;
            border-radius: 8px;
            margin: 10px;
        }
        div{
            margin-left: 20px;
        }
        button{
            font-size: 20px;
            font-weight: bold;
            padding: 4px;
            border: 2px solid black;
            margin-bottom: 4px;
            border-radius: 4px;
        }
        input{
            font-size: 20px;
            font-weight: 400;
            padding: 4px;
            margin-bottom: 4px;
            margin-right: 12px;
            border-radius: 4px;
        } 
    </style>

    <script>
        function setTimer(num){
        var timer = document.getElementById("timer").value;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/settimer?timer=" + timer, true);
        xhr.send();
        }
    </script>

</head>

<body>
    <section class="title">
        <h2>ESP32 TABLE Web Server</h1>
    </section>



    <h2>타이머 설정</h2>
    <div>
       <input type="number" id="timer" value="0" min="0" max="60" placeholder="1000 = 1초"/>
        <button onclick="setTimer(1)">테이블 상승 대기시간 설정</button><br>
    </div>


</body>
</html>
)rawliteral";
#endif

//---------------------------------------------------------------
// 페이지 요청이 들어 오면 처리 하는 함수
void handle_root()
{
    server.send(200, "text/html", index_html);
}
//---------------------------------------------------------------
// HTML 조작 함수
void setTimerTime()
{
    String secStr = server.arg("timer");
    Serial.println(secStr);
    timer = secStr.toInt();
    EEPROM.put(0, timer);
    EEPROM.commit();
    Serial.print("타이머 시간설정 - ");
    Serial.println(timer);
    server.send(200, "text/html", index_html);
}

void InitWebServer()
{
    server.on("/", handle_root);
    server.on("/settimer", HTTP_GET, setTimerTime);
    server.begin();
}

long pressDuration(int button, unsigned long duration)
{
    long startTime = millis();
    while (digitalRead(button) == LOW)
    { // duration뒤에 버튼 상태가 LOW라면
        if (millis() - startTime >= duration)
        {
            return 1;
        }
    }
    return 0;
}

// MQTT JSON 포맷으로 데이터 전송하기
void sendMqttJson()
{
    StaticJsonDocument<200> doc;
    // JSON 오브젝트에 cleaningRobotState 값을 추가
    doc["cleaningRobotState"] = true;
    // JSON 형식의 문자열로 변환
    char json[200];
    serializeJson(doc, json);
    // MQTT 브로커에 데이터 전송
    client.publish("mainserver", json);
}
//---------------------------------------------------------------

void setup()
{
    // 시리얼 통신 초기화(실행), 전송속도 설정
    Serial.begin(9600);
    EEPROM.begin(16); // EEPROM에 12바이트 할당
    EEPROM.get(0, timer);
    Serial.print("타이머 시간 : ");
    Serial.println(timer);
    // WIFI 접속
    setup_wifi();
    InitWebServer();
    Serial.println("HTTP server started");
    delay(100);

    // MQTT 브로커 접속
    client.setServer(mqttServer, mqttPort);
    client.setCallback(mqttCallback);
    setup_mqtt();
    delay(100);

    // BTN
    pinMode(callCleanBot, INPUT_PULLUP);
    pinMode(callCleanBotCancel, INPUT_PULLUP);
    pinMode(kioskUp, INPUT_PULLUP);
    pinMode(kioskDown, INPUT_PULLUP);
    pinMode(kioskStop, INPUT_PULLUP);

    // OUTPUT
    pinMode(liftKioskUp, OUTPUT);
    digitalWrite(liftKioskUp, HIGH);
    pinMode(liftKioskDown, OUTPUT);
    digitalWrite(liftKioskDown, HIGH);
    pinMode(liftKioskStop, OUTPUT);
    digitalWrite(liftKioskStop, HIGH);

    // 상승 / 하강 체크
    pinMode(checkUp, INPUT_PULLUP);
    pinMode(checkDown, INPUT_PULLUP);

    // Initialize SPIFFS
    if (!SPIFFS.begin())
    {
        Serial.println("Failed to mount file system");
        return;
    }
}

// ────────────────────────────────────────────────────────────────────────────────
//  cleaningRobotState = false = 기본상태 - 미호출중
void loop()
{
    server.handleClient();
    client.loop();

    // ────────────────────────────────────────────────────────────────────────────────
    //  로봇 호출 / 취소
    //  호출 상태 수신 => 서버에서 호출이 종료되었다는 답을 받아서 호출상태를 변경해야합니다.

    // 호출 상태 체크
    if(!digitalRead(callCleanBot) && cleaningRobotState == false){
        // 3초간 버튼이 눌릴 때까지 대기
        long pressTime = pressDuration(callCleanBot, 3000);
        if (pressTime == 0) {
            Serial.println("호출 버튼이 3초간 눌리지 않았습니다.");
            return;
        }
        playWav("callcleaningbot");
        Serial.println("호출 완료 청소봇을 불러옵니다.");
        // 서버에 로봇 호출 명령을 전달합니다.
        sendMqttJson();
        // client.publish("TOPIC NAME", "MQTT LOBOT CALL");
        cleaningRobotState = true; // 호출 상태

    }else if(!digitalRead(callCleanBot) && cleaningRobotState == true){
        Serial.println("이미 호출중입니다.");
    }
    // 호출 취소
    if(!digitalRead(callCleanBotCancel) && cleaningRobotState == true){
        Serial.println("청소봇 호출을 취소합니다.");
        playWav("canclecallcleaningbot");
        cleaningRobotState = false; // 호출 상태
        return;
    }

    // 키오스크 정지
    if (digitalRead(kioskStop) == LOW)
    {
        digitalWrite(liftKioskStop, HIGH);
        delay(100);
        digitalWrite(liftKioskStop, LOW);
    }

    // 키오스크 상승
    if (digitalRead(kioskUp) == LOW && digitalRead(checkDown) == LOW)
    {
        // 경고 음성 출력
        Serial.println("키오스크 상승");
        playWav("kioskupalert");
        delay(5000); // 상승만 경고출력후 대기시간다음에 상승
        digitalWrite(liftKioskUp, LOW);
        delay(100);
        digitalWrite(liftKioskUp, HIGH);
    }
    else if (digitalRead(kioskUp) == LOW && digitalRead(checkUp) == LOW)
    {
        Serial.println("키오스크가 이미 상승한 상태입니다.");
        playWav("alreadykioskup");
    }
    else if (digitalRead(kioskUp) == LOW && stopState == true)
    {
        Serial.println("키오스크 상승");
        playWav("kioskupalert");
        digitalWrite(liftKioskUp, LOW);
        delay(100);
        digitalWrite(liftKioskUp, HIGH);
        stopState = false;
    }
    else if (digitalRead(kioskUp) == LOW && digitalRead(checkUp) == HIGH && digitalRead(checkDown) == HIGH)
    {
        digitalWrite(liftKioskStop, HIGH);
        delay(100);
        digitalWrite(liftKioskStop, LOW);
        stopState = true;
        Serial.println("키오스크가 이동중입니다.");
        playWav("kioskmoving");
    }

    // 키오스크 하강 버튼 입력
    if (digitalRead(kioskDown) == LOW && digitalRead(checkUp) == LOW)
    {
        // 경고음성 출력
        Serial.println("키오스크 하강");
        playWav("kioskdown");
        digitalWrite(liftKioskDown, LOW);
        delay(100);
        digitalWrite(liftKioskDown, HIGH);
    }
    else if (digitalRead(kioskDown) == LOW && digitalRead(checkDown) == LOW)
    {
        Serial.println("키오스크가 이미 하강한 상태입니다.");
        playWav("alreadykioskdown");
    }
    else if (digitalRead(kioskDown) == LOW && stopState == true)
    {
        Serial.println("키오스크 하강");
        playWav("kioskdown");
        digitalWrite(liftKioskDown, LOW);
        delay(100);
        digitalWrite(liftKioskDown, HIGH);
        stopState = false;
    }
    else if (digitalRead(kioskDown) == LOW && digitalRead(checkUp) == HIGH && digitalRead(checkDown) == HIGH)
    {
        digitalWrite(liftKioskStop, LOW);
        delay(100);
        digitalWrite(liftKioskStop, HIGH);
        stopState = true;
        Serial.println("키오스크가 이동중입니다.");
        playWav("kioskmoving");
    }
}

// 와이파이 접속
void setup_wifi()
{

    // 고정 IP 설정
    // if (!WiFi.config(ip, gateway, subnet))
    // {
    //     Serial.prindtln("STA Failed to configure");
    // // }

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
    Serial.print("PORT address: ");
    Serial.println(port);
}

// MQTT 수신 콜백 함수
// void mqttCallback(char *topic, byte *payload, unsigned int length){
//     Serial.print("메시지 도착 [");
//     Serial.print(topic);
//     Serial.print("] ");
//     for (int i = 0; i < length; i++){
//         Serial.print((char)payload[i]);
//     }
//     Serial.println();
// }

// MQTT JSON 받기
void mqttCallback(char *topic, byte *payload, unsigned int length){
    Serial.print("Topic Name [");
    Serial.print(topic);
    Serial.println("]");

    char json[length + 1];
    for (int i = 0; i < length; i++){
        json[i] = (char)payload[i];
    }
    json[length] = '\0';
    Serial.println(json);
    
    // Parse JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, json);

    if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
    }

    // Extract values
    bool cleaningRobotState = doc["cleaningRobotState"];

    if (cleaningRobotState == false){
        cleaningRobotState = false;
        Serial.println("청소봇 호출 끝");
    }
}




// MQTT 재접속
void setup_mqtt()
{
    while (!client.connected())
    {
        if (client.connect("ESP32MQTTBrokerClient"))
        {
            Serial.println("MQTT 브로커에 연결됨");
            client.subscribe("table_in");
        }
        else
        {
            Serial.print("MQTT 브로커 연결 실패, 상태코드: rc =  ");
            Serial.print(client.state());
            Serial.println(" 3초 후 재시도...");
            delay(3000);
        }
    }
}
