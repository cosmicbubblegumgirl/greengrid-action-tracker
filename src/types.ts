export type CategoryId = 'reuse' | 'energy' | 'transport' | 'food' | 'community'

export type SyncMode = 'loading' | 'synced' | 'local'

export type Category = {
  id: CategoryId
  label: string
  hint: string
  color: string
  actions: string[]
}

export type ImpactSummary = {
  co2Kg: number
  bottlesAvoided: number
  wasteItems: number
  waterLitres: number
  distanceKm: number
  communityReach: number
  label: string
}

export type ActionRecord = {
  id: string
  category: CategoryId
  action: string
  learner: string
  quantity: number
  duration: string
  reflection: string
  visibility: string
  locationCategory: string
  actionMode: string
  evidenceName: string
  createdAt: string
  impact: ImpactSummary
  reactions: Record<string, number>
}

export type GridTile = {
  id: string
  category: CategoryId | 'open'
  learner: string
  action: string
  impact: string
  reflection: string
  date: string
  reaction: string
}

export type DashboardStats = {
  co2Saved: number
  bottlesAvoided: number
  wasteItems: number
  waterLitres: number
  distanceKm: number
  communityReach: number
  actionsThisWeek: number
  activeLearners: number
  checkedInToday: number
  streakDays: number
  topHabit: string
}

export type TeamProfile = {
  name: string
  memberName: string
  motto: string
  streakDays: number
  palette: string
  privacyMode: string
}

export type UserProfile = {
  displayName: string
  team: string
  habitFocus: string
  privacy: Record<string, boolean>
  notifications: string
}

export type Challenge = {
  id: string
  title: string
  progress: number
  accent: string
  reward: string
  detail: string
  categoryFocus: CategoryId
  joined: boolean
}

export type Resource = {
  id: string
  title: string
  format: string
  category: string
  actionCategory: CategoryId
  action: string
}

export type Story = {
  id: string
  type: string
  title: string
  body: string
  reaction: string
  createdAt: string
  reactions: Record<string, number>
}

export type ProjectTask = {
  title: string
  done: boolean
}

export type Project = {
  id: string
  title: string
  objective: string
  tasks: ProjectTask[]
}

export type ImpactCalculation = {
  title: string
  body: string
  confidence: string
}

export type DashboardPayload = {
  team: TeamProfile
  profile: UserProfile
  stats: DashboardStats
  actions: ActionRecord[]
  tiles: GridTile[]
  challenges: Challenge[]
  stories: Story[]
  resources: Resource[]
  projects: Project[]
  calculations: ImpactCalculation[]
}

export type ActionInput = {
  category: CategoryId
  action: string
  quantity: number
  learner: string
  reflection: string
  visibility: string
  locationCategory: string
  actionMode: string
}

export type ActionResult = {
  record: ActionRecord
  dashboard: DashboardPayload
}
