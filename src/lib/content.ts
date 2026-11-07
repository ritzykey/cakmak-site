// Sahne anahtar kareleri, bölüm metinleri ve parça açıklamaları.
// Koordinatlar glTF (Y yukarı) model uzayında, metre cinsinden.

export type Vec3 = [number, number, number];

export type CalloutId =
  | "cark"
  | "tasTupu"
  | "ruzgarlik"
  | "fitil"
  | "mentese"
  | "kam"
  | "govde"
  | "icKasa";

export const ANCHORS: Record<CalloutId, Vec3> = {
  cark: [0.0158, 0.0495, 0.0016],
  tasTupu: [0.0133, 0.0405, 0.0012],
  ruzgarlik: [0.0035, 0.0505, 0.0058],
  fitil: [-0.001, 0.0412, 0.0],
  mentese: [-0.0202, 0.0356, 0.0],
  kam: [-0.0148, 0.0445, 0.0006],
  govde: [0.009, 0.014, 0.0065],
  icKasa: [0.0125, 0.0372, 0.006],
};

export type Callout = {
  id: CalloutId;
  title: string;
  text: string;
  /** Etiketin bağlantı noktasına göre ekran ofseti (px) */
  offset: [number, number];
};

export const CALLOUTS: Record<CalloutId, Callout> = {
  cark: {
    id: "cark",
    title: "Tırtıllı Çelik Çark",
    text: "Mat, sertleştirilmiş çelik. Başparmağın tek sürtüşüyle çakmak taşından kıvılcım koparır; tırtıllı yüzeyi ıslak elde bile kaymaz.",
    offset: [170, -120],
  },
  tasTupu: {
    id: "tasTupu",
    title: "Çakmak Taşı Tüpü",
    text: "Yaylı tüp, taşı sürekli çarka bastırır. Taş bittiğinde alttan saniyeler içinde değişir.",
    offset: [210, 30],
  },
  ruzgarlik: {
    id: "ruzgarlik",
    title: "8 Delikli Rüzgarlık",
    text: "Her yüzde 3-2-3 dizilimli sekiz delik alevi besler, yandan gelen rüzgarı keser. Fırtınada bile söndürmesi zor bir alev.",
    offset: [-260, -110],
  },
  fitil: {
    id: "fitil",
    title: "Pamuk Fitil",
    text: "İç kasadaki yakıtı kılcal etkiyle yukarı taşır. Uzun ömürlü, kolayca değiştirilebilir.",
    offset: [-230, 90],
  },
  mentese: {
    id: "mentese",
    title: "5 Boğumlu Menteşe",
    text: "Kapağı gövdeye bağlayan beş boğumlu çelik menteşe. Binlerce açılıp kapanmaya dayanacak şekilde perçinlidir.",
    offset: [-250, 90],
  },
  kam: {
    id: "kam",
    title: "Yaylı Kam",
    text: "O meşhur “klik” sesinin sahibi. Kapağı açıkken tutar, kapanırken sıkıca kilitler.",
    offset: [-140, -200],
  },
  govde: {
    id: "govde",
    title: "Parlak Siyah Lake Gövde",
    text: "Derin siyah, ayna parlaklığında lake kaplama. Avuca oturan yuvarlatılmış köşeler.",
    offset: [-280, 40],
  },
  icKasa: {
    id: "icKasa",
    title: "Parlak Alüminyum İç Kasa",
    text: "Yakıt haznesi ve tüm mekanizma tek parça iç kasada. Gövdeden çekip çıkararak doldurulur.",
    offset: [-300, -110],
  },
};

export type Keyframe = {
  /** Model grubunun konumu (ekran birimi) */
  pos: Vec3;
  rotY: number;
  /** 0 = kapalı, 1 = açık */
  lid: number;
  /** Kameranın odaklanacağı parça; yoksa sahne merkezi */
  focus?: CalloutId;
  /** Hedefe göre kamera ofseti */
  cam: Vec3;
  callouts: CalloutId[];
  /** Çark dönüşü (radyan) */
  wheel?: number;
};

export const KEYFRAMES: Keyframe[] = [
  { pos: [1.35, -1.2, 0], rotY: -0.45, lid: 0, cam: [0, 0, 7], callouts: [] },
  { pos: [-1.05, -1.2, 0], rotY: 0.35, lid: 1, cam: [0, 0.25, 8.4], callouts: [] },
  { pos: [-0.9, -1.2, 0], rotY: 0.55, lid: 1, focus: "cark", cam: [0.55, 0.3, 3.3], callouts: ["cark", "tasTupu"], wheel: 3 },
  { pos: [-0.9, -1.2, 0], rotY: 0.15, lid: 1, focus: "ruzgarlik", cam: [0.35, 0.3, 2.7], callouts: ["ruzgarlik", "fitil"], wheel: 3 },
  { pos: [-0.9, -1.2, 0], rotY: 0.2, lid: 1, focus: "kam", cam: [0.7, 0.3, 3.1], callouts: ["mentese", "kam"], wheel: 3 },
  { pos: [1.2, -1.2, 0], rotY: -0.5, lid: 1, cam: [0, 0.15, 6.4], callouts: ["govde", "icKasa"], wheel: 3 },
  { pos: [0, -0.7, 0], rotY: Math.PI * 2 - 0.3, lid: 0, cam: [0, 0.1, 10], callouts: [], wheel: 6 },
];

export type Section = {
  eyebrow: string;
  title: string;
  text: string;
  align: "left" | "right" | "bottom-left" | "bottom-right" | "center";
};

export const SECTIONS: Section[] = [
  {
    eyebrow: "Klasik Rüzgar Çakmağı",
    title: "Siyah. Sade. Ölümsüz.",
    text: "Cebinizde taşıyacağınız en sağlam alev. Aşağı kaydırın ve içine bakın.",
    align: "left",
  },
  {
    eyebrow: "01 — Açılış",
    title: "Tek hamlede açılır",
    text: "Kapak, yaylı kam sayesinde net bir klikle açılır ve açık kalır. Alev her zaman bir başparmak uzaklığında.",
    align: "right",
  },
  {
    eyebrow: "02 — Ateşleme",
    title: "Kıvılcımın kalbi",
    text: "Mat çelik çark ve yaylı taş tüpü birlikte çalışır.",
    align: "bottom-left",
  },
  {
    eyebrow: "03 — Alev",
    title: "Rüzgara meydan okur",
    text: "Delikli rüzgarlık alevi korur, fitil yakıtı sürekli besler.",
    align: "bottom-right",
  },
  {
    eyebrow: "04 — Mekanizma",
    title: "Küçük parçalar, büyük güven",
    text: "Perçinli menteşe ve kam yıllarca aynı sesi çıkarır.",
    align: "bottom-right",
  },
  {
    eyebrow: "05 — Malzeme",
    title: "Lake dış, alüminyum iç",
    text: "Parlak siyah lake gövde ve ayna parlaklığında alüminyum iç kasa.",
    align: "left",
  },
  {
    eyebrow: "Klasik Rüzgar Çakmağı",
    title: "Bir ömür yanında.",
    text: "Doldur, çak, kapat. Gerisi hikâye.",
    align: "center",
  },
];
