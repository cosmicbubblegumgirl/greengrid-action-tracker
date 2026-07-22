import type {
  ActionInput,
  ActionRecord,
  ActionResult,
  CategoryId,
  DashboardPayload,
  GridTile,
  ImpactSummary,
  SyncMode,
} from './types'

type ApiResponse<T> = {
  data: T
  mode: SyncMode
}

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const storageKey = 'greengrid-dashboard-v3'

const categoryActions: Record<CategoryId, string[]> = {
  reuse: [
    'Refilled a water bottle',
    'Used a reusable cup',
    'Packed food in a reusable container',
    'Refused a plastic straw',
    'Reused packaging',
  ],
  energy: [
    'Switched off unused lights',
    'Unplugged a device',
    'Used natural lighting',
    'Reduced screen brightness',
    'Used a power-saving mode',
  ],
  transport: [
    'Walked',
    'Cycled',
    'Used public transport',
    'Shared a lift',
    'Attended remotely instead of travelling',
  ],
  food: [
    'Chose a plant-based meal',
    'Reduced food waste',
    'Used leftovers',
    'Supported a local food business',
    'Composted food scraps',
  ],
  community: [
    'Picked up litter',
    'Shared an environmental resource',
    'Helped someone repair an item',
    'Donated an unused item',
    'Joined a clean-up activity',
  ],
}

export function createFallbackDashboard() {
  return readLocalDashboard()
}

export function resetLocalDashboard() {
  const dashboard = createLocalDashboard()
  saveLocalDashboard(dashboard)
  return dashboard
}

export function isApiError(error: unknown) {
  return error instanceof ApiError
}

export async function loadDashboard(): Promise<ApiResponse<DashboardPayload>> {
  return withLocalFallback(() => request<DashboardPayload>('/api/bootstrap'), () => readLocalDashboard())
}

export async function submitAction(input: ActionInput): Promise<ApiResponse<ActionResult>> {
  return withLocalFallback(
    () =>
      request<ActionResult>('/api/actions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    () => addLocalAction(input),
  )
}

export async function joinChallenge(challengeId: string): Promise<ApiResponse<DashboardPayload>> {
  return withLocalFallback(
    () =>
      request<DashboardPayload>(`/api/challenges/${encodeURIComponent(challengeId)}/join`, {
        method: 'POST',
      }),
    () => joinLocalChallenge(challengeId),
  )
}

export async function trackResource(resourceId: string): Promise<ApiResponse<ActionResult>> {
  return withLocalFallback(
    () =>
      request<ActionResult>(`/api/resources/${encodeURIComponent(resourceId)}/track`, {
        method: 'POST',
      }),
    () => trackLocalResource(resourceId),
  )
}

export async function addStoryReaction(
  storyId: string,
  reaction: string,
): Promise<ApiResponse<DashboardPayload>> {
  return withLocalFallback(
    () =>
      request<DashboardPayload>(`/api/stories/${encodeURIComponent(storyId)}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      }),
    () => addLocalStoryReaction(storyId, reaction),
  )
}

export async function updatePrivacy(privacy: Record<string, boolean>): Promise<ApiResponse<DashboardPayload>> {
  return withLocalFallback(
    () =>
      request<DashboardPayload>('/api/profile/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ privacy }),
      }),
    () => updateLocalPrivacy(privacy),
  )
}

async function withLocalFallback<T>(remote: () => Promise<T>, local: () => T): Promise<ApiResponse<T>> {
  try {
    return { data: await remote(), mode: 'synced' }
  } catch (error) {
    if (error instanceof ApiError && ![404, 405].includes(error.status) && error.status < 500) {
      throw error
    }

    return { data: local(), mode: 'local' }
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  const text = await response.text()
  const payload = text ? safeJson(text) : undefined

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'GreenGrid could not complete that request.'
    throw new ApiError(response.status, message)
  }

  if (!payload) {
    throw new ApiError(502, 'GreenGrid received an empty response.')
  }

  return payload as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function readLocalDashboard() {
  const stored = readStoredDashboard()
  if (stored) return stored

  const dashboard = createLocalDashboard()
  saveLocalDashboard(dashboard)
  return dashboard
}

function readStoredDashboard(): DashboardPayload | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as DashboardPayload
    return parsed?.stats && Array.isArray(parsed.tiles) ? parsed : undefined
  } catch {
    return undefined
  }
}

function saveLocalDashboard(dashboard: DashboardPayload) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(dashboard))
  } catch {
    // Local saving is best effort when storage is unavailable.
  }
}

function createLocalDashboard(): DashboardPayload {
  const now = new Date()
  const actions = [
    ['reuse', 'Maya', 'Refilled a water bottle', 10, 0],
    ['reuse', 'Jon', 'Refilled a water bottle', 8, 0],
    ['energy', 'Theo', 'Switched off unused lights', 1, 0],
    ['reuse', 'Simone', 'Refilled a water bottle', 5, 1],
    ['transport', 'Anonymous', 'Walked', 2, 1],
    ['food', 'Ari', 'Used leftovers', 1, 1],
    ['community', 'Nia', 'Shared an environmental resource', 6, 1],
    ['reuse', 'Kai', 'Refilled a water bottle', 12, 2],
    ['energy', 'Lebo', 'Unplugged a device', 1, 2],
    ['transport', 'Jon', 'Cycled', 1, 3],
    ['food', 'Kai', 'Reduced food waste', 1, 4],
    ['community', 'Simone', 'Helped someone repair an item', 2, 5],
  ].map(([category, learner, action, quantity, daysAgo], index) =>
    createLocalActionRecord({
      id: `local-seed-${index + 1}`,
      category: category as CategoryId,
      learner: String(learner),
      action: String(action),
      quantity: Number(quantity),
      reflection: seedReflection(category as CategoryId),
      visibility: learner === 'Anonymous' ? 'anonymous' : 'first-name',
      locationCategory: 'Campus',
      actionMode: 'individual',
      createdAt: dateDaysAgo(now, Number(daysAgo)),
    }),
  )

  return rebuildDashboard({
    team: {
      name: 'The Carbon Cutters',
      memberName: 'Simone',
      motto: 'Debugging habits one choice at a time.',
      streakDays: 12,
      palette: 'Forest lime',
      privacyMode: 'First names and anonymous contributions',
    },
    profile: {
      displayName: 'Simone',
      team: 'The Carbon Cutters',
      habitFocus: 'Reducing single-use plastic',
      privacy: {
        exactImpact: true,
        actions: true,
        streak: true,
        photos: false,
        reflections: true,
      },
      notifications: 'Daily summary',
    },
    stats: emptyStats(),
    actions,
    tiles: [],
    challenges: [
      {
        id: 'plastic-light-week',
        title: 'Plastic-Light Week',
        progress: 72,
        accent: '#24c26a',
        reward: 'Community garden island',
        detail: 'Refill or reuse actions grow a shared garden.',
        categoryFocus: 'reuse',
        joined: true,
      },
      {
        id: 'switch-it-off-sprint',
        title: 'Switch-It-Off Sprint',
        progress: 58,
        accent: '#f6c64f',
        reward: 'Solar path lights',
        detail: 'Energy-saving actions light the team pathway.',
        categoryFocus: 'energy',
        joined: true,
      },
      {
        id: 'campus-cleanup-quest',
        title: 'Campus Cleanup Quest',
        progress: 41,
        accent: '#a98df2',
        reward: 'Recycling station',
        detail: 'Community actions build a practical campus resource.',
        categoryFocus: 'community',
        joined: false,
      },
    ],
    stories: [
      {
        id: 'story-refill-row',
        type: 'Team celebration',
        title: 'The grid just got greener.',
        body: 'Three learners checked in before lunch and completed a full refill row.',
        reaction: 'Keep Growing',
        createdAt: dateDaysAgo(now, 0),
        reactions: { 'Keep Growing': 4 },
      },
      {
        id: 'story-repair-cable',
        type: 'Repair story',
        title: 'A cable saved from the bin.',
        body: 'A quick repair turned into a reusable charger station for the studio.',
        reaction: 'Clever Reuse',
        createdAt: dateDaysAgo(now, 1),
        reactions: { 'Clever Reuse': 2 },
      },
      {
        id: 'story-easy-action',
        type: 'Habit tip',
        title: 'Make the easy action visible.',
        body: 'Reusable cups now sit beside the coffee machine instead of in a cupboard.',
        reaction: 'Bright Move',
        createdAt: dateDaysAgo(now, 2),
        reactions: { 'Bright Move': 3 },
      },
    ],
    resources: [
      {
        id: 'low-cost-student-sustainability',
        title: 'One-minute guide to low-cost student sustainability',
        format: 'One-minute read',
        category: 'Beginner actions',
        actionCategory: 'community',
        action: 'Shared an environmental resource',
      },
      {
        id: 'campus-recycling-checklist',
        title: 'Campus recycling checklist',
        format: 'Checklist',
        category: 'Recycling guides',
        actionCategory: 'community',
        action: 'Shared an environmental resource',
      },
      {
        id: 'responsible-digital-habits',
        title: 'Responsible digital habits mini quiz',
        format: 'Quick quiz',
        category: 'Responsible digital habits',
        actionCategory: 'energy',
        action: 'Used a power-saving mode',
      },
      {
        id: 'waste-less-lunch-template',
        title: 'Team activity template for a waste-less lunch',
        format: 'Team template',
        category: 'Low-cost ideas',
        actionCategory: 'food',
        action: 'Reduced food waste',
      },
    ],
    projects: [
      {
        id: 'community-garden-sprint',
        title: 'Community garden sprint',
        objective: 'Plan a student-led garden pilot with evidence, tasks, and a final showcase.',
        tasks: [
          { title: 'Plan bed layout', done: true },
          { title: 'Collect compost', done: false },
          { title: 'Build water guide', done: false },
          { title: 'Final showcase', done: false },
        ],
      },
    ],
    calculations: [],
  })
}

function addLocalAction(input: ActionInput): ActionResult {
  const dashboard = readLocalDashboard()
  const record = createLocalActionRecord(input)
  const challenges = dashboard.challenges.map((challenge) =>
    challenge.categoryFocus === record.category
      ? { ...challenge, joined: true, progress: Math.min(100, challenge.progress + 4) }
      : challenge,
  )
  const stories = [
    {
      id: `story-${record.id}`,
      type: 'Action completed',
      title: actionMessage(record.category),
      body: `${displayLearner(record)} logged ${record.action.toLowerCase()} for ${record.quantity} ${
        record.quantity === 1 ? 'unit' : 'units'
      }.`,
      reaction: defaultReaction(record.category),
      createdAt: record.createdAt,
      reactions: { [defaultReaction(record.category)]: 0 },
    },
    ...dashboard.stories,
  ]

  const nextDashboard = rebuildDashboard({
    ...dashboard,
    actions: [record, ...dashboard.actions],
    challenges,
    stories,
  })
  saveLocalDashboard(nextDashboard)

  return { record, dashboard: nextDashboard }
}

function joinLocalChallenge(challengeId: string) {
  const dashboard = readLocalDashboard()
  const nextDashboard = rebuildDashboard({
    ...dashboard,
    challenges: dashboard.challenges.map((challenge) =>
      challenge.id === challengeId
        ? { ...challenge, joined: true, progress: Math.min(100, challenge.progress + 3) }
        : challenge,
    ),
  })
  saveLocalDashboard(nextDashboard)
  return nextDashboard
}

function trackLocalResource(resourceId: string): ActionResult {
  const dashboard = readLocalDashboard()
  const resource = dashboard.resources.find((item) => item.id === resourceId)
  if (!resource) {
    throw new ApiError(404, 'Resource not found.')
  }

  return addLocalAction({
    category: resource.actionCategory,
    action: resource.action,
    quantity: 1,
    learner: dashboard.profile.displayName,
    reflection: `Turned "${resource.title}" into a trackable GreenGrid action.`,
    visibility: 'first-name',
    locationCategory: 'Campus',
    actionMode: 'team',
  })
}

function addLocalStoryReaction(storyId: string, reaction: string) {
  const dashboard = readLocalDashboard()
  const nextDashboard = rebuildDashboard({
    ...dashboard,
    stories: dashboard.stories.map((story) =>
      story.id === storyId
        ? {
            ...story,
            reactions: {
              ...story.reactions,
              [reaction]: Number(story.reactions[reaction] || 0) + 1,
            },
          }
        : story,
    ),
  })
  saveLocalDashboard(nextDashboard)
  return nextDashboard
}

function updateLocalPrivacy(privacy: Record<string, boolean>) {
  const dashboard = readLocalDashboard()
  const nextDashboard = rebuildDashboard({
    ...dashboard,
    profile: {
      ...dashboard.profile,
      privacy: { ...dashboard.profile.privacy, ...privacy },
    },
  })
  saveLocalDashboard(nextDashboard)
  return nextDashboard
}

function createLocalActionRecord(input: Partial<ActionInput> & { id?: string; createdAt?: string }): ActionRecord {
  const category = input.category || 'reuse'
  const quantity = clampQuantity(input.quantity)
  const action = cleanText(input.action, 96) || categoryActions[category][0]
  const learner = cleanText(input.learner, 40) || 'Simone'

  return {
    id: input.id || createId(),
    category,
    action,
    learner,
    quantity,
    duration: '',
    reflection: cleanText(input.reflection, 420) || seedReflection(category),
    visibility: cleanText(input.visibility, 32) || 'first-name',
    locationCategory: cleanText(input.locationCategory, 48) || 'Campus',
    actionMode: cleanText(input.actionMode, 32) || 'individual',
    evidenceName: '',
    createdAt: input.createdAt || new Date().toISOString(),
    impact: calculateImpact(category, action, quantity),
    reactions: {
      'Keep Growing': 0,
      'Ripple Effect': 0,
      'Clever Reuse': 0,
      'Bright Move': 0,
      'Team Energy': 0,
    },
  }
}

function rebuildDashboard(dashboard: DashboardPayload): DashboardPayload {
  const actions = [...dashboard.actions].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )
  const weeklyActions = actions.filter((action) => isWithinDays(action.createdAt, 7))
  const stats = summarizeActions(weeklyActions, dashboard.team.streakDays)

  return {
    ...dashboard,
    stats,
    actions: actions.slice(0, 20),
    tiles: buildTiles(actions),
    stories: dashboard.stories.slice(0, 8),
    calculations: [
      {
        title: `${stats.bottlesAvoided} bottles avoided`,
        body: `Calculated from ${stats.bottlesAvoided} recorded refill actions. This is an activity estimate rather than a precise environmental measurement.`,
        confidence: 'high',
      },
      {
        title: `${stats.co2Saved.toFixed(1)} kg CO2 saved`,
        body: 'Built from logged transport, energy, food, community, and reuse actions using conservative conversion factors.',
        confidence: 'medium',
      },
      {
        title: `${stats.activeLearners} active learners`,
        body: 'Participation is counted as presence and momentum. It is never used for negative ranking.',
        confidence: 'high',
      },
    ],
  }
}

function summarizeActions(actions: ActionRecord[], streakDays: number) {
  const totals = actions.reduce(emptyImpactTotals, emptyStats())
  const learners = new Set(actions.map(displayLearner))
  const todayLearners = new Set(actions.filter((action) => isToday(action.createdAt)).map(displayLearner))
  const habitCounts = new Map<string, number>()

  for (const action of actions) {
    habitCounts.set(action.action, (habitCounts.get(action.action) || 0) + action.quantity)
  }

  const topHabit = [...habitCounts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] || 'Refill'

  return {
    ...totals,
    co2Saved: round(totals.co2Saved, 1),
    distanceKm: round(totals.distanceKm, 1),
    bottlesAvoided: Math.round(totals.bottlesAvoided),
    wasteItems: Math.round(totals.wasteItems),
    waterLitres: Math.round(totals.waterLitres),
    communityReach: Math.round(totals.communityReach),
    actionsThisWeek: actions.length,
    activeLearners: learners.size,
    checkedInToday: todayLearners.size,
    streakDays,
    topHabit,
  }
}

function emptyImpactTotals(total: ReturnType<typeof emptyStats>, action: ActionRecord) {
  total.co2Saved += action.impact.co2Kg
  total.bottlesAvoided += action.impact.bottlesAvoided
  total.wasteItems += action.impact.wasteItems
  total.waterLitres += action.impact.waterLitres
  total.distanceKm += action.impact.distanceKm
  total.communityReach += action.impact.communityReach
  return total
}

function emptyStats() {
  return {
    co2Saved: 0,
    bottlesAvoided: 0,
    wasteItems: 0,
    waterLitres: 0,
    distanceKm: 0,
    communityReach: 0,
    actionsThisWeek: 0,
    activeLearners: 0,
    checkedInToday: 0,
    streakDays: 0,
    topHabit: 'Refill',
  }
}

function buildTiles(actions: ActionRecord[]): GridTile[] {
  const actionTiles = actions.slice(0, 58).map((action) => ({
    id: action.id,
    category: action.category,
    learner: displayLearner(action),
    action: action.action,
    impact: action.impact.label,
    reflection: action.reflection,
    date: formatDateLabel(action.createdAt),
    reaction: defaultReaction(action.category),
  }))

  const openTiles = Array.from({ length: Math.max(0, 72 - actionTiles.length) }, (_, index) => ({
    id: `open-${index}`,
    category: 'open' as const,
    learner: 'Open space',
    action: 'Ready for the next small action',
    impact: 'Future impact',
    reflection: 'Your grid is ready whenever you are.',
    date: 'Soon',
    reaction: 'Space Saved',
  }))

  return [...actionTiles, ...openTiles].slice(0, 72)
}

function calculateImpact(category: CategoryId, action: string, quantity: number): ImpactSummary {
  const impact = {
    co2Kg: 0,
    bottlesAvoided: 0,
    wasteItems: 0,
    waterLitres: 0,
    distanceKm: 0,
    communityReach: 0,
    label: 'Impact recorded',
  }

  if (category === 'reuse') {
    impact.co2Kg = quantity * (action.includes('water bottle') ? 0.16 : 0.08)
    impact.bottlesAvoided = action.includes('water bottle') ? quantity : 0
    impact.wasteItems = action.includes('water bottle') ? quantity : Math.max(quantity, 1)
    impact.label = action.includes('water bottle')
      ? `${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} avoided`
      : `${quantity} reuse ${quantity === 1 ? 'item' : 'items'} recorded`
  }

  if (category === 'energy') {
    impact.co2Kg = quantity * 0.35
    impact.label = `${round(impact.co2Kg, 1)} kg CO2 estimated`
  }

  if (category === 'transport') {
    impact.co2Kg = quantity * 0.3
    impact.distanceKm = quantity
    impact.label = `${quantity} km lower-carbon travel`
  }

  if (category === 'food') {
    impact.co2Kg = quantity * 0.65
    impact.label = `${quantity} food ${quantity === 1 ? 'habit' : 'habits'} logged`
  }

  if (category === 'community') {
    impact.communityReach = quantity
    impact.label = `${quantity} community ${quantity === 1 ? 'touchpoint' : 'touchpoints'}`
  }

  return { ...impact, co2Kg: round(impact.co2Kg, 2) }
}

function seedReflection(category: CategoryId) {
  return (
    {
      reuse: 'Easy to repeat after keeping a bottle near my desk.',
      energy: 'The room was bright enough without extra lights.',
      transport: 'Took a little longer and felt calmer.',
      food: 'It saved money and reduced waste at the same time.',
      community: 'A small share made the idea easier for someone else.',
    }[category] || 'This felt worth repeating.'
  )
}

function actionMessage(category: CategoryId) {
  return (
    {
      reuse: 'One less bottle. One more win.',
      energy: 'Small move. Real momentum.',
      transport: 'The route got lighter.',
      food: 'Waste-less habit added.',
      community: 'The grid just got kinder.',
    }[category] || 'Tiny action logged. Collective impact upgraded.'
  )
}

function defaultReaction(category: CategoryId) {
  return (
    {
      reuse: 'Keep Growing',
      energy: 'Bright Move',
      transport: 'Team Energy',
      food: 'Clever Reuse',
      community: 'Ripple Effect',
    }[category] || 'Keep Growing'
  )
}

function displayLearner(action: ActionRecord) {
  if (action.visibility === 'anonymous') return 'Anonymous'
  return cleanText(action.learner, 40) || 'Simone'
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clampQuantity(value: unknown) {
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return 1
  return Math.min(500, Math.max(1, Math.round(quantity)))
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength)
}

function dateDaysAgo(now: Date, daysAgo: number) {
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(10 + (daysAgo % 7), 15, 0, 0)
  return date.toISOString()
}

function formatDateLabel(value: string) {
  const date = new Date(value)
  if (isToday(value)) return 'Today'
  if (isWithinDays(value, 2)) return 'Yesterday'
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString()
}

function isWithinDays(value: string, days: number) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
