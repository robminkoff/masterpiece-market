"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Artwork, ProfileEntity } from "@/lib/types";
import { ProfileShell } from "@/components/profile/ProfileShell";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [entity, setEntity] = useState<ProfileEntity | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      })
      .then((data) => {
        setEntity(data.entity);
        setArtworks(data.artworks ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error || !entity) return <p className="text-red-500">{error ?? "User not found."}</p>;

  return <ProfileShell entity={entity} artworks={artworks} />;
}
