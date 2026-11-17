/* OpenGrid Springs — site data
   Example inputs are made up for demonstration. Real data is exactly what is publicly available. */

const HOURS_PER_QUARTER = 2190;
const LITERS_PER_GALLON = 3.785;
const HOMES_PER_MW = 800;

const SOURCES = {
  novva: { label: "Novva", url: "https://www.novva.com/data-center-facilities/colorado" },
  novvaTracker: { label: "Data center tracker", url: "https://morethanjustparks.com/data-center-tracker/progressive-insurance-colorado-springs-co--84b9d195-5483-4b60-be39-db215cd36d10" },
  dcmap: { label: "Data Center Map", url: "https://www.datacentermap.com/usa/colorado/colorado-springs/" },
  cleanview: { label: "Cleanview", url: "https://cleanview.co/data-centers/colorado/qts-colorado-springs-2057" },
  dchub: { label: "DC Hub", url: "https://dchub.cloud/facilities/in/us/colorado" },
  gazette: { label: "Gazette", url: "https://gazette.com/?p=2034641" },
  koaa: { label: "KOAA", url: "https://www.koaa.com/news/local-news/project-taurus-data-center/city-council-sets-september-17-as-final-vote-date-for-project-taurus-data-center" },
  axios: { label: "Axios", url: "https://www.axios.com/local/colorado-springs/2026/09/18/data-center-project-taurus-vote-delay" }
};

const FACILITIES = [
  {
    id: "novva",
    name: "Novva Colorado Springs",
    operator: "Novva Data Centers",
    status: "Operating",
    example: { avgMW: 20, pue: 1.30, wue: 0.05, cooling: "Ambient air (waterless)", audit: "Audited ✓", auditType: "ok" },
    real: {
      tierNote: "Designed for 40 MW",
      notes: [
        "Novva says its PUE is 1.3 (annualized) — self-reported, unaudited.",
        "Novva says it uses waterless, ambient-air cooling — self-reported, unaudited.",
        "A Gazette report put the older building at about 6 MW, rising to 30 MW after expansion."
      ],
      pue: "1.3 (company claim)",
      cooling: "Ambient air (company claim)",
      sources: ["novva", "novvaTracker"]
    },
    tier: "Large"
  },
  {
    id: "t5",
    name: "T5@Colorado Springs",
    operator: "T5 Data Centers",
    address: "3233 Janitell Rd",
    status: "Operating",
    example: { avgMW: 30, pue: 1.35, wue: 0.40, cooling: "Free cooling + evaporative assist", audit: "Audited ✓", auditType: "ok" },
    real: {
      tierNote: "Marketed as scalable to 100 MW",
      notes: ["A 64-acre campus marketed as scalable to 100 MW with free cooling."],
      cooling: "Free cooling (marketing)",
      sources: ["dcmap"]
    },
    tier: "Large"
  },
  {
    id: "qts",
    name: "QTS Colorado Springs",
    operator: "QTS Data Centers",
    status: "Operating",
    example: { avgMW: 12, pue: 1.40, wue: 1.20, cooling: "Evaporative", audit: "Audit flagged 14% discrepancy — $50,000 fine", auditType: "flag" },
    real: { notes: [], sources: ["cleanview"] },
    tier: "Large"
  },
  {
    id: "sap",
    name: "SAP Colorado Springs",
    operator: "SAP",
    status: "Operating",
    example: { avgMW: 6, pue: 1.50, wue: 1.00, cooling: "Chilled water", audit: "Audited ✓", auditType: "ok" },
    real: { notes: [], sources: ["dchub"] },
    tier: "Small"
  },
  {
    id: "data102",
    name: "Data102 (COS01/COS02)",
    operator: "Data102",
    address: "102 S Tejon St",
    status: "Operating",
    example: { avgMW: 2, pue: 1.60, wue: 0.80, cooling: "Chilled water", audit: "Report late — $250/day accruing", auditType: "late" },
    real: { notes: [], sources: ["dchub"] },
    tier: "Small"
  },
  {
    id: "walmart",
    name: "Walmart Colorado data center",
    operator: "Walmart",
    status: "Operating",
    example: { avgMW: 8, pue: 1.45, wue: 1.10, cooling: "Evaporative", audit: "Audited ✓", auditType: "ok" },
    real: { notes: [], sources: ["dchub"] },
    tier: "Small"
  },
  {
    id: "uniti",
    name: "Windstream/Uniti Colorado Springs",
    operator: "Windstream / Uniti",
    address: "1780 Jet Stream Dr",
    status: "Operating",
    example: { avgMW: 1.5, pue: 1.70, wue: 0.90, cooling: "Air-cooled CRAC", audit: "Audited ✓", auditType: "ok" },
    real: { notes: [], sources: ["dcmap"] },
    tier: "Small"
  },
  {
    id: "taurus",
    name: "Project Taurus",
    operator: "Raeden",
    address: "Former Intel plant off Garden of the Gods Rd",
    status: "Proposed",
    example: { avgMW: 45, pue: 1.25, wue: 0.00, cooling: "Closed-loop", audit: "Not yet operating (projected)", auditType: "projected" },
    real: {
      tierNote: "Cleared for up to 50 MW",
      notes: ["Raeden says its closed-loop cooling uses zero water per day."],
      cooling: "Closed-loop (company claim)",
      conflict: true,
      sources: ["gazette", "koaa", "axios"]
    },
    tier: "Large"
  }
];

/* Derived example numbers — computed so every figure stays consistent */
FACILITIES.forEach(f => {
  const e = f.example;
  e.mwh = e.avgMW * HOURS_PER_QUARTER;
  e.itKWh = (e.mwh * 1000) / e.pue;
  e.gallons = (e.itKWh * e.wue) / LITERS_PER_GALLON;
  e.homes = e.avgMW * HOMES_PER_MW;
});

const FINES = {
  late:  { label: "Late or missing quarterly report", Small: { perDay: 250, cap: 25000 }, Large: { perDay: 1000, cap: 100000 } },
  off:   { label: "Audit finds numbers off by more than 10%", Small: { flat: 10000 }, Large: { flat: 50000 } },
  false: { label: "Knowingly false report", Small: { upTo: 50000 }, Large: { upTo: 100000 } }
};

const EVENTS = [
  { id: "e1", title: "Data Centers 101: What powers the cloud?", date: "Wed, Dec 9, 2026", time: "6:30 pm", place: "Example venue: downtown library", blurb: "A friendly, no-jargon intro to what data centers do and what they need to run." },
  { id: "e2", title: "Reading the Numbers: PUE and WUE workshop", date: "Sat, Jan 23, 2027", time: "10:00 am", place: "Example venue: community center", blurb: "Practice reading efficiency figures so you can ask sharper questions." },
  { id: "e3", title: "Community Town Hall before the Project Taurus decision", date: "Thu, Mar 18, 2027", time: "6:00 pm", place: "Example venue: high school auditorium", blurb: "Hear from neighbors, ask questions, and share what information you want to see." },
  { id: "e4", title: "Testify at City Council: how to sign up for public comment", date: "April 2027", time: "Date TBA with Council agenda", place: "Example venue: City Hall", blurb: "A walkthrough of signing up, timing, and keeping comments short and clear." }
];
