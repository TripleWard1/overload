'use client';

import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';

/* -------------------- FONTS (premium) -------------------- */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
});

/* -------------------- TYPES -------------------- */
type Set = { id: string; weightKg: number; reps: number; completed: boolean };
type SessionExercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: Set[];
};
type Session = {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  exercises: SessionExercise[];
  durationSeconds?: number;
  addons?: { abs?: boolean; cardio?: boolean; notes?: string };
};

type ExerciseStats = {
  normalizedName: string;
  displayName: string;
  lastDate?: string;
  lastWeight?: number;
  lastReps?: number;
  bestWeight?: number;
  bestReps?: number;
  usageCount?: number;
};

type TemplateExercise = {
  normalizedName: string;
  displayName: string;
  targetSets: number;
  targetReps?: number;
  restSeconds?: number;
};

type WorkoutTemplate = {
  id: string;
  normalizedName: string;
  displayName: string;
  updatedAt: string;
  exercises: TemplateExercise[];
};

/* -------------------- STORAGE -------------------- */
const STORAGE_KEY = 'gym_sessions_v2';
const STORAGE_KEY_STATS = 'gym_exercise_stats_v1';
const STORAGE_KEY_TEMPLATES = 'gym_templates_v1';

/* -------------------- BRAND -------------------- */
const BRAND_NAME = 'Overload';
const BRAND_FAVICON_URL = 'https://i.imgur.com/mR0XFUM.png';

// ✅ logo transparente (o que pediste)
const BRAND_LOGO_URL = 'https://i.imgur.com/HiwopZd.png';

// ✅ capa do hero (imagem de fundo do header)
const BRAND_HERO_COVER_URL =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=70';

/* -------------------- LOGO SIZES (CTRL+F: LOGO_SIZE) -------------------- */
const HERO_LOGO_PX = 58; // <<< aumenta para 64/72 se quiseres ainda maior
const TAB_LOGO_PX = 34;
const HEADER_LOGO_PX = 36;

/* -------------------- IMAGE POOL (100+ placeholders) -------------------- */
// pool grande (determinístico por seed), não “quebra” como imagens partidas
const WORKOUT_IMAGE_POOL: string[] = [
  // strength / gym premium
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07b?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546484959-f9a1a2f1a7c0?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1603287611630-d645505273b7?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=1600&auto=format&fit=crop',

  // dark / aesthetic gym
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1600&auto=format&fit=crop',

  // equipment / mood
  'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584467735871-bf92e4b8b3d6?q=80&w=1600&auto=format&fit=crop',
];

const KEYWORD_MAP: Array<{ keys: string[]; img: string }> = [
  {
    keys: ['push', 'peito', 'supino', 'chest'],
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['pull', 'costas', 'remada', 'back'],
    img: 'https://images.unsplash.com/photo-1603287611630-d645505273b7?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['legs', 'perna', 'agach', 'squat'],
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['ombro', 'shoulder'],
    img: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['abs', 'abdom', 'core'],
    img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['cardio', 'corrida', 'run'],
    img: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['upper', 'upper power'],
    img: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1600&auto=format&fit=crop',
  },
  {
    keys: ['full', 'full body', 'total'],
    img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1600&auto=format&fit=crop',
  },
];


/* -------------------- UTILS -------------------- */
const normalizeName = (raw: string) => {
  const trimmed = (raw ?? '').trim();
  const collapsed = trimmed.replace(/\s+/g, ' ');
  const lowered = collapsed.toLowerCase();
  return lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const hashSeed = (seed: string) => {
  const s = normalizeName(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0 || 1;
};

const pickImageFor = (seed: string) => {
  const n = normalizeName(seed);
  const m = KEYWORD_MAP.find((x) =>
    x.keys.some((k) => n.includes(normalizeName(k)))
  );
  if (m) return m.img;

  const idx = hashSeed(seed) % WORKOUT_IMAGE_POOL.length;
  return WORKOUT_IMAGE_POOL[idx];
};

const formatDatePT = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatTimePT = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

const computeDurationSeconds = (startedAtIso: string, endedAtIso: string) => {
  const a = new Date(startedAtIso).getTime();
  const b = new Date(endedAtIso).getTime();
  return Math.max(0, Math.floor((b - a) / 1000));
};

const dateKey = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
};

// (legacy) BrandMark antigo — mantido para não apagar nada fora do referido,
// mas desativado para evitar conflito com o BrandMark premium (mais abaixo).
const BrandMark = ({ sizePx = 40 }: { sizePx?: number }) => (
  <span style={{ display: 'none' }} aria-hidden="true" data-legacy-brandmark>
    {sizePx}
  </span>
);

// --- COLAR ESTA FUNÇÃO DE IMAGENS LOGO ABAIXO DO LOGO ---
const getExerciseImage = (name: string) => {
  const n = name?.toLowerCase() || '';
  if (
    n.includes('supino') ||
    n.includes('peito') ||
    n.includes('chest') ||
    n.includes('press')
  )
    return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop';
  if (
    n.includes('agachamento') ||
    n.includes('perna') ||
    n.includes('leg') ||
    n.includes('press')
  )
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
  if (
    n.includes('costas') ||
    n.includes('back') ||
    n.includes('puxada') ||
    n.includes('remada')
  )
    return 'https://images.unsplash.com/photo-1603287611630-d645505273b7?q=80&w=800&auto=format&fit=crop';
  if (n.includes('ombro') || n.includes('shoulder') || n.includes('militar'))
    return 'https://images.unsplash.com/photo-1541534741688-6078c64b52d2?q=80&w=800&auto=format&fit=crop';
  if (
    n.includes('braço') ||
    n.includes('bicep') ||
    n.includes('tricep') ||
    n.includes('rosca')
  )
    return 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?q=80&w=800&auto=format&fit=crop';

  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop';
};

/* -------------------- APP -------------------- */
export default function GymApp() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'train' | 'history' | 'calendar' | 'templates'
  >('home');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const [exerciseStats, setExerciseStats] = useState<
    Record<string, ExerciseStats>
  >({});
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const [exerciseInput, setExerciseInput] = useState('');
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [workoutNow, setWorkoutNow] = useState<number>(Date.now());
  const workoutTickRef = useRef<NodeJS.Timeout | null>(null);

  // templates editor
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [templateDraftExercises, setTemplateDraftExercises] = useState<
    TemplateExercise[]
  >([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  // --- ADICIONA ISTO JUNTO AOS OUTROS USESTATES ---
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // ✅ Toast específico para Templates (novo/atualizado)
  const [showTemplateToast, setShowTemplateToast] = useState(false);
  const [templateToastText, setTemplateToastText] = useState('Treino gravado!');
  const hasLoadedRef = useRef(false);

  // COLAR ISTO LOGO ABAIXO DOS TEUS USESTATES
  const startWorkoutFromTemplate = (template: WorkoutTemplate) => {
    startFromTemplate(template);
  };

  // calendar
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const [trainShowAddExercise, setTrainShowAddExercise] =
    useState<boolean>(false);
  const [addonAbs, setAddonAbs] = useState(false);
  const [addonCardio, setAddonCardio] = useState(false);
  const [addonNotes, setAddonNotes] = useState('');

  /* -------------------- LOAD / SYNC -------------------- */
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) setSessions(JSON.parse(saved));

  const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
  if (savedStats) setExerciseStats(JSON.parse(savedStats));

  const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
  if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

  // ✅ importante: só permitir sync DEPOIS do React aplicar estes setStates
  setTimeout(() => {
    hasLoadedRef.current = true;
  }, 0);
}, []);


  useEffect(() => {
    if (!hasLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(exerciseStats));
  }, [exerciseStats]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    if (restTimer === 0 || restTimer === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [restTimer]);

  useEffect(() => {
    if (activeTab === 'train' && currentSession) {
      if (workoutTickRef.current) clearInterval(workoutTickRef.current);
      workoutTickRef.current = setInterval(
        () => setWorkoutNow(Date.now()),
        1000
      );
      return () => {
        if (workoutTickRef.current) clearInterval(workoutTickRef.current);
        workoutTickRef.current = null;
      };
    }
    if (workoutTickRef.current) clearInterval(workoutTickRef.current);
    workoutTickRef.current = null;
  }, [activeTab, currentSession]);

  const startRest = (seconds: number = 90) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer(seconds);
    timerRef.current = setInterval(
      () => setRestTimer((prev) => (prev && prev > 0 ? prev - 1 : 0)),
      1000
    );
  };

  /* -------------------- COMPUTEDS -------------------- */
  const totalExercises = Object.keys(exerciseStats).length;
  const totalTemplates = templates.length;

  const topExercise = useMemo(() => {
    const list = Object.values(exerciseStats).sort(
      (a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0)
    );
    return list[0];
  }, [exerciseStats]);

  const homeRecap = useMemo(() => {
    const now = new Date();
    const keyThisMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const thisMonth = sessions.filter((s) => {
      const d = new Date(s.startedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      return k === keyThisMonth;
    });

    const totalSets = thisMonth.reduce(
      (acc, s) => acc + s.exercises.reduce((a, ex) => a + ex.sets.length, 0),
      0
    );
    const totalMin = thisMonth.reduce(
      (acc, s) => acc + Math.round((s.durationSeconds ?? 0) / 60),
      0
    );
    const absCount = thisMonth.filter((s) => s.addons?.abs).length;
    const cardioCount = thisMonth.filter((s) => s.addons?.cardio).length;

    return {
      thisMonthSessions: thisMonth.length,
      totalSets,
      totalMin,
      absCount,
      cardioCount,
    };
  }, [sessions]);

  const monthLabel = useMemo(() => {
    const d = new Date(calYear, calMonth, 1);
    return d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }, [calYear, calMonth]);

  const calendarCells = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const daysInMonth = last.getDate();
    const jsDay = first.getDay();
    const mondayIndex = (jsDay + 6) % 7;
    const blanks = Array.from({ length: mondayIndex }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const cells: Array<{ day: number; key: string } | null> = [
      ...blanks,
      ...days.map((day) => ({
        day,
        key: dateKey(new Date(calYear, calMonth, day).toISOString()),
      })),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      const k = dateKey(s.startedAt);
      (map[k] ||= []).push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    }
    return map;
  }, [sessions]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDateKey) return [];
    return sessionsByDay[selectedDateKey] ?? [];
  }, [selectedDateKey, sessionsByDay]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((s) => s.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions]);

  const workoutElapsed = useMemo(() => {
    if (!currentSession) return 0;
    return Math.max(
      0,
      Math.floor(
        (workoutNow - new Date(currentSession.startedAt).getTime()) / 1000
      )
    );
  }, [workoutNow, currentSession]);

  const exerciseSuggestions = useMemo(() => {
    const q = normalizeName(exerciseInput);
    const all = Object.values(exerciseStats);

    return all
      .filter((s) =>
        q
          ? s.normalizedName.includes(q) ||
            normalizeName(s.displayName).includes(q)
          : true
      )
      .sort((a, b) => {
        const au = a.usageCount ?? 0;
        const bu = b.usageCount ?? 0;
        const al = a.lastDate ? new Date(a.lastDate).getTime() : 0;
        const bl = b.lastDate ? new Date(b.lastDate).getTime() : 0;
        if (bl !== al) return bl - al;
        return bu - au;
      })
      .slice(0, 10);
  }, [exerciseInput, exerciseStats]);

  const filteredTemplates = useMemo(() => {
    const q = normalizeName(templateSearch);
    const sorted = [...templates].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return q
      ? sorted.filter(
          (t) =>
            normalizeName(t.displayName).includes(q) ||
            t.exercises.some((e) => normalizeName(e.displayName).includes(q))
        )
      : sorted;
  }, [templates, templateSearch]);

  const templatesToShow = useMemo(() => {
    const limit = templatesExpanded ? filteredTemplates.length : 6;
    return filteredTemplates.slice(0, limit);
  }, [filteredTemplates, templatesExpanded]);

  /* -------------------- ACTIONS -------------------- */
  const startNewWorkout = () => {
    setAddonAbs(false);
    setAddonCardio(false);
    setAddonNotes('');
    setTrainShowAddExercise(true);

    setCurrentSession({
      id: crypto.randomUUID(),
      name: `SESSÃO ${new Date().getHours() < 12 ? 'MATINAL' : 'TARDE'}`,
      startedAt: new Date().toISOString(),
      exercises: [],
      addons: { abs: false, cardio: false, notes: '' },
    });
    setActiveTab('train');
  };

  const startFromTemplate = (tpl: WorkoutTemplate) => {
    const now = new Date().toISOString();
    setTrainShowAddExercise(false);
    setAddonAbs(false);
    setAddonCardio(false);
    setAddonNotes('');

    const exercises: SessionExercise[] = tpl.exercises.map((te) => {
      const sets: Set[] = Array.from(
        { length: Math.max(1, te.targetSets || 1) },
        () => ({
          id: crypto.randomUUID(),
          weightKg: 0,
          reps: typeof te.targetReps === 'number' ? te.targetReps : 0,
          completed: false,
        })
      );

      return {
        id: crypto.randomUUID(),
        exerciseId: te.normalizedName,
        name: te.displayName.toUpperCase(),
        sets,
      };
    });

    setCurrentSession({
      id: crypto.randomUUID(),
      name: tpl.displayName,
      startedAt: now,
      exercises,
      addons: { abs: false, cardio: false, notes: '' },
    });

    setActiveTab('train');
  };

  const saveWorkout = () => {
    if (!currentSession) return;

    const endedAt = new Date().toISOString();
    const durationSeconds = computeDurationSeconds(
      currentSession.startedAt,
      endedAt
    );

    const sessionToSave: Session = {
      ...currentSession,
      endedAt,
      durationSeconds,
      addons: {
        abs: addonAbs,
        cardio: addonCardio,
        notes: (addonNotes || '').trim() || undefined,
      },
    };

    const updated = [sessionToSave, ...sessions];
    setSessions(updated);

    // update stats
    const nextStats: Record<string, ExerciseStats> = { ...exerciseStats };

    for (const ex of sessionToSave.exercises) {
      const normalized = normalizeName(ex.name);
      const display = ex.name.trim();

      const completedSets = ex.sets.filter((s) => s.completed);
      const candidateLast =
        [...completedSets]
          .reverse()
          .find((s) => (s.weightKg || 0) > 0 && (s.reps || 0) > 0) ??
        [...ex.sets]
          .reverse()
          .find((s) => (s.weightKg || 0) > 0 && (s.reps || 0) > 0);

      const lastWeight = candidateLast?.weightKg;
      const lastReps = candidateLast?.reps;

      // best: preferir sets concluídos; se não houver, fallback para quaisquer sets preenchidos
      const validSets = ex.sets
        .filter((s) => s.completed)
        .filter((s) => (s.weightKg || 0) > 0 && (s.reps || 0) > 0);

      const fallbackSets = ex.sets.filter(
        (s) => (s.weightKg || 0) > 0 && (s.reps || 0) > 0
      );

      const allSets = validSets.length ? validSets : fallbackSets;

      const best = allSets.reduce<{ w?: number; r?: number }>(
        (acc, s) => {
          const w = s.weightKg || 0;
          const r = s.reps || 0;
          const accW = acc.w ?? -1;
          const accR = acc.r ?? -1;
          if (w > accW) return { w, r };
          if (w === accW && r > accR) return { w, r };
          return acc;
        },
        {
          w: nextStats[normalized]?.bestWeight,
          r: nextStats[normalized]?.bestReps,
        }
      );

      const prev = nextStats[normalized];
      nextStats[normalized] = {
        normalizedName: normalized,
        displayName: prev?.displayName ?? display,
        lastDate: endedAt,
        lastWeight:
          typeof lastWeight === 'number' ? lastWeight : prev?.lastWeight,
        lastReps: typeof lastReps === 'number' ? lastReps : prev?.lastReps,
        bestWeight: typeof best.w === 'number' ? best.w : prev?.bestWeight,
        bestReps: typeof best.r === 'number' ? best.r : prev?.bestReps,
        usageCount: (prev?.usageCount ?? 0) + 1,
      };
    }

    setExerciseStats(nextStats);

    // auto template upsert
    const tplNormalized = normalizeName(sessionToSave.name);
    const tplExercises: TemplateExercise[] = sessionToSave.exercises.map(
      (ex) => {
        const n = normalizeName(ex.name);
        const displayName = ex.name.trim();
        const targetSets = Math.max(1, ex.sets.length);
        const repsValues = ex.sets
          .map((s) => s.reps)
          .filter((v) => typeof v === 'number');

        const freq = repsValues.reduce<Record<number, number>>((m, v) => {
          m[v] = (m[v] || 0) + 1;
          return m;
        }, {});

        const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
        const targetReps =
          typeof mode !== 'undefined'
            ? Number(mode)
            : repsValues.reverse().find((v) => v > 0) ?? undefined;

        return { normalizedName: n, displayName, targetSets, targetReps };
      }
    );

    setTemplates((prev) => {
      const existingIdx = prev.findIndex(
        (t) => t.normalizedName === tplNormalized
      );
      const next: WorkoutTemplate = {
        id: existingIdx >= 0 ? prev[existingIdx].id : crypto.randomUUID(),
        normalizedName: tplNormalized,
        displayName: sessionToSave.name,
        updatedAt: endedAt,
        exercises: tplExercises,
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = next;
        return copy;
      }
      return [next, ...prev];
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 1600);

    setCurrentSession(null);
    setActiveTab('calendar');
  };

  const updateSet = (exIdx: number, sIdx: number, data: Partial<Set>) => {
    if (!currentSession) return;

    const ex = currentSession.exercises[exIdx];
    const sets = ex.sets.map((s, i) => (i === sIdx ? { ...s, ...data } : s));

    const exercises = currentSession.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets } : e
    );

    const nextSession = { ...currentSession, exercises };

    if (data.completed === true) {
      const exNorm = normalizeName(ex.name);
      const tpl = templates.find(
        (t) => normalizeName(t.displayName) === normalizeName(nextSession.name)
      );
      const hint = tpl?.exercises.find(
        (e) => e.normalizedName === exNorm
      )?.restSeconds;
      startRest(typeof hint === 'number' && hint > 0 ? hint : 90);
    }

    setCurrentSession(nextSession);
  };

  const addSet = (exIdx: number) => {
    if (!currentSession) return;
    const newSession = { ...currentSession };
    const lastSet =
      newSession.exercises[exIdx].sets[
        newSession.exercises[exIdx].sets.length - 1
      ];
    newSession.exercises[exIdx].sets.push({
      id: crypto.randomUUID(),
      weightKg: lastSet?.weightKg || 0,
      reps: lastSet?.reps || 0,
      completed: false,
    });
    setCurrentSession(newSession);
  };

  const addExercise = (name: string) => {
    if (!name || !currentSession) return;
    const normalized = normalizeName(name);
    if (!normalized) return;

    const already = currentSession.exercises.some(
      (e) => normalizeName(e.name) === normalized
    );
    if (already) {
      setExerciseInput('');
      return;
    }

    const displayName = name.trim().replace(/\s+/g, ' ');
    const newEx: SessionExercise = {
      id: crypto.randomUUID(),
      exerciseId: normalized,
      name: displayName.toUpperCase(),
      sets: [
        { id: crypto.randomUUID(), weightKg: 0, reps: 0, completed: false },
      ],
    };

    setCurrentSession({
      ...currentSession,
      exercises: [...currentSession.exercises, newEx],
    });
    setExerciseInput('');
  };

  const removeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSessionId === id) setSelectedSessionId(null);
    if (deleteSessionId === id) setDeleteSessionId(null);
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
      setTemplateNameInput('');
      setTemplateDraftExercises([]);
      setExerciseInput('');
    }
    setDeleteTemplateId(null);
  };

  const startTemplateBuilder = () => {
    setTemplateNameInput('');
    setTemplateDraftExercises([]);
    setSelectedTemplateId('NEW');
    setActiveTab('templates');
  };

  const openTemplate = (tplId: string) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTemplateId(tplId);
    setTemplateNameInput(tpl.displayName);
    setTemplateDraftExercises(tpl.exercises.map((e) => ({ ...e })));
    setActiveTab('templates');
  };

  const addExerciseToTemplate = (raw: string) => {
    const n = normalizeName(raw);
    if (!n) return;
    const displayName = raw.trim().replace(/\s+/g, ' ');
    const exists = templateDraftExercises.some((e) => e.normalizedName === n);
    if (exists) {
      setExerciseInput('');
      return;
    }
    setTemplateDraftExercises((prev) => [
      ...prev,
      {
        normalizedName: n,
        displayName,
        targetSets: 3,
        targetReps: 8,
        restSeconds: 120,
      },
    ]);
    setExerciseInput('');
  };

  const updateTemplateExercise = (
    idx: number,
    patch: Partial<TemplateExercise>
  ) => {
    setTemplateDraftExercises((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const removeTemplateExercise = (idx: number) => {
    setTemplateDraftExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveTemplate = () => {
    const name = templateNameInput.trim().replace(/\s+/g, ' ');
    if (!name) return;

    const normalizedName = normalizeName(name);
    const updatedAt = new Date().toISOString();

    const cleanedExercises = templateDraftExercises
      .map((e) => ({
        ...e,
        displayName: e.displayName.trim().replace(/\s+/g, ' '),
        normalizedName: normalizeName(e.displayName),
        targetSets: Math.max(1, Number(e.targetSets || 1)),
        targetReps:
          typeof e.targetReps === 'number'
            ? Number(e.targetReps)
            : e.targetReps,
        restSeconds:
          typeof e.restSeconds === 'number'
            ? Number(e.restSeconds)
            : e.restSeconds,
      }))
      .filter((e) => e.normalizedName);

    // ✅ deteta se vai ser update (por id OU por nome)
    const isUpdate =
      (selectedTemplateId &&
        selectedTemplateId !== 'NEW' &&
        templates.some((t) => t.id === selectedTemplateId)) ||
      templates.some((t) => t.normalizedName === normalizedName);

    setTemplates((prev) => {
      const isNew = selectedTemplateId === 'NEW' || !selectedTemplateId;
      const existingIdx = !isNew
        ? prev.findIndex((t) => t.id === selectedTemplateId)
        : -1;

      const tpl: WorkoutTemplate = {
        id: isNew
          ? crypto.randomUUID()
          : prev[existingIdx]?.id ?? crypto.randomUUID(),
        normalizedName,
        displayName: name,
        updatedAt,
        exercises: cleanedExercises,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = tpl;
        return copy.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }

      const sameNameIdx = prev.findIndex(
        (t) => t.normalizedName === normalizedName
      );
      if (sameNameIdx >= 0) {
        const copy = [...prev];
        copy[sameNameIdx] = { ...tpl, id: copy[sameNameIdx].id };
        return copy.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }

      return [tpl, ...prev];
    });

    // ✅ toast correto
    setTemplateToastText(isUpdate ? 'Treino atualizado!' : 'Treino gravado!');
    setShowTemplateToast(true);
    setTimeout(() => setShowTemplateToast(false), 1600);

    // ✅ voltar à lista de treinos
    setSelectedTemplateId(null);
    setTemplateNameInput('');
    setTemplateDraftExercises([]);
    setExerciseInput('');
  };

  /* -------------------- SHARED UI -------------------- */
  const BrandMark = ({ sizePx }: { sizePx: number }) => (
    <div
      className="brandmark"
      style={{ width: sizePx + 14, height: sizePx + 14 }}
      aria-label="Overload logo"
    >
      <img
        src={BRAND_LOGO_URL}
        alt={BRAND_NAME}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        draggable={false}
        className="logo-img"
        style={{ width: sizePx, height: sizePx }}
      />
    </div>
  );

  /* -------------------- RENDER -------------------- */
  return (
    <main
      className={[
        'app-shell max-w-md mx-auto min-h-screen overflow-x-hidden pb-36 text-slate-100',
        inter.variable,
        grotesk.variable,
      ].join(' ')}
      style={{
        fontFamily:
          'var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, Arial',
      }}
    >
      <Head>
        <title>{BRAND_NAME}</title>
        <meta name="application-name" content={BRAND_NAME} />
        <meta name="apple-mobile-web-app-title" content={BRAND_NAME} />
        <meta name="theme-color" content="#070B14" />
        <link rel="icon" href={BRAND_FAVICON_URL} />
        <link rel="apple-touch-icon" href={BRAND_FAVICON_URL} />
        <link rel="shortcut icon" href={BRAND_FAVICON_URL} />
      </Head>

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070B14]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_12%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(900px_620px_at_80%_18%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_700px_at_50%_110%,rgba(34,197,94,0.08),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.20)_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="absolute inset-0 opacity-[0.12] mix-blend-soft-light app-noise" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_620px_at_50%_-10%,rgba(0,0,0,0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1100px_820px_at_50%_120%,rgba(0,0,0,0.70),transparent_60%)]" />
      </div>

      {/* REST TIMER OVERLAY */}
      {restTimer !== null && restTimer > 0 && (
        <div className="fixed top-4 inset-x-4 z-[200]">
          <div className="card-premium rounded-[1.75rem] px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl text-[#071018] flex items-center justify-center font-black shadow-lg bg-[linear-gradient(135deg,#22c55e,#a3e635)]">
                {restTimer}
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                  Descanso
                </div>
                <div className="text-sm font-black text-white">
                  Recupera e volta forte.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setRestTimer((v) => (typeof v === 'number' ? v + 15 : 15))
                }
                className="btn-soft text-[10px] font-black px-3 py-2 rounded-xl uppercase active:scale-95"
              >
                +15s
              </button>
              <button
                onClick={() => setRestTimer(0)}
                className="btn-primary text-[10px] font-black px-4 py-2 rounded-xl uppercase active:scale-95"
              >
                Terminar
              </button>
            </div>
          </div>
        </div>
      )}

            {/* HOME */}
            {activeTab === 'home' && (
        <div className="p-6 space-y-7 animate-in">
          <header className="pt-2 space-y-5">
            <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 shadow-[0_28px_110px_rgba(0,0,0,0.55)]">
              {/* ✅ hairline premium (top edge) */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.30),rgba(59,130,246,0.22),transparent)]" />

              <div className="absolute inset-0">
                <img
                  src={BRAND_HERO_COVER_URL}
                  alt="Overload cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />

                {/* ✅ overlay mais legível (menos “washed out”) */}
                <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,11,20,0.96),rgba(7,11,20,0.74),rgba(7,11,20,0.30))]" />
                <div className="absolute inset-0 bg-[radial-gradient(900px_560px_at_28%_25%,rgba(59,130,246,0.16),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(780px_520px_at_80%_58%,rgba(34,197,94,0.12),transparent_60%)]" />

                {/* ✅ sheen (brilho suave) */}
                <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-white/6 blur-3xl" />

                <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
              </div>

              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-4">
                      {/* ✅ LOGO GRANDE (CTRL+F: HERO_LOGO_PX / LOGO_SIZE) */}
                      <BrandMark sizePx={HERO_LOGO_PX} />

                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-300 truncate">
                          {BRAND_NAME}
                        </div>
                        <h1
                          className="text-[44px] font-black italic tracking-[-0.05em] leading-none mt-1 text-white truncate drop-shadow-[0_16px_35px_rgba(0,0,0,0.45)]"
                          style={{
                            fontFamily:
                              'var(--font-grotesk), var(--font-inter), system-ui',
                          }}
                        >
                          Overload
                        </h1>
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-slate-300">
                      Treino. Performance. Progressão.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="chip shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
                        <span className="chip-dot bg-emerald-400" />
                        <span className="chip-k">Exercícios</span>
                        <span className="chip-v">{totalExercises}</span>
                      </span>
                      <span className="chip shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
                        <span className="chip-dot bg-indigo-400" />
                        <span className="chip-k">Treinos</span>
                        <span className="chip-v">{totalTemplates}</span>
                      </span>
                      <span className="chip shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
                        <span className="chip-dot bg-slate-300" />
                        <span className="chip-k">Volume</span>
                        <span className="chip-v">{homeRecap.totalSets}</span>
                      </span>
                    </div>
                  </div>

                  {/* ✅ stat card mais “limpo” */}
                  <div className="card-premium rounded-[1.85rem] p-4 min-w-[132px] text-right relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute inset-0 opacity-[0.08] app-noise" />

                    <div className="relative">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        Este mês
                      </div>
                      <div className="mt-2 text-3xl font-black italic text-white drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)]">
                        {homeRecap.thisMonthSessions}
                      </div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        sessões
                      </div>
                      <div className="mt-3 h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.35),transparent)]" />
                    </div>
                  </div>
                </div>

                {/* ✅ sugestão mais premium */}
                <div className="mt-5 card-soft rounded-[2.05rem] p-4 flex items-center gap-4 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-[0.08] app-noise" />
                  <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-indigo-400/10 blur-2xl" />
                  <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                    <img
                      src={pickImageFor(topExercise?.displayName || 'gym')}
                      alt="Sugestão"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.35))]" />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                      Sugestão rápida
                    </div>
                    <div className="text-sm font-black text-white truncate mt-1">
                      {topExercise?.displayName
                        ? `Foca em ${topExercise.displayName}`
                        : 'Cria o teu primeiro treino'}
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono uppercase mt-1">
                      {topExercise?.lastDate
                        ? `Última vez: ${formatDatePT(topExercise.lastDate)}`
                        : 'Sem histórico ainda'}
                    </div>
                  </div>

                  <button
                    onClick={startNewWorkout}
                    className="relative btn-primary px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all duration-200 hover:brightness-[1.03] shadow-[0_18px_55px_rgba(34,197,94,0.18)]"
                  >
                    Começar
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ biblioteca card: mais “depth” + hairline */}
            <div className="card-premium rounded-[2.75rem] p-6 overflow-hidden relative">
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.28),rgba(34,197,94,0.22),transparent)]" />

              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/8 blur-2xl" />
              <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
              <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_0%,rgba(255,255,255,0.06),transparent_55%)]" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                    Biblioteca
                  </div>
                  <div
                    className="text-xl font-black italic uppercase tracking-tighter mt-1 text-white"
                    style={{
                      fontFamily:
                        'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    Treinos personalizados
                  </div>
                  <div className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Cria planos com nome livre:{' '}
                    <span className="font-black text-white">Upper Power</span>,{' '}
                    <span className="font-black text-white">Push A</span>, etc.
                  </div>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
                  ✦
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={startTemplateBuilder}
                  className="btn-primary rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-[0.25em] active:scale-[0.99] transition-all duration-200 hover:brightness-[1.03]"
                >
                  + Criar treino
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="btn-soft rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-[0.25em] active:scale-[0.99] transition-all duration-200 hover:bg-white/8"
                >
                  Ver treinos
                </button>
              </div>
            </div>
          </header>

          {/* ✅ métricas: micro sheen + glow alternado */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Sets (mês)',
                value: homeRecap.totalSets,
                hint: 'volume',
                glow: 'bg-emerald-400/10',
              },
              {
                label: 'Tempo (mês)',
                value: homeRecap.totalMin,
                hint: 'min',
                glow: 'bg-indigo-400/10',
              },
              {
                label: 'Abs (mês)',
                value: homeRecap.absCount,
                hint: 'sessões',
                glow: 'bg-lime-400/8',
              },
              {
                label: 'Cardio (mês)',
                value: homeRecap.cardioCount,
                hint: 'sessões',
                glow: 'bg-sky-400/10',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="card-premium rounded-[2.25rem] p-5 relative overflow-hidden"
              >
                <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-2xl ${t.glow}`} />
                <div className="absolute inset-0 bg-[radial-gradient(700px_340px_at_20%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.08] app-noise" />

                <div className="relative">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                    {t.label}
                  </div>
                  <div className="mt-2 text-3xl font-black italic text-white">
                    {t.value}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {t.hint}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ CTA sessão livre: hairline + sheen + melhor “depth” */}
          <button
            onClick={startNewWorkout}
            className="w-full rounded-[2.75rem] p-[2px] bg-[linear-gradient(90deg,#22c55e,#a3e635)] shadow-[0_30px_110px_rgba(34,197,94,0.18)] active:scale-95 transition-all duration-200 hover:brightness-[1.02]"
          >
            <div className="rounded-[2.65rem] bg-[#070B14]/85 backdrop-blur-xl p-7 flex justify-between items-center border border-white/10 relative overflow-hidden">
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.35),rgba(163,230,53,0.25),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_30%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
              <div className="absolute inset-0 opacity-[0.08] app-noise" />

              <div className="relative text-left">
                <h2
                  className="text-2xl font-black italic uppercase leading-none mb-1 text-white"
                  style={{
                    fontFamily:
                      'var(--font-grotesk), var(--font-inter), system-ui',
                  }}
                >
                  Sessão livre
                </h2>
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
                  Começar já +
                </p>
              </div>

              <div className="relative h-12 w-12 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                🏁
              </div>
            </div>
          </button>
        </div>
      )}

      {/* TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="animate-in">
          {showTemplateToast && (
            <div className="fixed top-12 left-0 right-0 z-[320] flex justify-center px-6 animate-in">
              <div className="bg-white/10 border border-white/14 backdrop-blur-2xl text-white px-6 py-4 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex items-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.10] app-noise" />
                <div className="bg-emerald-400 text-[#071018] rounded-full p-1.5 shadow relative">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="font-black uppercase italic tracking-tighter text-sm relative">
                  {templateToastText}
                </span>
              </div>
            </div>
          )}

          <header className="sticky top-0 z-50 px-6 py-4 bg-[#070B14]/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.40)] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="absolute -top-28 -left-28 h-64 w-64 rounded-full bg-lime-400/8 blur-2xl" />
              <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.30),rgba(163,230,53,0.22),transparent)]" />
            </div>

            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <BrandMark sizePx={HEADER_LOGO_PX} />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.30em] text-slate-300 truncate">
                    {BRAND_NAME}
                  </div>
                  <div
                    className="font-black italic uppercase text-sm tracking-tighter text-white truncate"
                    style={{
                      fontFamily:
                        'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    {selectedTemplateId ? 'Treino' : 'Treinos'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTemplateId(null);
                  setTemplateNameInput('');
                  setTemplateDraftExercises([]);
                  setExerciseInput('');
                  setActiveTab('home');
                }}
                className="btn-soft px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all duration-200 hover:bg-white/8"
              >
                Home
              </button>
            </div>
          </header>

          <div className="p-5 space-y-6 pb-40">
            {/* LIST */}
            {!selectedTemplateId && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-2xl font-black italic uppercase tracking-tighter text-white"
                    style={{
                      fontFamily: 'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    Treinos
                  </h2>
                  <button
                    onClick={startTemplateBuilder}
                    className="btn-primary px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:brightness-[1.03]"
                  >
                    + Criar
                  </button>
                </div>

                <div className="card-premium rounded-[2rem] p-4 relative overflow-hidden">
                  {/* ✅ bolinhas + glow verde/lima (voltou) */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-lime-400/10 blur-2xl" />
                    <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_25%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
                  </div>

                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                      Pesquisar
                    </div>
                    <input
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Ex.: Push A, Upper Power, Peito…"
                      className="mt-2 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-white/7"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {filteredTemplates.length} resultados
                      </div>
                      {filteredTemplates.length > 6 && (
                        <button
                          onClick={() => setTemplatesExpanded((v) => !v)}
                          className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          {templatesExpanded ? 'Mostrar menos' : 'Mostrar tudo'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {templatesToShow.map((t) => {
                    const thumb = pickImageFor(t.displayName);
                    return (
                      <div
                        key={t.id}
                        className="card-premium rounded-[2.25rem] overflow-hidden relative transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_34px_130px_rgba(0,0,0,0.55)]"
                      >
                        {/* ✅ borda/halo verde-lima + dots */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 opacity-[0.10] app-noise" />
                          <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
                          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-lime-400/10 blur-2xl" />
                        </div>

                        <div className="relative h-32">
                          <img
                            src={thumb}
                            alt={t.displayName}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            draggable={false}
                          />

                          {/* ✅ overlay premium + degradé verde/lima (como antes) */}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(7,11,20,0.92))]" />
                          <div className="absolute inset-0 bg-[radial-gradient(900px_300px_at_20%_0%,rgba(34,197,94,0.16),transparent_60%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(900px_320px_at_90%_40%,rgba(163,230,53,0.12),transparent_55%)]" />

                          {/* ✅ header content */}
                          <div className="absolute left-5 right-5 bottom-4">
                            <div className="flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {/* ✅ bolinhas (dots) */}
                                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
                                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                                    Treino
                                  </div>
                                </div>

                                <div
                                  className="text-xl font-black italic uppercase tracking-tighter text-white truncate mt-1"
                                  style={{
                                    fontFamily:
                                      'var(--font-grotesk), var(--font-inter), system-ui',
                                  }}
                                >
                                  {t.displayName}
                                </div>
                              </div>

                              {/* badge */}
                              <div className="shrink-0 rounded-2xl px-3 py-2 bg-white/8 border border-white/12 backdrop-blur-xl">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                                  {t.exercises.length} ex
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 text-[10px] text-slate-300 font-mono uppercase">
                              Atualizado: {formatDatePT(t.updatedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="relative p-5">
                          <div className="mt-1 flex flex-wrap gap-2">
                            {t.exercises.slice(0, 6).map((ex) => (
                              <span
                                key={ex.normalizedName}
                                className="text-[9px] bg-white/5 text-slate-200 px-3 py-1 rounded-full font-black uppercase border border-white/10"
                              >
                                {ex.displayName}
                              </span>
                            ))}
                            {t.exercises.length > 6 && (
                              <span className="text-[9px] bg-white/5 text-slate-300 px-3 py-1 rounded-full font-black uppercase border border-white/10">
                                +{t.exercises.length - 6}
                              </span>
                            )}
                          </div>

                          {/* ✅ ações mais “premium” */}
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openTemplate(t.id)}
                              className="btn-soft px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:bg-white/8"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => startWorkoutFromTemplate(t)}
                              className="btn-primary px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-[0_18px_60px_rgba(34,197,94,0.18)] transition-all duration-200 hover:brightness-[1.03]"
                            >
                              Iniciar
                            </button>
                          </div>

                          <button
                            onClick={() => setDeleteTemplateId(t.id)}
                            className="mt-3 w-full bg-rose-500/10 border border-rose-400/20 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-200 active:scale-95 transition-all duration-200 hover:bg-rose-500/14"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {templates.length === 0 && (
                    <div className="card-premium rounded-[2rem] p-6 text-slate-300 text-xs font-bold">
                      Ainda não tens treinos. Cria o primeiro.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* EDITOR */}
            {selectedTemplateId && (
              <>
                <div className="card-premium rounded-[2.5rem] p-6 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-lime-400/8 blur-2xl" />
                    <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
                  </div>

                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                      Nome do treino
                    </div>
                    <input
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                      placeholder="O teu nome (ex.: Upper Power)"
                      className="mt-2 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 font-black italic tracking-tighter text-lg outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-white/7"
                      style={{
                        fontFamily:
                          'var(--font-grotesk), var(--font-inter), system-ui',
                      }}
                    />

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={saveTemplate}
                        className="btn-primary rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:brightness-[1.03]"
                      >
                        Guardar
                      </button>

                      <button
                        onClick={() => {
                          const name = templateNameInput
                            .trim()
                            .replace(/\s+/g, ' ');
                          if (!name) return;
                          const tpl: WorkoutTemplate = {
                            id: crypto.randomUUID(),
                            normalizedName: normalizeName(name),
                            displayName: name,
                            updatedAt: new Date().toISOString(),
                            exercises: templateDraftExercises.map((e) => ({
                              ...e,
                            })),
                          };
                          startFromTemplate(tpl);
                        }}
                        className="btn-soft rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:bg-white/8"
                      >
                        Iniciar agora
                      </button>
                    </div>

                    <div className="mt-6">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        Adicionar exercício
                      </div>

                      <div className="mt-2 bg-white/5 border border-white/10 rounded-[1.35rem] p-2 pl-4 flex items-center gap-2 transition-all duration-200 hover:bg-white/7">
                        <input
                          value={exerciseInput}
                          onChange={(e) => setExerciseInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            addExerciseToTemplate(exerciseInput)
                          }
                          className="flex-grow bg-transparent outline-none font-bold text-sm text-white placeholder:text-slate-500"
                          placeholder="Supino, Remada, Agachamento..."
                        />
                        <button
                          onClick={() => addExerciseToTemplate(exerciseInput)}
                          className="btn-primary p-3 rounded-2xl active:scale-95 transition-all duration-200 hover:brightness-[1.03]"
                          aria-label="Adicionar exercício"
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>

                      {exerciseSuggestions.length > 0 &&
                        normalizeName(exerciseInput).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {exerciseSuggestions.map((s) => (
                              <button
                                key={s.normalizedName}
                                onClick={() =>
                                  addExerciseToTemplate(s.displayName)
                                }
                                className="text-[9px] bg-white/5 text-slate-200 px-3 py-2 rounded-full font-black uppercase border border-white/10 active:scale-95 transition-all duration-200 hover:bg-white/10"
                              >
                                {s.displayName}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {templateDraftExercises.map((ex, idx) => {
                    const perf = exerciseStats[ex.normalizedName];
                    const lastLine =
                      perf?.lastDate &&
                      (typeof perf.lastWeight === 'number' ||
                        typeof perf.lastReps === 'number')
                        ? `Última vez: ${
                            typeof perf.lastWeight === 'number'
                              ? `${perf.lastWeight} kg`
                              : '--'
                          } × ${
                            typeof perf.lastReps === 'number'
                              ? `${perf.lastReps} reps`
                              : '--'
                          } (${formatDatePT(perf.lastDate)})`
                        : 'Sem histórico ainda';

                    return (
                      <div
                        key={ex.normalizedName}
                        className="card-premium rounded-[2.25rem] p-6 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
                          <div className="absolute inset-0 opacity-[0.08] app-noise" />
                        </div>

                        <div className="relative flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div
                              className="text-white font-black italic uppercase text-lg tracking-tighter truncate"
                              style={{
                                fontFamily:
                                  'var(--font-grotesk), var(--font-inter), system-ui',
                              }}
                            >
                              {ex.displayName}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">
                              {lastLine}
                            </div>
                          </div>

                          <button
                            onClick={() => removeTemplateExercise(idx)}
                            className="bg-rose-500/10 border border-rose-400/20 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-200 active:scale-95 transition-all duration-200 hover:bg-rose-500/14"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="relative mt-5 grid grid-cols-3 gap-3">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 transition-all duration-200 hover:bg-white/8">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                              Sets
                            </div>
                            <input
                              type="number"
                              value={ex.targetSets}
                              onChange={(e) =>
                                updateTemplateExercise(idx, {
                                  targetSets: clamp(Number(e.target.value), 1, 12),
                                })
                              }
                              className="mt-2 w-full bg-transparent outline-none font-black text-lg text-white"
                              placeholder="3"
                            />
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 transition-all duration-200 hover:bg-white/8">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                              Reps
                            </div>
                            <input
                              type="number"
                              value={ex.targetReps ?? ''}
                              onChange={(e) =>
                                updateTemplateExercise(idx, {
                                  targetReps: Number(e.target.value),
                                })
                              }
                              className="mt-2 w-full bg-transparent outline-none font-black text-lg text-white"
                              placeholder="8"
                            />
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 transition-all duration-200 hover:bg-white/8">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                              Descanso
                            </div>
                            <input
                              type="number"
                              value={ex.restSeconds ?? ''}
                              onChange={(e) =>
                                updateTemplateExercise(idx, {
                                  restSeconds: Number(e.target.value),
                                })
                              }
                              className="mt-2 w-full bg-transparent outline-none font-black text-lg text-white"
                              placeholder="120"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {templateDraftExercises.length === 0 && (
                    <div className="card-premium rounded-[2.25rem] p-6 text-center">
                      <div className="text-slate-300 text-xs font-bold">
                        Adiciona exercícios.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setSelectedTemplateId(null);
                      setTemplateNameInput('');
                      setTemplateDraftExercises([]);
                      setExerciseInput('');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                  >
                    ← Voltar
                  </button>

                  <button
                    onClick={() => {
                      if (selectedTemplateId && selectedTemplateId !== 'NEW')
                        setDeleteTemplateId(selectedTemplateId);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-rose-200 hover:text-rose-100 transition-colors"
                  >
                    Remover treino
                  </button>
                </div>
              </>
            )}
          </div>

          {deleteTemplateId && (
            <div className="fixed inset-0 z-[260] bg-black/55 backdrop-blur-sm p-4">
              <div className="max-w-md mx-auto mt-24 rounded-[2.25rem] card-premium p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.10] app-noise" />
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300 relative">
                  Confirmação
                </div>
                <div
                  className="text-xl font-black italic uppercase tracking-tighter mt-2 text-white relative"
                  style={{
                    fontFamily:
                      'var(--font-grotesk), var(--font-inter), system-ui',
                  }}
                >
                  Remover treino?
                </div>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed relative">
                  Isto remove o template da tua lista. As sessões no calendário
                  não são apagadas.
                </p>
                <div className="mt-5 flex gap-2 relative">
                  <button
                    onClick={() => setDeleteTemplateId(null)}
                    className="flex-1 btn-soft rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:bg-white/8"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => removeTemplate(deleteTemplateId)}
                    className="flex-1 bg-rose-500 text-white rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all duration-200 hover:brightness-[1.03]"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* TRAIN (visual melhor: thumbnail + header mais limpo) */}
      {activeTab === 'train' && currentSession && (
        <div className="animate-in">
          <header className="sticky top-0 z-50 px-6 pt-4 pb-4 bg-[#070B14]/72 backdrop-blur-2xl border-b border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.45)] relative overflow-hidden">
            {/* ✅ glow/dots como no resto do app */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="absolute -top-28 -left-28 h-64 w-64 rounded-full bg-lime-400/8 blur-2xl" />
              <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />

              {/* ✅ hairline gradient no fundo do header (mais premium) */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.35),rgba(163,230,53,0.25),transparent)]" />
            </div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <BrandMark sizePx={TAB_LOGO_PX} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
                      <span
                        className="font-black italic uppercase text-sm tracking-tighter truncate text-white"
                        style={{
                          fontFamily:
                            'var(--font-grotesk), var(--font-inter), system-ui',
                        }}
                      >
                        {currentSession.name}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        Em curso
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">
                        {formatDuration(workoutElapsed)}
                      </span>

                      {/* ✅ micro-badge “ao vivo” */}
                      <span className="ml-1 inline-flex items-center gap-2 rounded-full px-2.5 py-1 bg-white/5 border border-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(34,197,94,0.10)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
                          live
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ pills mais bonitas */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setAddonAbs((v) => !v)}
                    className={`shrink-0 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border active:scale-95 transition-all duration-200 ${
                      addonAbs
                        ? 'bg-[linear-gradient(135deg,#22c55e,#a3e635)] text-[#071018] border-emerald-200/40 shadow-[0_16px_50px_rgba(34,197,94,0.16)]'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/8'
                    }`}
                  >
                    Abs
                  </button>

                  <button
                    onClick={() => setAddonCardio((v) => !v)}
                    className={`shrink-0 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border active:scale-95 transition-all duration-200 ${
                      addonCardio
                        ? 'bg-[linear-gradient(135deg,#38bdf8,#a3e635)] text-[#071018] border-emerald-200/30 shadow-[0_16px_50px_rgba(56,189,248,0.12)]'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/8'
                    }`}
                  >
                    Cardio
                  </button>

                  <button
                    onClick={() => setTrainShowAddExercise((v) => !v)}
                    className={`shrink-0 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border active:scale-95 transition-all duration-200 ${
                      trainShowAddExercise
                        ? 'bg-white/10 border-white/14 text-white'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/8'
                    }`}
                  >
                    {trainShowAddExercise ? 'Fechar' : 'Adicionar exercício'}
                  </button>
                </div>

                {/* ✅ notas com melhor moldura */}
                <div className="mt-3">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      ✎
                    </div>
                    <input
                      value={addonNotes}
                      onChange={(e) => setAddonNotes(e.target.value)}
                      placeholder="Notas rápidas (opcional)…"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-white/7"
                    />
                  </div>
                </div>
              </div>

              {/* ✅ botão terminar mais “statement” */}
              <button
                onClick={saveWorkout}
                className="btn-primary px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-[0_20px_70px_rgba(34,197,94,0.18)] transition-all duration-200 hover:brightness-[1.02]"
              >
                Terminar
              </button>
            </div>
          </header>

          <div className="p-4 space-y-6 pb-44">
            {currentSession.exercises.map((ex, exIdx) => {
              const thumb = pickImageFor(ex.name);
              const perf = exerciseStats[normalizeName(ex.name)];

              return (
                <div
                  key={ex.id}
                  className="card-premium rounded-[2.5rem] overflow-hidden relative"
                >
                  {/* ✅ halo/dots (consistência premium) */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-lime-400/8 blur-2xl" />
                    <div className="absolute inset-0 opacity-[0.08] app-noise" />
                  </div>

                  {/* cover */}
                  <div className="relative h-28">
                    <img
                      src={thumb}
                      alt={ex.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      draggable={false}
                    />
                    {/* ✅ overlay mais “legível” */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(7,11,20,0.94))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_280px_at_20%_0%,rgba(34,197,94,0.14),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_300px_at_90%_55%,rgba(163,230,53,0.10),transparent_55%)]" />

                    <div className="absolute left-5 bottom-3 right-5">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className="text-white font-black italic uppercase text-lg tracking-tighter truncate"
                            style={{
                              fontFamily:
                                'var(--font-grotesk), var(--font-inter), system-ui',
                            }}
                          >
                            {ex.name}
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">
                            {perf?.lastDate
                              ? `Última vez: ${perf.lastWeight ?? '--'}kg × ${
                                  perf.lastReps ?? '--'
                                } (${formatDatePT(perf.lastDate)})`
                              : 'Sem histórico ainda'}
                          </div>
                        </div>

                        {typeof perf?.bestWeight === 'number' && (
                          <div className="shrink-0 rounded-2xl px-3 py-2 bg-white/8 border border-white/12 backdrop-blur-xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                              Best {perf.bestWeight}kg
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative p-6">
                    <div className="grid grid-cols-4 gap-4 mb-4 text-[9px] font-black text-slate-300 uppercase text-center tracking-[0.25em]">
                      <span>SET</span>
                      <span>CARGA</span>
                      <span>REPS</span>
                      <span>✓</span>
                    </div>

                    {ex.sets.map((set, sIdx) => (
                      <div
                        key={set.id}
                        className={`rounded-2xl p-2 mb-3 border transition-all duration-200 ${
                          set.completed
                            ? 'bg-white/6 border-emerald-400/20'
                            : 'bg-white/4 border-white/10'
                        }`}
                      >
                        <div
                          className={`grid grid-cols-4 gap-3 items-center ${
                            set.completed ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="bg-white/5 border border-white/10 h-12 rounded-2xl flex items-center justify-center font-black italic text-xs text-white">
                            {sIdx + 1}
                          </div>

                          <input
                            type="number"
                            className="bg-white/5 border border-white/10 h-12 rounded-2xl text-center font-black text-sm outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-white/8"
                            value={set.weightKg || ''}
                            placeholder="0"
                            onChange={(e) =>
                              updateSet(exIdx, sIdx, {
                                weightKg: Number(e.target.value),
                              })
                            }
                          />

                          <input
                            type="number"
                            className="bg-white/5 border border-white/10 h-12 rounded-2xl text-center font-black text-sm outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500 transition-all duration-200 hover:bg-white/8"
                            value={set.reps || ''}
                            placeholder="0"
                            onChange={(e) =>
                              updateSet(exIdx, sIdx, {
                                reps: Number(e.target.value),
                              })
                            }
                          />

                          <button
                            onClick={() =>
                              updateSet(exIdx, sIdx, {
                                completed: !set.completed,
                              })
                            }
                            className={`h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border font-black ${
                              set.completed
                                ? 'bg-[linear-gradient(135deg,#22c55e,#a3e635)] text-[#071018] border-emerald-200/40 shadow-[0_14px_50px_rgba(34,197,94,0.18)]'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addSet(exIdx)}
                      className="w-full h-12 mt-2 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.99] overflow-hidden relative"
                    >
                      <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,197,94,0.22),rgba(163,230,53,0.14))]" />
                      <span className="absolute inset-[1px] rounded-2xl bg-[#070B14]/55 border border-white/10" />
                      <span className="relative">+ Série</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {trainShowAddExercise && (
            <div className="fixed bottom-28 inset-x-6 z-50 rounded-[1.6rem] bg-[#070B14]/80 backdrop-blur-2xl border border-white/10 shadow-[0_24px_90px_rgba(0,0,0,0.45)] p-2 pl-6 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-lime-400/8 blur-2xl" />
                <div className="absolute inset-0 opacity-[0.10] mix-blend-soft-light app-noise" />
              </div>

              <div className="relative">
                <div className="flex items-center gap-2">
                  <input
                    value={exerciseInput}
                    onChange={(e) => setExerciseInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && addExercise(exerciseInput)
                    }
                    className="flex-grow bg-transparent outline-none font-bold text-sm text-white placeholder:text-slate-500"
                    placeholder="Adicionar exercício…"
                  />
                  <button
                    onClick={() => addExercise(exerciseInput)}
                    className="btn-primary p-3 rounded-2xl active:scale-95 transition-all duration-200 hover:brightness-[1.02]"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>

                {exerciseSuggestions.length > 0 &&
                  normalizeName(exerciseInput).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exerciseSuggestions.map((s) => (
                        <button
                          key={s.normalizedName}
                          onClick={() => addExercise(s.displayName)}
                          className="text-[9px] bg-white/5 text-slate-200 px-3 py-2 rounded-full font-black uppercase border border-white/10 active:scale-95 transition-all duration-200 hover:bg-white/10"
                        >
                          {s.displayName}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CALENDAR (mais premium) */}
      {activeTab === 'calendar' && (
        <div className="p-6 animate-in">
          <div className="flex items-center justify-between mb-6 pt-2">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <BrandMark sizePx={HEADER_LOGO_PX} />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">
                    {BRAND_NAME}
                  </div>
                  <h2
                    className="text-3xl font-black italic uppercase tracking-tighter mt-1 text-white"
                    style={{
                      fontFamily:
                        'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    Calendário
                  </h2>
                </div>
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 mt-3">
                {monthLabel}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = new Date(calYear, calMonth - 1, 1);
                  setCalYear(prev.getFullYear());
                  setCalMonth(prev.getMonth());
                }}
                className="btn-soft px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  const next = new Date(calYear, calMonth + 1, 1);
                  setCalYear(next.getFullYear());
                  setCalMonth(next.getMonth());
                }}
                className="btn-soft px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
              <div
                key={i}
                className="text-center text-slate-300 font-black text-[10px] tracking-widest"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell)
                return (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl bg-transparent"
                  />
                );

              const worked = (sessionsByDay[cell.key]?.length ?? 0) > 0;
              const count = sessionsByDay[cell.key]?.length ?? 0;
              const isSelected = selectedDateKey === cell.key;
              const isToday = cell.key === dateKey(new Date().toISOString());

              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDateKey(cell.key)}
                  className={[
                    'aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-black transition-all border relative overflow-hidden',
                    worked
                      ? 'bg-white/10 text-white border-white/10'
                      : 'bg-white/5 text-slate-200 border-white/10',
                    isSelected ? 'ring-4 ring-emerald-300/20 scale-[1.03]' : '',
                    isToday ? 'outline outline-2 outline-emerald-300/30' : '',
                  ].join(' ')}
                >
                  {worked && (
                    <span className="absolute inset-0 opacity-[0.08] app-noise" />
                  )}
                  <div className="relative">{cell.day}</div>
                  {worked && (
                    <div className="relative mt-1 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span className="text-[9px] font-black text-emerald-300">
                        {count}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <div className="mt-6 card-premium rounded-[2.5rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                    Dia
                  </div>
                  <div
                    className="text-xl font-black italic uppercase tracking-tighter mt-2 text-white"
                    style={{
                      fontFamily:
                        'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString(
                      'pt-PT',
                      {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDateKey(null)}
                  className="btn-soft px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {selectedDaySessions.length === 0 ? (
                  <div className="text-slate-300 text-xs font-bold">
                    Sem treino registado neste dia.
                  </div>
                ) : (
                  selectedDaySessions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <button
                        onClick={() => setSelectedSessionId(s.id)}
                        className="w-full text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                              Treino
                            </div>
                            <div
                              className="text-lg font-black italic uppercase tracking-tighter truncate mt-1 text-white"
                              style={{
                                fontFamily:
                                  'var(--font-grotesk), var(--font-inter), system-ui',
                              }}
                            >
                              {s.name}
                            </div>
                            <div className="text-[10px] text-slate-300 font-mono uppercase mt-1">
                              {formatTimePT(s.startedAt)}
                              {typeof s.durationSeconds === 'number' &&
                                s.durationSeconds > 0 && (
                                  <span className="ml-2 text-slate-300">
                                    • {Math.round(s.durationSeconds / 60)} min
                                  </span>
                                )}
                              {s.addons?.abs && (
                                <span className="ml-2 text-emerald-300">
                                  • ABS
                                </span>
                              )}
                              {s.addons?.cardio && (
                                <span className="ml-2 text-sky-300">
                                  • CARDIO
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                            Detalhes
                          </div>
                        </div>
                      </button>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => setDeleteSessionId(s.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-rose-200 hover:text-rose-100"
                        >
                          Remover do histórico
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedSession && (
            <div className="fixed inset-0 z-[250] bg-black/55 backdrop-blur-sm p-4">
              <div className="max-w-md mx-auto mt-6 card-premium rounded-[2.75rem] overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                        Sessão
                      </div>
                      <div
                        className="text-2xl font-black italic uppercase tracking-tighter truncate mt-2 text-white"
                        style={{
                          fontFamily:
                            'var(--font-grotesk), var(--font-inter), system-ui',
                        }}
                      >
                        {selectedSession.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono uppercase mt-2">
                        {formatDatePT(selectedSession.startedAt)} •{' '}
                        {formatTimePT(selectedSession.startedAt)}
                        {typeof selectedSession.durationSeconds === 'number' &&
                          selectedSession.durationSeconds > 0 && (
                            <span className="ml-2 text-slate-300">
                              •{' '}
                              {Math.round(selectedSession.durationSeconds / 60)}{' '}
                              min
                            </span>
                          )}
                        {selectedSession.addons?.abs && (
                          <span className="ml-2 text-emerald-300">• ABS</span>
                        )}
                        {selectedSession.addons?.cardio && (
                          <span className="ml-2 text-sky-300">• CARDIO</span>
                        )}
                      </div>

                      {selectedSession.addons?.notes && (
                        <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-100">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                            Notas
                          </div>
                          {selectedSession.addons.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedSessionId(null)}
                        className="btn-soft px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={() => setDeleteSessionId(selectedSession.id)}
                        className="bg-rose-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {selectedSession.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-white/5 border border-white/10 rounded-[2rem] p-5"
                    >
                      <div className="text-white font-black italic uppercase tracking-tighter">
                        {ex.name}
                      </div>
                      <div className="mt-3 space-y-2">
                        {ex.sets.map((set, i) => (
                          <div
                            key={set.id}
                            className="flex items-center justify-between text-xs font-bold text-slate-100"
                          >
                            <div className="text-slate-300 font-black">
                              Set {i + 1}
                            </div>
                            <div className="font-black">
                              {(set.weightKg || 0) > 0
                                ? `${set.weightKg} kg`
                                : '--'}{' '}
                              × {(set.reps || 0) > 0 ? `${set.reps}` : '--'}
                              {set.completed && (
                                <span className="ml-2 text-[10px] font-black uppercase text-emerald-300">
                                  ✓
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {deleteSessionId && (
            <div className="fixed inset-0 z-[260] bg-black/55 backdrop-blur-sm p-4">
              <div className="max-w-md mx-auto mt-24 card-premium rounded-[2.25rem] p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">
                  Confirmação
                </div>
                <div
                  className="text-xl font-black italic uppercase tracking-tighter mt-2 text-white"
                  style={{
                    fontFamily:
                      'var(--font-grotesk), var(--font-inter), system-ui',
                  }}
                >
                  Remover sessão?
                </div>
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  Isto vai remover a sessão do teu histórico/calendário.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setDeleteSessionId(null)}
                    className="flex-1 btn-soft rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => removeSession(deleteSessionId)}
                    className="flex-1 bg-rose-500 text-white rounded-2xl px-4 py-3 font-black text-[10px] uppercase tracking-widest active:scale-95"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="p-6 animate-in">
          <div className="flex items-center gap-3 mb-8">
            <BrandMark sizePx={HEADER_LOGO_PX} />
            <h2
              className="text-3xl font-black italic uppercase tracking-tighter text-white"
              style={{
                fontFamily: 'var(--font-grotesk), var(--font-inter), system-ui',
              }}
            >
              Histórico
            </h2>
          </div>
          <div className="space-y-6">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="relative pl-6 border-l-2 border-white/10 pb-2"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-400 border-4 border-[#070B14] shadow-sm" />
                <div className="card-premium p-5 rounded-3xl">
                  <span className="text-slate-300 font-mono text-[10px] uppercase block mb-2">
                    {new Date(s.startedAt).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {typeof s.durationSeconds === 'number' &&
                      s.durationSeconds > 0 && (
                        <span className="ml-2 text-slate-300">
                          • {Math.round(s.durationSeconds / 60)} min
                        </span>
                      )}
                  </span>
                  <h3
                    className="font-black italic uppercase text-lg mb-1 text-white"
                    style={{
                      fontFamily:
                        'var(--font-grotesk), var(--font-inter), system-ui',
                    }}
                  >
                    {s.name}
                  </h3>
                  <div className="text-[10px] text-slate-300 font-mono uppercase">
                    {s.exercises.length} exercícios
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-[150] px-6 pb-10 pt-4">
        <div className="rounded-[2.9rem] bg-[#070B14]/72 backdrop-blur-2xl border border-white/10 shadow-[0_26px_110px_rgba(0,0,0,0.55)] flex justify-around items-center p-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.12] app-noise" />
          {[
            {
              id: 'home',
              icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            },
            {
              id: 'templates',
              icon: 'M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z',
            },
            { id: 'train', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            {
              id: 'calendar',
              icon: 'M8 7V5m8 2V5M4 9h16m-2 12H6a2 2 0 01-2-2V9a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2z',
            },
            {
              id: 'history',
              icon: 'M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex flex-col items-center p-3 transition-all duration-300 rounded-2xl ${
                activeTab === tab.id ? 'text-[#071018]' : 'text-slate-300'
              }`}
            >
              <span
                className={`mb-1 h-10 w-10 rounded-2xl flex items-center justify-center transition-all border ${
                  activeTab === tab.id
                    ? 'bg-[linear-gradient(135deg,#22c55e,#a3e635)] border-emerald-200/40 shadow-[0_16px_50px_rgba(34,197,94,0.18)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={activeTab === tab.id ? 2.8 : 2}
                    d={tab.icon}
                  />
                </svg>
              </span>

              {/* ✅ indicador discreto do tab ativo */}
              {activeTab === tab.id && (
                <span className="mt-1 h-1 w-5 rounded-full bg-emerald-300/80 shadow-[0_0_0_6px_rgba(34,197,94,0.10)]" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <style jsx global>{`
        body {
          background: #070b14;
          color: #e5e7eb;
          -webkit-tap-highlight-color: transparent;
        }

        .animate-in {
          animation: slideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input::placeholder {
          color: #64748b;
          font-style: italic;
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Premium glass (dark) */
        .card-premium {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.10);
          box-shadow: 0 26px 110px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
        }
        .card-soft {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
        }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #22c55e, #a3e635);
          color: #071018;
          border: 1px solid rgba(163, 230, 53, 0.35);
          box-shadow: 0 18px 60px rgba(34, 197, 94, 0.16);
        }
        .btn-soft {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.10);
          color: #ffffff;
          box-shadow: 0 8px 26px rgba(0, 0, 0, 0.30);
          backdrop-filter: blur(14px);
        }

        /* Chips */
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.7rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.10);
          backdrop-filter: blur(14px);
        }
        .chip-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 999px;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
        }
        .chip-k {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.26em;
          color: #cbd5e1;
        }
        .chip-v {
          font-size: 0.95rem;
          font-weight: 900;
          color: #ffffff;
          font-style: italic;
          margin-left: 0.15rem;
        }

        /* Brand mark */
        .brandmark {
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
        }
        .logo-img {
          object-fit: contain;
          opacity: 0.98;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.35));
        }

        /* noise via inline svg */
        .app-noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
        }

        .app-shell ::selection {
          background: rgba(34, 197, 94, 0.22);
        }
      `}</style>
      {/* --- COLA ISTO ANTES DO </main> --- */}
      {showSuccessToast && (
        <div className="fixed top-12 left-0 right-0 z-[300] flex justify-center px-6 animate-in">
          <div className="bg-emerald-500 text-black px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-3 border-t border-white/30">
            <div className="bg-black/20 rounded-full p-1">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="font-black uppercase italic tracking-tighter text-sm">
              Treino Guardado!
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

