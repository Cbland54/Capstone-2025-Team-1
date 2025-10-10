import { Routes, Route, NavLink } from "react-router-dom";
import ShoeSelector from './components/Selector';
import Scheduler from "./components/Scheduler";
import Media from "./components/Media";

const LinkItem = ({ to, children }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      padding: "8px 12px",
      borderRadius: 8,
      textDecoration: "none",
      color: isActive ? "#0b5fff" : "#111",
      background: isActive ? "rgba(11,95,255,0.12)" : "transparent",
      marginRight: 8,
    })}
  >
    {children}
  </NavLink>
);

function Home() {
  return (
    <div>
      <h2>FootWorks Widgets</h2>
      <p>Choose a module from the nav above, or visit:</p>
      <ul>
        <li><a href="/selector">/selector</a> – Online Shoe Selector</li>
        <li><a href="/scheduler">/scheduler</a> – Smart Scheduler</li>
        <li><a href="/media">/media</a> – Educational Media</li>
      </ul>
    </div>
  );
}

function NotFound() {
  return <h2>404 – Page Not Found</h2>;
}

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Capstone 2025 Team 1 – FootWorks Widgets</h1>

      {/* Simple top navigation */}
      <nav style={{ margin: "12px 0" }}>
        <LinkItem to="/">Home</LinkItem>
        <LinkItem to="/selector">Selector</LinkItem>
        <LinkItem to="/scheduler">Scheduler</LinkItem>
        <LinkItem to="/media">Media</LinkItem>
      </nav>

      {/* Route definitions */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/selector" element={<ShoeSelector />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/media" element={<Media />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
