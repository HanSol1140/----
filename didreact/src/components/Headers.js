import { Link } from 'react-router-dom';
import './Headers.css';

const Headers = () => {
    return (
        <section id = "Headers">
            <ul>
            <Link to="/" className='link'><li>Advert List</li></Link>
            <Link to="/marque" className='link'><li>Marque List</li></Link>
            <Link to="plan" className='link'><li>Advert Plan</li></Link>
            </ul>
        </section>
    );
};

export default Headers;