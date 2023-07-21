import React, { useState, useEffect } from 'react';
import Modal1 from './Modal1.js'; // 모달 컴포넌트를 import합니다.
import EditPlan from './EditPlan.js';
import ConnectList from './ConnectList.js';
import axios from 'axios';
import './PlanPage.css';

const PlanPage = () => {

    // 실행될때 advertPlanList 다운로드



    const [searchText, setSearchText] = useState('');
    const onChange = e => {
        setSearchText(e.target.value);
    }
    const [planList, setPlanList] = useState([]);

    async function getAdvertPlanList() {
        try {
            const response = await axios.post(`http://localhost:8083/Api/getAdvertPlanList`, { 
                searchText: searchText // 검색 텍스트를 서버에 전달
            });
            if (response.status === 200) {
                setPlanList(response.data);
            }
        } catch (error) {
            console.error('Error with API call:', error);
        }
    }

    // 모달창 open을 위한 state
    const [isOpen, setIsOpen] = useState(false);
    const openPage = () => {
        setIsOpen(true);
    };
    const closePage = () => {
        setIsOpen(false);
        getAdvertPlanList();
    };


    // 생성한 advertPlan DID에 업로드하기
    async function distAdvertPlan(planName) {
        try {
            const response = await axios.post(`http://localhost:8083/Api/distAdvertPlan`, {
                planName: planName
            });
            if (response.status === 200) {
                console.log("distAdvertPlan값 전송완료");
                console.log(response.data);
            }
        } catch (error) {
            console.error('Error with API call:', error);
        }
    }


    // 체크해서 삭제하기


    //체크관련
    const [checkedItems, setCheckedItems] = useState({}); // 초기에는 모두 체크되지 않은 상태
    const handleCheckChange = (event, planName) => {
        if (event.target.checked) {
            setCheckedItems({ ...checkedItems, [planName]: event.target.checked });
        } else {
            const newCheckedItems = { ...checkedItems };
            delete newCheckedItems[planName];
            setCheckedItems(newCheckedItems);
        }
    };
    const handleCheckAllChange = (event) => {
        if (event.target.checked) {
            const newCheckedItems = planList.reduce((acc, curr) => {
                acc[curr.planName] = true;
                return acc;
            }, {});
            setCheckedItems(newCheckedItems);
        } else {
            setCheckedItems({});
        }
    }
    async function deleteAdvertPlan() {
        const itemsToDelete = Object.keys(checkedItems).filter(item => checkedItems[item]);
        try {
            const response = await axios.post(`http://localhost:8083/Api/deleteAdvertPlan`, {
                itemsToDelete
            });
            if (response.status === 200) {
                console.log("deleteAdvertPlan완료");
                window.location.reload();
            }
        } catch (error) {
            console.error('Error with API call:', error);
        }
    }



    // edit
    const [isEdit, setIsEdit] = useState(false);
    const [editPlan, setEditPlan] = useState([]);
    async function openAdvertPlan(planName) {
        try {
            const response = await axios.post(`http://localhost:8083/Api/openAdvertPlan`, {
                planName: planName
            });
            if (await response.status === 200) {
                console.log("editAdvertPlan값 수신완료");
                setEditPlan(response.data);
            }
        } catch (error) {
            console.error('Error with API call:', error);
        }
    };
    const openEdit = (planName) => {
        openAdvertPlan(planName);
        setTimeout(() => {
            setIsEdit(true);
            // console.log(editPlan);
        }, 100);

    };
    const closeEdit = () => {
        setIsEdit(false);
        getAdvertPlanList();
    };

    // 연결목록 검색(ConnectList)
    const [isConnectList, setIsConnectList] = useState(false);
    const openConnectList = (planName) => {
        openAdvertPlan(planName);
        setTimeout(() => {
            setIsConnectList(true);
            // console.log(editPlan);
        }, 100);
    };
    const closeConnectList = () => {
        setIsConnectList(false);
        getAdvertPlanList();
    };


    useEffect(() => {
        getAdvertPlanList();
    }, [searchText]);

    return (
        <section id="PlanPage">
            <div className='PlanPageBtn'>
                <ul>
                    <input
                        type="checkbox"
                        onChange={handleCheckAllChange}
                    />
                    <li onClick={openPage}>추가</li>
                    <li onClick={deleteAdvertPlan}>삭제</li>
                </ul>

                    
                <input
                    type='text'
                    value={searchText}
                    placeholder='검색어 입력'
                    onChange={onChange}

                />
                    

            </div>
            <div className='planList'>
                {planList.map((item, index) => (
                    <ul
                        key={index}
                    >
                        <li>
                            <input
                                type="checkbox"
                                // onChange={(e) => handleCheckChange(e, item.planName)}
                                checked={checkedItems[item.planName] || false}
                                onChange={(e) => handleCheckChange(e, item.planName)}
                            >
                            </input>{item.planName}
                        </li>
                        <li>
                            <ul>
                                <li onClick={() => distAdvertPlan(item.planName)}>dist</li>
                                <li onClick={() => openEdit(item.planName)}>edit</li>
                                <li onClick={() => openConnectList(item.planName)}>ConnectList</li>
                            </ul>
                        </li>

                    </ul>
                ))}
            </div>
            {isOpen && <Modal1 onClick={closePage}></Modal1>}
            {isEdit && <EditPlan onClick={closeEdit} editPlan={editPlan}></EditPlan>}
            {isConnectList && <ConnectList onClick={closeConnectList} editPlan={editPlan}></ConnectList>}
        </section>
    );
};

export default PlanPage;
