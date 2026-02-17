"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Artwork, ProfileEntity } from "@/lib/types";
import { ProfileShell } from "@/components/profile/ProfileShell";

export default function InstitutionProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [entity, setEntity] = useState<ProfileEntity | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/npcs/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Institution not found");
        return r.json();
      })
      .then((data) => {
        setEntity(data.entity);
        setArtworks(data.artworks ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error || !entity) return <p className="text-red-500">{error ?? "Institution not found."}</p>;

  return <ProfileShell entity={entity} artworks={artworks} />;
}
