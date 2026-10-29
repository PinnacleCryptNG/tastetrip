export type SampleTaste = {
  label: string;
  city: string;
  days: number;
  seeds: { query: string; type: string }[];
};

// Resolved through Qloo /search at click time, so the seeds are always real Qloo entities.
export const SAMPLES: SampleTaste[] = [
  { label: "Frank Ocean + Spirited Away + Muji in Tokyo", city: "Tokyo", days: 2, seeds: [{ query: "Frank Ocean", type: "artist" }, { query: "Spirited Away", type: "movie" }, { query: "Muji", type: "brand" }] },
  { label: "Beyonce + Amelie + Chanel in Paris", city: "Paris", days: 2, seeds: [{ query: "Beyonce", type: "artist" }, { query: "Amelie", type: "movie" }, { query: "Chanel", type: "brand" }] },
  { label: "Taylor Swift + Gilmore Girls + Little Women in New York", city: "New York", days: 1, seeds: [{ query: "Taylor Swift", type: "artist" }, { query: "Gilmore Girls", type: "tv_show" }, { query: "Little Women", type: "book" }] },
  { label: "Bad Bunny + Coco + Frida in Mexico City", city: "Mexico City", days: 2, seeds: [{ query: "Bad Bunny", type: "artist" }, { query: "Coco", type: "movie" }, { query: "Frida", type: "movie" }] },
  { label: "Black Coffee + Black Panther + Born a Crime in Cape Town", city: "Cape Town", days: 2, seeds: [{ query: "Black Coffee", type: "artist" }, { query: "Black Panther", type: "movie" }, { query: "Born a Crime", type: "book" }] },
  { label: "Tame Impala + Bluey + Patagonia in Sydney", city: "Sydney", days: 1, seeds: [{ query: "Tame Impala", type: "artist" }, { query: "Bluey", type: "tv_show" }, { query: "Patagonia", type: "brand" }] },
];
