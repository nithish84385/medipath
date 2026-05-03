// Comprehensive synthetic doctor database — 50+ doctors across 18 specialties
// Data is realistic but entirely fictional. Real South Asian hospital names used for authenticity.

export const DOCTORS_DB = [
  // ── CARDIOLOGY ──
  { id: "D001", name: "Dr. Ayesha Malik", specialty: "Cardiology", hospital: "Aga Khan University Hospital", city: "Karachi", rating: 4.9, yearsExperience: 18, patientsServed: 4200, available: true, qualifications: "MBBS, FCPS (Cardiology), FACC", languages: ["English", "Urdu"], consultationFee: 3000, avatar: "AM" },
  { id: "D002", name: "Dr. Rajesh Kapoor", specialty: "Cardiology", hospital: "AIIMS Delhi", city: "New Delhi", rating: 4.8, yearsExperience: 22, patientsServed: 6800, available: true, qualifications: "MBBS, MD (Medicine), DM (Cardiology)", languages: ["English", "Hindi"], consultationFee: 2500, avatar: "RK" },
  { id: "D003", name: "Dr. Fatima Begum", specialty: "Cardiology", hospital: "National Heart Foundation", city: "Dhaka", rating: 4.7, yearsExperience: 14, patientsServed: 3100, available: false, qualifications: "MBBS, MD (Cardiology), MRCP", languages: ["English", "Bengali"], consultationFee: 2000, avatar: "FB" },

  // ── NEUROLOGY ──
  { id: "D004", name: "Dr. Rahul Verma", specialty: "Neurology", hospital: "NIMHANS", city: "Bangalore", rating: 4.9, yearsExperience: 20, patientsServed: 5400, available: true, qualifications: "MBBS, MD (Medicine), DM (Neurology)", languages: ["English", "Hindi", "Kannada"], consultationFee: 2800, avatar: "RV" },
  { id: "D005", name: "Dr. Nasreen Akhtar", specialty: "Neurology", hospital: "CMH Rawalpindi", city: "Rawalpindi", rating: 4.6, yearsExperience: 12, patientsServed: 2200, available: true, qualifications: "MBBS, FCPS (Neurology)", languages: ["English", "Urdu"], consultationFee: 2500, avatar: "NA" },
  { id: "D006", name: "Dr. Arjun Menon", specialty: "Neurology", hospital: "Fortis Hospital", city: "Mumbai", rating: 4.8, yearsExperience: 16, patientsServed: 3900, available: true, qualifications: "MBBS, DNB (Neurology), Fellowship (Epilepsy)", languages: ["English", "Hindi", "Malayalam"], consultationFee: 3000, avatar: "AM" },

  // ── ORTHOPEDICS ──
  { id: "D007", name: "Dr. Imran Khan", specialty: "Orthopedics", hospital: "CMH Lahore", city: "Lahore", rating: 4.8, yearsExperience: 19, patientsServed: 4800, available: true, qualifications: "MBBS, FCPS (Orthopedics), Fellowship (Joint Replacement)", languages: ["English", "Urdu", "Punjabi"], consultationFee: 3500, avatar: "IK" },
  { id: "D008", name: "Dr. Suresh Reddy", specialty: "Orthopedics", hospital: "Apollo Hospitals", city: "Hyderabad", rating: 4.7, yearsExperience: 15, patientsServed: 3600, available: true, qualifications: "MBBS, MS (Orthopedics), MCh", languages: ["English", "Hindi", "Telugu"], consultationFee: 2000, avatar: "SR" },
  { id: "D009", name: "Dr. Kamal Hossain", specialty: "Orthopedics", hospital: "Square Hospital", city: "Dhaka", rating: 4.5, yearsExperience: 11, patientsServed: 1800, available: false, qualifications: "MBBS, MS (Orthopedics)", languages: ["English", "Bengali"], consultationFee: 1500, avatar: "KH" },

  // ── PULMONOLOGY ──
  { id: "D010", name: "Dr. Omar Farooq", specialty: "Pulmonology", hospital: "Shaukat Khanum Hospital", city: "Lahore", rating: 4.9, yearsExperience: 17, patientsServed: 3200, available: true, qualifications: "MBBS, FCPS (Pulmonology), FRCP", languages: ["English", "Urdu"], consultationFee: 3000, avatar: "OF" },
  { id: "D011", name: "Dr. Deepa Krishnan", specialty: "Pulmonology", hospital: "CMC Vellore", city: "Vellore", rating: 4.8, yearsExperience: 21, patientsServed: 5100, available: true, qualifications: "MBBS, MD (Pulmonary Medicine), DTCD", languages: ["English", "Tamil", "Hindi"], consultationFee: 1800, avatar: "DK" },

  // ── GASTROENTEROLOGY ──
  { id: "D012", name: "Dr. Sunita Rao", specialty: "Gastroenterology", hospital: "Fortis Hospital", city: "Delhi", rating: 4.7, yearsExperience: 14, patientsServed: 3400, available: true, qualifications: "MBBS, MD, DM (Gastroenterology)", languages: ["English", "Hindi"], consultationFee: 2500, avatar: "SR" },
  { id: "D013", name: "Dr. Bilal Hussain", specialty: "Gastroenterology", hospital: "Aga Khan University Hospital", city: "Karachi", rating: 4.6, yearsExperience: 13, patientsServed: 2800, available: true, qualifications: "MBBS, FCPS (Gastroenterology)", languages: ["English", "Urdu", "Sindhi"], consultationFee: 2800, avatar: "BH" },
  { id: "D014", name: "Dr. Anjali Deshmukh", specialty: "Gastroenterology", hospital: "KEM Hospital", city: "Mumbai", rating: 4.8, yearsExperience: 18, patientsServed: 4600, available: false, qualifications: "MBBS, MD, DM (Gastroenterology)", languages: ["English", "Hindi", "Marathi"], consultationFee: 2200, avatar: "AD" },

  // ── DERMATOLOGY ──
  { id: "D015", name: "Dr. Zubair Ahmed", specialty: "Dermatology", hospital: "PNS Shifa", city: "Islamabad", rating: 4.5, yearsExperience: 10, patientsServed: 2100, available: true, qualifications: "MBBS, FCPS (Dermatology)", languages: ["English", "Urdu"], consultationFee: 2000, avatar: "ZA" },
  { id: "D016", name: "Dr. Lakshmi Iyer", specialty: "Dermatology", hospital: "Manipal Hospital", city: "Bangalore", rating: 4.7, yearsExperience: 12, patientsServed: 2900, available: true, qualifications: "MBBS, MD (Dermatology), DVD", languages: ["English", "Hindi", "Kannada"], consultationFee: 1800, avatar: "LI" },

  // ── ENT ──
  { id: "D017", name: "Dr. Farid Siddiqui", specialty: "ENT", hospital: "Jinnah Hospital", city: "Lahore", rating: 4.6, yearsExperience: 15, patientsServed: 3200, available: true, qualifications: "MBBS, FCPS (ENT), Fellowship (Cochlear Implant)", languages: ["English", "Urdu"], consultationFee: 2500, avatar: "FS" },
  { id: "D018", name: "Dr. Shalini Gupta", specialty: "ENT", hospital: "Max Super Speciality Hospital", city: "Delhi", rating: 4.8, yearsExperience: 16, patientsServed: 3800, available: true, qualifications: "MBBS, MS (ENT), DNB", languages: ["English", "Hindi"], consultationFee: 2000, avatar: "SG" },

  // ── ENDOCRINOLOGY ──
  { id: "D019", name: "Dr. Meera Nair", specialty: "Endocrinology", hospital: "Amrita Hospital", city: "Kochi", rating: 4.7, yearsExperience: 13, patientsServed: 2400, available: true, qualifications: "MBBS, MD (Medicine), DM (Endocrinology)", languages: ["English", "Malayalam", "Hindi"], consultationFee: 2200, avatar: "MN" },
  { id: "D020", name: "Dr. Tariq Mehmood", specialty: "Endocrinology", hospital: "SKMCH&RC", city: "Lahore", rating: 4.6, yearsExperience: 11, patientsServed: 1900, available: false, qualifications: "MBBS, FCPS (Medicine), FACE", languages: ["English", "Urdu"], consultationFee: 3000, avatar: "TM" },
  { id: "D021", name: "Dr. Nandini Sharma", specialty: "Endocrinology", hospital: "PGI Chandigarh", city: "Chandigarh", rating: 4.9, yearsExperience: 24, patientsServed: 7200, available: true, qualifications: "MBBS, MD, DM (Endocrinology), PhD", languages: ["English", "Hindi", "Punjabi"], consultationFee: 2000, avatar: "NS" },

  // ── INTERNAL MEDICINE ──
  { id: "D022", name: "Dr. Kavitha Nair", specialty: "Internal Medicine", hospital: "KEM Hospital", city: "Mumbai", rating: 4.8, yearsExperience: 20, patientsServed: 8200, available: true, qualifications: "MBBS, MD (Internal Medicine), FICP", languages: ["English", "Hindi", "Marathi"], consultationFee: 1500, avatar: "KN" },
  { id: "D023", name: "Dr. Asad Mahmood", specialty: "Internal Medicine", hospital: "PIMS Islamabad", city: "Islamabad", rating: 4.5, yearsExperience: 16, patientsServed: 5500, available: true, qualifications: "MBBS, FCPS (Medicine)", languages: ["English", "Urdu"], consultationFee: 2000, avatar: "AM" },
  { id: "D024", name: "Dr. Priya Sharma", specialty: "Internal Medicine", hospital: "Apollo Hospital", city: "Chennai", rating: 4.7, yearsExperience: 14, patientsServed: 4100, available: true, qualifications: "MBBS, MD (Internal Medicine), MRCP", languages: ["English", "Hindi", "Tamil"], consultationFee: 1800, avatar: "PS" },

  // ── GENERAL MEDICINE ──
  { id: "D025", name: "Dr. Vikram Singh", specialty: "General Medicine", hospital: "Safdarjung Hospital", city: "New Delhi", rating: 4.6, yearsExperience: 22, patientsServed: 9500, available: true, qualifications: "MBBS, MD (General Medicine)", languages: ["English", "Hindi"], consultationFee: 800, avatar: "VS" },
  { id: "D026", name: "Dr. Samiya Rahim", specialty: "General Medicine", hospital: "Dow University Hospital", city: "Karachi", rating: 4.5, yearsExperience: 10, patientsServed: 3200, available: true, qualifications: "MBBS, FCPS (Medicine)", languages: ["English", "Urdu", "Sindhi"], consultationFee: 1500, avatar: "SR" },
  { id: "D027", name: "Dr. Ravi Kumar", specialty: "General Medicine", hospital: "JIPMER", city: "Puducherry", rating: 4.8, yearsExperience: 18, patientsServed: 6700, available: false, qualifications: "MBBS, MD (General Medicine), DNB", languages: ["English", "Hindi", "Tamil"], consultationFee: 600, avatar: "RK" },

  // ── RHEUMATOLOGY ──
  { id: "D028", name: "Dr. Tariq Hassan", specialty: "Rheumatology", hospital: "Jinnah Hospital", city: "Lahore", rating: 4.6, yearsExperience: 14, patientsServed: 2100, available: true, qualifications: "MBBS, FCPS (Medicine), Fellowship (Rheumatology)", languages: ["English", "Urdu"], consultationFee: 2500, avatar: "TH" },
  { id: "D029", name: "Dr. Anita Ghosh", specialty: "Rheumatology", hospital: "Tata Medical Center", city: "Kolkata", rating: 4.7, yearsExperience: 15, patientsServed: 2800, available: true, qualifications: "MBBS, MD, DM (Rheumatology)", languages: ["English", "Hindi", "Bengali"], consultationFee: 2000, avatar: "AG" },

  // ── GENERAL SURGERY ──
  { id: "D030", name: "Dr. Mohan Das", specialty: "General Surgery", hospital: "CMC Vellore", city: "Vellore", rating: 4.9, yearsExperience: 25, patientsServed: 8900, available: true, qualifications: "MBBS, MS (General Surgery), FRCS", languages: ["English", "Tamil", "Hindi"], consultationFee: 2000, avatar: "MD" },
  { id: "D031", name: "Dr. Saima Yasin", specialty: "General Surgery", hospital: "Services Hospital", city: "Lahore", rating: 4.5, yearsExperience: 12, patientsServed: 2400, available: true, qualifications: "MBBS, FCPS (Surgery)", languages: ["English", "Urdu"], consultationFee: 2500, avatar: "SY" },

  // ── INFECTIOUS DISEASE ──
  { id: "D032", name: "Dr. Navin Khanna", specialty: "Infectious Disease", hospital: "AIIMS Delhi", city: "New Delhi", rating: 4.8, yearsExperience: 19, patientsServed: 4500, available: true, qualifications: "MBBS, MD (Medicine), DM (Infectious Disease)", languages: ["English", "Hindi"], consultationFee: 2000, avatar: "NK" },
  { id: "D033", name: "Dr. Hira Shah", specialty: "Infectious Disease", hospital: "Aga Khan University Hospital", city: "Karachi", rating: 4.6, yearsExperience: 11, patientsServed: 1800, available: true, qualifications: "MBBS, FCPS (Medicine), FIDSA", languages: ["English", "Urdu"], consultationFee: 3000, avatar: "HS" },

  // ── OPHTHALMOLOGY ──
  { id: "D034", name: "Dr. Arun Mathew", specialty: "Ophthalmology", hospital: "Sankara Nethralaya", city: "Chennai", rating: 4.9, yearsExperience: 23, patientsServed: 12000, available: true, qualifications: "MBBS, MS (Ophthalmology), FRCS", languages: ["English", "Tamil", "Hindi"], consultationFee: 1500, avatar: "AM" },
  { id: "D035", name: "Dr. Nazia Perveen", specialty: "Ophthalmology", hospital: "Al-Shifa Eye Hospital", city: "Rawalpindi", rating: 4.7, yearsExperience: 14, patientsServed: 5200, available: true, qualifications: "MBBS, FCPS (Ophthalmology)", languages: ["English", "Urdu"], consultationFee: 2000, avatar: "NP" },

  // ── ALLERGY & IMMUNOLOGY ──
  { id: "D036", name: "Dr. Pooja Mehta", specialty: "Allergy & Immunology", hospital: "Medanta Hospital", city: "Gurugram", rating: 4.6, yearsExperience: 12, patientsServed: 2100, available: true, qualifications: "MBBS, MD (Medicine), Fellowship (Allergy)", languages: ["English", "Hindi"], consultationFee: 2500, avatar: "PM" },

  // ── NEPHROLOGY ──
  { id: "D037", name: "Dr. Faisal Qureshi", specialty: "Nephrology", hospital: "SIUT Karachi", city: "Karachi", rating: 4.9, yearsExperience: 20, patientsServed: 5600, available: true, qualifications: "MBBS, FCPS (Nephrology), FASN", languages: ["English", "Urdu"], consultationFee: 3000, avatar: "FQ" },
  { id: "D038", name: "Dr. Geeta Verma", specialty: "Nephrology", hospital: "PGI Chandigarh", city: "Chandigarh", rating: 4.7, yearsExperience: 16, patientsServed: 3800, available: true, qualifications: "MBBS, MD, DM (Nephrology)", languages: ["English", "Hindi", "Punjabi"], consultationFee: 2200, avatar: "GV" },

  // ── PSYCHIATRY ──
  { id: "D039", name: "Dr. Saira Jabeen", specialty: "Psychiatry", hospital: "Fountain House", city: "Lahore", rating: 4.5, yearsExperience: 13, patientsServed: 2400, available: true, qualifications: "MBBS, FCPS (Psychiatry)", languages: ["English", "Urdu", "Punjabi"], consultationFee: 3000, avatar: "SJ" },
  { id: "D040", name: "Dr. Amit Roy", specialty: "Psychiatry", hospital: "NIMHANS", city: "Bangalore", rating: 4.9, yearsExperience: 22, patientsServed: 6200, available: true, qualifications: "MBBS, MD (Psychiatry), MRCPsych", languages: ["English", "Hindi", "Bengali"], consultationFee: 2500, avatar: "AR" },

  // ── ONCOLOGY ──
  { id: "D041", name: "Dr. Pallavi Joshi", specialty: "Oncology", hospital: "Tata Memorial Hospital", city: "Mumbai", rating: 4.9, yearsExperience: 18, patientsServed: 4200, available: true, qualifications: "MBBS, MD, DM (Medical Oncology)", languages: ["English", "Hindi", "Marathi"], consultationFee: 3000, avatar: "PJ" },
  { id: "D042", name: "Dr. Usman Ali", specialty: "Oncology", hospital: "Shaukat Khanum Hospital", city: "Lahore", rating: 4.8, yearsExperience: 16, patientsServed: 3500, available: true, qualifications: "MBBS, FCPS (Oncology), Fellowship (UK)", languages: ["English", "Urdu"], consultationFee: 4000, avatar: "UA" },

  // ── PEDIATRICS ──
  { id: "D043", name: "Dr. Sneha Chatterjee", specialty: "Pediatrics", hospital: "Apollo Gleneagles", city: "Kolkata", rating: 4.8, yearsExperience: 14, patientsServed: 5800, available: true, qualifications: "MBBS, MD (Pediatrics), IAP Fellow", languages: ["English", "Hindi", "Bengali"], consultationFee: 1200, avatar: "SC" },
  { id: "D044", name: "Dr. Muhammad Hamza", specialty: "Pediatrics", hospital: "Children Hospital", city: "Lahore", rating: 4.7, yearsExperience: 11, patientsServed: 4200, available: true, qualifications: "MBBS, FCPS (Pediatrics)", languages: ["English", "Urdu", "Punjabi"], consultationFee: 1500, avatar: "MH" },

  // ── GYNECOLOGY ──
  { id: "D045", name: "Dr. Rekha Sharma", specialty: "Gynecology", hospital: "Max Hospital", city: "Delhi", rating: 4.8, yearsExperience: 20, patientsServed: 7600, available: true, qualifications: "MBBS, MS (Obstetrics & Gynecology), FRCOG", languages: ["English", "Hindi"], consultationFee: 2000, avatar: "RS" },
  { id: "D046", name: "Dr. Sadia Khan", specialty: "Gynecology", hospital: "Lady Reading Hospital", city: "Peshawar", rating: 4.6, yearsExperience: 14, patientsServed: 4100, available: true, qualifications: "MBBS, FCPS (Gynecology)", languages: ["English", "Urdu", "Pashto"], consultationFee: 2000, avatar: "SK" },

  // ── ADDITIONAL DOCTORS FOR DEPTH ──
  { id: "D047", name: "Dr. Venkat Raman", specialty: "Cardiology", hospital: "Narayana Hrudayalaya", city: "Bangalore", rating: 4.8, yearsExperience: 19, patientsServed: 5800, available: true, qualifications: "MBBS, MD, DM (Cardiology)", languages: ["English", "Kannada", "Hindi"], consultationFee: 2500, avatar: "VR" },
  { id: "D048", name: "Dr. Shabana Mir", specialty: "Pulmonology", hospital: "Indus Hospital", city: "Karachi", rating: 4.5, yearsExperience: 9, patientsServed: 1400, available: true, qualifications: "MBBS, FCPS (Pulmonology)", languages: ["English", "Urdu"], consultationFee: 2000, avatar: "SM" },
  { id: "D049", name: "Dr. Harish Patel", specialty: "Gastroenterology", hospital: "Sterling Hospital", city: "Ahmedabad", rating: 4.6, yearsExperience: 13, patientsServed: 2600, available: true, qualifications: "MBBS, MD, DM (Gastroenterology)", languages: ["English", "Hindi", "Gujarati"], consultationFee: 1800, avatar: "HP" },
  { id: "D050", name: "Dr. Uzma Latif", specialty: "Dermatology", hospital: "Bahria International Hospital", city: "Lahore", rating: 4.4, yearsExperience: 8, patientsServed: 1200, available: true, qualifications: "MBBS, FCPS (Dermatology)", languages: ["English", "Urdu"], consultationFee: 2000, avatar: "UL" },
  { id: "D051", name: "Dr. Sanjay Gupta", specialty: "Orthopedics", hospital: "Medanta Hospital", city: "Gurugram", rating: 4.9, yearsExperience: 26, patientsServed: 9200, available: true, qualifications: "MBBS, MS (Orthopedics), Fellowship (Spine Surgery)", languages: ["English", "Hindi"], consultationFee: 3000, avatar: "SG" },
  { id: "D052", name: "Dr. Rohan Desai", specialty: "Neurology", hospital: "Kokilaben Hospital", city: "Mumbai", rating: 4.7, yearsExperience: 15, patientsServed: 3200, available: false, qualifications: "MBBS, MD, DM (Neurology)", languages: ["English", "Hindi", "Marathi"], consultationFee: 2800, avatar: "RD" },
  { id: "D053", name: "Dr. Amna Bukhari", specialty: "Internal Medicine", hospital: "Mayo Hospital", city: "Lahore", rating: 4.6, yearsExperience: 17, patientsServed: 6100, available: true, qualifications: "MBBS, FCPS (Medicine), MRCP", languages: ["English", "Urdu", "Punjabi"], consultationFee: 1500, avatar: "AB" },
];
