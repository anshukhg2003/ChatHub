import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login/Login";
import ProfileUpdate from "./Pages/ProfileUpdate/ProfileUpdate";
import Chat from "./Pages/Chat/Chat";

const App = () => {
  return (
    <Routes>
      {/* LOGIN */}

      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />

      {/* PROFILE UPDATE */}

      <Route path="/profile-update" element={<ProfileUpdate />} />

      {/* CHAT PAGE */}

      <Route path="/chat" element={<Chat />} />

      {/* UNKNOWN ROUTE */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
