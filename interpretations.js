// ===== Interpretation engine =====
// Builds an actual sentence for any transiting-planet -> aspect -> natal-planet/point combination,
// instead of just labeling it.

const ASPECT_FLAVOR = {
  Conjunction: { verb: "fuses with", tone: "intense, hard to ignore" },
  Sextile: { verb: "opens a door for", tone: "an easy opportunity, if you take it" },
  Square: { verb: "puts pressure on", tone: "friction that asks something to shift" },
  Trine: { verb: "flows easily with", tone: "support that comes with little effort" },
  Opposition: { verb: "pulls against", tone: "a balancing act between two needs" }
};

// What each transiting planet brings, in a few words
const TRANSIT_THEME = {
  Sun: "visibility and focus",
  Mercury: "thoughts, conversations, and decisions",
  Venus: "love, money, or what feels good",
  Mars: "drive, friction, or assertiveness",
  Jupiter: "growth and expansion",
  Saturn: "responsibility, limits, and tests",
  Uranus: "sudden change and disruption",
  Neptune: "fog, dreams, or illusion",
  Pluto: "deep transformation and power dynamics"
};

// What each natal point represents when it's the one being activated
const NATAL_THEME = {
  Sun: "your core identity and sense of self",
  Moon: "your emotional needs and instincts",
  Mercury: "how you think and communicate",
  Venus: "love, attraction, and what you value",
  Mars: "your drive and how you assert yourself",
  Jupiter: "your sense of growth and opportunity",
  Saturn: "your boundaries and sense of responsibility",
  Uranus: "your need for freedom and independence",
  Neptune: "your dreams, ideals, and intuition",
  Pluto: "your relationship with power and control",
  Ascendant: "how you come across to others, your instinctive style",
  Midheaven: "your career direction and public reputation"
};

function interpretTransit(t) {
  const flavor = ASPECT_FLAVOR[t.aspect];
  const theme = TRANSIT_THEME[t.transiting];
  const natalTheme = NATAL_THEME[t.natal];
  const retroNote = t.retrograde ? ` ${t.transiting} is retrograde right now, so this leans more toward revisiting old ground than starting something new.` : '';
  return `${t.transiting} ${flavor.verb} your natal ${t.natal} — ${theme} meeting ${natalTheme}. This tends to feel like ${flavor.tone}.${retroNote}`;
}

// Short one-line version for compact rows
function interpretTransitShort(t) {
  const theme = TRANSIT_THEME[t.transiting];
  const natalTheme = NATAL_THEME[t.natal];
  const aspectWord = t.aspect === 'Conjunction' ? 'meets' : t.aspect === 'Square' ? 'clashes with' : t.aspect === 'Trine' ? 'supports' : t.aspect === 'Opposition' ? 'tugs against' : 'eases';
  return `${theme} ${aspectWord} ${natalTheme}`;
}

// Progressed Moon house meanings — richer than a static blurb
const PROGRESSED_MOON_HOUSE_MEANING = {
  1: "Your sense of self and how you present to the world is front and center right now. You may feel more focused on independence, identity, or simply being seen as yourself.",
  2: "Money, security, and self-worth are the emotional undercurrent right now. What makes you feel resourced and stable matters more than usual during this stretch.",
  3: "You're emotionally tuned into communication, learning, and the people immediately around you — siblings, neighbors, everyday connections.",
  4: "Home and family are emotionally activated. A pull toward roots, comfort, or unfinished business with where you come from is common here.",
  5: "Self-expression, romance, and creativity are emotionally charged. This is a period where what feels fun or alive matters more than usual.",
  6: "Daily routines, health, and the structure of your everyday life are where your emotional energy is going right now.",
  7: "Partnerships and one-on-one relationships are emotionally central. Your needs around closeness, fairness, and being met by another person are highlighted.",
  8: "Intimacy, shared resources, and deeper transformation are active. This can be an intense stretch — old emotional material may resurface to be processed.",
  9: "Your emotional focus is on the bigger picture — beliefs, travel, learning, expanding your worldview.",
  10: "Career and public reputation carry emotional weight right now. How you're seen professionally matters more to your sense of security than usual.",
  11: "Friendships, community, and future-oriented hopes are emotionally activated. Belonging to something bigger than yourself matters here.",
  12: "This is a more internal, behind-the-scenes stretch. Rest, solitude, and processing the subconscious tend to matter more than usual — even if it's not obvious why."
};

function progressedMoonInsight(pm) {
  return PROGRESSED_MOON_HOUSE_MEANING[pm.house] || "";
}

// Transiting Moon house meaning (shorter, since it only lasts ~2.5 days)
const TRANSIT_MOON_HOUSE_SHORT = {
  1: "today leans toward focusing on yourself and how you show up",
  2: "today leans toward money, comfort, and self-worth",
  3: "today leans toward conversations and everyday connections",
  4: "today leans toward home and family",
  5: "today leans toward fun, romance, and creative expression",
  6: "today leans toward routine, health, and getting things done",
  7: "today leans toward relationships and partnership",
  8: "today leans toward intimacy and deeper, more intense feelings",
  9: "today leans toward big-picture thinking or restlessness for more",
  10: "today leans toward career and how you're seen publicly",
  11: "today leans toward friendships and community",
  12: "today leans toward rest, solitude, and quieter processing"
};
function transitMoonInsight(tm) {
  return TRANSIT_MOON_HOUSE_SHORT[tm.house] || "";
}
