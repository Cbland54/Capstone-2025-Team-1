
# Capstone 2025 Team 1 – FootWorks

## 📖 About the Project
This project is part of our **SWE Capstone course at Kennesaw State University**.  
We are building **digital engagement tools** to help **FootWorks Miami**, a family-owned specialty running store, modernize its online presence and improve in-store customer conversions.  

Our React app is designed as **standalone widgets** that can be integrated into the store’s website or run independently for demonstrations.

### 🎯 Goals
- Provide customers with interactive **online tools** that preview the benefits of an in-store visit.
- Encourage **appointment scheduling** with staff, using pre-filled information from the Shoe Selector.
- Deliver **educational content** to build trust and highlight FootWorks’ unique expertise.
- Ensure everything works smoothly on **mobile devices**.

---

## ⚙️ Modules Overview

### 1. Online Shoe Selector
- Guides customers through quick questions: shoe size, terrain, running goals, feel preference, injury history, etc.
- Produces **suggested shoe categories** (e.g., Stability, Trail, Cushioned).
- Outputs structured data that can be passed to the Scheduler for appointment pre-filling.

### 2. Smart Scheduler
- Lets customers book an in-store fitting appointment.
- Uses **results from the Shoe Selector** to pre-fill staff briefing notes (size, categories, training goals).
- Provides confirmed appointment details (date, time, notes).
- Future-ready: can integrate with Google Calendar, Outlook, or FootWorks’ POS system.

### 3. Educational Media
- Embeds short **videos and guides** directly on the site.
- Recommendations tailored to customer input (e.g., trail running safety, pronation education, marathon prep).
- Builds customer trust and reinforces the value of visiting FootWorks in person.

---

## 🚀 Getting Started

### 1. Prerequisites
- Install [Node.js](https://nodejs.org) (v18+ recommended, v22 LTS works fine).
- npm (comes bundled with Node).

Check versions:
```bash
node -v
npm -v
```

### 2. Clone the Repository
```bash
git clone https://github.com/Cbland54/Capstone-2025-Team-1.git
cd Capstone-2025-Team-1
```
### 3. Install Dependencies
```bash
npm install
```
### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser

---

## Project Structure
```bash
src/
  components/
    Selector.jsx    # Online Shoe Selector component
    Scheduler.jsx   # Smart Scheduler component
    Media.jsx       # Educational Media component
  App.jsx           # Main app entry – imports the components
  main.jsx          # React DOM render
```

## 🛠 Planned Enhancements
- Add **TailwindCSS** for styling.
- Replace **mock API functions** with real **WordPress REST API** endpoints.
- Bundle widgets for **WordPress shortcode integration**.
- Connect Scheduler to actual **staff calendars**.
- Expand media library with more **educational content**.

---

## 👥 Team Members
- Connor Bland  
- Megan Dollar  
- Joo Kang  
- Steve Lane  
- Heidi Wilder  


