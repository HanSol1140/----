// server.js
const express = require('express');
const app = express();
app.use(express.json());
const axios = require('axios');
const cors = require('cors');
app.use(cors()); // 모든 도메인에서의 요청 허용
app.use(express.static('build'));
app.get('/', (req, res) => {
    res.redirect('/index.html');
});
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8083;
const mqtt = require("mqtt");
const mqttIP = "192.168.0.137:1883";

const access_token = "1027d408-cb99-11e8-aaa2-00163e046949";
const access_secret = "c720652";

let access_secret_md5 = md5(access_secret);
let timestamp = "";
let sign = '';
let select_name = '';


let cMarksAddress = '';
let marqueIdAddress = '';

function getTimeStamp() {
    // 현재 시간(UTC)의 밀리초 단위 타임스탬프를 얻습니다.
    const currentTime = new Date().getTime();
    // 밀리초를 초 단위로 변환하여 반환합니다.
    return Math.floor(currentTime / 1000);
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}


const client = mqtt.connect(`mqtt://${mqttIP}`);

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
    client.subscribe('did_in', function (err) {
        if (!err) {
            console.log('Connected to MQTT broker');
        }
    });
});


// MQTT 작동예제
// var message = {
//     cMarksNames : "nnx10, nnx11",
//     planName: "hansol image advert 004, hansol image advert 005, hansol image advert 006",
//     marqueName : "test1, test2"
// };
// client.publish('did_in', JSON.stringify(message));

client.on('message', async function (topic, message) {
    // message is Buffer
    console.log(message.toString());

    // JSON 데이터 파싱
    try {
        const data = JSON.parse(message.toString());

        if (data.planName) {
            let planNameArray = data.planName.split(',').map(item => item.trim());
            for (var k = 0; k < planNameArray.length; k++) {
                let planName = planNameArray[k];
                ////////////////////////////////
                // data.json 파일 읽기
                fs.readFile('data.json', 'utf8', async (err, data) => {
                    if (err) {
                        console.error('Error reading data.json:', err);
                        return;
                    }

                    try {
                        const jsonData = JSON.parse(data);

                        const matchedPlan = jsonData.find(item => item.planName === planName);
                        // console.log(matchedPlan);

                        if (matchedPlan) {
                            console.log(matchedPlan);
                        
                            access_token;
                            timestamp = getTimeStamp();
                            sign = md5(access_token + access_secret_md5 + timestamp);
                            itemName = matchedPlan.planName;
                            var itemIds = matchedPlan.itemIds;
                            var cMarks = matchedPlan.cMarksIds; // ,으로 구분
                            var sDate = matchedPlan.sDate;
                            var eDate = matchedPlan.eDate;
                            var beginTime = matchedPlan.beginTime;
                            var endTime = matchedPlan.endTime;
                            var playtimetype = 1; // 고정
                            var playCount = 10000;
                            var pType = matchedPlan.pType;
                            var pCycle = matchedPlan.pCycle;
                            try {
                                const response = await axios.post(
                                    `http://localhost:8780/adc/sdk/advert_dist_items?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&itemName=${itemName}&itemIds=${itemIds}&cMarks=${cMarks}&sDate=${sDate}&eDate=${eDate}&beginTime=${beginTime}&endTime=${endTime}&playtimetype=${playtimetype}&playCount=${playCount}&pType=${pType}&pCycle=${pCycle}`);
                                if (response.status === 200) {
                                    console.log("advert_dist_success");
                                    console.log(response.data);
                                }
                            } catch (error) {
                                console.log("error : ", error);
                            }


                            //
                        } else {
                            console.log("matchedPlan가 없습니다.");
                        }
                    } catch (error) {
                        console.log("error!~~");
                    }
                });
                ////////////////////////////////
            }
        }



        // marque보내기 => 보낼 marque제목이랑 전송할 기계deviceName이 필요함
        if (data.marqueName && data.cMarksNames) {
            await delete_marque_list();
            console.log('marqueName값 체크');
            let cMarkArray = data.cMarksNames.split(',').map(item => item.trim());
            let marqueArray = data.marqueName.split(',').map(item => item.trim());

            for (var j = 0; j < cMarkArray.length; j++) {
                dev_get_devs_itemlist(cMarkArray[j]);
                console.log(cMarksAddress);
                for (var i = 0; i < marqueArray.length; i++) {
                    await get_marque_list(marqueArray[i]);
                    await marque_dist_item(marqueIdAddress, cMarksAddress);
                }
            }

        }

        
    } catch (error) {
        console.log('JSON 파싱 오류:', error);
    }
});



// 장치 목록 가져오기
async function dev_get_devs_itemlist(searchcmark) {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    var currentPage = 1;
    var showCount = 100;
    var select_name = `${searchcmark}`;
    try {
        const response = await axios.post(
            `http://localhost:8780/adc/sdk/dev_get_devs_itemlist?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&currentPage=${currentPage}&showCount=${showCount}&select_name=${select_name}`);
        if (await response.status === 200) {
            console.log("success");
            // console.log(response.data);
            console.log("──────────────────────────");
            console.log(response.data.devs[0].cName);
            console.log(response.data.devs[0].cMark);
            console.log("──────────────────────────");
            cMarksAddress = response.data.devs[0].cMark;
        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
}
// dev_get_devs_itemlist("");


// 광고 계획 게시
// pType 설명
// 0 => 추가
// 1 => 재생하던 광고가 끝나면 교체
// 2 => 재생하던 광고에 상관없이 교체
// 3 => Clear
async function advert_dist_items(advertName, advertID, cMarksAddress) {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    itemName = `${advertName}`;
    itemIds = `${advertID}`;
    cMarks = `${cMarksAddress}`; // ,으로 구분
    sDate = "2000-01-01";
    eDate = "2099-12-30";
    beginTime = "00:00:00";
    endTime = "23:59:59";
    playtimetype = 1; // 고정
    playCount = 10000;
    pType = 2;
    // pCycle

    try {
        const response = await axios.post(
            `http://localhost:8780/adc/sdk/advert_dist_items?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&itemName=${itemName}&itemIds=${itemIds}&cMarks=${cMarks}&sDate=${sDate}&eDate=${eDate}&beginTime=${beginTime}&endTime=${endTime}&playtimetype=${playtimetype}&playCount=${playCount}&pType=${pType}`);
        if (await response.status === 200) {
            console.log("advert_dist_success");
            console.log(response.data);
        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
}

// marque 가져와서 전체삭제(전체)
async function delete_marque_list() {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    gType = 1;
    showCount = 100;
    currentPage = 1;
    try {
        const response = await axios.post(`http://localhost:8780/adc/sdk/get_marque_list?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&gType=${gType}&showCount=${showCount}&currentPage=${currentPage}`);
        if (await response.status === 200) {
            for (var i = 0; i < response.data.list.length; i++) {
                marqueIdAddress = response.data.list[i].id;
                marqueId = marqueIdAddress;
                cMarks = `44407907080018250611`;
                try {
                    const response = await axios.post(
                        `http://localhost:8780/adc/sdk/marque_revoke_item?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&marqueId=${marqueId}&cMarks=${cMarks}`);
                    if (await response.status === 200) {
                        console.log(response.data);
                        console.log("marque_revoke_success");
                    }
                } catch (error) {
                    console.error('Error with API call:', error);
                    console.log("error : ", error);
                }
            }


        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
}

// marque 가져오기(검색)
async function get_marque_list(searchName) {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    select_name = `${searchName}`;
    gType = 1;
    showCount = 100;
    currentPage = 1;
    try {
        const response = await axios.post(
            `http://localhost:8780/adc/sdk/get_marque_list?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&select_name=${select_name}&gType=${gType}&showCount=${showCount}&currentPage=${currentPage}`);
        if (await response.status === 200) {
            // console.log("marque_list_get_success");
            console.log(response.data.list[0].title);
            console.log(response.data.list[0].id);
            marqueIdAddress = response.data.list[0].id;
        }
    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
}

// marque 기계에 보내기
// async function marque_dist_item(){
async function marque_dist_item(marqueID, cMarksAddress) {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    marqueId = `${marqueID}`;
    // marqueId = "3880367697@000001";
    cMarks = `${cMarksAddress}`;
    // cMarks = "44407907080018250611";    
    try {
        const response = await axios.post(
            `http://localhost:8780/adc/sdk/marque_dist_item?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&marqueId=${marqueId}&cMarks=${cMarks}`);
        if (await response.status === 200) {
            console.log("marque_dist_success!");
            // console.log(marqueID, + "" + cMarksAddress);
            // console.log(response.data);
        }
    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
}
// 서버 시작
app.listen(PORT, () => {
    console.log(`Server listening on HTTP port ${PORT}`);
});

// --------------------------------------------------------
// UI제작
app.post("/Api/getMarqueList", async (req, res) => {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    var gType = 1
    var select_name = req.body.searchText;
    var showCount = 500;
    var CurrentPage = 1;
    try {
        const response = await axios.post(`http://localhost:8780/adc/sdk/get_marque_list?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&gType=${gType}&select_name=${select_name}&showCount=${showCount}&currentPage=${CurrentPage}`);
        if (await response.status === 200) {
            console.log("getMarqueList");
            res.send(response.data);
        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
});


app.post("/Api/getAdvertList", async (req, res) => {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    var showCount = 500;
    var CurrentPage = 1;
    var select_name = req.body.searchText;
    try {
        const response = await axios.post(`http://localhost:8780/adc/sdk/advert_get_itemlist?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&showCount=${showCount}&currentPage=${CurrentPage}&select_name=${select_name}`);
        if (await response.status === 200) {
            console.log("getAdvertList");
            res.send(response.data);
        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
});


app.post("/Api/getDeviceList", async (req, res) => {
    access_token;
    timestamp = getTimeStamp();
    sign = md5(access_token + access_secret_md5 + timestamp);
    var currentPage = 1;
    var showCount = 100;
    var select_name = req.body.searchText;
    try {
        const response = await axios.post(
            `http://localhost:8780/adc/sdk/dev_get_devs_itemlist?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&currentPage=${currentPage}&showCount=${showCount}&select_name=${select_name}`);
        if (await response.status === 200) {
            console.log("getDeviceList");
            console.log(response.data);
            res.send(response.data);
        }

    } catch (error) {
        console.error('Error with API call:', error);
        console.log("error : ", error);
    }
});





// advertplan저장 => planName 중복시 저장불가로 해놓음 = edit으로 수정하거나 삭제하고 다시등록해야함
app.post("/Api/saveAdvertPlan", async (req, res) => {
    var planName = req.body.planName
    var itemNames = req.body.itemNames
    var itemIds = req.body.itemIds;
    var cMarksNames = req.body.cMarksNames;
    var cMarksIds = req.body.cMarksIds;
    var sDate = req.body.sDate;
    var eDate = req.body.eDate;
    var beginTime = req.body.beginTime;
    var endTime = req.body.endTime;
    var pType = req.body.pType;
    var pCycle = req.body.pCycle;

    const newData = {
        planName: planName,
        itemNames: itemNames,
        itemIds: itemIds,
        cMarksNames: cMarksNames,
        cMarksIds: cMarksIds,
        sDate: sDate,
        eDate: eDate,
        beginTime: beginTime,
        endTime: endTime,
        pType: pType,
        pCycle: pCycle
    };

    fs.readFile('data.json', 'utf8', (err, data) => {
        var parsedData;
        if (err || data.length === 0) {
            console.error('Error reading JSON file or file is empty, creating a new one:', err);
            parsedData = [];
        } else {
            parsedData = JSON.parse(data);
        }

        // Update data if itemName exists, else add new data
        const existingItemIndex = parsedData.findIndex(item => item.planName === planName);
        if (existingItemIndex > -1) {
            // parsedData[existingItemIndex] = newData;
            res.status(409).send('이미 존재하는 planName입니다.');
            return;
        } else {
            parsedData.push(newData);
        }
        const jsonData = JSON.stringify(parsedData, null, 2);
        fs.writeFile('data.json', jsonData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
                res.sendStatus(500);
                return;
            }
            console.log('JSON file has been saved.');
            res.sendStatus(200);
        });
    });
});


app.post("/Api/getAdvertPlanList", async (req, res) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err || data.length === 0) {
            console.error('Error reading JSON file or file is empty:', err);
            res.sendStatus(500);
            return;
        } else {
            const parsedData = JSON.parse(data);
            const searchText = req.body.searchText; // 요청 본문에서 검색 텍스트를 얻습니다.
            if (searchText) {
                const filteredData = parsedData.filter(item => item.planName.includes(searchText));
                res.json(filteredData);
            } else {
                res.json(parsedData);
            }
        }
    });
});

app.post("/Api/distAdvertPlan", async (req, res) => {
    let planName = req.body.planName;
    console.log(planName);

    // data.json 파일 읽기
    fs.readFile('data.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading data.json:', err);
            res.sendStatus(500);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            // itemName과 일치하는 항목 찾기
            const matchedPlan = jsonData.find(item => item.planName === planName);
            if (matchedPlan) {
                console.log(matchedPlan);
                //

                access_token;
                timestamp = getTimeStamp();
                sign = md5(access_token + access_secret_md5 + timestamp);
                itemName = matchedPlan.planName;
                var itemIds = matchedPlan.itemIds;
                var cMarks = matchedPlan.cMarksIds; // ,으로 구분
                var sDate = matchedPlan.sDate;
                var eDate = matchedPlan.eDate;
                var beginTime = matchedPlan.beginTime;
                var endTime = matchedPlan.endTime;
                var playtimetype = 1; // 고정
                var playCount = 10000;
                var pType = matchedPlan.pType;
                var pCycle = matchedPlan.pCycle;

                try {
                    const response = await axios.post(
                        `http://localhost:8780/adc/sdk/advert_dist_items?access_token=${access_token}&timestamp=${timestamp}&sign=${sign}&itemName=${itemName}&itemIds=${itemIds}&cMarks=${cMarks}&sDate=${sDate}&eDate=${eDate}&beginTime=${beginTime}&endTime=${endTime}&playtimetype=${playtimetype}&playCount=${playCount}&pType=${pType}&pCycle=${pCycle}`);
                    if (response.status === 200) {
                        console.log("advert_dist_success");
                        console.log(response.data);
                        res.sendStatus(200);
                    }
                } catch (error) {
                    console.error('Error with API call:', error);
                    console.log("error : ", error);
                }


                //
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            console.error('Error parsing data.json:', error);
            res.sendStatus(500);
        }
    });
});

app.post("/Api/deleteAdvertPlan", async (req, res) => {
    const itemsToDelete = req.body.itemsToDelete;

    fs.readFile('data.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading data.json:', err);
            res.sendStatus(500);
            return;
        }

        try {
            let jsonData = JSON.parse(data);
            jsonData = jsonData.filter(item => !itemsToDelete.includes(item.planName));
            fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing to data.json:', err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        } catch (error) {
            console.error('Error parsing data.json:', error);
            res.sendStatus(500);
        }
    });
});


app.post("/Api/openAdvertPlan", async (req, res) => {
    var planName = req.body.planName

    // data.json 파일 읽기
    fs.readFile('data.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading data.json:', err);
            res.sendStatus(500);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            // itemName과 일치하는 항목 찾기
            const matchedPlan = jsonData.find(item => item.planName === planName);
            if (matchedPlan) {
                res.send(matchedPlan);
                // console.log(matchedPlan);

            } else {
                console.log("itemName과 일치하는 값이 없습니다.")
            }




        } catch (error) {
            console.error('Error parsing data.json:', error);
        }
    });
});

app.post("/Api/editAdvertPlan", async (req, res) => {
    var planName = req.body.planName
    var itemNames = req.body.itemNames
    var itemIds = req.body.itemIds;
    var cMarksNames = req.body.cMarksNames;
    var cMarksIds = req.body.cMarksIds;
    var sDate = req.body.sDate;
    var eDate = req.body.eDate;
    var beginTime = req.body.beginTime;
    var endTime = req.body.endTime;
    var pType = req.body.pType;
    var pCycle = req.body.pCycle;

    const newData = {
        planName: planName,
        itemNames: itemNames,
        itemIds: itemIds,
        cMarksNames: cMarksNames,
        cMarksIds: cMarksIds,
        sDate: sDate,
        eDate: eDate,
        beginTime: beginTime,
        endTime: endTime,
        pType: pType,
        pCycle: pCycle
    };

    fs.readFile('data.json', 'utf8', (err, data) => {
        var parsedData;
        if (err || data.length === 0) {
            console.error('Error reading JSON file or file is empty, creating a new one:', err);
            parsedData = [];
        } else {
            parsedData = JSON.parse(data);
        }

        // Update data if itemName exists, else add new data
        const existingItemIndex = parsedData.findIndex(item => item.planName === planName);
        if (existingItemIndex > -1) {
            parsedData[existingItemIndex] = newData;
        } else {
            parsedData.push(newData);
        }
        const jsonData = JSON.stringify(parsedData, null, 2);
        fs.writeFile('data.json', jsonData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
                res.sendStatus(500);
                return;
            }
            console.log('JSON file has been saved.');
            res.sendStatus(200);
        });
    });
});

// 리액트는 SPA이므로 .index.html파일 하나밖에없음
// 그런데 /plan으로 이동하면 사실 index.html밖에 없으므로 오류를 출력
// 따라서 모든 경로에 대해 index.html을 호출해줍니다.
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, './build/index.html'), function(err) {
      if (err) {
        res.status(500).send(err)
      }
    })
  })