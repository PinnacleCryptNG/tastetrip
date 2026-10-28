import { BookOpen, Film, Gamepad2, MapPin, Mic, Music, ShoppingBag, Sparkles, Tv, User } from "lucide-react";

export function TypeIcon({ type, className }: { type: string; className?: string }) {
  const t = type.replace("urn:entity:", "");
  const I =
    t === "artist" ? Music
    : t === "movie" ? Film
    : t === "tv_show" ? Tv
    : t === "book" ? BookOpen
    : t === "brand" ? ShoppingBag
    : t === "place" || t === "destination" || t === "locality" ? MapPin
    : t === "podcast" ? Mic
    : t === "videogame" || t === "video_game" ? Gamepad2
    : t === "person" ? User
    : Sparkles;
  return <I className={className} aria-hidden />;
}

export const typeLabel = (type: string) =>
  ({ artist: "Artist", movie: "Film", tv_show: "TV", book: "Book", brand: "Brand", place: "Place", podcast: "Podcast", videogame: "Game", person: "Person" })[
    type.replace("urn:entity:", "")
  ] ?? "Taste";
