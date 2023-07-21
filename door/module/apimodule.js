const axios = require('axios');
const apiModule = () => {
    app.post("/RestApi/setpassword", async (req, res) => {
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

    function removeOldData() {
        fs.readFile('phoneNumber.json', 'utf8', (err, fileData) => {
            if (err) throw err;

            let data = fileData ? JSON.parse(fileData) : [];

            // const oneHourAgo = new Date().getTime() - 3600000; // 1시간전의 시간값 구하기
            const oneHourAgo = new Date().getTime() - 100000; // 1시간전의 시간값 구하기


            data = data.filter(item => new Date(item.timestamp).getTime() > oneHourAgo); // timestamp가 1시간 이전보다 더 최신인 데이터만 남김

            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFile('phoneNumber.json', jsonData, (err) => {
                if (err) throw err;
                console.log('1시간 이전 데이터 제거 완료');
            });
        });
    }
    // ────────────────────────────────────────────────────────────────────────────────────────────────────
    // 문자 보내기
    app.post("/RestApi/smssend", async (req, res) => {
        try {
            destnumber = req.body.destnumber
            smsmsg = req.body.smsmsg;
            const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/smssend?id=${id}&pass=${pass}&destnumber=${destnumber}&smsmsg=${smsmsg}`);
            if (response.status === 200) {
                res.send("문자 보내기 성공");
                console.log("문자 보내기 성공");
            }
        } catch (error) {
            console.error('Error with API call:', error);
            res.send("error");
        }
    });
    // 통화 종료
    app.post("/RestApi/hangup", async (req, res) => {
        try {
            const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/hangup?id=${id}&pass=${pass}`);
            if (response.status === 200) {
                res.send(response.data);
            }
        } catch (error) {
            console.error('Error with API call:', error);
            res.send("error");
        }
    });

    // 전화 수신시 URL알림 설정 정보 조회(수신시 URL알림이 설정된 정보를 조회하는 기능)
    app.post("/RestApi/getringcallback", async (req, res) => {
        try {
            const id = req.body.id;
            const pass = req.body.pass;
            const response = await axios.post(`https://centrex.uplus.co.kr/RestApi/getringcallback?id=${req.body.id}&pass=${req.body.pass}`);
            // console.log(response.data);
            if (response.status === 200) {
                res.send(response.data);
            }
        } catch (error) {
            console.error('Error with API call:', error);
            res.send("error");
        }
    });

    // 전화 수신시 URL알림 설정
    app.post("/RestApi/setringcallback", async (req, res) => {
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
    app.post("/RestApi/delringcallback", async (req, res) => {
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
}

module.exports = apiModule;