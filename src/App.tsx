import './App.css'
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Auth from "./Auth";
import "bootstrap/dist/css/bootstrap.min.css"
import Game from "./Game";
function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/index.html" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
