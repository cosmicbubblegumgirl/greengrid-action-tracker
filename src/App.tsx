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
import './App.css'

type CategoryId = 'reuse' | 'energy' | 'transport' | 'food' | 'community'

type Category = {
  id: CategoryId
  label: string
  hint: string
  color: string
  Icon: typeof Droplets
  actions: string[]
}

type GridTile = {
  category: CategoryId | 'open'
  learner: string
  action: string
  impact: string
  reflection: string
  date: string
  reaction: string
}

type Seed = {
  id: number
  x: number
  y: number
}

const categories: Category[] = [
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

const statCards = [
  { label: 'Estimated CO2 saved this week', value: 18.4, suffix: ' kg' },
  { label: 'Current team streak', value: 12, suffix: ' days' },
  { label: 'Learners checked in today', value: 3, suffix: ' learners' },
  { label: 'Single-use bottles avoided', value: 64, suffix: ' bottles' },
]

const sampleTiles: GridTile[] = [
  {
    category: 'reuse',
    learner: 'Maya',
    action: 'Refilled a water bottle',
    impact: '1 bottle avoided',
    reflection: 'Easy to repeat after keeping a bottle near my desk.',
    date: 'Today',
    reaction: 'Keep Growing',
  },
  {
    category: 'energy',
    learner: 'Theo',
    action: 'Switched off unused lights',
    impact: '0.3 kg CO2 estimated',
    reflection: 'The lab was bright enough with daylight.',
    date: 'Today',
    reaction: 'Bright Move',
  },
  {
    category: 'transport',
    learner: 'Anonymous',
    action: 'Walked part of the route',
    impact: '1.8 km lower-carbon travel',
    reflection: 'Took ten extra minutes and felt calmer.',
    date: 'Yesterday',
    reaction: 'Team Energy',
  },
  {
    category: 'food',
    learner: 'Ari',
    action: 'Used leftovers',
    impact: '1 meal rescued',
    reflection: 'Made lunch cheaper too.',
    date: 'Yesterday',
    reaction: 'Clever Reuse',
  },
  {
    category: 'community',
    learner: 'Nia',
    action: 'Shared an environmental resource',
    impact: '6 classmates reached',
    reflection: 'Short practical tips worked best.',
    date: 'Monday',
    reaction: 'Ripple Effect',
  },
  {
    category: 'reuse',
    learner: 'Jon',
    action: 'Used a reusable cup',
    impact: '1 cup avoided',
    reflection: 'The cafe remembered the discount.',
    date: 'Monday',
    reaction: 'Keep Growing',
  },
]

const challenges = [
  {
    title: 'Plastic-Light Week',
    progress: 72,
    accent: '#24c26a',
    reward: 'Community garden island',
    detail: '46 of 64 refill or reuse actions complete',
  },
  {
    title: 'Switch-It-Off Sprint',
    progress: 58,
    accent: '#f6c64f',
    reward: 'Solar path lights',
    detail: 'Nine energy-saving actions logged this week',
  },
  {
    title: 'Campus Cleanup Quest',
    progress: 41,
    accent: '#a98df2',
    reward: 'Recycling station',
    detail: 'A shared project board is now open',
  },
]

const stories = [
  {
    type: 'Team celebration',
    title: 'The grid just got greener.',
    body: 'Three learners checked in before lunch and completed a full refill row.',
    reaction: 'Keep Growing',
  },
  {
    type: 'Repair story',
    title: 'A cable saved from the bin.',
    body: 'A quick repair turned into a reusable charger station for the studio.',
    reaction: 'Clever Reuse',
  },
  {
    type: 'Habit tip',
    title: 'Make the easy action visible.',
    body: 'Reusable cups now sit beside the coffee machine instead of in a cupboard.',
    reaction: 'Bright Move',
  },
]

const resources = [
  'One-minute guide to low-cost student sustainability',
  'Campus recycling checklist',
  'Responsible digital habits mini quiz',
  'Team activity template for a waste-less lunch',
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

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0)

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('reuse')
  const [selectedAction, setSelectedAction] = useState(categories[0].actions[0])
  const [quantity, setQuantity] = useState('1')
  const [reflection, setReflection] = useState('')
  const [message, setMessage] = useState('Your action joined the ecosystem.')
  const [activeTile, setActiveTile] = useState(0)
  const [seeds, setSeeds] = useState<Seed[]>([])
  const seedId = useRef(0)
  const lastSeedAt = useRef(0)

  const currentCategory = categories.find((item) => item.id === selectedCategory) ?? categories[0]

  const gridTiles = useMemo(() => {
    return Array.from({ length: 72 }, (_, index) => {
      if (index > 57 && index % 3 !== 0) {
        return {
          category: 'open',
          learner: 'Open space',
          action: 'Ready for the next small action',
          impact: 'Future impact',
          reflection: 'Your grid is ready whenever you are.',
          date: 'Soon',
          reaction: 'Space Saved',
        } satisfies GridTile
      }

      return sampleTiles[index % sampleTiles.length]
    })
  }, [])

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
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

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category.id)
    setSelectedAction(category.actions[0])
  }

  const handleLogAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextMessage =
      selectedCategory === 'reuse'
        ? 'One less bottle. One more win.'
        : selectedCategory === 'energy'
          ? 'Small move. Real momentum.'
          : selectedCategory === 'community'
            ? 'The grid just got kinder.'
            : 'Tiny action logged. Collective impact upgraded.'

    setMessage(nextMessage)
    setActiveTile((current) => (current + 7) % 57)
    setReflection('')
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
              Sign In
            </a>
            <a className="workspace-link" href="#dashboard">
              Back to Workspace <ArrowUpRight size={16} />
            </a>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Small choices. Visible impact. Shared momentum.</p>
            <h1>Small choices, visible impact.</h1>
            <p className="hero-lede">
              A clear view of everyday environmental actions for student teams who want
              progress without shame, pressure, or noise.
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
              <span className="live-dot">live</span>
            </div>
            <div className="mini-grid">
              {gridTiles.slice(0, 36).map((tile, index) => (
                <span
                  className={`mini-tile ${tile.category} ${index <= activeTile ? 'is-awake' : ''}`}
                  key={`${tile.action}-${index}`}
                  style={{ animationDelay: `${index * 38}ms` }}
                />
              ))}
            </div>
            <div className="console-footer">
              <span>
                <Sprout size={16} />
                Row 3 grew a refill garden
              </span>
              <span>27 actions this week</span>
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
            <h2>Good afternoon, Simone.</h2>
            <p>Your team has completed 27 small actions this week.</p>
          </div>
          <div className="quick-actions" aria-label="Quick actions">
            <button type="button">
              <Plus size={18} />
              Log
            </button>
            <button type="button">
              <Camera size={18} />
              Evidence
            </button>
            <button type="button">
              <Trophy size={18} />
              Challenge
            </button>
            <button type="button">
              <MessageCircleHeart size={18} />
              Celebrate
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="impact-ring-panel">
            <div className="impact-ring" aria-label="Weekly progress 78 percent">
              <div>
                <strong>78%</strong>
                <span>weekly pulse</span>
              </div>
            </div>
            <div>
              <h3>Weekly impact overview</h3>
              <p>18.4 kg CO2 saved, 64 bottles avoided, 27 actions completed, and 8 active learners.</p>
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
              <span>Most consistent</span>
              <strong>Maya and Jon</strong>
              <span>Best first step</span>
              <strong>Anonymous refill action</strong>
              <span>Community spark</span>
              <strong>Nia shared a guide</strong>
            </div>
          </article>
        </div>

        <div className="living-grid-wrap">
          <div className="section-heading compact">
            <p className="eyebrow">The Living GreenGrid</p>
            <h2>Every tile is a real action with room for the next one.</h2>
          </div>
          <div className="living-grid" aria-label="Interactive action grid">
            {gridTiles.map((tile, index) => (
              <button
                className={`grid-tile ${tile.category} ${index === activeTile ? 'latest' : ''} ${
                  Math.floor(index / 12) === 2 ? 'row-complete' : ''
                }`}
                key={`${tile.action}-${index}`}
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
              <button type="submit">
                <Send size={18} />
                Add tile
              </button>
            </div>
            <p className="success-message">
              <Sparkles size={18} />
              {message}
            </p>
          </div>
        </form>
      </section>

      <section className="section challenge-section" id="challenges">
        <div className="section-heading">
          <p className="eyebrow">Challenges</p>
          <h2>Floating missions that build a shared green world.</h2>
        </div>
        <div className="challenge-map">
          {challenges.map((challenge, index) => (
            <article className="challenge-island" key={challenge.title} style={{ '--accent': challenge.accent } as React.CSSProperties}>
              <span className="island-number">0{index + 1}</span>
              <h3>{challenge.title}</h3>
              <p>{challenge.detail}</p>
              <div className="progress-track">
                <span style={{ width: `${challenge.progress}%` }} />
              </div>
              <strong>{challenge.reward}</strong>
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
          <article>
            <Waves size={24} />
            <h3>64 bottles avoided</h3>
            <p>Calculated from 64 recorded refill actions. This is an activity estimate, not a precise measurement.</p>
            <span>Confidence: high</span>
          </article>
          <article>
            <Flame size={24} />
            <h3>18.4 kg CO2 saved</h3>
            <p>Built from logged transport, energy, food and reuse actions using conservative conversion factors.</p>
            <span>Reviewed this month</span>
          </article>
          <article>
            <Users size={24} />
            <h3>8 active learners</h3>
            <p>Participation is shown as momentum categories instead of negative rankings or red warnings.</p>
            <span>No-shame design</span>
          </article>
        </div>
      </section>

      <section className="section stories-section">
        <div className="section-heading">
          <p className="eyebrow">Green stories</p>
          <h2>A calmer feed for progress, tips and team wins.</h2>
        </div>
        <div className="story-grid">
          {stories.map((story) => (
            <article key={story.title}>
              <span>{story.type}</span>
              <h3>{story.title}</h3>
              <p>{story.body}</p>
              <button type="button">
                <Sprout size={17} />
                {story.reaction}
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
          {resources.map((resource) => (
            <article key={resource}>
              <BookOpen size={21} />
              <span>{resource}</span>
              <button type="button">
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
            <h2>Community garden sprint</h2>
            <p>
              Objective, members, tasks, timeline, evidence, impact and reflections live in one calm workspace.
            </p>
          </div>
          <div className="project-board" aria-label="Project task board">
            <span>Plan bed layout</span>
            <span>Collect compost</span>
            <span>Build water guide</span>
            <span>Final showcase</span>
          </div>
        </div>
      </section>

      <section className="section profile-section" id="profile">
        <div>
          <p className="eyebrow">Profile and privacy</p>
          <h2>Display the contribution, not the pressure.</h2>
          <p>I am currently working on reducing single-use plastic.</p>
        </div>
        <div className="privacy-controls">
          <span>
            <Lock size={18} />
            First name only
          </span>
          <span>
            <MapPinned size={18} />
            Location category
          </span>
          <span>
            <SunMedium size={18} />
            Quiet reminders
          </span>
        </div>
      </section>

      <footer>
        <span>GreenGrid</span>
        <span>a quantumcupcakecreation</span>
      </footer>
    </main>
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

export default App
