import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileUpdate.css";
import assets from "../../assets/assets";
import { supabase } from "../../Config/SupabaseClient";

const ProfileUpdate = () => {
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  // =====================================================
  // IMAGE SELECT
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Only images
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");

      e.target.value = "";

      return;
    }

    // Maximum 5MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Profile image must be less than 5MB.");

      e.target.value = "";

      return;
    }

    setImage(file);
  };

  // =====================================================
  // GET CURRENT SESSION
  // =====================================================

  const getCurrentSession = async () => {
    const {
      data,
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data?.session?.user) {
      throw new Error(
        "No active login session. Please login again."
      );
    }

    return data.session;
  };

  // =====================================================
  // UPLOAD PROFILE IMAGE
  // =====================================================

  const uploadProfileImage = async (user, file) => {
    const bucketName = "chat-media";

    // Get extension
    const fileExtension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    // Unique filename
    const fileName =
      `profile-${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    /*
      IMPORTANT:

      Storage RLS policy expects:

      first folder = auth.uid()

      Therefore the path MUST be:

      user-id/filename

      Example:

      f57e06b7-xxxx/profile-123.jpg
    */

    const filePath =
      `${user.id}/${fileName}`;

    console.log(
      "================================"
    );

    console.log(
      "PROFILE IMAGE UPLOAD"
    );

    console.log(
      "Bucket:",
      bucketName
    );

    console.log(
      "Authenticated user:",
      user.id
    );

    console.log(
      "File path:",
      filePath
    );

    console.log(
      "File type:",
      file.type
    );

    console.log(
      "File size:",
      file.size
    );

    console.log(
      "================================"
    );

    // =================================================
    // UPLOAD
    // =================================================

    const {
      data: uploadData,
      error: uploadError,
    } = await supabase.storage
      .from(bucketName)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        }
      );

    if (uploadError) {
      console.error(
        "================================"
      );

      console.error(
        "STORAGE UPLOAD ERROR"
      );

      console.error(
        "Code:",
        uploadError.code
      );

      console.error(
        "Message:",
        uploadError.message
      );

      console.error(
        "Details:",
        uploadError.details
      );

      console.error(
        "Hint:",
        uploadError.hint
      );

      console.error(
        "================================"
      );

      throw uploadError;
    }

    console.log(
      "Upload successful:",
      uploadData
    );

    // =================================================
    // PUBLIC URL
    // =================================================

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error(
        "Unable to generate profile image URL."
      );
    }

    console.log(
      "Profile image URL:",
      publicUrlData.publicUrl
    );

    return publicUrlData.publicUrl;
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      console.log(
        "1. Save button clicked"
      );

      // =================================================
      // GET SESSION
      // =================================================

      const session =
        await getCurrentSession();

      const user =
        session.user;

      console.log(
        "2. Logged in user:",
        user.id
      );

      // =================================================
      // VALIDATE NAME
      // =================================================

      const cleanName =
        name.trim();

      if (!cleanName) {
        alert(
          "Please enter your name."
        );

        return;
      }

      // =================================================
      // VALIDATE BIO
      // =================================================

      const cleanBio =
        bio.trim();

      if (!cleanBio) {
        alert(
          "Please enter your bio."
        );

        return;
      }

      // =================================================
      // GET EXISTING PROFILE
      // =================================================

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfileError) {
        console.error(
          "Existing profile error:",
          existingProfileError
        );
      }

      // Keep old avatar if user does
      // not select a new image.
      let avatarUrl =
        existingProfile?.avatar_url ||
        null;

      // =================================================
      // UPLOAD NEW IMAGE
      // =================================================

      if (image) {
        console.log(
          "3. Uploading profile image..."
        );

        avatarUrl =
          await uploadProfileImage(
            user,
            image
          );

        console.log(
          "4. New avatar URL:",
          avatarUrl
        );
      }

      // =================================================
      // SAVE PROFILE
      // =================================================

      console.log(
        "5. Saving profile..."
      );

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,

            full_name:
              cleanName,

            email:
              user.email,

            bio:
              cleanBio,

            avatar_url:
              avatarUrl,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (profileError) {
        console.error(
          "================================"
        );

        console.error(
          "PROFILE DATABASE ERROR"
        );

        console.error(
          "Code:",
          profileError.code
        );

        console.error(
          "Message:",
          profileError.message
        );

        console.error(
          "Details:",
          profileError.details
        );

        console.error(
          "Hint:",
          profileError.hint
        );

        console.error(
          "================================"
        );

        throw profileError;
      }

      console.log(
        "6. Profile saved successfully:",
        profileData
      );

      // =================================================
      // GO TO CHAT
      // =================================================

      console.log(
        "7. Navigating to chat..."
      );

      navigate("/chat", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "PROFILE UPDATE ERROR"
      );

      console.error(
        "Error code:",
        error?.code
      );

      console.error(
        "Error message:",
        error?.message
      );

      console.error(
        "Error details:",
        error?.details
      );

      console.error(
        "Error hint:",
        error?.hint
      );

      console.error(
        "Full error:",
        error
      );

      console.error(
        "================================"
      );

      alert(
        error?.message ||
          "Profile update failed."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="profile">

      <div className="profile-container">

        <form
          onSubmit={handleSubmit}
        >

          <h3>
            Profile Details
          </h3>

          {/* =========================================
              PROFILE IMAGE
          ========================================= */}

          <label htmlFor="avatar">

            <input
              type="file"
              id="avatar"
              accept=".png,.jpg,.jpeg,.webp"
              hidden
              onChange={
                handleImageChange
              }
            />

            <img
              src={
                previewUrl ||
                assets.avatar_icon
              }
              alt="Profile"
            />

            Upload Profile image

          </label>

          {/* =========================================
              NAME
          ========================================= */}

          <input
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

          {/* =========================================
              BIO
          ========================================= */}

          <textarea
            placeholder="Write profile bio"
            required
            value={bio}
            onChange={(e) =>
              setBio(
                e.target.value
              )
            }
          />

          {/* =========================================
              SAVE BUTTON
          ========================================= */}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Save"}
          </button>

        </form>

        {/* =========================================
            RIGHT LOGO / IMAGE
        ========================================= */}

        <img
          className="profile-pic"
          src={
            previewUrl ||
            assets.chathub_logo2
          }
          alt="ChatHub"
        />

      </div>

    </div>
  );
};

export default ProfileUpdate;