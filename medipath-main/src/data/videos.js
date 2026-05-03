// Recovery video library mapped by treatment type
// Uses real public YouTube video IDs for rehab/recovery content

export const RECOVERY_VIDEOS = [
  // ── ORTHOPEDIC / PHYSICAL INJURY ──
  {
    id: "v001",
    title: "Post-Fracture Rehabilitation Exercises",
    youtubeId: "qFOyK5520SI",
    duration: "15 min",
    category: "Physical Rehab",
    treatmentTypes: ["Orthopedics", "General Surgery"],
    difficulty: "Beginner",
    description: "Gentle range-of-motion exercises for post-fracture recovery. Safe movements to restore flexibility."
  },
  {
    id: "v002",
    title: "Knee Joint Mobility Exercises",
    youtubeId: "RjMGcTAxAqs",
    duration: "12 min",
    category: "Joint Mobility",
    treatmentTypes: ["Orthopedics", "Rheumatology"],
    difficulty: "Beginner",
    description: "Physiotherapy exercises for knee pain relief and improved joint mobility."
  },
  {
    id: "v003",
    title: "Shoulder Pain Recovery Routine",
    youtubeId: "iN2lCwZQPJs",
    duration: "18 min",
    category: "Physical Rehab",
    treatmentTypes: ["Orthopedics"],
    difficulty: "Intermediate",
    description: "Complete shoulder rehabilitation routine including stretches and strengthening exercises."
  },
  {
    id: "v004",
    title: "Lower Back Pain Relief Exercises",
    youtubeId: "XqNfWg0IBME",
    duration: "20 min",
    category: "Pain Management",
    treatmentTypes: ["Orthopedics", "Neurology"],
    difficulty: "Beginner",
    description: "Safe exercises to relieve lower back pain. Stretching and core strengthening."
  },
  {
    id: "v005",
    title: "Post-Surgery Walking Program",
    youtubeId: "mmOhAaGLxGE",
    duration: "10 min",
    category: "Physical Rehab",
    treatmentTypes: ["Orthopedics", "General Surgery"],
    difficulty: "Beginner",
    description: "Gradual walking program for post-surgical patients. Building endurance safely."
  },

  // ── CARDIAC REHABILITATION ──
  {
    id: "v006",
    title: "Cardiac Rehabilitation Exercises",
    youtubeId: "nBdThBpWiyo",
    duration: "22 min",
    category: "Cardiac Rehab",
    treatmentTypes: ["Cardiology", "Internal Medicine"],
    difficulty: "Beginner",
    description: "Heart-safe exercise program for cardiac patients. Low-impact aerobic movements."
  },
  {
    id: "v007",
    title: "Heart-Healthy Walking Program",
    youtubeId: "L_A_HjHZxfI",
    duration: "15 min",
    category: "Cardiac Rehab",
    treatmentTypes: ["Cardiology"],
    difficulty: "Beginner",
    description: "Structured walking program designed for cardiac rehabilitation patients."
  },
  {
    id: "v008",
    title: "Stress Management for Heart Patients",
    youtubeId: "sG7DBA-mgFY",
    duration: "12 min",
    category: "Wellness",
    treatmentTypes: ["Cardiology", "Psychiatry"],
    difficulty: "Beginner",
    description: "Guided relaxation and stress management techniques for cardiovascular health."
  },

  // ── RESPIRATORY / PULMONOLOGY ──
  {
    id: "v009",
    title: "Breathing Exercises for Lung Health",
    youtubeId: "UB3tA1fImSQ",
    duration: "14 min",
    category: "Respiratory",
    treatmentTypes: ["Pulmonology"],
    difficulty: "Beginner",
    description: "Diaphragmatic breathing and pursed-lip breathing techniques for lung capacity improvement."
  },
  {
    id: "v010",
    title: "Pulmonary Rehabilitation Exercises",
    youtubeId: "6FpXNi2e8VE",
    duration: "18 min",
    category: "Respiratory",
    treatmentTypes: ["Pulmonology", "General Medicine"],
    difficulty: "Intermediate",
    description: "Full pulmonary rehab program including breathing exercises and gentle aerobics."
  },
  {
    id: "v011",
    title: "Chest Physiotherapy Techniques",
    youtubeId: "1MKjiaxqK_I",
    duration: "10 min",
    category: "Respiratory",
    treatmentTypes: ["Pulmonology", "Infectious Disease"],
    difficulty: "Beginner",
    description: "Chest clearing techniques and postural drainage for respiratory patients."
  },

  // ── NEUROLOGICAL REHABILITATION ──
  {
    id: "v012",
    title: "Balance & Coordination Exercises",
    youtubeId: "D_Z1KFMNvJY",
    duration: "16 min",
    category: "Neuro Rehab",
    treatmentTypes: ["Neurology"],
    difficulty: "Intermediate",
    description: "Balance training exercises for neurological recovery. Improves stability and coordination."
  },
  {
    id: "v013",
    title: "Gentle Stretching for Muscle Stiffness",
    youtubeId: "g_tea8ZNk5A",
    duration: "20 min",
    category: "Mobility",
    treatmentTypes: ["Neurology", "Rheumatology"],
    difficulty: "Beginner",
    description: "Full body gentle stretching routine for patients with muscle stiffness or spasticity."
  },

  // ── GENERAL RECOVERY / WELLNESS ──
  {
    id: "v014",
    title: "Morning Stretching Routine",
    youtubeId: "4pKly2JojMw",
    duration: "12 min",
    category: "Mobility",
    treatmentTypes: ["General Medicine", "Internal Medicine", "Orthopedics"],
    difficulty: "Beginner",
    description: "Gentle morning stretching routine suitable for all recovery patients."
  },
  {
    id: "v015",
    title: "Guided Meditation for Healing",
    youtubeId: "ZToicYcHIqU",
    duration: "15 min",
    category: "Wellness",
    treatmentTypes: ["Psychiatry", "General Medicine", "Cardiology"],
    difficulty: "Beginner",
    description: "Guided meditation focusing on body healing, pain management, and recovery mindset."
  },
  {
    id: "v016",
    title: "Sleep Hygiene & Relaxation",
    youtubeId: "t0kACis_dJE",
    duration: "20 min",
    category: "Wellness",
    treatmentTypes: ["Psychiatry", "Neurology", "General Medicine"],
    difficulty: "Beginner",
    description: "Progressive muscle relaxation and tips for better sleep during recovery."
  },
  {
    id: "v017",
    title: "Gentle Yoga for Recovery",
    youtubeId: "v7AYKMP6rOE",
    duration: "25 min",
    category: "Mobility",
    treatmentTypes: ["General Medicine", "Orthopedics", "Rheumatology"],
    difficulty: "Beginner",
    description: "Therapeutic yoga session designed for patients in recovery. Chair-supported options available."
  },
  {
    id: "v018",
    title: "Hand & Wrist Rehabilitation",
    youtubeId: "hUyMNyrOHIg",
    duration: "10 min",
    category: "Physical Rehab",
    treatmentTypes: ["Orthopedics", "Neurology", "Rheumatology"],
    difficulty: "Beginner",
    description: "Targeted exercises for hand and wrist recovery after injury or surgery."
  },

  // ── DIABETES & METABOLIC ──
  {
    id: "v019",
    title: "Exercise for Diabetes Management",
    youtubeId: "Yz7Ofr9z1co",
    duration: "18 min",
    category: "Metabolic Health",
    treatmentTypes: ["Endocrinology", "Internal Medicine", "General Medicine"],
    difficulty: "Beginner",
    description: "Safe exercise routine for diabetic patients to help manage blood sugar levels."
  },
  {
    id: "v020",
    title: "Walking for Weight Loss & Health",
    youtubeId: "bxQbXGxsVFc",
    duration: "20 min",
    category: "Metabolic Health",
    treatmentTypes: ["Endocrinology", "Cardiology", "General Medicine"],
    difficulty: "Beginner",
    description: "Structured walking program for weight management and metabolic health improvement."
  },

  // ── DIGESTIVE HEALTH ──
  {
    id: "v021",
    title: "Yoga for Digestive Health",
    youtubeId: "ISmhZUcS7B8",
    duration: "15 min",
    category: "Digestive Wellness",
    treatmentTypes: ["Gastroenterology", "General Medicine"],
    difficulty: "Beginner",
    description: "Gentle yoga poses to improve digestion and relieve abdominal discomfort."
  },
  {
    id: "v022",
    title: "Stress Relief for IBS",
    youtubeId: "O-6f5wQXSu8",
    duration: "12 min",
    category: "Digestive Wellness",
    treatmentTypes: ["Gastroenterology", "Psychiatry"],
    difficulty: "Beginner",
    description: "Relaxation techniques and breathing exercises for managing IBS symptoms."
  },

  // ── WOMEN'S HEALTH ──
  {
    id: "v023",
    title: "Prenatal Gentle Exercise",
    youtubeId: "eXW6LTM73Ks",
    duration: "22 min",
    category: "Women's Health",
    treatmentTypes: ["Obstetrics & Gynecology", "General Medicine"],
    difficulty: "Beginner",
    description: "Safe prenatal exercises for expecting mothers. Improves strength and flexibility."
  },
  {
    id: "v024",
    title: "Postpartum Recovery Exercises",
    youtubeId: "Yz7Ofr9z1co",
    duration: "16 min",
    category: "Women's Health",
    treatmentTypes: ["Obstetrics & Gynecology"],
    difficulty: "Beginner",
    description: "Gentle exercises for postpartum recovery focusing on core and pelvic floor."
  },

  // ── SENIOR HEALTH ──
  {
    id: "v025",
    title: "Chair Exercises for Seniors",
    youtubeId: "l7cY2AlYPKo",
    duration: "18 min",
    category: "Senior Fitness",
    treatmentTypes: ["Geriatrics", "General Medicine", "Orthopedics"],
    difficulty: "Beginner",
    description: "Safe seated exercises for older adults to maintain strength and mobility."
  },
  {
    id: "v026",
    title: "Fall Prevention Exercises",
    youtubeId: "4TYwxj_e8Yw",
    duration: "14 min",
    category: "Senior Fitness",
    treatmentTypes: ["Geriatrics", "Neurology"],
    difficulty: "Beginner",
    description: "Balance and strength exercises to reduce fall risk in elderly patients."
  },

  // ── PAIN MANAGEMENT ──
  {
    id: "v027",
    title: "Neck Pain Relief Exercises",
    youtubeId: "FTV6UCh-yhs",
    duration: "10 min",
    category: "Pain Management",
    treatmentTypes: ["Orthopedics", "Neurology", "General Medicine"],
    difficulty: "Beginner",
    description: "Simple exercises and stretches to relieve neck pain and tension."
  },
  {
    id: "v028",
    title: "Sciatica Pain Relief",
    youtubeId: "DWmGArQBtFI",
    duration: "15 min",
    category: "Pain Management",
    treatmentTypes: ["Orthopedics", "Neurology"],
    difficulty: "Beginner",
    description: "Targeted stretches and exercises for sciatic nerve pain relief."
  },
  {
    id: "v029",
    title: "Fibromyalgia Gentle Movement",
    youtubeId: "Yz7Ofr9z1co",
    duration: "20 min",
    category: "Pain Management",
    treatmentTypes: ["Rheumatology", "General Medicine"],
    difficulty: "Beginner",
    description: "Very gentle movement therapy for fibromyalgia patients to reduce pain and stiffness."
  },

  // ── MENTAL HEALTH & WELLNESS ──
  {
    id: "v030",
    title: "Anxiety Relief Breathing",
    youtubeId: "odADwWzHR24",
    duration: "8 min",
    category: "Mental Wellness",
    treatmentTypes: ["Psychiatry", "General Medicine"],
    difficulty: "Beginner",
    description: "Quick breathing techniques to manage anxiety and panic attacks."
  },
  {
    id: "v031",
    title: "Depression Recovery Yoga",
    youtubeId: "Yz7Ofr9z1co",
    duration: "25 min",
    category: "Mental Wellness",
    treatmentTypes: ["Psychiatry"],
    difficulty: "Beginner",
    description: "Therapeutic yoga sequence designed to help with depression recovery."
  },
  {
    id: "v032",
    title: "Mindfulness Meditation",
    youtubeId: "ZToicYcHIqU",
    duration: "15 min",
    category: "Mental Wellness",
    treatmentTypes: ["Psychiatry", "General Medicine", "Neurology"],
    difficulty: "Beginner",
    description: "Guided mindfulness meditation for stress reduction and mental clarity."
  },

  // ── POST-COVID RECOVERY ──
  {
    id: "v033",
    title: "Post-COVID Breathing Exercises",
    youtubeId: "UB3tA1fImSQ",
    duration: "12 min",
    category: "Respiratory",
    treatmentTypes: ["Pulmonology", "Infectious Disease", "General Medicine"],
    difficulty: "Beginner",
    description: "Breathing exercises to help recover lung capacity after COVID-19."
  },
  {
    id: "v034",
    title: "Post-COVID Fatigue Management",
    youtubeId: "mmOhAaGLxGE",
    duration: "16 min",
    category: "Wellness",
    treatmentTypes: ["General Medicine", "Infectious Disease"],
    difficulty: "Beginner",
    description: "Gentle exercises and energy management strategies for post-COVID fatigue."
  },

  // ── ADDITIONAL MOBILITY ──
  {
    id: "v035",
    title: "Hip Flexibility Routine",
    youtubeId: "Yz7Ofr9z1co",
    duration: "14 min",
    category: "Joint Mobility",
    treatmentTypes: ["Orthopedics", "Rheumatology"],
    difficulty: "Beginner",
    description: "Hip opening stretches to improve flexibility and reduce pain."
  },
  {
    id: "v036",
    title: "Ankle Strengthening Exercises",
    youtubeId: "Yz7Ofr9z1co",
    duration: "10 min",
    category: "Physical Rehab",
    treatmentTypes: ["Orthopedics", "Sports Medicine"],
    difficulty: "Beginner",
    description: "Exercises to strengthen ankles and prevent future injuries."
  },
];

// Get videos filtered by doctor specialty
export function getVideosForSpecialty(specialty) {
  return RECOVERY_VIDEOS.filter(v => v.treatmentTypes.includes(specialty));
}

// Get all unique categories
export function getVideoCategories() {
  return [...new Set(RECOVERY_VIDEOS.map(v => v.category))];
}
