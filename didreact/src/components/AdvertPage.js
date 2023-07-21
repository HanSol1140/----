import { useState, useEffect } from 'react';
import axios from 'axios';
import "./AdvertPage.css";


const AdvertPage = () => {
    const [searchText, setSearchText] = useState('');
    const [advertNames, setAdvertNames] = useState([]);


    useEffect(() => {
        async function getAdvertList() {
            try {
                const response = await axios.post(`http://localhost:8083/Api/getAdvertList`, {
                    searchText: searchText
                });
                if (await response.status === 200) {
                    console.log(response.data);
                    for(var i=0; i < response.data.itemList.length; i++){
                        // console.log(response.data.itemList[i].itemName);
                        setAdvertNames(response.data.itemList);
                    }
                }
            } catch (error) {
                console.error('Error with API call:', error);
                console.log("error : ", error);
            }
        }
        getAdvertList();
    }, []);


    return (
        <section id="AdvertPage">
            <div className='category'>
                <ul>
                    <li>광고Name</li>
                    <li>광고ID</li>
                </ul>
            </div>
            {advertNames.map((item, index) => (
                <div className='advertList' key={index}>
                    <ul>
                        <li>{item.itemName}</li>
                        <li>{item.id}</li>
                    </ul>
                </div>
            ))}
        </section>
    );
};

export default AdvertPage;