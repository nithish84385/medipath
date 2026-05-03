# MediPath

MediPath is a role-based healthcare web application built with React and Vite for patients, doctors, and administrators. It combines symptom-driven doctor discovery, live queue handling, prescription workflows, medication tracking, recovery guidance, and emergency support in one streamlined interface.

## Overview

The app is designed as a connected care journey:

- Patients select symptoms and get matched to suitable doctors.
- Admins manage incoming queue requests and assign appointment slots.
- Doctors create prescriptions, set medicine timings, and attach recovery guidance.
- Patients then follow medication schedules, receive reminder support, and continue into recovery plans.

## Core Features

### Patient experience

- **AI-Powered Matchmaker:** Smart symptom analysis and doctor recommendations using Gemini AI.
- Symptom-based doctor matching using an advanced algorithmic model.
- Category-based symptom picker with support for custom symptom input.
- Ranked doctor recommendations with match score, fee, availability, rating, city, and experience.
- Real-time queue status tracking after joining a doctor's queue.
- Medication dashboard with active prescription syncing from Firestore.
- Dose-by-dose medicine tracking with daily compliance progress.
- Browser notification reminders for scheduled medicine times.
- **AI Home Care:** Auto-generated personalized diets, exercises, and natural remedies based on patient symptoms.
- Recovery section with diet guidance, exercise checklist, and video-based rehab content.
- Built-in SOS flow with emergency helpline references.

### Doctor experience

- Role-based doctor login and onboarding
- Prescription creation with patient details, diagnosis, symptoms, dosage, and course duration
- Medication timing setup for reminder-driven treatment plans
- Recovery and diet plan authoring for post-treatment care
- Video recommendation selection for patient recovery support
- Prototype chat panel for patient follow-up style interactions

### Admin experience

- Live queue monitoring from Firestore
- Appointment slot assignment for waiting patients
- Recently scheduled appointments view
- Doctor workload panel showing active waiting counts
- Demo prescription generation to unlock downstream patient flow during testing

## Product Flow

### Patient journey

1. Sign in as a patient.
2. Select symptoms and run doctor matching.
3. Choose a recommended doctor and join the queue.
4. Wait for admin scheduling and view the assigned appointment slot.
5. Open the medications dashboard once treatment is active.
6. Mark doses as taken and complete the prescribed course.
7. Unlock the recovery plan with diet, exercises, and videos.

### Doctor journey

1. Sign in as a doctor.
2. Create a prescription for a patient.
3. Add medication timings.
4. Submit diet, exercise, and recovery guidance.

### Admin journey

1. Sign in as an admin.
2. Review waiting queue entries.
3. Assign an appointment slot.
4. Monitor recent scheduling activity and doctor load.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- Firebase Authentication
- Cloud Firestore
- Google Generative AI (Gemini API)
- Tailwind CSS 4
- Lucide React

## Data and App Logic

- Uses a seeded synthetic doctor database spanning multiple specialties
- Includes structured symptom-to-specialty mappings for doctor recommendations
- Supports role-based routing for `patient`, `doctor`, and `admin`
- Uses live Firestore listeners for queue updates and active prescriptions
- Tracks in-progress treatment state with a mix of Firestore and local storage

## Project Structure

```text
src/
  components/     Shared UI like navbar, SOS, progress, and chat
  data/           Seeded doctors, symptoms, diets, and recovery videos
  lib/            Firebase setup
  pages/
    admin/        Admin queue dashboard
    doctor/       Prescription, timing, and diet-plan flows
    patient/      Matching, queue, medication, and recovery flows
  utils/          Bayesian-style doctor matching logic
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/pb3363-art/medipath.git
cd medipath
npm install
npm run dev
```

The Vite dev server will start locally and the app will be available in the browser.

## Environment Variables

The repository includes an example environment file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Copy `.env.example` to `.env` when wiring your own Firebase project.

Note: the current codebase also contains Firebase configuration in [`src/lib/firebase.js`](/d:/medipath/src/lib/firebase.js), so you may want to move that fully to environment-based config if you are preparing the app for production.

## Available Scripts

- `npm run dev` - start the local development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint

## Deployment

Deployment configuration is already included for:

- Vercel
- Netlify

See [`DEPLOYMENT.md`](/d:/medipath/DEPLOYMENT.md) for deployment steps and hosting notes.

## Documentation

- [`ROADMAP.md`](/d:/medipath/ROADMAP.md) for planned product direction
- [`TIMELINE.md`](/d:/medipath/TIMELINE.md) for milestone history
- [`DEPLOYMENT.md`](/d:/medipath/DEPLOYMENT.md) for deployment setup

## Current Status

MediPath is currently a frontend-heavy prototype with live Firebase-backed workflows for authentication, queue handling, prescriptions, and medication tracking. It already demonstrates the complete multi-role app journey and is a strong base for production hardening, backend expansion, and deeper clinical integrations.

