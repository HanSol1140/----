// server.js
const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());


app.use(express.static('public'));

const axios = require('axios');

const fs = require('fs');
// const { exec } = require('child_process');
const { spawn } = require('child_process');
const mqtt = require("mqtt");

const { Gpio } = require('onoff');
const { PythonShell } = require('python-shell');

const PORT = 8083;
const SOCKETPORT = 8082;

app.get('/', (req, res) => {
    res.redirect('/settings.html');
});

let authorization = 'x';
let guestnumber = '';

// 입장가능시간 변수
let GuestEnteringTime = false;
let MemberEnteringTime = false;

// 입장
// Gpio의 라이브러리는 별도설정없을시 BCM(Broadcom SOC Channel모드를 기본으로 설정
const guestEnteringSensor = new Gpio(22, 'in', 'both', { debounceTimeout: 100, activeLow: false });
const blueToothEnteringSensor = new Gpio(27, 'in', 'both', { debounceTimeout: 100, activeLow: false });
// 테스트용 출력설정
// const guestEnteringSensor = new Gpio(26, 'out');
// guestEnteringSensor.writeSync(1);

// 문열기 / 닫기
const DoorStatePin = 25;
const DoorState = new Gpio(DoorStatePin, 'out');
DoorState.writeSync(1);


// ────────────────────────────────────────────────────────────────────────────────────────────────────

// 설정파일
const settingpath = 'settings.json';

// settings값 쓰기
function writeSettings(values) {
    fs.writeFileSync(settingpath, JSON.stringify(values, null, 2));
}

// 설정 값 읽기
function readSettings() {
    if (fs.existsSync(settingpath)) {
        const data = JSON.parse(fs.readFileSync(settingpath));
        // Check if masterpassword and mqttipport exists in the JSON file. If not, use a default value
        if (!('masterpassword' in data)) {
            data['masterpassword'] = '6195';
        }
        if (!('mqttipport' in data)) {
            data['mqttipport'] = '192.168.0.137:1883'; // Default MQTT IP:PORT is set here.
        }
        if (!('esp32address' in data)) {
            data['esp32address'] = '192.168.0.88:8083'; // Default MQTT IP:PORT is set here.
        }
        if (!('id' in data)) {
            data['id'] = ''; // Default
        }
        if (!('pass' in data)) {
            data['pass'] = ''; // Default
        }
        return data;
    } else {
        // Here, the default value of mqttipport is also set to '192.168.0.137:1883'
        return { timer1: 30000, timer2: 10000, timer3: 14400000, timer4: 30000, masterpassword: '6195', mqttipport: '192.168.0.137:1883', esp32address: '192.168.0.88:8083', id: '', pass: '' };
    }
}

// 서버 시작 시 값 로드
let settings = readSettings();

app.get("/api/setimer", async (req, res) => {
    try {
        let timernumber = parseInt(req.query.timernumber);
        let timesetvalue = parseInt(req.query.timesetvalue);

        // 타이머 값 설정
        settings[`timer${timernumber}`] = timesetvalue * 1000;

        // 파일에 쓰기
        writeSettings(settings);
        console.log(`${timernumber}번 타이머 설정 : ${timesetvalue}초`);
        res.send(`${timernumber}번 타이머 설정 : ${timesetvalue}초`);

    } catch (error) {
        console.error('timerSetting Error with API call:', error);
        res.send("타이머 설정 실패");
    }
});

function removeOldData() {
    fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
        if (err) throw err;

        let data = fileData ? JSON.parse(fileData) : [];
        // const oneHourAgo = new Date().getTime() - 3600000; // 1시간전의 시간값 구하기
        const oneHourAgo = new Date().getTime() - 14400000; // 4시간전의 시간값



        data = data.filter(item => new Date(item.timestamp).getTime() > oneHourAgo); // timestamp가 1시간 이전보다 더 최신인 데이터만 남김

        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFile('phoneNumber.json', jsonData, (err) => {
            if (err) throw err;
            // console.log('데이터 제거 완료');
        });
    });
}
// ────────────────────────────────────────────────────────────────────────────────────────────────────
const client = mqtt.connect(`mqtt://${settings.mqttipport}`);
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
    client.subscribe('door_in', function (err) {
        if (!err) {
            console.log('Connected to MQTT broker');
        }
    });
});

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString());

    // JSON 데이터 파싱
    try {
        const data = JSON.parse(message.toString());
        if (data.phonenumber && data.bluetoothmac) {
            memberDoorTimerOn();

            //
            fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
                if (err) throw err;
                let filedata = [];
                filedata = fileData ? JSON.parse(fileData) : []; // 파일에 데이터가 없으면 빈 배열을 사용
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = padZero(currentDate.getMonth() + 1);
                const date = padZero(currentDate.getDate());
                const hours = padZero(currentDate.getHours());
                const mins = padZero(currentDate.getMinutes());
                const newData = {
                    timestamp: `${year}-${month}-${date} ${hours}:${mins}`,
                    phonenumber: data.phonenumber,
                    bluetoothmac: data.bluetoothmac
                };
                const exists = filedata.some(item => item.phonenumber === data.phonenumber);
                if (!exists) {
                    filedata.push(newData); // 새로운 데이터를 배열에 추가
                    const jsonData = JSON.stringify(filedata, null, 2);
                    fs.writeFileSync('phoneNumber.json', jsonData); // 동기적으로 파일 작성
                    console.log('새로운 번호 저장 완료');
                    client.publish("mainserver", JSON.stringify(newData));
                } else {
                    console.log("이미 추가된 번호입니다.");
                }
                removeOldData();
            });
            //
        }

    } catch (error) {
        console.log('JSON 파싱 오류:', error);
    }
});






app.post("/api/setpassword", async (req, res) => {
    try {
        const password = req.body.password;

        // Save the masterpassword to the settings object
        settings.masterpassword = password;

        // Write the settings back to the file
        writeSettings(settings);

        res.send("비밀번호 설정 성공");
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("비밀번호 설정 실패");
    }
});

// ID / PASS(LGU+ 아이디 / 비밀번호) 설정
app.post("/api/setidpass", async (req, res) => {
    const id = req.body.id;
    const pass = req.body.pass;
    settings.id = id;
    settings.pass = pass;
    writeSettings(settings);
    console.log(id);
    console.log(pass);

    res.send("ID / PASS 설정 완료");
});


// IP / PORT 반환
app.get('/api/getServerIP', (req, res) => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const serverIP = networkInterfaces['wlan0'][0].address; // Replace 'eth0' with the correct network interface if needed
    const serverPORT = PORT;
    res.send({ ip: serverIP, port: serverPORT });
});

// ID / PASS(LGU+ 아이디 / 비밀번호) 설정
app.post("/api/setmqttipport", async (req, res) => {
    try {
        const mqttipport = req.body.mqttipport;

        // Save the mqttipport to the settings object
        settings.mqttipport = mqttipport;

        // Write the settings back to the file
        writeSettings(settings);

        res.send("MQTT IP/PORT 설정 성공");
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("MQTT IP/PORT 설정 실패");
    }
});

app.post("/api/setesp32address", async (req, res) => {
    try {
        const esp32address = req.body.esp32address;
        settings.esp32address = esp32address;
        writeSettings(settings);

        res.send("ESP32 주소설정 성공");
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("ESP32 주소설정 실패");
    }
});


// 전화 수신시 URL알림 설정 정보 조회(수신시 URL알림이 설정된 정보를 조회하는 기능)
app.post("/api/getringcallback", async (req, res) => {
    try {
        const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/getringcallback?id=${req.body.id}&pass=${req.body.pass}`);
        if (response.status === 200) {
            res.send(response.data);
        }
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("error");
    }
});

// 전화 수신시 URL알림 설정
app.post("/api/setringcallback", async (req, res) => {
    try {
        const id = req.body.id;
        const pass = req.body.pass;
        const callbackurl = req.body.callbackurl;
        const callbackhost = req.body.callbackhost;
        const callbackport = req.body.callbackport;

        const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/setringcallback?id=${req.body.id}&pass=${req.body.pass}&callbackurl=${req.body.callbackurl}&callbackhost=${req.body.callbackhost}&callbackport=${req.body.callbackport}`);
        console.log(response.data);
        if (response.status === 200) {
            res.send(response.data);
        }
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("error");
    }
});

// 전화 수신시 URL알림 설정 삭제
app.post("/api/delringcallback", async (req, res) => {
    try {
        const id = req.body.id;
        const pass = req.body.pass;
        const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/delringcallback?id=${req.body.id}&pass=${req.body.pass}`);
        // console.log(response.data);
        if (response.status === 200) {
            res.send(response.data);
        }
    } catch (error) {
        console.error('Error with API call:', error);
        res.send("error");
    }
});











// 입장
let opendoorRepeat;

function openDoor() {
    console.log("문이 열립니다.");
    DoorState.writeSync(0);
    opendoorstate = true;
    if (opendoorRepeat) {
        clearTimeout(opendoorRepeat);
    }

    opendoorRepeat = setTimeout(() => {
        console.log("문이 닫힙니다.");
        DoorState.writeSync(1);
    }, settings.timer2);
};

// 음원파일 재생 => ()안에 .wav 확장자를 제외한 제목을 넣어주세요
// function playWav(title) {
//     // exec(`mpg321 audio/${title}.mp3`, (error, stdout, stderr) => {
//     exec(`aplay audio/${title}.wav`, (error, stdout, stderr) => {
//         if (error) {
//             // console.log(`error: ${error.message}`);
//             return;
//         }
//         if (stderr) {
//             // console.log(`stderr: ${stderr}`);
//             return;
//         }
//         // console.log(`stdout: ${stdout}`);
//     });
// }
// 음원 파일 재생 => 중복 재생시 이전 재생 취소 
let currentProcess = null;
function playWav(title) {
    // If a sound is currently playing, kill the process.
    if (currentProcess) {
        currentProcess.kill();
    }
    currentProcess = spawn('aplay', [`/home/nanonix/door/audio/${title}.wav`]);

    currentProcess.on('exit', (code, signal) => {
        // Once the sound has finished playing (or has been stopped), 
        // reset currentProcess to null.
        currentProcess = null;
    });

    currentProcess.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        
    });
  currentProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
}

// 시간값이 한자리일경우 앞에 0추가
function padZero(number) {
    return number < 10 ? `0${number}` : number;
}

// 서버 자동실행시 테스트 보이스 출력
app.get("/api/testvoiceon", async (req, res) => {
    playWav("testvoice");
});


// PythonShell
// 주변 블루투스 장치 스캔해서 서버로 MQTT전송

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
            // phonenumber: '',
            bluetoothmac: message
        };
        client.publish("mainserver", JSON.stringify(newData));
    }
});







// 근접센서 입장감지
let cencerNonRepeat1;
let cencerNonRepeat2;

function guestDoorTimerOn() {
    GuestEnteringTime = true; // 문을 입장가능한상 태로 변경
    // playWav("output");
    console.log("게스트입장");

    // 마지막으로 실행된  setTimeout만 실행
    if (cencerNonRepeat1) {
        clearTimeout(cencerNonRepeat1);
    }
    cencerNonRepeat1 = setTimeout(() => {
        GuestEnteringTime = false; // 일정 시간 후에 GuestEnteringTime 값을 false로 설정
        console.log("입장시간 종료");
    }, settings.timer1);
}

function memberDoorTimerOn() {
    MemberEnteringTime = true; // 문을 입장가능한상 태로 변경
    console.log("회원입장 확인");

    // 마지막으로 실행된  setTimeout만 실행
    if (cencerNonRepeat2) {
        clearTimeout(cencerNonRepeat2);
    }

    cencerNonRepeat2 = setTimeout(() => {
        MemberEnteringTime = false; // 일정 시간 후에 GuestEnteringTime 값을 false로 설정
        console.log("입장시간 종료");
        // 음성 출력,
    }, settings.timer1);
}



// watch는 input만 감지합니다.
guestEnteringSensor.watch((err, value) => {
    if (err) {
        console.log('Error', err);
    }
    if (value == 0) {
        guestDoorTimerOn();
    }
});

blueToothEnteringSensor.watch((err, value) => {
    if (err) {
        console.log('Error', err);
    }
    if (value == 0 && MemberEnteringTime == true) {
        // 블루투스 인증이 된 상태라면 문을 열어줍니다
        openDoor();

    }
});

// 전화 수신시 URL 알림 수신 + 전화끊기 / TCP서버
const net = require('net'); // 수신 응답을 받기위한 TCP 설정
const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
        const strData = data.toString(); // 받아온 데이터를 문자열로 변환합니다.
        const params = new URLSearchParams(strData.split('?')[1]); // Query 파라미터를 분리하고 파싱합니다.

        const sender = await params.get('sender');
        let phonenumber = sender;
        console.log('Sender:', sender);

        if (sender && strData.includes('/nanonix.html')) {
            // nanonix.html에 sender값이 있다면 ESP32에 신호발신
            try {
                const response = await axios.get(`http://${settings.esp32address}/callcancle`);
                // const response = await axios.get(`http://192.168.0.8:80/callcancle`);
                // callcancle신호를 받은 전화기쪽 ESP32가 전화를 끊어줍니다.
                if (response.status === 200) {
                    console.log("통화 종료");
                }

            } catch (error) {
                console.error('Error with API call:', error);
                console.log("error");
            }

        } else {
            console.log("sender값이 없습니다!");
            // 음성 메세지 출력
            return;
        }

        // 제한시간내로 입장시 문열어주기
        if (GuestEnteringTime) {

            fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
                if (err) throw err;
                let data = [];
                data = fileData ? JSON.parse(fileData) : []; // 파일에 데이터가 없으면 빈 배열을 사용
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = padZero(currentDate.getMonth() + 1);
                const date = padZero(currentDate.getDate());
                const hours = padZero(currentDate.getHours());
                const mins = padZero(currentDate.getMinutes());
                const newData = {
                    timestamp: `${year}-${month}-${date} ${hours}:${mins}`,
                    phonenumber: phonenumber,
                    // bluetoothmac: ''
                };
                const exists = data.some(item => item.phonenumber === phonenumber);
                if (!exists) {
                    openDoor();
                    data.push(newData); // 새로운 데이터를 배열에 추가
                    const jsonData = JSON.stringify(data, null, 2);
                    fs.writeFileSync('phoneNumber.json', jsonData); // 동기적으로 파일 작성
                    // 새로운 번호 저장완료
                    client.publish("mainserver", JSON.stringify(newData));
                } else {
                    console.log("이미 추가된 번호입니다.");
                    openDoor();
                }
                removeOldData();
            });

        } else {
            console.log("제한시간 초과! 문을 열 수 없습니다.");
            playWav("nfctrycontact");
        }

    });
    socket.on('error', (error) => {
        console.error('Error with TCP connection:', error);
    });
});

// ───────────────────────────────────────────────
// 전화 끊기
// try {
//   const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/hangup?id=${id}&pass=${pass}`);
//   if (response.status === 200) {
//     console.log(response.data);
//   }
// } catch (error) {
//   console.error('Error with API call:', error);
//   console.log("error");
// }
// ────────────────────────────────────────────────
// 번호키 입장방식
let authorizationTimeOut;
authorizationtimer = false;
// 번호 키 입력받기  => 라즈베리파이 RS485  => npm install serialport
const { SerialPort, ReadlineParser } = require('serialport');
const { CLIENT_RENEG_LIMIT } = require('tls');
const { response } = require('express');
let serialPort = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 });
// Send data through serial port
let dataToSend = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16]);
serialPort.write(dataToSend);
let parser = new ReadlineParser();
serialPort.pipe(parser);

// 버튼 감지
let phonenumber = '';
parser.on('data', function (data) {

    console.log(data);
    console.log(data.length);
    let inputnumber = (data.match(/\d/g));

    if (inputnumber == null) {
        console.log("값이 없습니다.");
        playWav("rewriteplz");
        return
    } else {
        inputnumber = inputnumber.join('');
        console.log(inputnumber);
        console.log(inputnumber.length);
    }
    phoneNumber3 = inputnumber[0] + inputnumber[1] + inputnumber[2];


    if (inputnumber == settings.masterpassword) { // 매장 비밀번호 => 별다른 알림이 뜰이유가없음
        // 매장 비밀번호 입력
        openDoor();
    } else if (authorization == inputnumber) {  // 승인번호 => 승인번호를 일정시간후에 무효화시켜야합니다.
        // 인증번호 입력
        if (authorizationtimer) {
            openDoor();

            fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
                if (err) throw err;
                let data = [];
                data = fileData ? JSON.parse(fileData) : []; // 파일에 데이터가 없으면 빈 배열을 사용

                const exists = data.some(item => item.phonenumber === inputnumber);

                if (!exists) {
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const month = padZero(currentDate.getMonth() + 1);
                    const date = padZero(currentDate.getDate());
                    const hours = padZero(currentDate.getHours());
                    const mins = padZero(currentDate.getMinutes());
                    const newData = {
                        timestamp: `${year}-${month}-${date} ${hours}:${mins}`,
                        phonenumber: phonenumber,
                        // bluetoothmac: ''
                    };
                    data.push(newData);
                    client.publish("mainserver", JSON.stringify(newData));

                    const jsonData = JSON.stringify(data, null, 2);
                    fs.writeFileSync('phoneNumber.json', jsonData);
                    // 새로운 번호 저장완료

                } else {
                    console.log("이미 있는 번호입니다.");
                }
                removeOldData();
            });

            console.log("손님 입장 완료");

            clearTimeout(authorizationTimeOut);

            guestnumber = '';
            authorization = 'x';
        }
    } else {
        if ((inputnumber.length == 11 && phoneNumber3 == "010") || inputnumber.length == 8) {
            if (inputnumber.length == 8) {
                inputnumber = "010" + inputnumber;
            }

            //
            fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
                if (err) throw err;
                let data = [];
                data = fileData ? JSON.parse(fileData) : []; // 파일에 데이터가 없으면 빈 배열을 사용

                const exists = data.some(item => item.phonenumber === inputnumber);

                if (!exists) {
                    // 문자 보내기
                    phonenumber = inputnumber;
                    const getRandomNumber = () => Math.floor(Math.random() * 10);
                    const num1 = getRandomNumber();
                    const num2 = getRandomNumber();
                    authorization = `${num1}${num2}`;
                    smsmsg = `인증번호는 ${authorization} 입니다.`;
                    guestnumber = inputnumber;
                    console.log(authorization);
                    try {
                        const response = axios.post(`https://centrex.uplus.co.kr/RestApi/smssend?id=${settings.id}&pass=${settings.pass}&destnumber=${inputnumber}&smsmsg=${smsmsg}`);
                        console.log("승인번호 전송 완료");
                        //"전송된 승인번호를 누르고 #버튼을 눌러주세요." 음성 출력
                        playWav("sendauthorization");
                        clearTimeout(authorizationTimeOut);
                        authorizationtimer = true;
                        authorizationTimeOut = setTimeout(() => {
                            authorizationtimer = false;
                            console.log("승인 시간 종료");
                            playWav("timoutauthorization");
                            guestnumber = '';
                            authorization = 'x';
                        }, settings.timer4);

                    } catch (error) {
                        console.log("문자 전송 실패");
                    }
                    //

                } else {
                    console.log("이미 있는 번호입니다.");
                    openDoor();
                }
            });
            //

        } else {
            console.log("다시 입력해주세요.") // 8자리가 아니거나 010으로 시작하는 휴대폰번호 11자리가 아닐경우
        }
    }
});






// 서버 시작 전 파일 삭제
// const path = './phoneNumber.txt';
// try {
//     if (fs.existsSync("./phoneNumber.json")) { // 파일이 존재하는지 확인
//         fs.unlinkSync("./phoneNumber.json"); // 파일 삭제
//     }
// } catch (err) {
//     console.error(err);
// }

// // 새로운 파일 생성
// try {
//     fs.openSync("./phoneNumber.json", 'w'); // 파일 생성
// } catch (err) {
//     console.error(err);
// }


// TCP 서버
server.listen(SOCKETPORT, () => {
    console.log(`Server started on TCP port ${SOCKETPORT}`);
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server listening on HTTP port ${PORT}`);
});