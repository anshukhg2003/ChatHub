import React, { useEffect, useState } from "react";

import "./LeftSideBar.css";

import assets from "../../assets/assets";

import { supabase } from "../../Config/SupabaseClient";

import { useNavigate } from "react-router-dom";

const LeftSideBar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [showMenu, setShowMenu] = useState(false);

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  // =====================================================
  // GET USERS + LAST MESSAGES
  // =====================================================

  const getUsers = async () => {
    try {
      // -------------------------------------------------
      // CURRENT USER
      // -------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      setCurrentUser(user);

      // -------------------------------------------------
      // GET PROFILES
      // -------------------------------------------------

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("full_name", {
          ascending: true,
        });

      if (profileError) {
        throw profileError;
      }

      const allUsers = profileData || [];

      // -------------------------------------------------
      // GET ALL MESSAGES
      // -------------------------------------------------

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          message,
          message_type,
          media_url,
          created_at,
          updated_at
        `,
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", {
          ascending: false,
        });

      if (messageError) {
        console.error("Sidebar message error:", messageError);

        setUsers(
          allUsers.map((profile) => ({
            ...profile,
            lastMessage: null,
            lastMessageAt: null,
            unreadCount: 0,
          })),
        );

        return;
      }

      const allMessages = messageData || [];

      // -------------------------------------------------
      // ADD LAST MESSAGE TO USERS
      // -------------------------------------------------

      const usersWithMessages = allUsers.map((profile) => {
        const conversationMessages = allMessages.filter((message) => {
          return (
            (message.sender_id === user.id &&
              message.receiver_id === profile.id) ||
            (message.sender_id === profile.id &&
              message.receiver_id === user.id)
          );
        });

        // Because messages are already ordered
        // newest first, [0] is the latest message.

        const lastMessage = conversationMessages[0] || null;

        return {
          ...profile,

          lastMessage,

          lastMessageAt: lastMessage?.created_at || null,

          unreadCount: 0,
        };
      });

      // -------------------------------------------------
      // SORT USERS
      // -------------------------------------------------

      usersWithMessages.sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt) {
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        }

        if (a.lastMessageAt) {
          return -1;
        }

        if (b.lastMessageAt) {
          return 1;
        }

        return (a.full_name || "")
          .toLowerCase()
          .localeCompare((b.full_name || "").toLowerCase());
      });

      setUsers(usersWithMessages);
    } catch (error) {
      console.error("Error loading users:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    getUsers();
  }, []);

  // =====================================================
  // PROFILE REALTIME
  // =====================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase

      .channel("profiles-changes")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },

        (payload) => {
          // ---------------------------------------------
          // NEW USER
          // ---------------------------------------------

          if (payload.eventType === "INSERT") {
            const newUser = payload.new;

            if (newUser.id === currentUser.id) {
              return;
            }

            setUsers((previousUsers) => {
              const exists = previousUsers.some(
                (user) => user.id === newUser.id,
              );

              if (exists) {
                return previousUsers;
              }

              return [
                ...previousUsers,
                {
                  ...newUser,
                  lastMessage: null,
                  lastMessageAt: null,
                  unreadCount: 0,
                },
              ];
            });
          }

          // ---------------------------------------------
          // UPDATE PROFILE
          // ---------------------------------------------

          if (payload.eventType === "UPDATE") {
            const updatedUser = payload.new;

            if (updatedUser.id === currentUser.id) {
              return;
            }

            setUsers((previousUsers) =>
              previousUsers.map((user) => {
                if (user.id !== updatedUser.id) {
                  return user;
                }

                return {
                  ...user,
                  ...updatedUser,
                };
              }),
            );
          }

          // ---------------------------------------------
          // DELETE USER
          // ---------------------------------------------

          if (payload.eventType === "DELETE") {
            const deletedUser = payload.old;

            setUsers((previousUsers) =>
              previousUsers.filter((user) => user.id !== deletedUser.id),
            );
          }
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // =====================================================
  // MESSAGE REALTIME
  // =====================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const channel = supabase

      .channel(`sidebar-messages-${currentUser.id}`)

      // =================================================
      // INSERT MESSAGE
      // =================================================

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },

        (payload) => {
          const newMessage = payload.new;

          // ------------------------------------------------
          // MESSAGE MUST INVOLVE CURRENT USER
          // ------------------------------------------------

          const isConversation =
            newMessage.sender_id === currentUser.id ||
            newMessage.receiver_id === currentUser.id;

          if (!isConversation) {
            return;
          }

          // ------------------------------------------------
          // FIND OTHER USER
          // ------------------------------------------------

          const otherUserId =
            newMessage.sender_id === currentUser.id
              ? newMessage.receiver_id
              : newMessage.sender_id;

          // ------------------------------------------------
          // DID SOMEONE ELSE SEND IT?
          // ------------------------------------------------

          const isReceivedMessage =
            newMessage.receiver_id === currentUser.id &&
            newMessage.sender_id !== currentUser.id;

          setUsers((previousUsers) => {
            const updatedUsers = previousUsers.map((user) => {
              if (user.id !== otherUserId) {
                return user;
              }

              // --------------------------------------
              // RECEIVED MESSAGE
              // --------------------------------------

              if (isReceivedMessage) {
                const isCurrentlyOpen = selectedUser?.id === otherUserId;

                return {
                  ...user,

                  lastMessage: newMessage,

                  lastMessageAt: newMessage.created_at,

                  unreadCount: isCurrentlyOpen
                    ? 0
                    : (user.unreadCount || 0) + 1,
                };
              }

              // --------------------------------------
              // MY MESSAGE
              // --------------------------------------

              return {
                ...user,

                lastMessage: newMessage,

                lastMessageAt: newMessage.created_at,
              };
            });

            // ------------------------------------------------
            // SORT
            // ------------------------------------------------

            updatedUsers.sort((a, b) => {
              if (a.unreadCount > 0 && b.unreadCount === 0) {
                return -1;
              }

              if (a.unreadCount === 0 && b.unreadCount > 0) {
                return 1;
              }

              if (a.lastMessageAt && b.lastMessageAt) {
                return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
              }

              if (a.lastMessageAt) {
                return -1;
              }

              if (b.lastMessageAt) {
                return 1;
              }

              return 0;
            });

            return updatedUsers;
          });
        },
      )

      // =================================================
      // UPDATE MESSAGE
      // =================================================

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },

        (payload) => {
          const updatedMessage = payload.new;

          const isConversation =
            updatedMessage.sender_id === currentUser.id ||
            updatedMessage.receiver_id === currentUser.id;

          if (!isConversation) {
            return;
          }

          const otherUserId =
            updatedMessage.sender_id === currentUser.id
              ? updatedMessage.receiver_id
              : updatedMessage.sender_id;

          setUsers((previousUsers) =>
            previousUsers.map((user) => {
              if (user.id !== otherUserId) {
                return user;
              }

              return {
                ...user,

                lastMessage: updatedMessage,

                lastMessageAt: updatedMessage.created_at,
              };
            }),
          );
        },
      )

      // =================================================
      // DELETE MESSAGE
      // =================================================

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },

        async (payload) => {
          console.log("Sidebar DELETE detected:", payload);

          /*
           * IMPORTANT:
           *
           * After deleting a message from ChatBox,
           * reload the sidebar messages.
           *
           * This prevents the deleted message from
           * remaining visible as the last message.
           */

          try {
            await getUsers();
          } catch (error) {
            console.error("Sidebar refresh after delete failed:", error);
          }
        },
      )

      .subscribe((status) => {
        console.log("Sidebar realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedUser]);

  // =====================================================
  // SELECT USER
  // =====================================================

  const handleSelectUser = (user) => {
    setUsers((previousUsers) =>
      previousUsers.map((item) => {
        if (item.id === user.id) {
          return {
            ...item,
            unreadCount: 0,
          };
        }

        return item;
      }),
    );

    setSelectedUser(user);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredUsers = users.filter((user) => {
    const userName = user.full_name || "";

    return userName.toLowerCase().includes(search.trim().toLowerCase());
  });

  // =====================================================
  // LAST MESSAGE TEXT
  // =====================================================

  const getLastMessageText = (user) => {
    const lastMessage = user.lastMessage;

    if (!lastMessage) {
      return "Click to chat";
    }

    if (lastMessage.message_type === "image") {
      return lastMessage.message ? `📷 ${lastMessage.message}` : "📷 Photo";
    }

    if (lastMessage.message_type === "video") {
      return lastMessage.message ? `🎥 ${lastMessage.message}` : "🎥 Video";
    }

    return lastMessage.message || "Message";
  };

  // =====================================================
  // TIME
  // =====================================================

  const formatLastMessageTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    const now = new Date();

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const yesterday = new Date(now);

    yesterday.setDate(now.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  // =====================================================
  // EDIT PROFILE
  // =====================================================

  const handleEditProfile = () => {
    setShowMenu(false);

    navigate("/profile-update");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="ls">
        <p
          style={{
            color: "white",
            padding: "20px",
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  // =====================================================
  // JSX
  // =====================================================

  return (
    <div className="ls">
      {/* =================================================
          TOP
      ================================================= */}

      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.Chathub_heading4} alt="" className="logo" />

          <div className="menu">
            <img
              src={assets.menu_icon}
              alt=""
              onClick={() => setShowMenu(!showMenu)}
            />

            {showMenu && (
              <div className="sub-menu active-menu">
                <p onClick={handleEditProfile}>Edit Profile</p>

                <hr />

                <p onClick={handleLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />

          <input
            type="text"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* =================================================
          USERS
      ================================================= */}

      <div className="ls-list">
        {filteredUsers.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              marginTop: "30px",
              color: "#9f9f9f",
              fontSize: "13px",
            }}
          >
            {search ? "No user found" : "No users available"}
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUser?.id === user.id;

            const hasUnread = (user.unreadCount || 0) > 0;

            return (
              <div
                key={user.id}
                className={`
                    friends
                    ${hasUnread ? "unread-chat" : ""}
                    ${isSelected ? "selected-chat" : ""}
                  `}
                onClick={() => handleSelectUser(user)}
              >
                {/* PROFILE */}

                <img src={user.avatar_url || assets.profile_img} alt="" />

                {/* USER INFO */}

                <div>
                  <p>{user.full_name || "ChatHub User"}</p>

                  <span>{getLastMessageText(user)}</span>
                </div>

                {/* RIGHT SIDE */}

                <div className="chat-list-right">
                  {user.lastMessageAt && (
                    <small className="last-message-time">
                      {formatLastMessageTime(user.lastMessageAt)}
                    </small>
                  )}

                  {/* UNREAD BADGE */}

                  {hasUnread && (
                    <span className="unread-badge">
                      {user.unreadCount > 99 ? "99+" : user.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
