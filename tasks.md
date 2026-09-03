# Minha Vez — Tasks

> Task board for the Minha Vez ecosystem: patient app, manager (doctor/admin/front-desk/exams), backend and documentation.

---

## 📋 Backlog

- Polish the manager UI (doctor and admin) and the app too.
- Refactor the APP, especially the React Query request handling — _in progress_.
- Refactor the receptionist panel.
- Set up Papertrail error alerts to be emailed to me.

---

## 🔢 Versioning (semver)

| Type      | Format  | When to use                                                                                    | Command                              |
| --------- | ------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| **patch** | `1.0.x` | Bug fixes, small tweaks, no visible behavior change. This is what the builds do automatically. | —                                    |
| **minor** | `1.x.0` | New feature that doesn't break anything existing.                                              | `node scripts/bump-version.js minor` |
| **major** | `x.0.0` | Big/breaking change, redesign, or an important product milestone.                              | `node scripts/bump-version.js major` |

---

## 🗺️ Roadmap — Call Panel and Queue Update System

_Within the TCC scope._

### Goal

Build a new, independent system, developed in a **new repository**, responsible for displaying real-time updates of the service queue and calls made in the application.

The system will work as a **call panel**, letting people physically present at the location easily see when they're called and know which room to go to.

This panel must serve both users who booked or joined the queue in person through the front desk, and users who went through the app and are already waiting on site.

### Main features

The system must display information about calls happening in real time.

#### Current call

The panel must visually highlight the attendance currently being called, containing information such as:

- User code/ticket called;
- Room the user should go to;
- Time of the call;
- Other relevant information that may be defined later.

Example:

> **Code: A123**
> Go to **Room 05**

### Call history

Besides the current call, the system must keep a list of the most recent codes called.

Each history item should show, initially:

- Code called;
- Time it was called;
- Destination room.

This history lets users who didn't see or hear the call at the time easily check whether their code has already been called.

### Audio system

The panel must have a voice-call system.

Whenever a new code is called, the system must play an audio message stating:

- The user's code;
- The room they should go to.

Call example:

> "Attention. Code A123, please go to Room 05."

#### Audio rules

The system must follow some important rules:

1. Each code called must be announced **3 times**;
2. Calls must happen sequentially;
3. If a new code is called while another announcement is still playing, the audios **must not play simultaneously**;
4. The system must have an audio playback queue;
5. A new announcement must wait for the previous one to finish before starting;
6. There may be a small configurable delay between repeats and between different calls;
7. Call order must be preserved so announcements don't play out of sequence.

Example:

- Code A123 called;
- System adds the announcement to the audio queue;
- Voice announces the code and the room;
- Message repeats 3 times;
- Once fully finished, the next code in the queue can be announced.

### Real-time update

The system must receive call updates in real time.

When a new call happens in the main system:

1. The new code must appear immediately on the panel;
2. The call must be highlighted as the current call;
3. The record must be added to the history;
4. The voice announcement must be added to the audio queue;
5. If other announcements are in progress, it must wait its turn.

It will be necessary to study the best strategy for real-time communication between the main system and the new panel.

Possible approaches to evaluate:

- WebSockets;
- Server-Sent Events (SSE);
- Event/messaging system;
- Polling as a less recommended alternative.

### Architecture

The project must be developed as a separate system, in a **new repository**, staying independent from the main project.

Needs to be defined:

- How the system will receive new-call events;
- How authentication/communication between systems will work, if needed;
- Which technology will be used for real-time communication;
- How the call queue state will be managed;
- How the audio playback queue will be implemented;
- How to avoid duplicate calls;
- How to handle reconnections if the panel loses connection;
- How to recover the current queue state after a reconnection.

### Points to study before implementation

Before starting development, do a technical study to define the best architecture for the solution, mainly about:

#### Real-time communication

Evaluate which technology best fits the scenario of instant panel updates.

#### Audio queue

Define a reliable strategy to guarantee that:

- Two audios are never played simultaneously;
- Call order is respected;
- Each call is repeated exactly 3 times;
- New calls are queued if an announcement is in progress.

#### Text-to-Speech (TTS)

Evaluate how the voice playback will work:

- Native browser API;
- External Text-to-Speech service;
- Pre-recorded audio files;
- Another solution offering better quality and reliability.

#### Synchronization

Define how the panel will recover information if:

- The page is reloaded;
- The connection is lost;
- The browser is closed and reopened;
- The panel goes temporarily offline.

### Possible future features

Items that could be added later:

- Average wait time display;
- Number of people waiting;
- Visual highlight and animations for new calls;
- Different attendance types/priorities;
- Configurable number of call repeats;
- Configurable interval between announcements;
- Fullscreen mode for use on TVs;
- Support for multiple simultaneous panels;
- Filter by department or unit;
- Additional visual indicators;
- Alert sounds before the call;
- Expanded call history;
- Admin panel to configure the system.

### Expected outcome

In the end, we'll have an independent **Call Panel** system, able to receive the main system's call events in real time, visually display the code called and the destination room, keep a history of the latest calls, and play voice announcements in an organized way.

The system must guarantee that audio announcements never overlap, using a sequential playback queue, where each code is announced 3 times before the next call starts.

The implementation must prioritize **real-time behavior, reliability, cross-system synchronization, and a good visual/audio experience for people on site**.

---

## 🚫 Out of scope

- Build a gamification system — there are several examples out there, think about the best fit for the app (references: Quero Delivery, Duolingo).
- Study and implement in-app payments (today payment only happens at the clinic). Note: this feature will only apply to private health units — public units (UBS) stay free.

---

## ✅ Completed (131)

### 🏗️ Project Foundations & Initial Setup

_Solo work from Feb–Aug 2026, before starting to pair on commits — never logged as tasks at the time, mapped retroactively from the commit history._

#### Backend

1. Set up the initial backend project (NestJS/Node), core dependencies (bcrypt, Jest) and TypeScript configuration.
2. Design the initial data model (DER) and base user settings.
3. Standardize the API contract/OpenAPI pattern across the core entities (health unit, patient, health professional, queue, queue item, notification, appointment).
4. Build the full Health Unit CRUD (entity, model, schema, repository, service, controller and factories).
5. Build the full Patient CRUD, including lookup by user ID.
6. Build the full Health Professional CRUD.
7. Build the full Queue CRUD, enforcing that a professional can only have one open queue at a time.
8. Build the full Queue Item CRUD, including the patient priority enum.
9. Implement authentication: login, token issuance, JWT refresh flow and auth middleware.
10. Build the full Notification and Appointment CRUDs (API, service, repository, schema).
11. Implement the core queue lifecycle: open/close a queue, track the current item and call the next patient in line.
12. Implement scheduling in minute-based slots tied to the health unit's operating hours, and add the logic to finish an appointment.
13. Add health-unit image upload via Cloudinary.
14. Support multiple queues per health professional across shifts (morning/afternoon).
15. Build the aggregated "queue management" endpoint that powers the manager dashboard.
16. Implement the initial notification system and WebSocket setup.

#### Patient App

17. Set up the initial Expo/React Native project and folder structure.
18. Build the login and signup screens with React Hook Form + Zod validation.
19. Wire up React Query + Axios and integrate real JWT authentication (login and user creation).
20. Build the home screen (carousel, search bar and quick services section).
21. List health units from the API, with a placeholder image when a unit has none.
22. Build the dynamic health unit details page.
23. Build the appointment scheduling flow (calendar screen and create-appointment request).
24. Build the Explore screen for browsing health units and professionals.
25. Build the initial profile screen with avatar initials, and show the patient's queue position, unit and professional's room.
26. Implement the initial notification system in the app.

#### Manager

27. Set up the initial manager project and environment configuration.
28. Implement authentication (login screen and API call), and keep the session alive on refresh (no logout on F5).
29. Build the base panel layout: sidebar, navigation and global profile component.
30. Build the Health Unit CRUD screens (list, card, create/edit modal with form validation).
31. Build the Health Professional CRUD screens (list, card, create/edit modal with form validation).
32. Build the queue management module: entities, query and consumption of the aggregated endpoint.
33. Implement the current-queue-item component and the "open queue / call patient" logic, restricted to the first patient in line.
34. Build the waiting-queue card with cache invalidation, and show the health unit's operating hours.

#### Docs site

35. Set up the initial docs site and point it to the Vercel deployment.

### 🔄 Queue, Scheduling & Notifications

36. Add paired queue codes, e.g. AP001 -> priority attendance, AN001 -> regular attendance; the numbers can reset at the end of the day and be reused the next day.
37. Figure out how to compute the wait time on the backend and frontend.
38. Create a notification system for **minha-vez-app**.
39. Fix the WebSocket and notification bug.
40. Improve the queue system to merge regular and priority patients into a single interleaved queue (regular, priority, regular, priority, etc.).
41. Add a backend rule so patients can only cancel an appointment until noon of the day before.
42. Add logic to ensure appointments can only be scheduled during the health unit's operating hours, not just based on the doctor's availability.
43. Add a backend rule preventing the same user from booking more than one appointment on the same day.
44. Fix notifications being sent at the wrong time (e.g. booked an appointment for tomorrow, correctly got "your appointment is tomorrow" but also incorrectly got "your appointment is today").
45. Only send queue-position notifications while the queue is open and the doctor is calling patients, i.e. drive it via WebSocket.
46. If a queue gets closed due to the doctor cancelling, before the appointment day, let the patient rebook with another doctor on that same day.
47. Let the patient join the queue even while it's already open, as long as there's still an available slot; stop auto-closing the queue when the last patient is served (now it only closes via the doctor's button), and auto-close it at 12pm and 10pm if the doctor hasn't closed it already.
48. Block a patient from booking two exams less than 2h apart, warning them visually in the app when a new booking falls within that window.

### 📱 Patient App

49. Add a doctor/clinic rating system and show a little card with the star rating (1 to 5).
50. Add a cancel button (red, at the bottom) to the queue-info screen that opens a confirmation modal, with a confirm button and an X to close the modal if the patient decides not to cancel.
51. Make the exam's "finished" status disappear from the user's screen as soon as the exam is completed.
52. Add a "see all" screen for the services offered.
53. Add a screen for a booked exam that also shows the prep instructions for that exam, since it currently only shows basic info like price, date and location.
54. Add a new "My appointments" card/button under quick services that opens a screen listing all of the user's booked appointments, and tapping one opens that appointment's queue screen.
55. Add a "see all" view under the Quick Services title that opens a screen listing every quick service using the same card layout as the home screen (4 per row), each redirecting to its respective screen.
56. Add pagination (default page size of 10) to every list that can have many cards: clinics, exams, appointment history, etc.
57. Add specialist photos inside the circular avatar on the Explore screen's specialist cards.
58. Allow the small card under the home search bar to wrap onto a new line when the message is too long, but only when the text actually overflows the card.
59. Check whether the wait-time/people-in-queue info shown on clinic cards in Explore was mocked, and if so, always show the real, live count of people in the currently open queue (or hide it if there's no open queue).
60. Add a tappable "your next appointment/exam" component on the home screen that navigates to that appointment or exam's info screen.
61. Always show the next upcoming exam/appointment in the reminder card.
62. Show the clinic's image on the queue-item card.
63. Add a new component that conditionally shows (whenever the user has a booked appointment/exam) the list of the user's booked appointments and exams.
64. Add a yellow card that appears 1 day before an appointment/exam saying "your appointment/exam is tomorrow" in the new upcoming appointments/exams section (by default no card shows until this rule is met).
65. Make the card turn red with a countdown when there's 1h left before the appointment/exam, and have it disappear (along with its info) once the time passes, leaving only the card in the upcoming appointments/exams list.
66. Fix the frontend (minha-vez-manager) logic so that when a doctor finishes seeing patients or closes the queue without seeing anyone, it automatically disappears from the user's home screen in both places it's shown.
67. Show the patient a modal with the reason the doctor typed as soon as the queue is closed (or upon login/opening the app, if they weren't online at the time), with a button to dismiss it, and auto-remove the queue from the user's screen.
68. Fix the home screen's "active queues" section, which was showing several queues — some duplicated, some already closed, some in the future — when it should only show currently happening or upcoming queues (disappearing once the user has been served); also fix the queue card always showing the info from a single queue (usually the first one booked) instead of each queue's own data.
69. Add a home-screen reminder telling the user to fill in their health info (blood type, etc.) if they haven't yet, flagging it as important.
70. In the booked appointments/exams section, show all of the user's bookings when there's more than one, since that's currently the job of the "your next appointment/exam" section — this section should show everything booked, not just the next one.
71. Fix the not-found page redirect and add a proper error page.
72. Add a "My Prescriptions" screen in the app (new card under Quick Services) listing the prescriptions doctors have issued, with a card showing the date, the doctor's name and the health unit's name, plus a detail screen with everything the doctor entered in the manager.
73. Add a button on the prescription card that jumps straight into the exam-booking screen with the prescribed exam already pre-selected, so the patient just needs to pick a time.
74. In "My Prescriptions", when booking an exam, list every clinic that offers it (not just the prescribing doctor's clinic) and let the patient choose, since sometimes that clinic doesn't offer exams — only appointments.
75. After booking an exam or appointment, redirect straight to that booking's info screen, and make the back button on that screen return to the home screen.
76. Limit the "next appointment/exam" list (and similar ones) on the home screen to 5 items, with a "see all" screen for the full list when there are more.

### 🖥️ Manager — Doctor, Admin, Front Desk & Exams

77. Whenever the doctor opens the dashboard, they see all of their queues, but all of them are closed by default; the doctor can only open **one queue at a time**, based on the queue's scheduled date.
78. Change the room input to accept just a number (e.g. 10, 40), instead of free text, capped at 9999.
79. Build a new manager panel for the EXAMPROFESSIONAL role, with a tab listing patients who have a booked exam; they mark the exam as started when the patient arrives and as completed once it's done, plus history and profile screens; this flow doesn't use a queue — each patient just shows up at their booked time.
80. In the EXAMPROFESSIONAL manager panel, add a feature so that once a patient's exam result is ready, the professional opens a modal to attach the exam PDF and the patient's CPF; confirming it emails the admin(s), who then forward it to the doctor and the patient as is done today — a whole new screen for this.
81. Let the admin mark a health unit as public or private at registration time, since the current flow doesn't distinguish them, which would otherwise complicate the future gamification rollout.
82. Minha-vez-manager - add dark, light and browser-default theme support.
83. Minha-vez-manager - add clearer, more visual error messages to help users understand what went wrong.
84. Minha-vez-manager - add a modal that opens when clicking an exam on the Available Exams screen to view its details.
85. Add a modal for the doctor to type a reason when closing a queue without seeing anyone, sending it in real time over WebSocket.
86. Add WebSocket support in the manager so a queue appears automatically for the doctor as soon as a patient books an appointment, with no need to refresh (F5).
87. Let the doctor schedule a patient's follow-up visit up to a maximum of 20 days after the appointment date.
88. Change the order queues are shown in the manager panel — instead of showing the most recently booked one, sort by date (e.g. 27, 28, 29, 30), and by shift when two fall on the same day (29 morning, 29 afternoon, 30, 31, 32).
89. Fix the manager's not-found page redirect so it always sends the logged-in user back to their home screen based on their role.
90. Add a front-desk/reception role and panel for clinic or UBS staff to book appointments and exams for patients who didn't use the app, with screens to book an appointment, book an exam and view their profile, joining the same queue and order as app bookings.
91. Add CPF-based patient lookup in the reception panel for booking, and — if the patient doesn't exist yet — a registration flow (email, password and the same data the app requires) so they can later log into the app with the credentials the front desk hands them.
92. Add the doctor's prescription for the patient they're currently seeing, where they can add exams, etc.
93. Require the doctor to register a prescription before an attendance can be marked as finished — i.e. an attendance can only be completed once a prescription has been recorded.
94. Minha-vez-manager - let the doctor cancel a queue that's still pending, before it's opened.

### 👤 Profile, Account & Priority

95. Add logic to show the user's password as they type via an eye icon they can tap.
96. Add backend and frontend logic to let the user upload a profile picture.
97. Show the user's profile picture -> header.tsx and profile-content.tsx.
98. Add a button to edit/upload the profile picture in the app - profile-content.tsx.
99. Automatically mark a patient as priority at registration when their age is over 60 (previously every registration defaulted to regular).
100.  Add a new dropdown at registration, based on the backend enum, for the patient to select whether they have a condition that grants priority attendance.
101.  In the priority dropdown, when a chronic-condition-type option is selected, show a small yellow message below it recommending they bring proof on the day or attach it in their profile — worded in the most recommended style.
102.  Add a new profile screen for the patient to attach a PDF or image proving the condition that grants priority, including optional fields like blood type and other health info.
103.  Update the yellow message in the patient registration modal to also mention uploading proof in their profile.
104.  Let the patient edit their priority status from their profile, since they currently can't, and a health issue that grants priority could arise later in life.
105.  Add a new "more settings" screen consolidating all the profile settings, since profile currently has many navigation buttons; leave the profile screen with just the photo/name, personal info, health info (new card matching the Figma design), notifications, and log out.
106.  Shrink the font size of the "not informed" blood-type label.
107.  Show the current app version and a copyright message ("made by Gabriel Santana Santos") at the bottom of the profile screen, after the last component.
108.  Add logic so that when a user taps their profile picture in the header (including on the home screen), they're taken to their profile.
109.  Add logic so that tapping the profile picture on the profile screen zooms it, similar to WhatsApp, so the user can view it properly.

### 🎨 UX, Theme & Errors

110. Add a **Loading Skeleton** shown while `isLoading` is `true`, using `react-native-skeleton-placeholder` — **minha-vez-app**.
111. Darken the input placeholder colors for better visibility.
112. Add visual error messages for user input mistakes, e.g. invalid date, invalid CPF, etc.
113. Translate every English error message and text to Portuguese.
114. Implement dark theme based on the OS setting.
115. Let the user override the OS theme — e.g. their OS is in light mode but they want the app in dark mode, so they tap a button in profile to switch it.
116. Change the birth date display to DD/MM/YYYY, the Brazilian standard.
117. `Add a vars.scss file at the root of the frontend project with all colors defined separately, following the pattern: $primary, etc.`
118. Fix the keyboard covering the inputs.
119. Improve the not-found page with the app logo and a friendly message, and create a matching error page with a non-alarming message so it doesn't upset the user.
120. Add a "How to use the app" button in the app and "How to use the Manager" in the manager (content varies by role in the manager) linking straight to the tutorial/user guide.

### ⚙️ Infrastructure, Tooling & Docs

121. Define a utility to pick an icon based on the health unit's service type.
122. Set up Papertrail.
123. Implement an automatic versioning system (e.g. 1.1.1) that bumps a version on every build.
124. Write a script to seed MongoDB with several health units and professionals linked to them, to test pagination.
125. Set up Papertrail in the manager panel and route errors into the Papertrail logs.
126. Create a nice README for each repo (app and manager), with images.
127. Create a user guide for the app and manager, basically a tutorial.
128. Set up CI/CD for the project.
129. Add a Dockerfile.dev to the backend, app and manager to spin up the local dev environment via containers.
130. Redesign the docs site using Tailwind, applying the app's visual identity (logo, favicon and color palette), and set up CI/CD for the docs repo.
131. Swap the Tutorial's `{/* IMG: ... */}` placeholders for real screenshots of the app and manager (admin, doctor/exam, front desk), organized under `static/img/`.
132. Check whether Papertrail is configured in the PROD environment.
