import React, { useState, useEffect } from 'react';
import './ConnectList.css';
const ConnectList = ({ onClick, editPlan }) => {
    const [cMarksNames, setcMarksNames] = useState([]);
    const [itemNames, setItemNames] = useState([]);
    const closeConnectList = () => {
        onClick();
    };
    useEffect(() => {
        // console.log(editPlan.planName);
        // console.log(editPlan.itemNames);
        // console.log(editPlan.itemIds);
        // console.log(editPlan.cMarksNames); // 1advert,2advert,3advert
        // console.log(editPlan.cMarksIds); // 2608728477@88@77@000001,2612840543@88@77@000001,2614856897@88@77@000001
        // console.log(editPlan.sDate);
        // console.log(editPlan.eDate);
        // console.log(editPlan.beginTime);
        // console.log(editPlan.endTime);
        // console.log(editPlan.pType);
        // console.log(editPlan.pCycle);
        if(editPlan.cMarksNames) {
            const cMarksArray = editPlan.cMarksNames.split(",");
            setcMarksNames(cMarksArray); // 상태 업데이트
        }

        if(editPlan.itemNames) {
            const namesArray = editPlan.itemNames.split(",");
            setItemNames(namesArray); // 상태 업데이트
        }
    }, []);

    return (
        <section id="ConnectList">
            <div className='blackbox' onClick={closeConnectList}></div>
            <div className='connectlist'>
                <article className='connectlist_title'>
                    <h2>ConnectList</h2>
                    <p onClick={closeConnectList}><span></span><span></span></p>
                </article>
                <article>
                    <div>
                        <h2>선택된 advert 목록</h2>
                        {itemNames.map((item, index) => (
                            <ul key={index} className='advertlist'>
                                <li>
                                    {item}
                                </li>
                            </ul>
                        ))}
                    </div>
                    <div>
                        <h2>선택된 device 목록</h2>
                        {cMarksNames.map((item, index) => (
                            <ul key={index} className='devicelist'>
                                <li>
                                    {item}
                                </li>
                            </ul>
                        ))}
                    </div>
                </article>
            </div>
        </section>
    );
};

export default ConnectList;