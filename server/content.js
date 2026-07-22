import { randomUUID } from "node:crypto";

const categoryLabels = {
  reuse: "Refill and reuse",
  energy: "Energy",
  transport: "Transport",
  food: "Food",
  community: "Community"
};

const categoryActions = {
  reuse: [
    "Refilled a water bottle",
    "Used a reusable cup",
    "Packed food in a reusable container",
    "Refused a plastic straw",
    "Reused packaging"
  ],
  energy: [
    "Switched off unused lights",
    "Unplugged a device",
    "Used natural lighting",
    "Reduced screen brightness",
    "Used a power-saving mode"
  ],
  transport: [
    "Walked",
    "Cycled",
    "Used public transport",
    "Shared a lift",
    "Attended remotely instead of travelling"
  ],
  food: [
    "Chose a plant-based meal",
    "Reduced food waste",
    "Used leftovers",
    "Supported a local food business",
    "Composted food scraps"
  ],
  community: [
    "Picked up litter",
    "Shared an environmental resource",
    "Helped someone repair an item",
    "Donated an unused item",
    "Joined a clean-up activity"
  ]
};

const learnerNames = ["Maya", "Theo", "Ari", "Nia", "Jon", "Simone", "Lebo", "Kai"];

const seedActionSpecs = [
  ["reuse", "Maya", "Refilled a water bottle", 10, 0],
  ["reuse", "Jon", "Refilled a water bottle", 8, 0],
  ["energy", "Theo", "Switched off unused lights", 1, 0],
  ["reuse", "Simone", "Refilled a water bottle", 5, 1],
  ["transport", "Anonymous", "Walked", 2, 1],
  ["food", "Ari", "Used leftovers", 1, 1],
  ["community", "Nia", "Shared an environmental resource", 6, 1],
  ["reuse", "Maya", "Refilled a water bottle", 7, 2],
  ["energy", "Lebo", "Unplugged a device", 1, 2],
  ["energy", "Theo", "Used natural lighting", 1, 2],
  ["reuse", "Kai", "Refilled a water bottle", 12, 2],
  ["food", "Ari", "Chose a plant-based meal", 1, 2],
  ["transport", "Jon", "Cycled", 1, 3],
  ["energy", "Simone", "Reduced screen brightness", 1, 3],
  ["reuse", "Nia", "Refilled a water bottle", 9, 3],
  ["community", "Maya", "Picked up litter", 4, 3],
  ["energy", "Lebo", "Used a power-saving mode", 1, 4],
  ["transport", "Theo", "Used public transport", 3, 4],
  ["reuse", "Jon", "Refilled a water bottle", 13, 4],
  ["food", "Kai", "Reduced food waste", 1, 4],
  ["energy", "Maya", "Switched off unused lights", 1, 5],
  ["community", "Simone", "Helped someone repair an item", 2, 5],
  ["transport", "Anonymous", "Shared a lift", 2, 5],
  ["energy", "Ari", "Unplugged a device", 1, 6],
  ["food", "Nia", "Composted food scraps", 1, 6],
  ["energy", "Kai", "Used natural lighting", 1, 6],
  ["community", "Lebo", "Donated an unused item", 1, 6]
];

export function createSeedState(now = new Date()) {
  const actions = seedActionSpecs.map(([category, learner, action, quantity, daysAgo], index) =>
    createActionRecord({
      id: `seed-${index + 1}`,
      category,
      learner,
      action,
      quantity,
      reflection: seedReflection(category, action),
      visibility: learner === "Anonymous" ? "anonymous" : "first-name",
      locationCategory: "Campus",
      actionMode: "individual",
      createdAt: dateDaysAgo(now, Number(daysAgo))
    })
  );

  return {
    version: 1,
    team: {
      name: "The Carbon Cutters",
      memberName: "Simone",
      motto: "Debugging habits one choice at a time.",
      streakDays: 12,
      palette: "Forest lime",
      privacyMode: "First names and anonymous contributions"
    },
    profile: {
      displayName: "Simone",
      team: "The Carbon Cutters",
      habitFocus: "Reducing single-use plastic",
      privacy: {
        exactImpact: true,
        actions: true,
        streak: true,
        photos: false,
        reflections: true
      },
      notifications: "Daily summary"
    },
    challenges: [
      {
        id: "plastic-light-week",
        title: "Plastic-Light Week",
        progress: 72,
        accent: "#24c26a",
        reward: "Community garden island",
        detail: "Refill or reuse actions grow a shared garden.",
        categoryFocus: "reuse",
        joined: true
      },
      {
        id: "switch-it-off-sprint",
        title: "Switch-It-Off Sprint",
        progress: 58,
        accent: "#f6c64f",
        reward: "Solar path lights",
        detail: "Energy-saving actions light the team pathway.",
        categoryFocus: "energy",
        joined: true
      },
      {
        id: "campus-cleanup-quest",
        title: "Campus Cleanup Quest",
        progress: 41,
        accent: "#a98df2",
        reward: "Recycling station",
        detail: "Community actions build a practical campus resource.",
        categoryFocus: "community",
        joined: false
      }
    ],
    resources: [
      {
        id: "low-cost-student-sustainability",
        title: "One-minute guide to low-cost student sustainability",
        format: "One-minute read",
        category: "Beginner actions",
        actionCategory: "community",
        action: "Shared an environmental resource"
      },
      {
        id: "campus-recycling-checklist",
        title: "Campus recycling checklist",
        format: "Checklist",
        category: "Recycling guides",
        actionCategory: "community",
        action: "Shared an environmental resource"
      },
      {
        id: "responsible-digital-habits",
        title: "Responsible digital habits mini quiz",
        format: "Quick quiz",
        category: "Responsible digital habits",
        actionCategory: "energy",
        action: "Used a power-saving mode"
      },
      {
        id: "waste-less-lunch-template",
        title: "Team activity template for a waste-less lunch",
        format: "Team template",
        category: "Low-cost ideas",
        actionCategory: "food",
        action: "Reduced food waste"
      }
    ],
    projects: [
      {
        id: "community-garden-sprint",
        title: "Community garden sprint",
        objective: "Plan a student-led garden pilot with evidence, tasks, and a final showcase.",
        tasks: [
          { title: "Plan bed layout", done: true },
          { title: "Collect compost", done: false },
          { title: "Build water guide", done: false },
          { title: "Final showcase", done: false }
        ]
      }
    ],
    stories: createSeedStories(),
    actions
  };
}

export function createActionRecord(input) {
  const category = String(input.category || "").trim();
  const quantity = cleanQuantity(input.quantity);
  const action = cleanText(input.action, 96) || categoryActions[category]?.[0];
  const learner = cleanText(input.learner, 40) || "Simone";

  if (!categoryLabels[category]) {
    throw statusError(400, "Choose a valid action category.");
  }

  if (!action) {
    throw statusError(400, "Choose an action to log.");
  }

  return {
    id: input.id || randomUUID(),
    category,
    action,
    learner,
    quantity,
    duration: cleanText(input.duration, 40),
    reflection: cleanText(input.reflection, 420) || seedReflection(category, action),
    visibility: cleanText(input.visibility, 32) || "first-name",
    locationCategory: cleanText(input.locationCategory, 48) || "Campus",
    actionMode: cleanText(input.actionMode, 32) || "individual",
    evidenceName: cleanText(input.evidenceName, 90),
    createdAt: input.createdAt || new Date().toISOString(),
    impact: calculateImpact(category, action, quantity),
    reactions: {
      "Keep Growing": 0,
      "Ripple Effect": 0,
      "Clever Reuse": 0,
      "Bright Move": 0,
      "Team Energy": 0
    }
  };
}

export function buildDashboard(db) {
  const actions = [...db.actions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const weeklyActions = actions.filter((action) => isWithinDays(action.createdAt, 7));
  const stats = summarizeActions(weeklyActions, db.team);

  return {
    team: db.team,
    profile: db.profile,
    stats,
    actions: actions.slice(0, 20),
    tiles: buildTiles(actions),
    challenges: db.challenges,
    stories: db.stories.slice(0, 8),
    resources: db.resources,
    projects: db.projects,
    calculations: [
      {
        title: `${stats.bottlesAvoided} bottles avoided`,
        body: `Calculated from ${stats.bottlesAvoided} recorded refill actions. This is an activity estimate rather than a precise environmental measurement.`,
        confidence: "high"
      },
      {
        title: `${stats.co2Saved.toFixed(1)} kg CO2 saved`,
        body: "Built from logged transport, energy, food, community, and reuse actions using conservative conversion factors.",
        confidence: "medium"
      },
      {
        title: `${stats.activeLearners} active learners`,
        body: "Participation is counted as presence and momentum. It is never used for negative ranking.",
        confidence: "high"
      }
    ]
  };
}

export function addActionToState(db, input) {
  const record = createActionRecord(input);
  db.actions.push(record);
  db.team.streakDays = Math.max(Number(db.team.streakDays || 0), 1);

  for (const challenge of db.challenges) {
    if (challenge.categoryFocus === record.category) {
      challenge.progress = Math.min(100, Number(challenge.progress || 0) + 4);
      challenge.joined = true;
    }
  }

  db.stories.unshift({
    id: `story-${record.id}`,
    type: "Action completed",
    title: actionMessage(record.category),
    body: `${displayLearner(record)} logged ${record.action.toLowerCase()} for ${record.quantity} ${record.quantity === 1 ? "unit" : "units"}.`,
    reaction: defaultReaction(record.category),
    createdAt: record.createdAt,
    reactions: { [defaultReaction(record.category)]: 0 }
  });

  return { record, dashboard: buildDashboard(db) };
}

export function addStoryReaction(db, storyId, reaction) {
  const story = db.stories.find((item) => item.id === storyId);
  if (!story) {
    throw statusError(404, "Story not found.");
  }
  const name = cleanText(reaction, 40) || story.reaction || "Keep Growing";
  story.reactions = story.reactions || {};
  story.reactions[name] = Number(story.reactions[name] || 0) + 1;
  return buildDashboard(db);
}

export function joinChallenge(db, challengeId) {
  const challenge = db.challenges.find((item) => item.id === challengeId);
  if (!challenge) {
    throw statusError(404, "Challenge not found.");
  }
  challenge.joined = true;
  challenge.progress = Math.min(100, Number(challenge.progress || 0) + 3);
  return buildDashboard(db);
}

export function trackResource(db, resourceId) {
  const resource = db.resources.find((item) => item.id === resourceId);
  if (!resource) {
    throw statusError(404, "Resource not found.");
  }

  return addActionToState(db, {
    category: resource.actionCategory,
    action: resource.action,
    quantity: 1,
    learner: "Simone",
    reflection: `Turned "${resource.title}" into a trackable GreenGrid action.`,
    visibility: "first-name",
    locationCategory: "Campus",
    actionMode: "team"
  });
}

export function updateProfilePrivacy(db, privacy) {
  db.profile.privacy = {
    ...db.profile.privacy,
    ...Object.fromEntries(
      Object.entries(privacy || {}).filter(([, value]) => typeof value === "boolean")
    )
  };
  return buildDashboard(db);
}

export function updateTeam(db, details) {
  const writableFields = ["name", "motto", "palette", "privacyMode"];
  for (const field of writableFields) {
    if (field in (details || {})) {
      db.team[field] = cleanText(details[field], 90);
    }
  }
  return buildDashboard(db);
}

export function statusError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function summarizeActions(actions, team) {
  const totals = actions.reduce(
    (total, action) => {
      total.co2Saved += Number(action.impact?.co2Kg || 0);
      total.bottlesAvoided += Number(action.impact?.bottlesAvoided || 0);
      total.wasteItems += Number(action.impact?.wasteItems || 0);
      total.waterLitres += Number(action.impact?.waterLitres || 0);
      total.distanceKm += Number(action.impact?.distanceKm || 0);
      total.communityReach += Number(action.impact?.communityReach || 0);
      return total;
    },
    {
      co2Saved: 0,
      bottlesAvoided: 0,
      wasteItems: 0,
      waterLitres: 0,
      distanceKm: 0,
      communityReach: 0
    }
  );

  const learners = new Set(actions.map((action) => displayLearner(action)));
  const todayLearners = new Set(
    actions.filter((action) => isToday(action.createdAt)).map((action) => displayLearner(action))
  );
  const habitCounts = new Map();
  for (const action of actions) {
    habitCounts.set(action.action, (habitCounts.get(action.action) || 0) + Number(action.quantity || 1));
  }
  const topHabit = [...habitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Refill";

  return {
    co2Saved: round(totals.co2Saved, 1),
    bottlesAvoided: Math.round(totals.bottlesAvoided),
    wasteItems: Math.round(totals.wasteItems),
    waterLitres: Math.round(totals.waterLitres),
    distanceKm: round(totals.distanceKm, 1),
    communityReach: Math.round(totals.communityReach),
    actionsThisWeek: actions.length,
    activeLearners: learners.size,
    checkedInToday: todayLearners.size,
    streakDays: Number(team.streakDays || 0),
    topHabit
  };
}

function buildTiles(actions) {
  const actionTiles = actions.slice(0, 58).map((action) => ({
    id: action.id,
    category: action.category,
    learner: displayLearner(action),
    action: action.action,
    impact: action.impact.label,
    reflection: action.reflection,
    date: formatDateLabel(action.createdAt),
    reaction: defaultReaction(action.category)
  }));

  const openTiles = Array.from({ length: Math.max(0, 72 - actionTiles.length) }, (_, index) => ({
    id: `open-${index}`,
    category: "open",
    learner: "Open space",
    action: "Ready for the next small action",
    impact: "Future impact",
    reflection: "Your grid is ready whenever you are.",
    date: "Soon",
    reaction: "Space Saved"
  }));

  return [...actionTiles, ...openTiles].slice(0, 72);
}

function calculateImpact(category, action, quantity) {
  const impact = {
    co2Kg: 0,
    bottlesAvoided: 0,
    wasteItems: 0,
    waterLitres: 0,
    distanceKm: 0,
    communityReach: 0,
    label: "Impact recorded"
  };

  if (category === "reuse") {
    impact.co2Kg = quantity * (action.includes("water bottle") ? 0.16 : 0.08);
    impact.bottlesAvoided = action.includes("water bottle") ? quantity : 0;
    impact.wasteItems = action.includes("water bottle") ? quantity : Math.max(quantity, 1);
    impact.label = action.includes("water bottle")
      ? `${quantity} ${quantity === 1 ? "bottle" : "bottles"} avoided`
      : `${quantity} reuse ${quantity === 1 ? "item" : "items"} recorded`;
  }

  if (category === "energy") {
    impact.co2Kg = quantity * 0.35;
    impact.label = `${round(impact.co2Kg, 1)} kg CO2 estimated`;
  }

  if (category === "transport") {
    impact.co2Kg = quantity * 0.3;
    impact.distanceKm = quantity;
    impact.label = `${quantity} km lower-carbon travel`;
  }

  if (category === "food") {
    impact.co2Kg = quantity * 0.65;
    impact.label = `${quantity} food ${quantity === 1 ? "habit" : "habits"} logged`;
  }

  if (category === "community") {
    impact.communityReach = quantity;
    impact.label = `${quantity} community ${quantity === 1 ? "touchpoint" : "touchpoints"}`;
  }

  impact.co2Kg = round(impact.co2Kg, 2);
  return impact;
}

function createSeedStories() {
  return [
    {
      id: "story-refill-row",
      type: "Team celebration",
      title: "The grid just got greener.",
      body: "Three learners checked in before lunch and completed a full refill row.",
      reaction: "Keep Growing",
      createdAt: dateDaysAgo(new Date(), 0),
      reactions: { "Keep Growing": 4 }
    },
    {
      id: "story-repair-cable",
      type: "Repair story",
      title: "A cable saved from the bin.",
      body: "A quick repair turned into a reusable charger station for the studio.",
      reaction: "Clever Reuse",
      createdAt: dateDaysAgo(new Date(), 1),
      reactions: { "Clever Reuse": 2 }
    },
    {
      id: "story-easy-action",
      type: "Habit tip",
      title: "Make the easy action visible.",
      body: "Reusable cups now sit beside the coffee machine instead of in a cupboard.",
      reaction: "Bright Move",
      createdAt: dateDaysAgo(new Date(), 2),
      reactions: { "Bright Move": 3 }
    }
  ];
}

function seedReflection(category, action) {
  const reflections = {
    reuse: "Easy to repeat after keeping a bottle near my desk.",
    energy: "The room was bright enough without extra lights.",
    transport: "Took a little longer and felt calmer.",
    food: "It saved money and reduced waste at the same time.",
    community: "A small share made the idea easier for someone else."
  };
  return reflections[category] || `${action} felt worth repeating.`;
}

function actionMessage(category) {
  return {
    reuse: "One less bottle. One more win.",
    energy: "Small move. Real momentum.",
    transport: "The route got lighter.",
    food: "Waste-less habit added.",
    community: "The grid just got kinder."
  }[category] || "Tiny action logged. Collective impact upgraded.";
}

function defaultReaction(category) {
  return {
    reuse: "Keep Growing",
    energy: "Bright Move",
    transport: "Team Energy",
    food: "Clever Reuse",
    community: "Ripple Effect"
  }[category] || "Keep Growing";
}

function displayLearner(action) {
  if (action.visibility === "anonymous") return "Anonymous";
  return learnerNames.includes(action.learner) ? action.learner : cleanText(action.learner, 40) || "Simone";
}

function cleanQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(500, Math.max(1, Math.round(quantity)));
}

function cleanText(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function dateDaysAgo(now, daysAgo) {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(10 + (daysAgo % 7), 15, 0, 0);
  return date.toISOString();
}

function formatDateLabel(value) {
  const date = new Date(value);
  if (isToday(value)) return "Today";
  if (isWithinDays(value, 2)) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

function isToday(value) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function isWithinDays(value, days) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
