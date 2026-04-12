import { useState, useEffect, useRef } from 'react'
import './App.css'

const exerciseDB = {
  Chest: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Fly',
    'Incline Dumbbell Fly', 'Cable Fly', 'Cable Crossover',
    'Machine Chest Press', 'Pec Deck', 'Push-Up', 'Dips (Chest)',
  ],
  Back: [
    'Deadlift', 'Barbell Row', 'Dumbbell Row', 'Pendlay Row',
    'T-Bar Row', 'Seated Cable Row', 'Lat Pulldown', 'Pull-Up',
    'Chin-Up', 'Face Pull', 'Straight Arm Pulldown',
    'Machine Row', 'Hyperextension', 'Rack Pull',
  ],
  Shoulders: [
    'Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press',
    'Lateral Raise', 'Cable Lateral Raise', 'Front Raise',
    'Reverse Fly', 'Cable Reverse Fly', 'Upright Row',
    'Barbell Shrug', 'Dumbbell Shrug', 'Lu Raise',
  ],
  Legs: [
    'Squat', 'Front Squat', 'Goblet Squat', 'Leg Press',
    'Hack Squat', 'Bulgarian Split Squat', 'Lunge', 'Walking Lunge',
    'Romanian Deadlift', 'Stiff Leg Deadlift', 'Leg Extension',
    'Leg Curl', 'Seated Leg Curl', 'Hip Thrust', 'Glute Bridge',
    'Calf Raise', 'Seated Calf Raise', 'Sumo Deadlift',
  ],
  Arms: [
    'Dumbbell Curl', 'Barbell Curl', 'Hammer Curl', 'Preacher Curl',
    'Incline Dumbbell Curl', 'Cable Curl', 'Concentration Curl',
    'Tricep Pushdown', 'Overhead Tricep Extension', 'Skull Crusher',
    'Close Grip Bench Press', 'Dips (Triceps)', 'Cable Kickback',
    'Reverse Curl', 'Wrist Curl',
  ],
  Core: [
    'Crunch', 'Cable Crunch', 'Hanging Leg Raise', 'Hanging Knee Raise',
    'Ab Wheel Rollout', 'Plank', 'Side Plank', 'Russian Twist',
    'Decline Sit-Up', 'Woodchop', 'Pallof Press', 'Dead Bug',
  ],
  Cardio: [
    'Treadmill Run', 'Incline Walk', 'Stair Climber',
    'Rowing Machine', 'Cycling', 'Assault Bike', 'Jump Rope',
    'Battle Ropes', 'Sled Push', 'Farmer Walk',
  ],
}

const allExercises = Object.entries(exerciseDB).flatMap(([group, exercises]) =>
  exercises.map((name) => ({ name, group }))
)

const REST_PRESETS = [30, 60, 90, 120, 180]

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function App() {
  const [sets, setSets] = useState(3)
  const [workout, setWorkout] = useState([])
  const [pastWorkouts, setPastWorkouts] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('workout')
  const [expandedPast, setExpandedPast] = useState(null)
  const [assessingId, setAssessingId] = useState(null)
  const [unit, setUnit] = useState('lbs')
  const [favorites, setFavorites] = useState([])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState(null)
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const searchRef = useRef(null)

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  const [buildingTemplate, setBuildingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateExercises, setTemplateExercises] = useState([])
  const [tplPickerOpen, setTplPickerOpen] = useState(false)
  const [tplSearch, setTplSearch] = useState('')
  const [tplGroup, setTplGroup] = useState(null)
  const [tplCustomName, setTplCustomName] = useState('')
  const [tplShowCustom, setTplShowCustom] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const tplSearchRef = useRef(null)

  const [timerDuration, setTimerDuration] = useState(90)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerVisible, setTimerVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('ironlog-workouts')
    if (saved) setPastWorkouts(JSON.parse(saved))
    const savedTpl = localStorage.getItem('ironlog-templates')
    if (savedTpl) setTemplates(JSON.parse(savedTpl))
    const savedFavs = localStorage.getItem('ironlog-favorites')
    if (savedFavs) setFavorites(JSON.parse(savedFavs))
    const savedUnit = localStorage.getItem('ironlog-unit')
    if (savedUnit) setUnit(savedUnit)
  }, [])

  useEffect(() => {
    if (pickerOpen && searchRef.current) searchRef.current.focus()
  }, [pickerOpen])

  useEffect(() => {
    if (tplPickerOpen && tplSearchRef.current) tplSearchRef.current.focus()
  }, [tplPickerOpen])

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) { setTimerRunning(false); clearInterval(timerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  function startTimer() { setTimerRemaining(timerDuration); setTimerRunning(true); setTimerVisible(true) }
  function toggleTimer() {
    if (timerRunning) { setTimerRunning(false); clearInterval(timerRef.current) }
    else if (timerRemaining > 0) { setTimerRunning(true) }
    else { startTimer() }
  }
  function resetTimer() { setTimerRunning(false); clearInterval(timerRef.current); setTimerRemaining(timerDuration) }

  function toggleFavorite(name) {
    const updated = favorites.includes(name) ? favorites.filter((f) => f !== name) : [...favorites, name]
    setFavorites(updated)
    localStorage.setItem('ironlog-favorites', JSON.stringify(updated))
  }

  function toggleUnit() {
    const next = unit === 'lbs' ? 'kg' : 'lbs'
    setUnit(next)
    localStorage.setItem('ironlog-unit', next)
  }

  function saveTemplates(updated) { setTemplates(updated); localStorage.setItem('ironlog-templates', JSON.stringify(updated)) }

  function filterExercises(query, group) {
    if (query.trim()) return allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    if (group) return allExercises.filter((e) => e.group === group)
    return allExercises
  }

  function groupResults(list, showFavs) {
    const grouped = {}
    if (showFavs && !searchQuery && !activeGroup) {
      const favItems = list.filter((e) => favorites.includes(e.name))
      if (favItems.length > 0) grouped['★ Favorites'] = favItems.map((e) => e.name)
    }
    list.forEach((e) => { if (!grouped[e.group]) grouped[e.group] = []; grouped[e.group].push(e.name) })
    return grouped
  }

  const filtered = filterExercises(searchQuery, activeGroup)
  const groupedFiltered = groupResults(filtered, true)
  const tplFiltered = filterExercises(tplSearch, tplGroup)
  const tplGroupedFiltered = groupResults(tplFiltered, false)

  function selectExercise(name) {
    setWorkout([...workout, { name, sets: Array.from({ length: sets }, () => ({ weight: '', reps: '' })), notes: '' }])
    closePicker()
  }

  function closePicker() { setPickerOpen(false); setSearchQuery(''); setActiveGroup(null); setShowCustom(false); setCustomName(''); setSets(3) }
  function addCustom() { if (!customName.trim()) return; selectExercise(customName.trim()) }

  function loadTemplate(template) {
    const exercises = template.exercises.map((ex) => ({ name: ex.name, sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '' })), notes: '' }))
    setWorkout([...workout, ...exercises])
    setTemplatePickerOpen(false)
  }

  function duplicateWorkout(pastWorkout) {
    const exercises = pastWorkout.exercises.map((ex) => ({ name: ex.name, sets: (ex.sets || []).map((s) => ({ weight: s.weight || '', reps: '' })), notes: '' }))
    setWorkout(exercises)
    setActiveTab('workout')
  }

  function updateSet(exIdx, setIdx, field, value) { const updated = [...workout]; updated[exIdx].sets[setIdx][field] = value; setWorkout(updated) }
  function updateNotes(exIdx, value) { const updated = [...workout]; updated[exIdx].notes = value; setWorkout(updated) }
  function removeExercise(index) { setWorkout(workout.filter((_, i) => i !== index)) }
  function clearWorkout() { setWorkout([]) }

  function saveWorkout() {
    if (workout.length === 0) return
    const entry = { id: Date.now(), date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), unit, exercises: workout }
    const updated = [entry, ...pastWorkouts]
    setPastWorkouts(updated)
    localStorage.setItem('ironlog-workouts', JSON.stringify(updated))
    setWorkout([])
  }

  function deletePastWorkout(id) {
    const updated = pastWorkouts.filter((w) => w.id !== id)
    setPastWorkouts(updated)
    localStorage.setItem('ironlog-workouts', JSON.stringify(updated))
    if (expandedPast === id) setExpandedPast(null)
    if (assessingId === id) setAssessingId(null)
  }

  function startNewTemplate() { setBuildingTemplate(true); setTemplateName(''); setTemplateExercises([]); setEditingTemplateId(null) }
  function startEditTemplate(tpl) { setBuildingTemplate(true); setTemplateName(tpl.name); setTemplateExercises(tpl.exercises.map((e) => ({ ...e }))); setEditingTemplateId(tpl.id) }

  function addExerciseToTemplate(name) { setTemplateExercises([...templateExercises, { name, sets: 3 }]); setTplPickerOpen(false); setTplSearch(''); setTplGroup(null); setTplShowCustom(false); setTplCustomName('') }
  function addCustomToTemplate() { if (!tplCustomName.trim()) return; addExerciseToTemplate(tplCustomName.trim()) }

  function updateTemplateSets(index, value) { const updated = [...templateExercises]; updated[index].sets = Math.max(1, Math.min(10, Number(value) || 1)); setTemplateExercises(updated) }
  function removeTemplateExercise(index) { setTemplateExercises(templateExercises.filter((_, i) => i !== index)) }

  function reorderTemplate(index, direction) {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= templateExercises.length) return
    const updated = [...templateExercises]; const temp = updated[index]; updated[index] = updated[newIdx]; updated[newIdx] = temp; setTemplateExercises(updated)
  }

  function saveTemplate() {
    if (!templateName.trim() || templateExercises.length === 0) return
    if (editingTemplateId) { saveTemplates(templates.map((t) => t.id === editingTemplateId ? { ...t, name: templateName.trim(), exercises: templateExercises } : t)) }
    else { saveTemplates([...templates, { id: Date.now(), name: templateName.trim(), exercises: templateExercises }]) }
    setBuildingTemplate(false); setEditingTemplateId(null)
  }

  function deleteTemplate(id) { saveTemplates(templates.filter((t) => t.id !== id)) }
  function cancelTemplateBuilder() { setBuildingTemplate(false); setEditingTemplateId(null); setTplPickerOpen(false); setTplSearch(''); setTplGroup(null); setTplShowCustom(false); setTplCustomName('') }

  const totalSets = workout.reduce((sum, e) => sum + e.sets.length, 0)
  const completedSets = workout.reduce((sum, e) => sum + e.sets.filter((s) => s.reps !== '' && s.reps !== '0').length, 0)
  const groups = Object.keys(exerciseDB)
  const unitLabel = unit.toUpperCase()
  const timerProgress = timerRemaining !== null ? timerRemaining / timerDuration : 1

  function getExerciseCompletion(entry) {
    const done = entry.sets.filter((s) => s.reps !== '' && s.reps !== '0').length
    return done / entry.sets.length
  }

  return (
    <div className="app">
      {/* Accent top bar */}
      <div className="top-accent" />

      <header>
        <div className="logo">IRON<span>LOG</span></div>
        <div className="header-rule" />
       <p className="tagline">Lift · Track · Repeat</p>
      </header>

      <div className="toolbar">
        <button className="tool-btn" onClick={toggleUnit}>
          {unit === 'lbs' ? 'LBS' : 'KG'}
        </button>
        <button className={`tool-btn ${timerVisible ? 'active' : ''}`} onClick={() => setTimerVisible(!timerVisible)}>
          Rest Timer
        </button>
      </div>

      {timerVisible && (
        <div className={`rest-timer ${timerRemaining === 0 && timerRemaining !== null ? 'done' : ''}`}>
          <div className="timer-top">
            <div className="timer-display">
              <svg className="timer-ring" viewBox="0 0 100 100">
                <circle className="timer-ring-bg" cx="50" cy="50" r="44" />
                <circle className="timer-ring-fill" cx="50" cy="50" r="44"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - timerProgress)}`} />
              </svg>
              <span className="timer-time">{timerRemaining !== null ? formatTime(timerRemaining) : formatTime(timerDuration)}</span>
            </div>
            <div className="timer-right">
              <div className="timer-presets">
                {REST_PRESETS.map((sec) => (
                  <button key={sec} className={`timer-preset ${timerDuration === sec ? 'active' : ''}`}
                    onClick={() => { setTimerDuration(sec); if (!timerRunning) setTimerRemaining(sec) }}>
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </button>
                ))}
              </div>
              <div className="timer-controls">
                <button className="timer-btn primary" onClick={toggleTimer}>
                  {timerRunning ? 'Pause' : timerRemaining === 0 || timerRemaining === null ? 'Start' : 'Resume'}
                </button>
                <button className="timer-btn" onClick={resetTimer}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')}>
          <span className="tab-text">Workout</span>
        </button>
        <button className={`tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          <span className="tab-text">Templates</span>
          {templates.length > 0 && <span className="tab-badge">{templates.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="tab-text">History</span>
          {pastWorkouts.length > 0 && <span className="tab-badge">{pastWorkouts.length}</span>}
        </button>
      </div>

      {/* WORKOUT */}
      {activeTab === 'workout' && (
        <div className="fade-in">
          <div className="input-card">
            <div className="sets-control">
              <span className="sets-label">SETS</span>
              <div className="stepper">
                <button className="step-btn" onClick={() => setSets(Math.max(1, sets - 1))}>−</button>
                <span className="step-value">{sets}</span>
                <button className="step-btn" onClick={() => setSets(Math.min(10, sets + 1))}>+</button>
              </div>
            </div>

            {!pickerOpen && !templatePickerOpen && (
              <div className="dual-btn-row">
                <button className="add-btn" onClick={() => setPickerOpen(true)}>+ Add Exercise</button>
                {templates.length > 0 && (
                  <button className="template-load-btn" onClick={() => setTemplatePickerOpen(true)}>Load Template</button>
                )}
              </div>
            )}

            {templatePickerOpen && (
              <div className="picker">
                <span className="picker-heading">Choose a Template</span>
                <div className="picker-results">
                  {templates.map((tpl) => (
                    <button key={tpl.id} className="picker-item template-picker-item" onClick={() => loadTemplate(tpl)}>
                      <span className="tpl-pick-name">{tpl.name}</span>
                      <span className="tpl-pick-detail">{tpl.exercises.length} exercises</span>
                    </button>
                  ))}
                </div>
                <button className="picker-close" onClick={() => setTemplatePickerOpen(false)}>Cancel</button>
              </div>
            )}

            {pickerOpen && (
              <div className="picker">
                <input ref={searchRef} className="picker-search" type="text" placeholder="Search exercises..."
                  value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setActiveGroup(null) }} />
                {!searchQuery && (
                  <div className="group-chips">
                    {groups.map((g) => (
                      <button key={g} className={`chip ${activeGroup === g ? 'active' : ''}`}
                        onClick={() => setActiveGroup(activeGroup === g ? null : g)}>{g}</button>
                    ))}
                  </div>
                )}
                <div className="picker-results">
                  {Object.entries(groupedFiltered).map(([group, exercises]) => (
                    <div key={group} className="picker-group">
                      <span className="picker-group-label">{group}</span>
                      {exercises.map((name) => (
                        <div key={name} className="picker-item-row">
                          <button className="picker-item" onClick={() => selectExercise(name)}>{name}</button>
                          <button className={`fav-btn ${favorites.includes(name) ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(name) }}>★</button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {filtered.length === 0 && !showCustom && <div className="picker-empty"><p>No matches found</p></div>}
                </div>
                {!showCustom ? (
                  <button className="custom-toggle" onClick={() => setShowCustom(true)}>+ Custom exercise</button>
                ) : (
                  <div className="custom-row">
                    <input className="custom-input" type="text" placeholder="Exercise name"
                      value={customName} onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
                    <button className="custom-add-btn" onClick={addCustom} disabled={!customName.trim()}>Add</button>
                  </div>
                )}
                <button className="picker-close" onClick={closePicker}>Cancel</button>
              </div>
            )}
          </div>

          {workout.length > 0 && (
            <div>
              {/* Hero stats */}
              <div className="hero-stats">
                <div className="hero-stat main">
                  <span className="hero-num">{completedSets}<span className="hero-den">/{totalSets}</span></span>
                  <span className="hero-label">Sets Complete</span>
                  <div className="hero-progress">
                    <div className="hero-progress-fill" style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="hero-stat">
                  <span className="hero-num-sm">{workout.length}</span>
                  <span className="hero-label">Exercises</span>
                </div>
              </div>

              <div className="workout-actions-row">
                <button className="clear-btn" onClick={clearWorkout}>Clear All</button>
                <button className="save-btn" onClick={saveWorkout}>Save Workout</button>
              </div>

              <div className="workout-log">
                {workout.map((entry, i) => {
                  const completion = getExerciseCompletion(entry)
                  return (
                    <div key={i} className="exercise-card" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="card-accent" style={{ height: `${Math.max(completion * 100, 2)}%` }} />
                      <div className="card-inner">
                        <div className="card-header">
                          <div className="card-title-group">
                            <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
                            <h2>{entry.name}</h2>
                          </div>
                          <div className="card-header-right">
                            {completion === 1 && <span className="complete-badge">✓</span>}
                            <button className="remove-btn" onClick={() => removeExercise(i)}>✕</button>
                          </div>
                        </div>

                        <div className="set-grid">
                          <div className="set-grid-header">
                            <span className="sg-corner">SET</span>
                            <span className="sg-col-label">{unitLabel}</span>
                            <span className="sg-col-label">REPS</span>
                          </div>
                          {entry.sets.map((s, j) => (
                            <div key={j} className={`set-row ${s.reps !== '' && s.reps !== '0' ? 'filled' : ''}`}>
                              <span className="set-num">{j + 1}</span>
                              <input type="number" min="0" placeholder="—" value={s.weight}
                                onChange={(e) => updateSet(i, j, 'weight', e.target.value)} />
                              <input type="number" min="0" placeholder="—" value={s.reps}
                                onChange={(e) => updateSet(i, j, 'reps', e.target.value)} />
                            </div>
                          ))}
                        </div>

                        <textarea className="notes-input" placeholder="Notes — how did it feel?"
                          value={entry.notes} onChange={(e) => updateNotes(i, e.target.value)} rows={2} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {workout.length === 0 && !pickerOpen && !templatePickerOpen && (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <span className="empty-plus">+</span>
              </div>
              <p className="empty-text">Add an exercise or load a template</p>
              <p className="empty-sub">Your workout starts here</p>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="fade-in">
          {!buildingTemplate ? (
            <div>
              <button className="add-btn full-width" onClick={startNewTemplate}>+ Create Template</button>
              {templates.length === 0 ? (
                <div className="empty-state"><p className="empty-text">No templates yet</p><p className="empty-sub">Create one to speed up your workouts</p></div>
              ) : (
                <div className="template-list">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="template-card">
                      <div className="template-card-header">
                        <div>
                          <h3 className="template-card-name">{tpl.name}</h3>
                          <span className="template-card-detail">{tpl.exercises.length} exercise{tpl.exercises.length !== 1 && 's'} · {tpl.exercises.reduce((s, e) => s + e.sets, 0)} sets</span>
                        </div>
                        <div className="template-card-actions">
                          <button className="tpl-action-btn" onClick={() => startEditTemplate(tpl)}>Edit</button>
                          <button className="tpl-action-btn danger" onClick={() => deleteTemplate(tpl.id)}>Delete</button>
                        </div>
                      </div>
                      <div className="template-exercise-list">
                        {tpl.exercises.map((ex, i) => (
                          <div key={i} className="template-exercise-row">
                            <span className="tpl-ex-num">{String(i + 1).padStart(2, '0')}</span>
                            <span className="tpl-ex-name">{ex.name}</span>
                            <span className="tpl-ex-sets">{ex.sets}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="template-builder">
              <h2 className="builder-title">{editingTemplateId ? 'Edit Template' : 'New Template'}</h2>
              <input className="builder-name-input" type="text" placeholder="Template name (e.g. Push Day)"
                value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              {templateExercises.length > 0 && (
                <div className="builder-exercises">
                  {templateExercises.map((ex, i) => (
                    <div key={i} className="builder-ex-row">
                      <div className="builder-ex-reorder">
                        <button className="reorder-btn" onClick={() => reorderTemplate(i, -1)} disabled={i === 0}>↑</button>
                        <button className="reorder-btn" onClick={() => reorderTemplate(i, 1)} disabled={i === templateExercises.length - 1}>↓</button>
                      </div>
                      <span className="builder-ex-name">{ex.name}</span>
                      <div className="builder-ex-sets">
                        <button className="step-btn-sm" onClick={() => updateTemplateSets(i, ex.sets - 1)}>−</button>
                        <span className="builder-sets-val">{ex.sets}</span>
                        <button className="step-btn-sm" onClick={() => updateTemplateSets(i, ex.sets + 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeTemplateExercise(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {!tplPickerOpen ? (
                <button className="custom-toggle" onClick={() => setTplPickerOpen(true)}>+ Add Exercise</button>
              ) : (
                <div className="picker">
                  <input ref={tplSearchRef} className="picker-search" type="text" placeholder="Search exercises..."
                    value={tplSearch} onChange={(e) => { setTplSearch(e.target.value); setTplGroup(null) }} />
                  {!tplSearch && (
                    <div className="group-chips">
                      {groups.map((g) => (
                        <button key={g} className={`chip ${tplGroup === g ? 'active' : ''}`}
                          onClick={() => setTplGroup(tplGroup === g ? null : g)}>{g}</button>
                      ))}
                    </div>
                  )}
                  <div className="picker-results">
                    {Object.entries(tplGroupedFiltered).map(([group, exercises]) => (
                      <div key={group} className="picker-group">
                        <span className="picker-group-label">{group}</span>
                        {exercises.map((name) => (
                          <button key={name} className="picker-item" onClick={() => addExerciseToTemplate(name)}>{name}</button>
                        ))}
                      </div>
                    ))}
                    {tplFiltered.length === 0 && !tplShowCustom && <div className="picker-empty"><p>No matches</p></div>}
                  </div>
                  {!tplShowCustom ? (
                    <button className="custom-toggle" onClick={() => setTplShowCustom(true)}>+ Custom exercise</button>
                  ) : (
                    <div className="custom-row">
                      <input className="custom-input" type="text" placeholder="Exercise name"
                        value={tplCustomName} onChange={(e) => setTplCustomName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomToTemplate()} />
                      <button className="custom-add-btn" onClick={addCustomToTemplate} disabled={!tplCustomName.trim()}>Add</button>
                    </div>
                  )}
                  <button className="picker-close" onClick={() => { setTplPickerOpen(false); setTplSearch(''); setTplGroup(null); setTplShowCustom(false); setTplCustomName('') }}>Done</button>
                </div>
              )}
              <div className="builder-actions">
                <button className="picker-close" onClick={cancelTemplateBuilder}>Cancel</button>
                <button className="save-btn builder-save" onClick={saveTemplate}
                  disabled={!templateName.trim() || templateExercises.length === 0}>
                  {editingTemplateId ? 'Update' : 'Save Template'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="fade-in">
          {pastWorkouts.length === 0 ? (
            <div className="empty-state"><p className="empty-text">No saved workouts yet</p><p className="empty-sub">Complete and save a workout to see it here</p></div>
          ) : (
            <div className="history-list">
              {pastWorkouts.map((w) => {
                const wUnit = w.unit || 'lbs'
                const totalW = w.exercises.reduce((sum, ex) => sum + (ex.sets || []).length, 0)
                const doneW = w.exercises.reduce((sum, ex) => sum + (ex.sets || []).filter((s) => s.reps && s.reps !== '0').length, 0)
                return (
                  <div key={w.id} className="history-card">
                    <button className="history-header" onClick={() => { setExpandedPast(expandedPast === w.id ? null : w.id); if (assessingId === w.id) setAssessingId(null) }}>
                      <div className="history-info">
                        <span className="history-date">{w.date}</span>
                        <span className="history-summary">{w.exercises.length} exercise{w.exercises.length !== 1 && 's'} · {doneW}/{totalW} sets · {wUnit}</span>
                      </div>
                      <span className={`chevron ${expandedPast === w.id ? 'open' : ''}`}>›</span>
                    </button>

                    {expandedPast === w.id && (
                      <div className="history-detail">
                        <div className="detail-tabs">
                          <button className={`detail-tab ${assessingId !== w.id ? 'active' : ''}`} onClick={() => setAssessingId(null)}>Details</button>
                          <button className={`detail-tab ${assessingId === w.id ? 'active' : ''}`} onClick={() => setAssessingId(w.id)}>Assess</button>
                        </div>

                        {assessingId !== w.id ? (
                          <div>
                            {w.exercises.map((ex, i) => (
                              <div key={i} className="history-exercise">
                                <div className="history-ex-header">
                                  <span className="history-ex-name">{ex.name}</span>
                                  <span className="history-ex-reps">{(ex.sets || []).filter((s) => s.reps && s.reps !== '0').length}/{(ex.sets || []).length}</span>
                                </div>
                                <div className="history-set-grid">
                                  <div className="hsg-header"><span></span><span>{wUnit.toUpperCase()}</span><span>REPS</span></div>
                                  {(ex.sets || []).map((s, j) => (
                                    <div key={j} className={`hsg-row ${s.reps && s.reps !== '0' ? 'done' : ''}`}>
                                      <span className="hsg-num">S{j + 1}</span>
                                      <span>{s.weight || '—'}</span>
                                      <span>{s.reps || '—'}</span>
                                    </div>
                                  ))}
                                </div>
                                {ex.notes && <p className="history-notes">{ex.notes}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <AssessView workout={w} />
                        )}

                        <div className="history-actions">
                          <button className="duplicate-btn" onClick={() => duplicateWorkout(w)}>Repeat Workout</button>
                          <button className="delete-workout-btn" onClick={() => deletePastWorkout(w.id)}>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AssessView({ workout }) {
  const exercises = workout.exercises
  const wUnit = workout.unit || 'lbs'
  const volumeData = exercises.map((ex) => {
    const setsData = ex.sets || []
    const volume = setsData.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0)
    const totalReps = setsData.reduce((sum, s) => sum + (Number(s.reps) || 0), 0)
    const maxWeight = Math.max(...setsData.map((s) => Number(s.weight) || 0), 0)
    const completedSets = setsData.filter((s) => s.reps && s.reps !== '0').length
    return { name: ex.name, volume, totalReps, maxWeight, completedSets, totalSets: setsData.length }
  })
  const maxVolume = Math.max(...volumeData.map((d) => d.volume), 1)
  const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0)
  const totalReps = volumeData.reduce((sum, d) => sum + d.totalReps, 0)
  const totalCompleted = volumeData.reduce((sum, d) => sum + d.completedSets, 0)
  const totalSetsAll = volumeData.reduce((sum, d) => sum + d.totalSets, 0)

  return (
    <div className="assess-view">
      <div className="assess-summary">
        <div className="assess-stat highlight">
          <span className="assess-stat-num">{totalVolume.toLocaleString()}</span>
          <span className="assess-stat-label">Volume ({wUnit})</span>
        </div>
        <div className="assess-stat">
          <span className="assess-stat-num">{totalReps}</span>
          <span className="assess-stat-label">Reps</span>
        </div>
        <div className="assess-stat">
          <span className="assess-stat-num">{totalCompleted}/{totalSetsAll}</span>
          <span className="assess-stat-label">Sets</span>
        </div>
      </div>
      <div className="chart-section">
        <h3 className="chart-title">Volume by Exercise</h3>
        <p className="chart-subtitle">Weight × Reps ({wUnit})</p>
        <div className="bar-chart">
          {volumeData.map((d, i) => (
            <div key={i} className="bar-row">
              <span className="bar-label">{d.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.volume / maxVolume) * 100}%`, animationDelay: `${i * 0.1}s` }} />
                <span className="bar-value">{d.volume.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-section">
        <h3 className="chart-title">Peak Weight</h3>
        <p className="chart-subtitle">Heaviest set ({wUnit})</p>
        <div className="bar-chart">
          {volumeData.map((d, i) => {
            const maxW = Math.max(...volumeData.map((v) => v.maxWeight), 1)
            return (
              <div key={i} className="bar-row">
                <span className="bar-label">{d.name}</span>
                <div className="bar-track">
                  <div className="bar-fill peak" style={{ width: `${(d.maxWeight / maxW) * 100}%`, animationDelay: `${i * 0.1}s` }} />
                  <span className="bar-value">{d.maxWeight}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="chart-section">
        <h3 className="chart-title">Set-by-Set Breakdown</h3>
        <p className="chart-subtitle">Reps per set · weight in {wUnit}</p>
        {exercises.map((ex, i) => {
          const setsData = ex.sets || []
          const maxReps = Math.max(...setsData.map((s) => Number(s.reps) || 0), 1)
          return (
            <div key={i} className="breakdown-card">
              <span className="breakdown-name">{ex.name}</span>
              <div className="mini-bars">
                {setsData.map((s, j) => {
                  const r = Number(s.reps) || 0
                  const w = Number(s.weight) || 0
                  return (
                    <div key={j} className="mini-bar-col">
                      <span className="mini-val">{r}</span>
                      <div className="mini-track"><div className="mini-fill" style={{ height: `${(r / maxReps) * 100}%` }} /></div>
                      <span className="mini-weight">{w > 0 ? w : '—'}</span>
                      <span className="mini-label">S{j + 1}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App