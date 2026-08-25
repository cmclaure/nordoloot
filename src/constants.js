// WoW class colors
export const CC = { Warrior: "#C69B6D", Paladin: "#F48CBA", Hunter: "#AAD372", Rogue: "#FFF468", Priest: "#FFFFFF", Shaman: "#0070DD", Mage: "#3FC7EB", Warlock: "#8788EE", Druid: "#FF7C0A" };
export const BUDGET = 500;
export const LC_CHARGE = 100;  // budget cost per LC shortlist spot (listed twice = charged twice)
export const LC_UPFRONT = 3;   // the first N waiting spots on each LC shortlist pay LC_CHARGE upfront

// ── Boss loot tables (verified, from spec) ──
export const BT = "Black Temple", MH = "Mount Hyjal";
export const RAID_BOSSES = {
  [BT]: ["BT Trash", "High Warlord Naj'entus", "Supremus", "Shade of Akama", "Teron Gorefiend", "Gurtogg Bloodboil", "Reliquary of Souls", "Mother Shahraz", "Illidari Council", "Illidan Stormrage"],
  [MH]: ["Hyjal Trash", "Rage Winterchill", "Anetheron", "Kaz'rogal", "Azgalor", "Archimonde"]
};
export const BL = {
  "BT Trash": ["Illidari Runeshield", "Swiftsteel Bludgeon", "Treads of the Den Mother", "Girdle of the Lightbearer", "Pillager's Gauntlets", "Shroud of the Final Stand", "Band of Devastation", "Blessed Band of Karabor", "Ring of Ancient Knowledge", "Nethervoid Cloak", "Pepe's Shroud of Pacification", "Choker of Serrated Blades", "Hellfire-Encased Pendant", "Boots of the Divine Light", "Chestguard of Relentless Storms", "Heart of Darkness"],
  "High Warlord Naj'entus": ["Halberd of Desolation", "Rising Tide", "The Maelstrom's Fury", "Slippers of the Seacaller", "Guise of the Tidal Lurker", "Mantle of Darkness", "Boots of Oceanic Fury", "Fists of Mukoa", "Helm of Soothing Currents", "Eternium Shell Bracers", "Pearl Inlaid Boots", "Tide-Stomper's Greaves", "Ring of Calming Waves", "Ring of Captured Storms"],
  "Supremus": ["Felstone Bulwark", "Legionkiller", "Syphon of the Nathrezim", "The Brutalizer", "Waistwrap of Infinity", "Nether Shadow Tunic", "Bands of the Coming Storm", "Naturalist's Preserving Cinch", "Wraps of Precise Flight", "Pauldrons of Abyssal Fury", "Band of the Abyssal Lord", "Choker of Endless Nightmares", "Idol of the White Stag"],
  "Shade of Akama": ["Amice of Brilliant Light", "Focused Mana Bindings", "Wristbands of Divine Influence", "Kilt of Immortal Nature", "Shadow-Walker's Cord", "Flashfire Girdle", "Shoulders of the Hidden Predator", "Spiritwalker Gauntlets", "Grips of Silent Justice", "Myrmidon's Treads", "Praetorian's Legguards", "The Seeker's Wristguards", "Blind-Seers Icon", "Ring of Deceitful Intent"],
  "Teron Gorefiend": ["Rifle of the Stoic Guardian", "Soul Cleaver", "Cowl of Benevolence", "Robe of the Shadow Council", "Botanist's Gloves of Growth", "Insidious Bands", "Softstep Boots of Tracking", "Gauntlets of Enforcement", "Girdle of Lordaeron's Fallen", "Shadowmoon Destroyer's Drape"],
  "Gurtogg Bloodboil": ["Messenger of Fate", "Staff of Immaculate Recovery", "Wand of Prismatic Focus", "Blood-Cursed Shoulderpads", "Garments of Temperance", "Belt of Primal Majesty", "Vest of Mounting Assault", "Girdle of Mighty Resolve", "Girdle of Stability", "Leggings of Divine Retribution", "Shroud of Forgiveness", "Shadowmoon Insignia", "Unstoppable Aggressor's Ring"],
  "Reliquary of Souls": ["Naaru-Blessed Life Rod", "Torch of the Damned", "Gloves of Unfailing Faith", "Elunite Empowered Bracers", "Naturewarden's Treads", "Grips of Damnation", "Boneweave Girdle", "The Wavemender's Mantle", "Crown of Empowered Fate", "Dreadboots of the Legion", "Pendant of Titans", "Touch of Inspiration", "Translucent Spellthread Necklace"],
  "Mother Shahraz": ["Blade of Savagery", "Leggings of Devastation", "Shadowmaster's Boots", "Heartshatter Breastplate", "Nadina's Pendant of Purity", "Pauldrons of the Forgotten Conqueror", "Pauldrons of the Forgotten Protector", "Pauldrons of the Forgotten Vanquisher"],
  "Illidari Council": ["Belt of Divine Guidance", "Veil of Turning Leaves", "Forest Prowler's Helm", "Helm of the Illidari Shatterer", "Cloak of the Illidari Council", "Madness of the Betrayer", "Leggings of the Forgotten Conqueror", "Leggings of the Forgotten Protector", "Leggings of the Forgotten Vanquisher"],
  "Illidan Stormrage": ["Warglaive of Azzinoth", "Black Bow of the Betrayer", "Bulwark of Azzinoth", "Crystal Spire of Karabor", "Shard of Azzinoth", "Zhar'doom Greatstaff of the Devourer", "Cowl of the Illidari High Lord", "Cursed Vision of Sargeras", "Faceplate of the Impenetrable", "Shroud of the Highborne", "Memento of Tyrande", "Stormrage Signet Ring", "The Skull of Gul'dan", "Chestguard of the Forgotten Conqueror", "Chestguard of the Forgotten Protector", "Chestguard of the Forgotten Vanquisher"],
  "Hyjal Trash": ["Claw of Molten Fury", "Fist of Molten Fury", "Hammer of Judgement", "Boots of the Divine Light", "Chestguard of Relentless Storms", "Nethervoid Cloak", "Pepe's Shroud of Pacification", "Choker of Serrated Blades", "Hellfire-Encased Pendant"],
  "Rage Winterchill": ["Chronicle of Dark Secrets", "Blessed Adamantite Bracers", "Bracers of the Pathfinder", "Cuffs of Devastation", "Bracers of Martyrdom", "Rejuvenating Bracers", "Blood-stained Pauldrons", "Tracker's Blade", "Deadly Cuffs", "Furious Shackles", "Howling Wind Bracers", "Stillwater Boots"],
  "Anetheron": ["Anetheron's Noose", "Hatefury Mantle", "Archbishop's Slippers", "Pillar of Ferocity", "Bastion of Light", "Glimmering Steel Mantle", "The Unbreakable Will", "Blade of Infamy", "Quickstrider Moccasins", "Golden Links of Restoration", "Don Alejandro's Money Belt", "Enchanted Leather Sandals"],
  "Kaz'rogal": ["Kaz'rogal's Hardened Heart", "Black Featherlight Boots", "Beast-tamer's Shoulders", "Sun-touched Chain Leggings", "Blue Suede Shoes", "Angelista's Sash", "Belt of the Crescent Moon", "Belt of Seething Fury", "Leggings of Channeled Elements", "Razorfury Mantle", "Hammer of Atonement", "Loop of Forged Natures", "Valestalker Girdle"],
  "Azgalor": ["Helm of the Forgotten Conqueror", "Helm of the Forgotten Protector", "Helm of the Forgotten Vanquisher", "Don Rodrigo's Poncho", "Shady Dealer's Pantaloons", "Bow of the Inferno", "Girdle of Hope", "Savage-Hewn Battleaxe", "Terrorweave Tunic", "Midnight Chestguard"],
  "Archimonde": ["Tempest of Chaos", "Cataclysm's Edge", "Apostle of Argus", "Antonidas's Aegis of Rapt Concentration", "Robes of Rhonin", "Midnight Helm", "Bristleblitz Striker", "Mail of Fevered Pursuit", "Leggings of Eternity", "Helm of the Forgotten Conqueror", "Helm of the Forgotten Protector", "Helm of the Forgotten Vanquisher"],
  // BoP craftables from Heart of Darkness patterns — biddable like drops, but never appear on a boss
  "Crafted (BoP)": ["Swiftsteel Shoulders", "Dawnsteel Shoulders", "Swiftsteel Bracers", "Dawnsteel Bracers", "Swiftstrike Shoulders", "Swiftstrike Bracers", "Living Earth Shoulders", "Living Earth Bindings", "Swiftheal Mantle", "Swiftheal Wraps", "Mantle of Nimble Thought", "Bracers of Nimble Thought"]
};
export const CRAFTED = "Crafted (BoP)";
// non-unique rings players may want two of — each TMB listing is a separate claim
export const DUP_OK = new Set(["Band of Devastation", "Blessed Band of Karabor", "Ring of Ancient Knowledge"]);
export const BOSS_RAID = {}; Object.entries(RAID_BOSSES).forEach(([r, bs]) => bs.forEach(b => BOSS_RAID[b] = r));
export const ITEM_BOSSES = {}; Object.entries(BL).forEach(([b, items]) => items.forEach(it => { (ITEM_BOSSES[it] = ITEM_BOSSES[it] || []).push(b) }));
export const bossesFor = it => ITEM_BOSSES[it] || [];
export const primaryBoss = it => (ITEM_BOSSES[it] || [])[0] || null;

// ── T6 tier tokens ↔ class set pieces ──
// Raiders sometimes wishlist their class set piece instead of the token; compute() canonicalizes
// piece rows (matched by item_id first, exact name as fallback) so both count as the same claim.
export const TIER_TOKEN_PIECES = {
  "Helm of the Forgotten Conqueror": [[30987, "Lightbringer Faceguard"], [30988, "Lightbringer Greathelm"], [30989, "Lightbringer War-Helm"], [31063, "Cowl of Absolution"], [31064, "Hood of Absolution"], [31051, "Hood of the Malefic"]],
  "Pauldrons of the Forgotten Conqueror": [[30996, "Lightbringer Pauldrons"], [30997, "Lightbringer Shoulderbraces"], [30998, "Lightbringer Shoulderguards"], [31069, "Mantle of Absolution"], [31070, "Shoulderpads of Absolution"], [31054, "Mantle of the Malefic"]],
  "Chestguard of the Forgotten Conqueror": [[30990, "Lightbringer Breastplate"], [30991, "Lightbringer Chestguard"], [30992, "Lightbringer Chestpiece"], [31065, "Shroud of Absolution"], [31066, "Vestments of Absolution"], [31052, "Robe of the Malefic"]],
  "Gloves of the Forgotten Conqueror": [[30982, "Lightbringer Gauntlets"], [30983, "Lightbringer Gloves"], [30985, "Lightbringer Handguards"], [31060, "Gloves of Absolution"], [31061, "Handguards of Absolution"], [31050, "Gloves of the Malefic"]],
  "Leggings of the Forgotten Conqueror": [[30993, "Lightbringer Greaves"], [30994, "Lightbringer Leggings"], [30995, "Lightbringer Legguards"], [31068, "Breeches of Absolution"], [31067, "Leggings of Absolution"], [31053, "Leggings of the Malefic"]],
  "Helm of the Forgotten Protector": [[30972, "Onslaught Battle-Helm"], [30974, "Onslaught Greathelm"], [31003, "Gronnstalker's Helmet"], [31015, "Skyshatter Cover"], [31014, "Skyshatter Headguard"], [31012, "Skyshatter Helmet"]],
  "Pauldrons of the Forgotten Protector": [[30979, "Onslaught Shoulderblades"], [30980, "Onslaught Shoulderguards"], [31006, "Gronnstalker's Spaulders"], [31023, "Skyshatter Mantle"], [31024, "Skyshatter Pauldrons"], [31022, "Skyshatter Shoulderpads"]],
  "Chestguard of the Forgotten Protector": [[30975, "Onslaught Breastplate"], [30976, "Onslaught Chestguard"], [31004, "Gronnstalker's Chestguard"], [31017, "Skyshatter Breastplate"], [31016, "Skyshatter Chestguard"], [31018, "Skyshatter Tunic"]],
  "Gloves of the Forgotten Protector": [[30969, "Onslaught Gauntlets"], [30970, "Onslaught Handguards"], [31001, "Gronnstalker's Gloves"], [31008, "Skyshatter Gauntlets"], [31007, "Skyshatter Gloves"], [31011, "Skyshatter Grips"]],
  "Leggings of the Forgotten Protector": [[30977, "Onslaught Greaves"], [30978, "Onslaught Legguards"], [31005, "Gronnstalker's Leggings"], [31020, "Skyshatter Legguards"], [31019, "Skyshatter Leggings"], [31021, "Skyshatter Pants"]],
  "Helm of the Forgotten Vanquisher": [[31027, "Slayer's Helm"], [31056, "Cowl of the Tempest"], [31039, "Thunderheart Cover"], [31040, "Thunderheart Headguard"], [31037, "Thunderheart Helmet"]],
  "Pauldrons of the Forgotten Vanquisher": [[31030, "Slayer's Shoulderpads"], [31059, "Mantle of the Tempest"], [31048, "Thunderheart Pauldrons"], [31049, "Thunderheart Shoulderpads"], [31047, "Thunderheart Spaulders"]],
  "Chestguard of the Forgotten Vanquisher": [[31028, "Slayer's Chestguard"], [31057, "Robes of the Tempest"], [31042, "Thunderheart Chestguard"], [31041, "Thunderheart Tunic"], [31043, "Thunderheart Vest"]],
  "Gloves of the Forgotten Vanquisher": [[31026, "Slayer's Handguards"], [31055, "Gloves of the Tempest"], [31034, "Thunderheart Gauntlets"], [31032, "Thunderheart Gloves"], [31035, "Thunderheart Handguards"]],
  "Leggings of the Forgotten Vanquisher": [[31029, "Slayer's Legguards"], [31058, "Leggings of the Tempest"], [31045, "Thunderheart Legguards"], [31044, "Thunderheart Leggings"], [31046, "Thunderheart Pants"]]
};
const PIECE_ID_TOKEN = {}, PIECE_NAME_TOKEN = {};
Object.entries(TIER_TOKEN_PIECES).forEach(([tok, pcs]) => pcs.forEach(([id, n]) => { PIECE_ID_TOKEN[id] = tok; PIECE_NAME_TOKEN[n.toLowerCase()] = tok; }));
export const tierTokenFor = (name, id) => PIECE_ID_TOKEN[parseInt(id)] || PIECE_NAME_TOKEN[String(name || "").trim().toLowerCase()] || null;

export const isTierName = n => /Forgotten|Vanquished/.test(n) || n === "Verdant Sphere";
export const REAGENTS = new Set(["Nether Vortex", "Verdant Sphere"]);

export const MOD_DEF = {
  att: { on: true, w: 20, label: "Attendance", sign: "+", desc: "% of raids attended. Every missed raid counts here, excused or not — marking out protects you from strikes, not from attendance." },
  ten: { on: true, w: 30, label: "Tenure", sign: "+", desc: "Weeks in guild, capped at 4. Full veteran standing in the first month of the phase." },
  ua: { on: true, w: 25, label: "Unexcused Absence", sign: "−", desc: "Escalating penalty per no-show without notice: 1st = −25, 2nd = −75 total, 3rd = −150 total. Excused absences never count as strikes — but they still lower attendance. Attending 4 consecutive raids clears one strike (officers decrement the counter manually)." },
  blp: { on: true, w: 3, label: "Bad Luck Protection", sign: "+", desc: "Each lost tie /roll-off lifts the player's future scores gradually. Losing to a higher bid never counts — only dice losses do." },
};
export const DEF_STATS = { attendance: 100, tenure: 0, wins: 0, blp: 0, ua: 0 };

export const DEFAULT_LC = () => [
  { name: "The Skull of Gul'dan", shortlist: [] },
  { name: "Warglaive of Azzinoth", shortlist: [] },
];
