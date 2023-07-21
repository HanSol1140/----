// server.js
const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
app.use(cors()); // 모든 도메인에서의 요청 허용
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.redirect('/settings.html');
});
const fs = require('fs');
// const { exec } = require('child_process');
const { spawn } = require('child_process');
const { Gpio } = require('onoff');
const { PythonShell } = require('python-shell');

const PORT = 8084;

let options = {
  mode: 'text',
  pythonPath: '/usr/bin/python3', // 여기에 실제 Python 경로를 넣어주세요
  pythonOptions: ['-u'], // unbuffered, 실시간으로 결과를 받기 위해 사용
  scriptPath: '/home/nanonix/table', // 여기에 실제 Python 스크립트 경로를 넣어주세요
};

let pyShell = new PythonShell('./test.py', options);

pyShell.on('message', function (message) {
  // Python 스크립트에서 print()로 출력한 내용이 message로 전달됩니다.
  console.log(message);
});

// 설정파일
const settingpath = 'settings.json';

// settings값 쓰기
function writeSettings(values) {
    fs.writeFileSync(settingpath, JSON.stringify(values, null, 2));
}
function readSettings() {
    if (fs.existsSync(settingpath)) {
        const data = JSON.parse(fs.readFileSync(settingpath));
        // Check if masterpassword and mqttipport exists in the JSON file. If not, use a default value
        if (!('timer1' in data)) {
            data['timer1'] = '5000';
        }

        return data;
    } else {
        // Here, the default value of mqttipport is also set to '192.168.0.137:1883'
        return { timer1: 5000 };
    }
}

// 서버 시작 시 값 로드
let settings = readSettings();

app.get("/api/setimer", async (req, res) => {
    try {
        let timernumber = parseInt(req.query.timernumber);
        let timesetvalue = parseInt(req.query.timesetvalue);

        // 타이머 값 설정
        settings[`timer${timernumber}`] = timesetvalue;

        // 파일에 쓰기
        writeSettings(settings);
        // console.log(`${timernumber}번 타이머 설정 : ${timesetvalue}초`);
        // res.send(`${timernumber}번 타이머 설정 : ${timesetvalue}초`);
        console.log(`테이블 상승 대기 타이머 설정 ${timesetvalue/1000}초`);
        res.send(`테이블 상승 대기 타이머 설정 ${timesetvalue/1000}초`);

    } catch (error) {
        console.error('timerSetting Error with API call:', error);
        res.send("타이머 설정 실패");
    }
});

app.get('/api/getServerIP', (req, res) => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const serverIP = networkInterfaces['wlan0'][0].address; // Replace 'eth0' with the correct network interface if needed
    const serverPORT = PORT;
    res.send({ ip: serverIP, port: serverPORT });
});


let cleaningBotState = false;
let callCleaningBotBtnPressed = false;
let callCleanBotBtnTimeout;
let stopState = false;


// 핀설정
// 로봇 호출 / 호출취소 버튼
const callCleanBotBtn = new Gpio(23, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const callCleanbotCancleBtn = new Gpio(24, 'in', 'both', { debounceTimeout: 100, activeLow: false });

// // 테이블 상승/하강 감지
const checkUpState = new Gpio(5, 'in', 'none', { debounceTimeout: 100, activeLow: false });
const checkDownState = new Gpio(6, 'in', 'none', { debounceTimeout: 100, activeLow: false });
// // 테이블 상승/ 하강/ 정지 버튼

const kioskUpBtn = new Gpio(17, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const kioskDownBtn = new Gpio(27, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const kioskStopBtn = new Gpio(22, 'in', 'both', { debounceTimeout: 100, activeLow: false });
// 테이블 상승 / 하강/ 정지 출력(펄스)

const kioskUpPower = new Gpio(16, 'out');
const kioskDownPower = new Gpio(26, 'out');
const kioskStopPower = new Gpio(20, 'out');

kioskUpPower.writeSync(1);
kioskDownPower.writeSync(1);
kioskStopPower.writeSync(1);


// MQTT
const mqtt = require("mqtt");
const client = mqtt.connect('mqtt://192.168.0.137:1883');

client.on('error', function (err) {
    console.log('MQTT Error: ', err);
});
client.on('offline', function () {
    console.log("MQTT client is offline");
});
client.on('reconnect', function () {
    console.log("MQTT client is trying to reconnect");
});

client.on('connect', function () {
    client.subscribe('table_in', function (err) {
        if (!err) {
            console.log('Connected to MQTT broker');
        }
    });
});


client.on('message', function (topic, message) {
    // message is Buffer
    // console.log(message.toString());

    // JSON 데이터 파싱
    try {
        const data = JSON.parse(message.toString());

        // cleaningBotState 값 확인
        if (data.cleaningBotState === "false") {
            cleaningBotState = false;
            console.log('cleaningBotState 변경: false');
        } else if (data.cleaningBotState === 'true') {
            cleaningBotState = true;
            console.log('cleaningBotState 변경: true');
        } else {
            console.log('올바르지 않은 cleaningBotState 값');
        }
    } catch (error) {
        console.log('JSON 파싱 오류:', error);
    }
});


// 음원파일 재생 => ()안에 .wav 확장자를 제외한 제목을 넣어주세요
// function playWav(title) {
//     // exec(`mpg321 audio/${title}.mp3`, (error, stdout, stderr) => {
//     exec(`aplay audio/${title}.wav`, (error, stdout, stderr) => {
//         if (error) {
//             console.log(`error: ${error.message}`);
//             return;
//         }
//         if (stderr) {
//             console.log(`stderr: ${stderr}`);
//             return;
//         }
//         console.log(`stdout: ${stdout}`);
//     });
// }



// 음원 파일 재생 => 중복 재생시 이전 재생 취소 
let currentProcess = null;
function playWav(title) {
    // If a sound is currently playing, kill the process.
    if (currentProcess) {
        currentProcess.kill();
    }
    currentProcess = spawn('aplay', [`/home/nanonix/table/audio/${title}.wav`]);

    currentProcess.on('exit', (code, signal) => {
        // Once the sound has finished playing (or has been stopped), 
        // reset currentProcess to null.
        currentProcess = null;
    });

    currentProcess.stderr.on('data', (data) => {
        // console.log(`stderr: ${data}`);
    });
  currentProcess.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
    });
}

  




// ─────────────────────────────────────────────────
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

// 테이블 정지
kioskStopBtn.watch((err, value) => {
    if (err) {
        console.log('테이블 정지 Error', err);
    }
    if (value == 0) {
        console.log("테이블 정지");
        kioskStopPower.writeSync(0);
        setTimeout(() => {
            kioskStopPower.writeSync(1);
        }, 100);
    }
});
// 테이블 상승 버튼

kioskUpBtn.watch((err, value) => {
    if (err) {
        console.log('테이블 상승 Error', err);
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
                console.log("테이블 상승시작");
            }, settings.timer1);
        } else if (checkUpState.readSync() == 0) {
            console.log("테이블이 이미 상승한 상태입니다");
            playWav("alreadykioskup");
        } else if(stopState == true){
            kioskUpPower.writeSync(0);
            setTimeout(() => {
                kioskUpPower.writeSync(1);
            }, 100);
            stopState = false;
        } else{
            console.log("테이블이 이동중입니다.");
            playWav("kioskmoving");
            kioskStopPower.writeSync(0);
            setTimeout(() => {
                kioskStopPower.writeSync(1);
            }, 100);
            stopState = true;
        };
    }
});
// 테이블 하강
kioskDownBtn.watch((err, value) => {
    if (err) {
        console.log('테이블 상승 Error', err);
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
            console.log("테이블이 이미 하강 상태입니다");
            playWav("alreadykioskdown");
        } else if(stopState == true){
            kioskDownPower.writeSync(0);
            setTimeout(() => {
                kioskDownPower.writeSync(1);
            }, 100);
            stopState = false;
        } else{
            console.log("테이블이 이동중입니다.");
            playWav("kioskmoving");
            kioskStopPower.writeSync(0);
            setTimeout(() => {
                kioskStopPower.writeSync(1);
            }, 100);
            stopState = true;
        };
    }
});
//──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server listening on HTTP port ${PORT}`);
});
