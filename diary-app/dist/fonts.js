export const FONTS = [{
  id: "cinzel",
  name: "Cinzel",
  url: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap",
  stack: "'Cinzel', serif",
  sizeScale: 1.06
}, {
  id: "dancing",
  name: "Dancing Script",
  url: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600&display=swap",
  stack: "'Dancing Script', cursive",
  sizeScale: 1.16
}, {
  id: "playfair",
  name: "Playfair Display",
  url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap",
  stack: "'Playfair Display', serif",
  sizeScale: 1.0
}, {
  id: "crimson",
  name: "Crimson Pro",
  url: "https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap",
  stack: "'Crimson Pro', serif",
  sizeScale: 1.04
}, {
  id: "libre",
  name: "Libre Baskerville",
  url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
  stack: "'Libre Baskerville', serif",
  sizeScale: 0.96
}];
export const FONT_SIZES = {
  s: "14px",
  m: "16px",
  l: "19px"
};
export function loadAllFonts() {
  FONTS.forEach(f => {
    if (!document.querySelector(`link[href="${f.url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = f.url;
      document.head.appendChild(link);
    }
  });
}