"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PROFILE_AVATAR_BUCKET = "profile-avatars";
const PROFILE_AVATAR_FILE = "avatar";
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function avatarPath(userId: string) {
  return `${userId}/${PROFILE_AVATAR_FILE}`;
}

function revalidateOwnProfile() {
  revalidatePath("/student/profile");
  revalidatePath("/student/settings");
  revalidatePath("/student/dashboard");
}

export async function saveOwnProfileAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Account services are unavailable." };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return { ok: false as const, error: "Please sign in again." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const avatarEntry = formData.get("avatar");
  const avatarFile =
    avatarEntry && typeof avatarEntry !== "string" && avatarEntry.size > 0
      ? avatarEntry
      : null;

  if (fullName.length < 2 || fullName.length > 120) {
    return { ok: false as const, error: "Full name must be between 2 and 120 characters." };
  }
  if (phone.length > 40) {
    return { ok: false as const, error: "Phone number is too long." };
  }

  let uploadedAvatarUrl: string | undefined;

  if (avatarFile) {
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { ok: false as const, error: "Profile photo must be 4 MB or smaller." };
    }
    if (!ALLOWED_AVATAR_TYPES.has(avatarFile.type)) {
      return { ok: false as const, error: "Use a JPG, PNG or WebP profile photo." };
    }

    const path = avatarPath(user.id);
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(path, avatarFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: avatarFile.type,
      });

    if (uploadError) {
      console.error("Unable to upload own avatar:", uploadError.message);
      return {
        ok: false as const,
        error: "Unable to upload your profile photo. Check that the profile avatar storage migration has been applied.",
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .getPublicUrl(path);

    uploadedAvatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
  }

  const profileUpdate: {
    full_name: string;
    phone: string | null;
    avatar_url?: string;
  } = {
    full_name: fullName,
    phone: phone || null,
  };

  if (uploadedAvatarUrl) profileUpdate.avatar_url = uploadedAvatarUrl;

  const { data, error } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)
    .select("id,avatar_url")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Unable to update own profile:", error.message);
    return { ok: false as const, error: "Unable to update your profile." };
  }

  revalidateOwnProfile();

  return {
    ok: true as const,
    fullName,
    phone,
    avatarUrl: data.avatar_url ?? null,
  };
}

export async function removeOwnAvatarAction() {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: "Account services are unavailable." };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return { ok: false as const, error: "Please sign in again." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Unable to clear own avatar:", error.message);
    return { ok: false as const, error: "Unable to remove your profile photo." };
  }

  const { error: storageError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .remove([avatarPath(user.id)]);

  if (storageError) {
    // The profile no longer references the image, so a storage cleanup failure should not
    // prevent the user from removing it from their account. The fixed path is overwritten
    // if they upload another avatar later.
    console.error("Unable to remove own avatar object:", storageError.message);
  }

  revalidateOwnProfile();
  return { ok: true as const, avatarUrl: null };
}
