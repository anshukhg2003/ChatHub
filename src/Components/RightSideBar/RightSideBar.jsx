import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../Config/SupabaseClient";
import assets from "../../assets/assets";

import "./RightSideBar.css";

const RightSideBar = () => {
  const navigate = useNavigate();

  // =====================================================
  // PROFILE STATE
  // =====================================================

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // MEDIA STATE
  // =====================================================

  const [media, setMedia] = useState([]);

  const [mediaLoading, setMediaLoading] = useState(true);

  // =====================================================
  // CURRENT USER ID
  // =====================================================

  const [currentUserId, setCurrentUserId] = useState(null);

  // =====================================================
  // LOAD PROFILE + MEDIA
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        // =================================================
        // GET CURRENT LOGGED-IN USER
        // =================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("User error:", userError);

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!mounted) {
          return;
        }

        setCurrentUserId(user.id);

        // =================================================
        // GET CURRENT USER PROFILE
        // =================================================

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            full_name,
            bio,
            avatar_url
          `,
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError.message);
        } else if (mounted) {
          setProfile(profileData);
        }

        // =================================================
        // GET CHAT MEDIA
        // =================================================
        //
        // Get messages where:
        //
        // sender = current user
        // OR
        // receiver = current user
        //
        // And only image/video messages.
        //
        // =================================================

        const { data: mediaData, error: mediaError } = await supabase
          .from("messages")
          .select(
            `
            id,
            sender_id,
            receiver_id,
            message_type,
            media_url,
            created_at
          `,
          )
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .in("message_type", ["image", "video"])
          .not("media_url", "is", null)
          .order("created_at", {
            ascending: false,
          })
          .limit(6);

        if (mediaError) {
          console.error("Media loading error:", mediaError.message);

          setMedia([]);
        } else {
          setMedia(mediaData || []);
        }
      } catch (error) {
        console.error("Error loading RightSideBar:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          setMediaLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =====================================================
  // REALTIME MEDIA
  // =====================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    // =================================================
    // REALTIME CHANNEL
    // =================================================

    const channel = supabase
      .channel(`right-sidebar-media-${currentUserId}`)

      // =================================================
      // NEW MESSAGE
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

          // =================================================
          // CHECK WHETHER MESSAGE BELONGS TO CURRENT USER
          // =================================================

          const belongsToCurrentUser =
            newMessage.sender_id === currentUserId ||
            newMessage.receiver_id === currentUserId;

          if (!belongsToCurrentUser) {
            return;
          }

          // =================================================
          // ONLY IMAGE / VIDEO
          // =================================================

          const isMedia =
            newMessage.message_type === "image" ||
            newMessage.message_type === "video";

          if (!isMedia) {
            return;
          }

          if (!newMessage.media_url) {
            return;
          }

          // =================================================
          // ADD NEW MEDIA TO TOP
          // =================================================

          setMedia((previousMedia) => {
            const alreadyExists = previousMedia.some(
              (item) => item.id === newMessage.id,
            );

            if (alreadyExists) {
              return previousMedia;
            }

            return [newMessage, ...previousMedia].slice(0, 6);
          });
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
        (payload) => {
          const deletedMessage = payload.old;

          setMedia((previousMedia) =>
            previousMedia.filter((item) => item.id !== deletedMessage.id),
          );
        },
      )

      .subscribe((status) => {
        console.log("RightSideBar media realtime:", status);
      });

    // =================================================
    // CLEANUP
    // =================================================

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);

      return;
    }

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // LOADING PROFILE
  // =====================================================

  if (loading) {
    return (
      <div className="rs">
        <div className="rs-profile">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="rs">
      {/* =================================================
          CURRENT USER PROFILE
      ================================================= */}

      <div className="rs-profile">
        <img src={profile?.avatar_url || assets.profile_img} alt="Profile" />

        <h3>
          {profile?.full_name || "ChatHub User"}

          <img src={assets.green_dot} alt="Online" className="dot" />
        </h3>

        <p>{profile?.bio || "Hey, I am using the ChatHub App"}</p>
      </div>

      <hr />

      {/* =================================================
          MEDIA
      ================================================= */}

      <div className="rs-media">
        <p>Media</p>

        {mediaLoading ? (
          <div className="media-loading">Loading media...</div>
        ) : media.length === 0 ? (
          <div className="media-empty">
            <p>No media yet</p>
          </div>
        ) : (
          <div className="media-grid">
            {media.map((item) => (
              <div className="media-item" key={item.id}>
                {/* =====================================
                    IMAGE
                ===================================== */}

                {item.message_type === "image" && (
                  <img
                    src={item.media_url}
                    alt="Shared media"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {/* =====================================
                    VIDEO
                ===================================== */}

                {item.message_type === "video" && (
                  <video
                    src={item.media_url}
                    muted
                    playsInline
                    preload="metadata"
                    controls
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default RightSideBar;
