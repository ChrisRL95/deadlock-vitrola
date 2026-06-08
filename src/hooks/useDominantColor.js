import { useState, useEffect } from "react";

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s, l];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function useDominantColor(imageUrl, fallback = "#888888") {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    if (!imageUrl) return;
    setColor(fallback); // reset on image change

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const size = 80; // downsample for performance
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        const candidates = [];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue; // skip transparent

          const [h, s, l] = rgbToHsl(r, g, b);
          // skip near-black, near-white, and desaturated
          if (l < 0.12 || l > 0.88 || s < 0.25) continue;

          // weight by saturation and avoid mid-grey
          candidates.push({ r, g, b, s, l, h });
        }

        if (candidates.length === 0) { setColor(fallback); return; }

        // sort by saturation descending, take top 10%
        candidates.sort((a, b) => b.s - a.s);
        const top = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.1)));

        // average the top candidates
        const avg = top.reduce(
          (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
          { r: 0, g: 0, b: 0 }
        );
        const n = top.length;
        const r = Math.round(avg.r / n);
        const g = Math.round(avg.g / n);
        const b = Math.round(avg.b / n);

        // boost saturation a bit for UI use
        const [h, s, l] = rgbToHsl(r, g, b);
        const boostedS = Math.min(s * 1.3, 1);
        const boostedL = Math.min(Math.max(l, 0.4), 0.65); // not too dark/light for UI

        // convert back to rgb
        function hslToRgb(h, s, l) {
          h /= 360;
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          const hue2rgb = (t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          return [
            Math.round(hslToRgb2(h + 1/3)),
            Math.round(hslToRgb2(h)),
            Math.round(hslToRgb2(h - 1/3)),
          ];
          function hslToRgb2(t) { return hue2rgb(t) * 255; }
        }

        const [fr, fg, fb] = hslToRgb(h, boostedS, boostedL);
        setColor(rgbToHex(fr, fg, fb));
      } catch (_) {
        setColor(fallback);
      }
    };

    img.onerror = () => setColor(fallback);
  }, [imageUrl, fallback]);

  return color;
}
