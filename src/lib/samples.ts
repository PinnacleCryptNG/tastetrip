export type SampleTaste = {
  label: string;
  city: string;
  days: number;
  seeds: { query: string; type: string }[];
};

// Resolved through Qloo /search at click time, so the seeds are always real Qloo entities.
export const SAMPLES: SampleTaste[] = [
  {
    label: "Wizkid + Studio Ghibli + Nike in Tokyo",
    city: "Tokyo",
    days: 2,
    seeds: [
      { query: "Wizkid", type: "artist" },
      { query: "Spirited Away", type: "movie" },
      { query: "Nike", type: "brand" },
    ],
  },
  {
    label: "Burna Boy + Nollywood + Achebe in Lisbon",
    city: "Lisbon",
    days: 2,
    seeds: [
      { query: "Burna Boy", type: "artist" },
      { query: "King of Boys", type: "movie" },
      { query: "Things Fall Apart", type: "book" },
    ],
  },
  {
    label: "Taylor Swift + Gilmore Girls + Little Women in New York",
    city: "New York",
    days: 1,
    seeds: [
      { query: "Taylor Swift", type: "artist" },
      { query: "Gilmore Girls", type: "tv_show" },
      { query: "Little Women", type: "book" },
    ],
  },
];
