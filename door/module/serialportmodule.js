// 번호 키 입력받기  => 라즈베리파이 RS485  => npm install serialport
const { SerialPort, ReadlineParser } = require('serialport');
const { CLIENT_RENEG_LIMIT } = require('tls');
const fs = require('fs');
const axios = require('axios');
const serialPortModule = () => {
let serialPort = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 });
// Send data through serial port
let dataToSend = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16]);
serialPort.write(dataToSend);
let parser = new ReadlineParser();
serialPort.pipe(parser);

// 버튼 감지

parser.on('data', function (data) {
  console.log(data);
  console.log(data.length);
  let datanumber = (data.match(/\d/g));

  if(datanumber == null){
    console.log("값이 없습니다.");
    // 다시 입력해주세요 음성 출력
    return
  }else{
    datanumber = datanumber.join('');
    console.log(datanumber);
    console.log(datanumber.length);
  }
  phoneNumber3 = datanumber[0] + datanumber[1] + datanumber[2];
  

  if(authorization == datanumber || datanumber == settings.masterpassword){
    console.log("인증완료 문이 열립니다.");
    DoorState.writeSync(1);

    setTimeout(() => {
      console.log("문이 닫힙니다.");
      DoorState.writeSync(0);
    }, settings.timer2);

    
  }else{
  // if ((datanumber.length == 11 && phoneNumber3 == "010") || datanumber.length == 8) {
    if (true) {
      fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
        if (err) throw err;
        let data = [];
        data = fileData ? JSON.parse(fileData) : []; // 파일에 데이터가 없으면 빈 배열을 사용
        const currentDate = new Date();
        const newData = {
          timestamp: currentDate.toISOString(),
          datanumber: datanumber
        };
        const exists = data.some(item => item.datanumber === datanumber);
        
        if (!exists) { 
          data.push(newData); // 새로운 데이터를 배열에 추가

          const jsonData = JSON.stringify(data, null, 2);
          fs.writeFileSync('phoneNumber.json', jsonData); // 동기적으로 파일 작성
          console.log('새로운 번호 저장 완료');

          const getRandomNumber = () => Math.floor(Math.random() * 10);
          const num1 = getRandomNumber();
          const num2 = getRandomNumber();
          authorization = `${num1}${num2}`;
          try {
            destnumber = datanumber;
            smsmsg = `인증번호는 ${authorization} 입니다.`;
            const response = axios.post(`https://centrex.uplus.co.kr/RestApi/smssend?id=${id}&pass=${pass}&destnumber=${destnumber}&smsmsg=${smsmsg}`);
            if (response.status === 200) {
              console.log("승인번호 전송 완료");
              console.log("전송된 승인번호를 누르고 #버튼을 눌러주세요. 음성 출력");
            }
          } catch (error) {
            console.log("문자 전송 실패");
          }
        }else{
          console.log("이미 추가된 번호입니다.");
          console.log("문이 열립니다.");
          DoorState.writeSync(1);
          setTimeout(() => {
            console.log("문이 닫힙니다.");
            DoorState.writeSync(0);
          }, 10000);
        }
            removeOldData();
      });

      
    } else {
      console.log("다시 입력해주세요.") // 8자리가 아니거나 010으로 시작하는 휴대폰번호 11자리가 아닐경우
    }
  }
});
}

module.exports = serialPortModule;