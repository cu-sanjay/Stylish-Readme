export default async function handler(req, res) {
  const { username = "guest", mode = "full" } = req.query;

  const size = mode === "compact" ? 6 : 12;

  const data = Array.from({ length: 35 }, () =>
    Math.floor(Math.random() * 15)
  );

  function getColor(count) {
    if (count === 0) return "#ebedf0";
    if (count < 5) return "#c6e48b";
    if (count < 10) return "#7bc96f";
    return "#196127";
  }

  let rects = "";

  data.forEach((count, i) => {
    const cols = 7;
    const x = (i % cols) * (size + 2);
    const y = Math.floor(i / cols) * (size + 2);

    rects += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${getColor(count)}" rx="2"/>`;
  });

  const width = 7 * (size + 2);
  const height = Math.ceil(data.length / 7) * (size + 2);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${rects}
      <text x="0" y="${height + 12}" font-size="10">
        ${username}'s activity (${mode})
      </text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
}