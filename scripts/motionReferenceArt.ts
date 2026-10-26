export const referenceSvg = (key: string, chibi: boolean, night = false, state = "closed"): string => {
  const p = { line: chibi ? "#402c30" : "#101115", wood: night ? "#3d3030" : chibi ? "#a27349" : "#735940", light: night ? "#888079" : "#e5dccb", dark: "#292b34", metal: night ? "#777d86" : "#a3a9b1", red: night ? "#702a30" : "#a33d42", cloth: night ? "#7f8791" : "#ece8df" };
  const r = (x: number, y: number, w: number, h: number, fill: string, radius = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
  const path = (d: string, fill = "none") => `<path d="${d}" fill="${fill}"/>`;
  const circle = (x: number, y: number, radius: number, fill: string) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}"/>`;
  let art = "";
  if (key === "scaffold") art = r(80, 50, 20, 425, p.wood) + r(410, 50, 20, 425, p.wood) + r(60, 225, 390, 22, p.wood) + r(60, 90, 390, 14, p.wood) + path("M90 475L420 248M90 248L420 475M90 225L420 104M90 104L420 225") + path("M130 470V260M200 470V260M130 290H200M130 335H200M130 380H200M130 425H200");
  if (key === "funeral_canopy") art = path("M20 130L256 25 492 130Z", p.cloth) + r(20, 130, 472, 36, p.cloth) + [45, 447].map((x) => r(x, 160, 20, 320, p.metal)).join("") + path("M35 172L85 180 85 405 35 440ZM477 172L427 180 427 405 477 440Z", p.cloth) + path("M40 110Q256 70 472 110") + r(224, 112, 64, 40, p.dark);
  if (key === "bus") art = r(20, 160, 472, 235, p.light, 22) + r(25, 300, 462, 54, p.red) + [40, 112, 184, 256].map((x) => r(x, 185, 62, 92, "#638593", 4)).join("") + r(344, 185, 74, 195, p.dark, 4) + r(350, 192, 60, 84, "#638593") + r(435, 184, 40, 92, "#638593", 5) + circle(115, 393, 40, p.dark) + circle(400, 393, 40, p.dark) + circle(115, 393, 18, p.metal) + circle(400, 393, 18, p.metal);
  if (key === "laptop") art = r(80, 90, 352, 240, p.dark, 12) + r(98, 108, 316, 202, "#66818b") + path("M80 330H432L488 425H24Z", p.metal) + path("M115 350H397L420 390H90Z", p.dark) + r(210, 397, 92, 14, p.light, 3);
  if (key === "digital_clock") {
    const segment = (x: number, digit: string) => {
      const paths = ["M0 0H54", "M60 6V60", "M60 72V126", "M0 132H54", "M-6 72V126", "M-6 6V60", "M0 66H54"];
      const bits: Record<string, number[]> = { "3": [0, 1, 2, 3, 6], "1": [1, 2], "2": [0, 1, 6, 4, 3] };
      return `<g transform="translate(${x} 175)" stroke="#ed8c65" stroke-width="12" stroke-linecap="round">${bits[digit].map((n) => path(paths[n])).join("")}</g>`;
    };
    art = r(38, 120, 436, 250, p.dark, 24) + r(57, 142, 398, 196, "#141a1a", 8) + segment(100, "3") + circle(204, 217, 6, "#ed8c65") + circle(204, 271, 6, "#ed8c65") + segment(238, "1") + segment(344, "2") + r(85, 371, 46, 20, p.dark) + r(381, 371, 46, 20, p.dark);
  }
  if (key === "video_camera") art = r(95, 155, 285, 200, p.dark, 18) + r(165, 108, 138, 44, p.dark, 10) + r(375, 184, 65, 135, p.metal) + path("M440 182L490 162V343L440 320Z", p.dark) + path("M95 180L18 155V302L95 325Z", p.metal) + r(25, 177, 55, 100, "#69818a") + circle(330, 208, 12, p.red) + r(211, 356, 62, 30, p.metal);
  if (key === "tripod") art = r(173, 35, 166, 30, p.dark, 5) + r(241, 65, 30, 203, p.metal) + path("M245 210L95 480H75L230 200ZM268 210L417 480H437L284 200ZM247 215L247 477H267V215Z", p.metal) + path("M120 400L256 320 393 400") + r(220, 175, 70, 37, p.dark, 6);
  if (key === "wardrobe")
    art =
      r(85, 30, 342, 450, p.wood) +
      r(105, 52, 302, 405, p.dark) +
      (state === "closed" ? r(105, 52, 151, 405, p.wood) + r(256, 52, 151, 405, p.wood) + circle(238, 265, 6, p.light) + circle(274, 265, 6, p.light) : state === "ajar" ? path("M105 52L226 85V425L105 457ZM407 52L286 85V425L407 457Z", p.wood) : path("M105 52L25 95V480L105 457ZM407 52L487 95V480L407 457Z", p.wood)) +
      r(100, 480, 25, 22, p.wood) +
      r(387, 480, 25, 22, p.wood);
  if (key === "covered_mirror") art = r(90, 35, 332, 445, p.wood, 45) + path("M65 45Q256 0 447 45L457 480 365 455 280 488 175 460 55 480Z", p.cloth) + path("M130 70L110 440M245 55L268 460M360 60L397 443");
  if (key === "red_liquid_bowl") art = path("M40 275Q70 445 256 455Q442 445 472 275Z", p.light) + `<ellipse cx="256" cy="275" rx="216" ry="65" fill="${p.red}"/>`;
  if (key === "red_liquid_plate") art = `<ellipse cx="256" cy="374" rx="236" ry="83" fill="${p.light}"/><ellipse cx="256" cy="368" rx="182" ry="53" fill="${p.red}"/>`;
  if (key === "body_shroud") art = path("M105 35Q256 5 407 35L444 495 350 475 256 505 170 479 68 495Z", p.cloth) + path("M160 55L144 450M254 45L275 470M350 55L380 449");
  if (!art) throw new Error(key);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g id="${key}" stroke="${p.line}" stroke-width="${chibi ? 4 : 6}" stroke-linejoin="round">${art}</g></svg>`;
};
