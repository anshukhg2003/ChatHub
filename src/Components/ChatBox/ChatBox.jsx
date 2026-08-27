import React, { useEffect, useRef, useState } from "react";
import "./ChatBox.css";

import assets from "../../assets/assets";
import { supabase } from "../../Config/SupabaseClient";
import EmojiPicker from "emoji-picker-react";

const CHAT_MEDIA_BUCKET = "chat-media";

const ChatBox = ({ selectedUser }) => {
  // =====================================================
  // STATE
  // =====================================================

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // =====================================================
  // EMOJI STATE
  // =====================================================

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // =====================================================
  // MEDIA STATE
  // =====================================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // =====================================================
  // EDIT STATE
  // =====================================================

  const [editingMessage, setEditingMessage] = useState(null);

  // =====================================================
  // MENU STATE
  // =====================================================

  const [openMenuId, setOpenMenuId] = useState(null);

  // =====================================================
  // REFS
  // =====================================================

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // =====================================================
  // GET CURRENT SESSION
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error.message);

        return;
      }

      if (mounted) {
        setSession(data.session);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
        }
      },
    );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // LOAD CHAT MESSAGES
  // =====================================================

  useEffect(() => {
    setShowEmojiPicker(false);
    setOpenMenuId(null);
    setEditingMessage(null);
    setNewMessage("");

    if (!session?.user?.id || !selectedUser?.id) {
      setMessages([]);

      return;
    }

    const loadMessages = async () => {
      setLoading(true);

      const currentUserId = session.user.id;

      const receiverId = selectedUser.id;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error("Error loading messages:", error);

        setLoading(false);

        return;
      }

      setMessages(data || []);

      setLoading(false);
    };

    loadMessages();
  }, [session, selectedUser]);

  // =====================================================
  // REALTIME CHAT
  // =====================================================

  useEffect(() => {
    if (!session?.user?.id || !selectedUser?.id) {
      return;
    }

    const currentUserId = session.user.id;

    const receiverId = selectedUser.id;

    const channelId = [currentUserId, receiverId].sort().join("-");

    const channel = supabase
      .channel(`chat-${channelId}`)

      // =================================================
      // INSERT
      // =================================================

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;

          const belongsToChat =
            (message.sender_id === currentUserId &&
              message.receiver_id === receiverId) ||
            (message.sender_id === receiverId &&
              message.receiver_id === currentUserId);

          if (!belongsToChat) {
            return;
          }

          setMessages((previousMessages) => {
            const exists = previousMessages.some(
              (item) => item.id === message.id,
            );

            if (exists) {
              return previousMessages;
            }

            return [...previousMessages, message];
          });
        },
      )

      // =================================================
      // UPDATE
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

          setMessages((previousMessages) =>
            previousMessages.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message,
            ),
          );
        },
      )

      // =================================================
      // DELETE
      // =================================================

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const deletedMessage = payload.old;

          setMessages((previousMessages) =>
            previousMessages.filter(
              (message) => message.id !== deletedMessage.id,
            ),
          );
        },
      )

      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, selectedUser]);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =====================================================
  // EMOJI CLICK
  // =====================================================

  const handleEmojiClick = (emojiData) => {
    setNewMessage((previousMessage) => previousMessage + emojiData.emoji);

    setShowEmojiPicker(false);
  };

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File size must be less than 50MB.");

      e.target.value = "";

      return;
    }

    const isImage = file.type.startsWith("image/");

    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Only image and video files are allowed.");

      e.target.value = "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);
  };

  // =====================================================
  // REMOVE SELECTED FILE
  // =====================================================

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // UPLOAD IMAGE / VIDEO
  // =====================================================

  const uploadFile = async (file) => {
    if (!session?.user?.id) {
      throw new Error("User is not logged in.");
    }

    if (!file) {
      throw new Error("No file selected.");
    }

    const isImage = file.type.startsWith("image/");

    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("Only image and video files are allowed.");
    }

    const messageType = isImage ? "image" : "video";

    const extension = file.name.split(".").pop()?.toLowerCase() || "file";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const folder = isImage ? "images" : "videos";

    const filePath = `${folder}/${session.user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("SUPABASE STORAGE ERROR:", uploadError);

      throw uploadError;
    }

    console.log("Upload successful:", uploadData);

    const { data: publicUrlData } = supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Unable to generate media URL.");
    }

    return {
      url: publicUrlData.publicUrl,

      type: messageType,

      path: filePath,
    };
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async (e) => {
    e.preventDefault();

    if (sending || uploading) {
      return;
    }

    if (!session?.user?.id) {
      console.error("User is not logged in.");

      return;
    }

    if (!selectedUser?.id) {
      console.error("No user selected.");

      return;
    }

    // =================================================
    // EDIT MESSAGE
    // =================================================

    if (editingMessage) {
      await updateMessage();

      return;
    }

    const text = newMessage.trim();

    if (!text && !selectedFile) {
      return;
    }

    setSending(true);

    try {
      let mediaUrl = null;

      let messageType = "text";

      // =================================================
      // UPLOAD MEDIA
      // =================================================

      if (selectedFile) {
        setUploading(true);

        const uploaded = await uploadFile(selectedFile);

        mediaUrl = uploaded.url;

        messageType = uploaded.type;

        setUploading(false);
      }

      // =================================================
      // INSERT MESSAGE
      // =================================================

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: session.user.id,

          receiver_id: selectedUser.id,

          message: text || null,

          message_type: messageType,

          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // =================================================
      // ADD LOCALLY
      // =================================================

      setMessages((previousMessages) => {
        const exists = previousMessages.some((item) => item.id === data.id);

        if (exists) {
          return previousMessages;
        }

        return [...previousMessages, data];
      });

      setNewMessage("");

      setShowEmojiPicker(false);

      removeSelectedFile();
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      alert(error?.message || "Failed to send message.");
    } finally {
      setSending(false);

      setUploading(false);
    }
  };

  // =====================================================
  // START EDIT
  // =====================================================

  const startEditMessage = (message) => {
    if (message.sender_id !== session?.user?.id) {
      return;
    }

    if (message.message_type !== "text") {
      return;
    }

    setEditingMessage(message);

    setNewMessage(message.message || "");

    setShowEmojiPicker(false);

    setOpenMenuId(null);
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const cancelEdit = () => {
    setEditingMessage(null);

    setNewMessage("");

    setShowEmojiPicker(false);
  };

  // =====================================================
  // UPDATE MESSAGE
  // =====================================================

  const updateMessage = async () => {
    const text = newMessage.trim();

    if (!text || !editingMessage) {
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .update({
          message: text,

          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMessage.id)
        .eq("sender_id", session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Update message error:", error);

        alert(error.message);

        return;
      }

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === data.id ? data : message,
        ),
      );

      cancelEdit();
    } catch (error) {
      console.error("Update error:", error);

      alert(error.message || "Failed to edit message.");
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // DELETE MESSAGE
  // =====================================================

  const deleteMessage = async (message) => {
    if (!session?.user?.id) {
      return;
    }

    if (message.sender_id !== session.user.id) {
      return;
    }

    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .delete()
        .eq("id", message.id)
        .eq("sender_id", session.user.id)
        .select();

      if (error) {
        console.error("SUPABASE DELETE ERROR:", error);

        alert(error.message);

        return;
      }

      if (!data || data.length === 0) {
        alert("Message was not deleted. Check your Supabase DELETE policy.");

        return;
      }

      setMessages((previousMessages) =>
        previousMessages.filter((item) => item.id !== message.id),
      );

      setOpenMenuId(null);
    } catch (error) {
      console.error("Unexpected delete error:", error);

      alert(error.message || "Something went wrong while deleting.");
    }
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage(e);
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // CLEANUP PREVIEW URL
  // =====================================================

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // =====================================================
  // NO USER SELECTED
  // =====================================================

  if (!selectedUser) {
    return (
      <div className="chat-box">
        <div className="chat-empty">
          <img src={assets.ChatHub_icon2} alt="ChatHub" />

          <h2>Chat anytime, anywhere</h2>

          <p>Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // CHAT UI
  // =====================================================

  return (
    <div className="chat-box">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="chat-user">
        <img src={selectedUser.avatar_url || assets.profile_img} alt="User" />

        <div className="chat-user-info">
          <p>{selectedUser.full_name || "Unknown User"}</p>

          <span>online</span>
        </div>

        <img src={assets.help_icon} alt="Help" className="help" />
      </div>

      {/* =================================================
          MESSAGE AREA
      ================================================= */}

      <div
        className="chat-msg"
        onClick={() => {
          setOpenMenuId(null);

          setShowEmojiPicker(false);
        }}
      >
        {/* LOADING */}

        {loading && <div className="chat-loading">Loading messages...</div>}

        {/* EMPTY */}

        {!loading && messages.length === 0 && (
          <div className="no-message">
            <p>No messages yet 👋</p>

            <span>Send a message to start chatting</span>
          </div>
        )}

        {/* =================================================
            MESSAGES
        ================================================= */}

        {!loading &&
          messages.map((msg) => {
            const isMyMessage = msg.sender_id === session?.user?.id;

            const isEdited =
              msg.updated_at &&
              new Date(msg.updated_at).getTime() >
                new Date(msg.created_at).getTime() + 1000;

            return (
              <div
                key={msg.id}
                className={
                  isMyMessage ? "message-row sent" : "message-row received"
                }
              >
                <div
                  className="message-bubble"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* =================================================
                      IMAGE
                  ================================================= */}

                  {msg.message_type === "image" && msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="Shared"
                      className="chat-media-image"
                    />
                  )}

                  {/* =================================================
                      VIDEO
                  ================================================= */}

                  {msg.message_type === "video" && msg.media_url && (
                    <video
                      src={msg.media_url}
                      className="chat-media-video"
                      controls
                      playsInline
                    />
                  )}

                  {/* =================================================
                      TEXT + EMOJI
                  ================================================= */}

                  {msg.message && <p>{msg.message}</p>}

                  {/* =================================================
                      TIME
                  ================================================= */}

                  <span className="message-time">
                    {isEdited && <span className="edited-label">edited</span>}

                    {formatTime(msg.created_at)}

                    {isMyMessage && <span className="message-check">✓✓</span>}
                  </span>

                  {/* =================================================
                      MESSAGE MENU
                  ================================================= */}

                  {isMyMessage && (
                    <div className="message-menu">
                      <button
                        type="button"
                        className="message-menu-trigger"
                        onClick={() =>
                          setOpenMenuId(openMenuId === msg.id ? null : msg.id)
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId === msg.id && (
                        <div className="message-menu-dropdown">
                          {/* EDIT */}

                          {msg.message_type === "text" && (
                            <button
                              type="button"
                              onClick={() => startEditMessage(msg)}
                            >
                              ✏️ Edit
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-option"
                            onClick={() => deleteMessage(msg)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* =================================================
          MEDIA PREVIEW
      ================================================= */}

      {selectedFile && previewUrl && (
        <div className="media-preview">
          <div className="media-preview-content">
            {selectedFile.type.startsWith("image/") ? (
              <img src={previewUrl} alt="Preview" />
            ) : (
              <video src={previewUrl} controls />
            )}

            <button type="button" onClick={removeSelectedFile}>
              ×
            </button>
          </div>

          <span>{selectedFile.name}</span>
        </div>
      )}

      {/* =================================================
          EDIT BAR
      ================================================= */}

      {editingMessage && (
        <div className="edit-message-bar">
          <div>
            <span>Editing message</span>

            <p>{editingMessage.message}</p>
          </div>

          <button type="button" onClick={cancelEdit}>
            ×
          </button>
        </div>
      )}

      {/* =================================================
          INPUT WRAPPER
      ================================================= */}

      <div className="chat-input-wrapper">
        {/* =================================================
            EMOJI PICKER
        ================================================= */}

        {showEmojiPicker && !editingMessage && (
          <div
            className="emoji-picker-container"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              width={320}
              height={400}
              previewConfig={{
                showPreview: false,
              }}
            />
          </div>
        )}

        {/* =================================================
            INPUT
        ================================================= */}

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder={
              editingMessage
                ? "Edit message..."
                : uploading
                  ? "Uploading..."
                  : "Write a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || uploading}
          />

          {/* =================================================
              EMOJI BUTTON
          ================================================= */}

          {!editingMessage && (
            <button
              type="button"
              className="emoji-button"
              onClick={() => setShowEmojiPicker((previous) => !previous)}
              disabled={sending || uploading}
              title="Emoji"
            >
              😊
            </button>
          )}

          {/* =================================================
              FILE INPUT
          ================================================= */}

          <input
            ref={fileInputRef}
            type="file"
            id="chat-media-input"
            accept="image/*,video/*"
            hidden
            disabled={!!editingMessage || sending || uploading}
            onChange={handleFileSelect}
          />

          {/* =================================================
              GALLERY
          ================================================= */}

          {!editingMessage && (
            <label
              htmlFor="chat-media-input"
              className="media-button"
              title="Photo / Video"
            >
              <img src={assets.gallery_icon} alt="Media" />
            </label>
          )}

          {/* =================================================
              SEND BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={
              sending || uploading || (!newMessage.trim() && !selectedFile)
            }
            title="Send"
          >
            <img src={assets.send} alt="Send" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
