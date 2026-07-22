import {
  ArrowUpRight,
  Bike,
  BookOpen,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  Flower2,
  HeartHandshake,
  Leaf,
  LineChart,
  Lock,
  MapPinned,
  MessageCircleHeart,
  Plus,
  Recycle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  SunMedium,
  Trees,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, PointerEvent } from 'react'
import {
  addStoryReaction,
  createFallbackDashboard,
  isApiError,
  joinChallenge,
  loadDashboard,
  resetLocalDashboard,
  submitAction,
  trackResource,
  updatePrivacy,
} from './api'
import './App.css'
import type { Category, CategoryId, GridTile, SyncMode } from './types'

type CategoryView = Category & {
  Icon: typeof Droplets
}

type Seed = {
  id: number
  x: number
  y: number
}

const categories: CategoryView[] = [
  {
    id: 'reuse',
    label: 'Refill and reuse',
    hint: 'Bottles, cups, containers and packaging',
    color: '#24c26a',
    Icon: Droplets,
    actions: [
      'Refilled a water bottle',
      'Used a reusable cup',
      'Packed food in a reusable container',
      'Refused a plastic straw',
      'Reused packaging',
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    hint: 'Lights, devices and lower-power habits',
    color: '#f6c64f',
    Icon: Zap,
    actions: [
      'Switched off unused lights',
      'Unplugged a device',
      'Used natural lighting',
      'Reduced screen brightness',
      'Used a power-saving mode',
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    hint: 'Walking, cycling and shared routes',
    color: '#35a7ff',
    Icon: Bike,
    actions: [
      'Walked',
      'Cycled',
      'Used public transport',
      'Shared a lift',
      'Attended remotely instead of travelling',
    ],
  },
  {
    id: 'food',
    label: 'Food',
    hint: 'Plant-forward meals and less waste',
    color: '#9bd35f',
    Icon: Leaf,
    actions: [
      'Chose a plant-based meal',
      'Reduced food waste',
      'Used leftovers',
      'Supported a local food business',
      'Composted food scraps',
    ],
  },
  {
    id: 'community',
    label: 'Community',
    hint: 'Repair, cleanup and shared resources',
    color: '#a98df2',
    Icon: HeartHandshake,
    actions: [
      'Picked up litter',
      'Shared an environmental resource',
      'Helped someone repair an item',
      'Donated an unused item',
      'Joined a clean-up activity',
    ],
  },
]

const forestPhotos = [
  {
    src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=85',
    alt: 'Tall green forest with sunlight through the trees',
  },
  {
    src: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1400&q=85',
    alt: 'Forest canopy photographed from below',
  },
  {
    src: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1400&q=85',
    alt: 'Dense green woodland path',
  },
]

const privacyOptions = [
  { key: 'actions', label: 'Action feed', Icon: Lock },
  { key: 'streak', label: 'Streak', Icon: SunMedium },
  { key: 'reflections', label: 'Reflections', Icon: MapPinned },
] as const

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(target)

  useEffect(() => {
    let frame = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(target * eased)

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, target])

  return value
}

function App() {
  const [dashboard, setDashboard] = useState(createFallbackDashboard)
  const [syncMode, setSyncMode] = useState<SyncMode>('loading')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('reuse')
  const [selectedAction, setSelectedAction] = useState(categories[0].actions[0])
  const [quantity, setQuantity] = useState('1')
  const [learner, setLearner] = useState('Simone')
  const [visibility, setVisibility] = useState('first-name')
  const [reflection, setReflection] = useState('')
  const [message, setMessage] = useState('Your workspace is opening.')
  const [formError, setFormError] = useState('')
  const [activeTile, setActiveTile] = useState(0)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [seeds, setSeeds] = useState<Seed[]>([])
  const seedId = useRef(0)
  const lastSeedAt = useRef(0)

  const currentCategory = categories.find((item) => item.id === selectedCategory) ?? categories[0]
  const stats = dashboard.stats
  const project = dashboard.projects[0]
  const ringProgress = Math.min(100, Math.max(12, Math.round((stats.actionsThisWeek / 35) * 100)))
  const activeMiniCount = Math.min(35, Math.max(12, stats.actionsThisWeek + 6))
  const latestActions = dashboard.actions.slice(0, 5)

  const statCards = useMemo(
    () => [
      { label: 'Estimated CO2 saved this week', value: stats.co2Saved, suffix: ' kg' },
      { label: 'Current team streak', value: stats.streakDays, suffix: ' days' },
      { label: 'Learners checked in today', value: stats.checkedInToday, suffix: ' learners' },
      { label: 'Single-use bottles avoided', value: stats.bottlesAvoided, suffix: ' bottles' },
    ],
    [stats],
  )

  useEffect(() => {
    let isMounted = true

    loadDashboard()
      .then(({ data, mode }) => {
        if (!isMounted) return
        setDashboard(data)
        setSyncMode(mode)
        setLearner(data.profile.displayName)
        setMessage(mode === 'synced' ? 'Workspace synced.' : 'Saved on this device.')
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        setSyncMode('local')
        setFormError(isApiError(error) ? error.message : 'The workspace opened with local saving.')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const now = Date.now()
    if (now - lastSeedAt.current < 90) {
      return
    }

    lastSeedAt.current = now
    const nextSeed = {
      id: seedId.current,
      x: event.clientX,
      y: event.clientY,
    }

    seedId.current += 1
    setSeeds((current) => [...current.slice(-14), nextSeed])
    window.setTimeout(() => {
      setSeeds((current) => current.filter((seed) => seed.id !== nextSeed.id))
    }, 1000)
  }

  const handleCategoryChange = (category: CategoryView) => {
    setSelectedCategory(category.id)
    setSelectedAction(category.actions[0])
  }

  const handleLogAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPendingKey('action')
    setFormError('')

    try {
      const { data, mode } = await submitAction({
        category: selectedCategory,
        action: selectedAction,
        quantity: Number(quantity),
        learner,
        reflection,
        visibility,
        locationCategory: 'Campus',
        actionMode: 'individual',
      })

      setDashboard(data.dashboard)
      setSyncMode(mode)
      setMessage(`${data.record.impact.label} added to the grid.`)
      setActiveTile(0)
      setReflection('')
      setQuantity('1')
    } catch (error: unknown) {
      setFormError(isApiError(error) ? error.message : 'The action could not be saved yet.')
    } finally {
      setPendingKey(null)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    setPendingKey(`challenge:${challengeId}`)
    setFormError('')

    try {
      const { data, mode } = await joinChallenge(challengeId)
      setDashboard(data)
      setSyncMode(mode)
      setMessage('Challenge joined.')
    } catch (error: unknown) {
      setFormError(isApiError(error) ? error.message : 'The challenge could not be updated yet.')
    } finally {
      setPendingKey(null)
    }
  }

  const handleTrackResource = async (resourceId: string) => {
    setPendingKey(`resource:${resourceId}`)
    setFormError('')

    try {
      const { data, mode } = await trackResource(resourceId)
      setDashboard(data.dashboard)
      setSyncMode(mode)
      setMessage(`${data.record.action} added from the resource library.`)
      setActiveTile(0)
    } catch (error: unknown) {
      setFormError(isApiError(error) ? error.message : 'The resource could not be tracked yet.')
    } finally {
      setPendingKey(null)
    }
  }

  const handleStoryReaction = async (storyId: string, reaction: string) => {
    setPendingKey(`story:${storyId}`)

    try {
      const { data, mode } = await addStoryReaction(storyId, reaction)
      setDashboard(data)
      setSyncMode(mode)
      setMessage('Reaction added.')
    } catch (error: unknown) {
      setFormError(isApiError(error) ? error.message : 'The reaction could not be saved yet.')
    } finally {
      setPendingKey(null)
    }
  }

  const handlePrivacyToggle = async (key: string) => {
    const nextValue = !dashboard.profile.privacy[key]
    setPendingKey(`privacy:${key}`)

    try {
      const { data, mode } = await updatePrivacy({ [key]: nextValue })
      setDashboard(data)
      setSyncMode(mode)
      setMessage('Privacy updated.')
    } catch (error: unknown) {
      setFormError(isApiError(error) ? error.message : 'Privacy could not be updated yet.')
    } finally {
      setPendingKey(null)
    }
  }

  const handleResetLocal = () => {
    const nextDashboard = resetLocalDashboard()
    setDashboard(nextDashboard)
    setSyncMode('local')
    setMessage('Saved view reset.')
    setActiveTile(0)
  }

  return (
    <main className="app" onPointerMove={handlePointerMove}>
      <div className="cursor-seeds" aria-hidden="true">
        {seeds.map((seed) => (
          <span key={seed.id} style={{ left: seed.x, top: seed.y }} />
        ))}
      </div>

      <section className="hero-section" id="home">
        <nav className="top-nav" aria-label="Main navigation">
          <a className="brand" href="#home" aria-label="GreenGrid home">
            <span className="brand-mark">
              <Leaf size={18} strokeWidth={2.4} />
            </span>
            GreenGrid
          </a>
          <div className="nav-links">
            <a href="#how">How It Works</a>
            <a href="#dashboard">Team Impact</a>
            <a href="#challenges">Challenges</a>
            <a href="#resources">Resources</a>
          </div>
          <div className="nav-actions">
            <a className="text-link" href="#profile">
              Profile
            </a>
            <a className="workspace-link" href="#dashboard">
              Workspace <ArrowUpRight size={16} />
            </a>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Small choices. Visible impact. Shared momentum.</p>
            <h1>Small choices, visible impact.</h1>
            <p className="hero-lede">
              A clear view of everyday environmental actions for student teams who want progress
              without shame, pressure, or noise.
            </p>
            <div className="hero-buttons">
              <a className="primary-button" href="#log">
                <Plus size={18} />
                Start an action
              </a>
              <a className="secondary-button" href="#dashboard">
                <LineChart size={18} />
                View team progress
              </a>
            </div>
          </div>

          <div className="garden-console" aria-label="Animated digital garden preview">
            <div className="console-header">
              <span>Living GreenGrid</span>
              <span className={`live-dot ${syncMode}`}>{syncLabel(syncMode)}</span>
            </div>
            <div className="mini-grid">
              {dashboard.tiles.slice(0, 36).map((tile, index) => (
                <span
                  className={`mini-tile ${tile.category} ${index <= activeMiniCount ? 'is-awake' : ''}`}
                  key={`${tile.id}-${index}`}
                  style={{ animationDelay: `${index * 38}ms` }}
                />
              ))}
            </div>
            <div className="console-footer">
              <span>
                <Sprout size={16} />
                {dashboard.team.name}
              </span>
              <span>{stats.actionsThisWeek} actions this week</span>
            </div>
          </div>
        </div>

        <div className="hero-stats" aria-label="Weekly impact summary">
          {statCards.map((stat, index) => (
            <ImpactCard
              key={stat.label}
              label={stat.label}
              target={stat.value}
              suffix={stat.suffix}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className="image-ribbon" aria-label="Green environments">
        {forestPhotos.map((photo) => (
          <img key={photo.src} src={photo.src} alt={photo.alt} loading="lazy" />
        ))}
      </section>

      <section className="section intro-section" id="how">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Turn tiny habits into a shared eco-world.</h2>
        </div>
        <div className="steps-grid">
          <article>
            <span className="step-icon">
              <Camera size={22} />
            </span>
            <h3>Log the action</h3>
            <p>Pick a category, add a quick detail, and keep evidence optional.</p>
          </article>
          <article>
            <span className="step-icon">
              <Flower2 size={22} />
            </span>
            <h3>Grow the tile</h3>
            <p>The action becomes a living tile with a reflection and celebration.</p>
          </article>
          <article>
            <span className="step-icon">
              <Trees size={22} />
            </span>
            <h3>Build momentum</h3>
            <p>Completed rows unlock plants, rivers, solar paths and team projects.</p>
          </article>
        </div>
      </section>

      <section className="section dashboard-section" id="dashboard">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Main dashboard</p>
            <h2>{greeting()}, {dashboard.profile.displayName}.</h2>
            <p>
              {dashboard.team.name} has completed {stats.actionsThisWeek} small actions this week.
            </p>
          </div>
          <div className="quick-actions" aria-label="Quick actions">
            <a href="#log">
              <Plus size={18} />
              Log
            </a>
            <a href="#resources">
              <BookOpen size={18} />
              Resource
            </a>
            <a href="#challenges">
              <Trophy size={18} />
              Challenge
            </a>
            <a href="#stories">
              <MessageCircleHeart size={18} />
              Celebrate
            </a>
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="impact-ring-panel">
            <div
              className="impact-ring"
              style={{ '--progress': `${ringProgress * 3.6}deg` } as CSSProperties}
              aria-label={`Weekly progress ${ringProgress} percent`}
            >
              <div>
                <strong>{ringProgress}%</strong>
                <span>weekly pulse</span>
              </div>
            </div>
            <div>
              <h3>Weekly impact overview</h3>
              <p>
                {stats.co2Saved.toFixed(1)} kg CO2 saved, {stats.bottlesAvoided} bottles avoided,{' '}
                {stats.actionsThisWeek} actions completed, and {stats.activeLearners} active learners.
              </p>
              <div className="floating-icons" aria-hidden="true">
                <Droplets size={18} />
                <Recycle size={18} />
                <SunMedium size={18} />
                <Leaf size={18} />
              </div>
            </div>
          </article>

          <article className="momentum-panel">
            <h3>Team momentum</h3>
            <div className="momentum-list">
              <span>Top habit</span>
              <strong>{stats.topHabit}</strong>
              <span>Team note</span>
              <strong>{dashboard.team.motto}</strong>
              <span>Community reach</span>
              <strong>{stats.communityReach} touchpoints</strong>
            </div>
          </article>
        </div>

        <div className="activity-panel">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h3>Fresh tiles from the team</h3>
          </div>
          <div className="activity-list">
            {latestActions.map((action) => (
              <article key={action.id}>
                <span className={`activity-dot ${action.category}`} />
                <div>
                  <strong>{action.action}</strong>
                  <p>
                    {action.learner} - {action.impact.label}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="living-grid-wrap">
          <div className="section-heading compact">
            <p className="eyebrow">The Living GreenGrid</p>
            <h2>Every tile is a real action with room for the next one.</h2>
          </div>
          <div className="living-grid" aria-label="Interactive action grid">
            {dashboard.tiles.map((tile, index) => (
              <GridButton
                active={index === activeTile}
                index={index}
                key={`${tile.id}-${index}`}
                tile={tile}
              />
            ))}
          </div>
          <div className="legend">
            {categories.map((category) => (
              <span key={category.id}>
                <i style={{ background: category.color }} />
                {category.label}
              </span>
            ))}
            <span>
              <i className="open-dot" />
              Future action
            </span>
          </div>
        </div>
      </section>

      <section className="section log-section" id="log">
        <div className="section-heading">
          <p className="eyebrow">Log an action</p>
          <h2>Less than one minute from habit to impact.</h2>
        </div>

        <form className="action-form" onSubmit={handleLogAction}>
          <div className="category-picker" aria-label="Choose an action category">
            {categories.map((category) => {
              const Icon = category.Icon
              return (
                <button
                  className={selectedCategory === category.id ? 'selected' : ''}
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                >
                  <Icon size={20} />
                  <span>{category.label}</span>
                  <small>{category.hint}</small>
                </button>
              )
            })}
          </div>

          <div className="form-panel">
            <div className="form-row">
              <label>
                Action
                <select value={selectedAction} onChange={(event) => setSelectedAction(event.target.value)}>
                  {currentCategory.actions.map((action) => (
                    <option key={action}>{action}</option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  min="1"
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Name
                <input value={learner} onChange={(event) => setLearner(event.target.value)} />
              </label>
              <label>
                Visibility
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                  <option value="first-name">First name</option>
                  <option value="anonymous">Anonymous</option>
                  <option value="team">Team only</option>
                </select>
              </label>
            </div>
            <label>
              Reflection
              <textarea
                placeholder="What made this action easy, difficult, or worth repeating?"
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
              />
            </label>
            <div className="submission-row">
              <span>
                <ShieldCheck size={18} />
                Individual, team, or anonymous logging stays positive.
              </span>
              <button disabled={pendingKey === 'action'} type="submit">
                <Send size={18} />
                {pendingKey === 'action' ? 'Adding' : 'Add tile'}
              </button>
            </div>
            <p className="success-message">
              <Sparkles size={18} />
              {message}
            </p>
            {formError ? <p className="form-error">{formError}</p> : null}
          </div>
        </form>
      </section>

      <section className="section challenge-section" id="challenges">
        <div className="section-heading">
          <p className="eyebrow">Challenges</p>
          <h2>Floating missions that build a shared green world.</h2>
        </div>
        <div className="challenge-map">
          {dashboard.challenges.map((challenge, index) => (
            <article
              className="challenge-island"
              key={challenge.id}
              style={{ '--accent': challenge.accent } as CSSProperties}
            >
              <span className="island-number">0{index + 1}</span>
              <h3>{challenge.title}</h3>
              <p>{challenge.detail}</p>
              <div className="progress-track">
                <span style={{ width: `${challenge.progress}%` }} />
              </div>
              <strong>{challenge.reward}</strong>
              <button
                disabled={pendingKey === `challenge:${challenge.id}`}
                type="button"
                onClick={() => handleJoinChallenge(challenge.id)}
              >
                <Trophy size={17} />
                {challenge.joined ? 'Boost mission' : 'Join mission'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section garden-section">
        <div className="section-heading">
          <p className="eyebrow">Habit garden</p>
          <h2>The garden pauses. It never punishes.</h2>
        </div>
        <div className="garden-layout">
          <div className="garden-visual" aria-label="Personal habit garden">
            <span className="pond" />
            <span className="sunflower" />
            <span className="tree" />
            <span className="vine" />
            <span className="firefly one" />
            <span className="firefly two" />
          </div>
          <div className="garden-copy">
            <p>Welcome back. Your garden saved you a space.</p>
            <ul>
              <li>Refill actions grow water lilies.</li>
              <li>Energy actions grow sunflowers.</li>
              <li>Community actions unlock trees and fireflies.</li>
              <li>Trying a new habit adds rare seasonal plants.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section explorer-section">
        <div className="section-heading">
          <p className="eyebrow">Impact explorer</p>
          <h2>Transparent estimates, explained in plain language.</h2>
        </div>
        <div className="explorer-grid">
          {dashboard.calculations.map((calculation, index) => (
            <article key={calculation.title}>
              {index === 0 ? <Waves size={24} /> : index === 1 ? <Flame size={24} /> : <Users size={24} />}
              <h3>{calculation.title}</h3>
              <p>{calculation.body}</p>
              <span>Confidence: {calculation.confidence}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section stories-section" id="stories">
        <div className="section-heading">
          <p className="eyebrow">Green stories</p>
          <h2>A calmer feed for progress, tips and team wins.</h2>
        </div>
        <div className="story-grid">
          {dashboard.stories.map((story) => (
            <article key={story.id}>
              <span>{story.type}</span>
              <h3>{story.title}</h3>
              <p>{story.body}</p>
              <button
                disabled={pendingKey === `story:${story.id}`}
                type="button"
                onClick={() => handleStoryReaction(story.id, story.reaction)}
              >
                <Sprout size={17} />
                {story.reaction} {story.reactions[story.reaction] || 0}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section resources-section" id="resources">
        <div className="resources-copy">
          <p className="eyebrow">Resource library</p>
          <h2>Practical ideas that turn directly into trackable action.</h2>
          <p>
            Guides stay short, student-friendly and useful, with quiet controls for resources,
            challenges, personal activity and campus updates.
          </p>
        </div>
        <div className="resource-list">
          {dashboard.resources.map((resource) => (
            <article key={resource.id}>
              <BookOpen size={21} />
              <span>
                <strong>{resource.title}</strong>
                <small>
                  {resource.format} - {resource.category}
                </small>
              </span>
              <button
                disabled={pendingKey === `resource:${resource.id}`}
                type="button"
                onClick={() => handleTrackResource(resource.id)}
              >
                <CheckCircle2 size={17} />
                Track
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section projects-section">
        <div className="project-card">
          <div>
            <p className="eyebrow">Team projects</p>
            <h2>{project.title}</h2>
            <p>{project.objective}</p>
          </div>
          <div className="project-board" aria-label="Project task board">
            {project.tasks.map((task) => (
              <span className={task.done ? 'done' : ''} key={task.title}>
                {task.done ? <CheckCircle2 size={17} /> : <Sprout size={17} />}
                {task.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section profile-section" id="profile">
        <div>
          <p className="eyebrow">Profile and privacy</p>
          <h2>Display the contribution, not the pressure.</h2>
          <p>I am currently working on {dashboard.profile.habitFocus.toLowerCase()}.</p>
        </div>
        <div className="privacy-controls">
          {privacyOptions.map(({ key, label, Icon }) => {
            const enabled = Boolean(dashboard.profile.privacy[key])
            return (
              <button
                aria-pressed={enabled}
                className={enabled ? 'enabled' : ''}
                disabled={pendingKey === `privacy:${key}`}
                key={key}
                type="button"
                onClick={() => handlePrivacyToggle(key)}
              >
                <Icon size={18} />
                <span>{label}</span>
                <small>{enabled ? 'On' : 'Off'}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="workspace-status" aria-live="polite">
        <span className={`live-dot ${syncMode}`}>{syncLabel(syncMode)}</span>
        <span>{message}</span>
        {syncMode === 'local' ? (
          <button type="button" onClick={handleResetLocal}>
            <RotateCcw size={16} />
            Reset saved view
          </button>
        ) : null}
      </section>

      <footer>
        <span>GreenGrid</span>
        <span>a quantumcupcakecreation</span>
      </footer>
    </main>
  )
}

function GridButton({ active, index, tile }: { active: boolean; index: number; tile: GridTile }) {
  return (
    <button
      className={`grid-tile ${tile.category} ${active ? 'latest' : ''} ${
        Math.floor(index / 12) === 2 ? 'row-complete' : ''
      }`}
      type="button"
    >
      <span className="tile-tooltip">
        <strong>{tile.learner}</strong>
        <span>{tile.action}</span>
        <span>{tile.impact}</span>
        <span>{tile.date}</span>
        <em>{tile.reflection}</em>
        <small>{tile.reaction}</small>
      </span>
    </button>
  )
}

function ImpactCard({
  label,
  target,
  suffix,
  index,
}: {
  label: string
  target: number
  suffix: string
  index: number
}) {
  const value = useCountUp(target)
  const displayValue = Number.isInteger(target) ? Math.round(value).toString() : value.toFixed(1)

  return (
    <article className="impact-card" style={{ animationDelay: `${index * 120}ms` }}>
      <strong>
        {displayValue}
        {suffix}
      </strong>
      <span>{label}</span>
      <small>Hover for method</small>
      <p>Built from recorded team actions using conservative activity estimates.</p>
    </article>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function syncLabel(mode: SyncMode) {
  if (mode === 'synced') return 'Live sync'
  if (mode === 'local') return 'Local save'
  return 'Syncing'
}

export default App
