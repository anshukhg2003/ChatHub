import React, { useState } from "react";
import "./Chat.css";

import LeftSideBar from "../../Components/LefSideBar/LeftSideBar";
import ChatBox from "../../Components/ChatBox/ChatBox";
import RightSideBar from "../../Components/RightSideBar/RightSideBar";

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="chat">
      <div className="chat-container">

        {/* LEFT SIDEBAR */}
        <div
          className={`chat-left ${
            selectedUser ? "mobile-hide" : ""
          }`}
        >
          <LeftSideBar
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>

        {/* CHAT BOX */}
        <div
          className={`chat-center ${
            selectedUser ? "mobile-show" : ""
          }`}
        >
          <ChatBox
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="chat-right">
          <RightSideBar selectedUser={selectedUser} />
        </div>

      </div>
    </div>
  );
};

export default Chat;