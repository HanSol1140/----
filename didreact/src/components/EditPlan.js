import React, { useState, useCallback, useEffect } from 'react';
import './EditPlan.css';
import AdvertList from './AdvertList.js'; // 모달import
import DeviceList from './DeviceList.js'; // 모달import
import axios from 'axios';

const EditPlan = ({ onClick, editPlan }) => {
    // useEffect(() => {
    //     console.log(editPlan);
    //   }, [editPlan]);


    useEffect(() => {
        const pCycleArray = editPlan.pCycle.split(',').map(String);
        const newCheckboxes = { checkbox0: false, checkbox1: false, checkbox2: false, checkbox3: false, checkbox4: false, checkbox5: false, checkbox6: false, checkbox7: false };
    
        pCycleArray.forEach(day => {
            if(day === '7') {
                for(let i = 0; i < 7; i++) {
                    newCheckboxes[`checkbox${i}`] = true;
                }
                newCheckboxes.checkbox7 = true;
            } else {
                newCheckboxes[`checkbox${day}`] = true;
            }
        });
    
        setCheckboxes(newCheckboxes);
    }, [editPlan]);

    const [itemNames, setItemNames] = useState("");
    const [itemIds, setItemIds] = useState("");

    const [cMarksNames, setCMarksNames] = useState("");
    const [cMarksIds, setCMarksIds] = useState("");
    

    const handleClose = () => {
        onClick(); // 부모 컴포넌트로부터 전달된 onClick 함수를 호출하여 모달 창을 닫습니다.
    };

    //advert목록 / device목록 검색,
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const handleOpen1 = () => {
        setIsOpen1(true);
    };
    const handleOpen2 = () => {
        setIsOpen2(true);
    };
    const handleClose1 = () => {
        setIsOpen1(false);
    };
    const handleClose2 = () => {
        setIsOpen2(false);
    };
    const [selectedAdverts, setSelectedAdverts] = useState([]);
    const handleAdvertConfirm1 = (selected) => {
        if(selected.length > 0){   
            setSelectedAdverts(selected);
            // console.log(selected);
            // console.log(selected[0].itemName);
            // console.log(selected[0].id);
            setItemNames(selected.map(item => item.itemName).join(","));
            setItemIds(selected.map(item => item.id).join(","));
            // console.log(itemNames);
            // console.log(itemIds);
        }else{
            console.log("No Selected");
            setSelectedAdverts([]);
            console.log(selected);
        }
    };


    const [selectedDevices, setSelectedDevices] = useState([]);
    const handleAdvertConfirm2 = (selected) => {
        if(selected.length > 0){    
            setSelectedDevices(selected);
            // console.log(selected);
            // console.log(selected[0].cName);
            // console.log(selected[0].cMark);
            setCMarksNames(selected.map(item => item.cName).join(","));
            setCMarksIds(selected.map(item => item.cMark).join(","));
        }else{
            console.log("No Selected");
            setSelectedDevices([]);
            console.log(selected);

        }
        
    };
    //advert / device 선택 끝

    // 각종 input값 관리
    const [inputText, setInputText] = useState({
        planName: `${editPlan.planName}`,
        startDate: `${editPlan.sDate}`,
        endDate: `${editPlan.eDate}`,
        startTime: `${editPlan.beginTime}`,
        endTime: `${editPlan.endTime}`,
        planType: `${editPlan.pType}`,
    });

    const onChange = useCallback(e => {
        const { name, value } = e.target;
        setInputText(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    });

    // pCycle 관리
    const [checkboxes, setCheckboxes] = useState({
        checkbox0: true,
        checkbox1: true,
        checkbox2: true,
        checkbox3: true,
        checkbox4: true,
        checkbox5: true,
        checkbox6: true,
        checkbox7: true,
    });

    // pCycle 값의 상태를 관리하는 state
    const [pCycle, setPCycle] = useState('7');

    // 체크박스의 상태가 변경되면 실행되는 함수
    const handleCheckboxChange = async (event) => {
        const { name, checked } = event.target;
    
        // copy of the previous state
        const newCheckboxes = {...checkboxes, [name]: checked};
    
        if(name === 'checkbox7') {
            for(let i = 0; i < 7; i++) {
                newCheckboxes[`checkbox${i}`] = checked;
            }
        }

        let checkedList = [];
        for(let i = 0; i < 7; i++) {
            if(newCheckboxes[`checkbox${i}`]) {
                checkedList.push(String(i));
            }
        }
    
        let newPCycle;
        if(checkedList.length === 7) {
            newPCycle = '7';
            newCheckboxes.checkbox7 = true;
        } else {
            newPCycle = checkedList.join(',');
            newCheckboxes.checkbox7 = false;
        }
    
        setPCycle(newPCycle);
        setCheckboxes(newCheckboxes);
    };

    // plan 저장하기
    async function editAdvertPlan() {
        if(inputText.planName.length == 0){
            alert("Plan명을 입력해주세요");
            return;
        }
        try {
            const response = await axios.post(`http://localhost:8083/Api/editAdvertPlan`,{
                planName : inputText.planName,
                itemNames,
                itemIds,
                cMarksNames,
                cMarksIds,
                sDate : inputText.startDate,
                eDate: inputText.endDate,
                beginTime: inputText.startTime,
                endTime: inputText.endTime,
                pType : inputText.planType,
                pCycle: pCycle,
            });
            if (response.status === 200) {
                console.log("전송완료");
                handleClose();
            }
        } catch (error) {
            console.error('Error with API call:', error);
        }
    }

    
    return (
        <section id="EditPlan" >
            <div className='blackbox' onClick={handleClose}>
            </div>
            <div className='addplan'>
                <h2>
                    <p>NEW</p>
                    <p onClick={handleClose}><span></span><span></span></p>
                </h2>
                <ul className='planname'>
                    <li>planName</li>
                    <li>
                        <input
                            id="planName"
                            name="planName"
                            placeholder='plan명 입력'
                            
                            value={inputText.planName}
                            onChange={onChange}
                            readOnly
                        >
                        </input>
                    </li>
                </ul>
                {/* 재생할 광고리스트 선택 */}
                <ul className='advertlist'>
                    <li>advertList</li>
                    <li onClick={handleOpen1}>advertList: <b>{selectedAdverts.length}</b></li>
                </ul>
                {/* 연결된 장치리스트 선택*/}
                <ul className='devicelist'>
                    <li>deviceList</li>
                    <li onClick={handleOpen2}>deviceList: <b>{selectedDevices.length}</b></li>
                </ul>
                {/* pType */}
                <ul>
                    <li>planType</li>
                    <li>
                    <select name="planType" id="planType" onChange={onChange} value={inputText.planType}>
                        <option value="0">추가</option>
                        <option value="1">현재파일 재생후 교체</option>
                        <option value="2">즉시교체</option>
                        <option value="3">Clear</option>
                    </select>
                    </li>
                </ul>
                {/* Date */}
                <ul>
                    <li>playDate</li>
                    <li>
                        <input
                            type="text"
                            id="startDate"
                            name="startDate"
                            placeholder='2023-01-01'
                            value={inputText.startDate}
                            onChange={onChange}
                        >
                        </input>
                    </li>
                    <li>
                        <input
                            type="text"
                            id="endDate"
                            name="endDate"
                            placeholder='2099-12-30'
                            value={inputText.endDate}
                            onChange={onChange}
                        >
                        </input>
                    </li>
                </ul>
                {/* Time */}
                <ul>
                    <li>playTime</li>
                    <li>
                        <input
                            type="text"
                            id="startTime"
                            name="startTime"
                            placeholder='00:00:00'
                            value={inputText.startTime}
                            onChange={onChange}
                        >
                        </input>
                    </li>
                    <li>
                        <input
                            type="text"
                            id="endTime"
                            name="endTime"
                            placeholder='23:59:59'
                            value={inputText.endTime}
                            onChange={onChange}
                        >
                        </input>
                    </li>
                </ul>
                {/* Period */}
                <ul className='playPeriod'>
                    <li>playday</li>
                    <li>
                        <input
                            type="checkbox"
                            id="checkbox7"
                            name="checkbox7"
                            checked={checkboxes.checkbox7}
                            onChange={handleCheckboxChange}
                        />
                        매일
                        <input
                            type="checkbox"
                            id="checkbox0"
                            name="checkbox0"
                            checked={checkboxes.checkbox0}
                            onChange={handleCheckboxChange}
                        />
                        일
                        <input
                            type="checkbox"
                            id="checkbox1"
                            name="checkbox1"
                            checked={checkboxes.checkbox1}
                            onChange={handleCheckboxChange}
                        />
                        월
                        <input
                            type="checkbox"
                            id="checkbox2"
                            name="checkbox2"
                            checked={checkboxes.checkbox2}
                            onChange={handleCheckboxChange}
                        />
                        화
                        <input
                            type="checkbox"
                            id="checkbox3"
                            name="checkbox3"
                            checked={checkboxes.checkbox3}
                            onChange={handleCheckboxChange}
                        />
                        수
                        <input
                            type="checkbox"
                            id="checkbox4"
                            name="checkbox4"
                            checked={checkboxes.checkbox4}
                            onChange={handleCheckboxChange}
                        />
                        목
                        <input
                            type="checkbox"
                            id="checkbox5"
                            name="checkbox5"
                            checked={checkboxes.checkbox5}
                            onChange={handleCheckboxChange}
                        />
                        금
                        <input
                            type="checkbox"
                            id="checkbox6"
                            name="checkbox6"
                            checked={checkboxes.checkbox6}
                            onChange={handleCheckboxChange}
                        />
                        토
                    </li>
                </ul>
                <ul className='saveAdvertPlanBtn'>
                    <button className='saveBtn' onClick={editAdvertPlan}>수정</button>
                </ul>
            </div>
            {isOpen1 && <AdvertList onClick={handleClose1} onConfirm={handleAdvertConfirm1}></AdvertList>}
            {isOpen2 && <DeviceList onClick={handleClose2} onConfirm={handleAdvertConfirm2}></DeviceList>}
        </section>
    );
};

export default EditPlan;
