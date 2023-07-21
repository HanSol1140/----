import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Headers from './components/Headers';
import AdvertPage from './components/AdvertPage';
import PlanPage from './components/PlanPage';
import MarquePage from './components/MarquePage';

import './App.css';

const App = () => {

    return (
        <Router>
            <div className="App">
                <Headers></Headers>
                <Routes>
                    <Route path="/" element={<AdvertPage />} />
                    <Route path="/plan" element={<PlanPage />} />
                    <Route path="/marque" element={<MarquePage />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
