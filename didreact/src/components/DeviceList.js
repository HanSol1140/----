import { useState, useEffect } from 'react';
import "./DeviceList.css";
import axios from 'axios';

const DeviceList = ({ onClick, onConfirm }) => {
    const handleClose2 = () => {
        onClick();
    };
    const [searchText, setSearchText] = useState('');
    const [deviceList, setDeviceList] = useState([]);
    

    const onChange = e => {
        setSearchText(e.target.value);
    }

    useEffect(() => {
        async function getDeviceList() {
            try {
                const response = await axios.post(`http://localhost:8083/Api/getDeviceList`, {
                    searchText: searchText,
                });
                if (response.status === 200) {
                    setDeviceList(response.data.devs);
                }
            } catch (error) {
                console.error('Error with API call:', error);
            }
        }
        getDeviceList();
    }, [searchText]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const handleDeviceClick = (cName) => {
        const device = deviceList.find(item => item.cName === cName);
        const isSelected = selectedDevices.find(selectedDevice => selectedDevice.cName === cName);
        if (isSelected) {
            setSelectedDevices(selectedDevices.filter((selectedDevice) => selectedDevice.cName !== cName));
        } else {
            setSelectedDevices([...selectedDevices, device]);
        }
    };
    

    const handleConfirm2 = () => {
        onConfirm(selectedDevices);
        handleClose2();
    };

    return (
        <section id="DeviceList">
            <div className='blackbox' onClick={handleClose2}></div>
            <div className='devicelist'>
                <article>
                    <h2>DeviceList</h2>
                    <button onClick={handleConfirm2}>확인</button>
                </article>
                <article>
                    <ul>
                        <li><h2>검색어</h2></li>
                        <li>
                            <input
                                type="text"
                                value={searchText}
                                onChange={onChange}
                            ></input>
                        </li>
                    </ul>
                    {deviceList.map((item, index) => (
                        <div
                            className={`deviceList ${selectedDevices.includes(item.cName) ? 'selected' : ''}`}
                            key={index}
                            onClick={() => handleDeviceClick(item.cName)}
                        >
                            <ul>
                                <li>{item.cName}</li>
                                <li>{item.cMark}</li>
                            </ul>
                        </div>
                    ))}
                </article>

 


               
                <article className='choiceBox'>
                    <h2>선택된 디바이스</h2>
                    {selectedDevices.map((selectedDevice) => {
                        return (
                            <div 
                                className='choicelist'
                                key={selectedDevice.cName} 
                                onClick={() => handleDeviceClick(selectedDevice.cName)}
                            >
                                {selectedDevice.cName}
                            </div>
                        );
                    })}
                </article>

            </div>
        </section>
    );
};

export default DeviceList;
