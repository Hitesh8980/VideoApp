import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./components/Lobby";
import VideoCall from "./components/Videocall";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:roomId" element={<VideoCall />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
