import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ChatPage from "./pages/Chat";
import RequireAdmin from "./components/RequireAdmin";

import './App.css'
import AdminPage from "./pages/Admin";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/SignUp";
import { useLenis } from "./hooks/useLenis";

function App() {
  
  useLenis();
  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminPage/>}/>
        </Route>
        
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
