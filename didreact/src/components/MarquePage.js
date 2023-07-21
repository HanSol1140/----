import { useState, useEffect } from 'react';
import axios from 'axios';
import "./MarquePage.css";


const MarquePage = () => {
    const [searchText, setSearchText] = useState('');
    const [marqueNames, setMarqueNames] = useState([]);


    useEffect(() => {
        async function getMarqueList() {
            try {
                const response = await axios.post(`http://localhost:8083/Api/getMarqueList`, {
                    searchText: searchText
                });
                if (await response.status === 200) {
                    // console.log(response.data.list[i].title);
                    for(var i=0; i < response.data.list.length; i++){
                        console.log(response.data.list[i].title);
                        console.log(response.data.list);
                        setMarqueNames(response.data.list);
                    }
                }
            } catch (error) {
                console.error('Error with API call:', error);
                console.log("error : ", error);
            }
        }
        getMarqueList();
    }, []);


    return (
        <section id="MarquePage">
            <div className='category'>
                <ul>
                    <li>MarqueName</li>
                    <li>MarqueText</li>
                </ul>
            </div>
            {marqueNames.map((item, index) => (
                <div className='advertList' key={index}>
                    <ul>
                        <li>{item.title}</li>
                        <li>{item.sContent}</li>
                    </ul>
                </div>
            ))}
        </section>
    );
};

export default MarquePage;