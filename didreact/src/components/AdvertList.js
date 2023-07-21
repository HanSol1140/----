import { useState, useEffect } from 'react';
import "./AdvertList.css";
import axios from 'axios';

const AdvertList = ({ onClick, onConfirm }) => {
    const handleClose1 = () => {
        onClick();
    };
    const [searchText, setSearchText] = useState('');
    const [advertNames, setAdvertNames] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    const onChange = e => {
        setSearchText(e.target.value);
    }
    useEffect(() => {
        async function getAdvertList() {
            try {
                const response = await axios.post(`http://localhost:8083/Api/getAdvertList`, {
                    searchText: searchText
                });
                
                if (response.status === 200) {
                    setAdvertNames(response.data.itemList);
                }
            } catch (error) {
                console.error('Error with API call:', error);
            }
        }
        getAdvertList();
    },[searchText]);
    
    const [selectedAdverts, setSelectedAdverts] = useState([]);
    const handleAdvertClick = (id) => {
        const advert = advertNames.find(item => item.id === id);
        const isSelected = selectedAdverts.find(selectedAdvert => selectedAdvert.id === id);
        if (isSelected) {
            setSelectedAdverts(selectedAdverts.filter((selectedAdvert) => selectedAdvert.id !== id));
        } else {
            setSelectedAdverts([...selectedAdverts, advert]);
        }
    };
    

    const handleConfirm1 = () => {
        onConfirm(selectedAdverts);
        handleClose1();
    };

    return (
        <section id="AdvertList">
            <div className='blackbox' onClick={handleClose1}></div>
            <div className='advertlist'>
                <article>
                    <h2>AdvertList</h2>
                    <button onClick={handleConfirm1}>확인</button>
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
                    {advertNames.map((item, index) => (
                        <div
                            className={`advertList ${selectedIds.includes(item.id) ? 'selected' : ''}`}
                            key={index}
                            onClick={() => handleAdvertClick(item.id)}
                        >
                            <ul>
                                <li>{item.itemName}</li>
                                <li>{item.id}</li>
                            </ul>
                        </div>
                    ))}
                </article>
                <article className='choiceBox'>
                    <h2>선택목록</h2>
                    {selectedAdverts.map((selectedAdvert) => {
                        return (
                            <div 
                                className='choicelist'
                                key={selectedAdvert.id} 
                                onClick={() => handleAdvertClick(selectedAdvert.id)}
                            >
                                {selectedAdvert.itemName}
                            </div>
                        );
                    })}
                </article>

            </div>

        </section>
    );
};

export default AdvertList;
