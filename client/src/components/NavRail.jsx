import { NavLink } from "react-router-dom";

const base =
  "w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-200 relative overflow-hidden";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5L12 5l8 6.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  );
}

function IconSeed() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" />
      <path d="M12 10c-3-4-7-3-8-1 1 4 5 6 8 3" />
      <path d="M12 10c3-4 7-3 8-1-1 4-5 6-8 3" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

function NavButton({ to, title, children }) {
  const linkClass = ({ isActive }) =>
    `${base} ${isActive ? "bg-[#1f2a1d] border-[#52B788] text-[#52B788] shadow-[0_0_0_1px_rgba(82,183,136,0.15),0_6px_16px_rgba(0,0,0,0.2)]" : "bg-[#161B22] border-[#21262d] text-[#F0EDE4] hover:-translate-y-0.5 hover:border-[#52B788]"}`;

  return (
    <NavLink to={to} end={to === "/"} className={linkClass} title={title}>
      {({ isActive }) => (
        <>
          {children}
          {isActive ? <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-[#52B788] opacity-80" /> : null}
        </>
      )}
    </NavLink>
  );
}

export default function NavRail() {
  const linkClass = ({ isActive }) =>
    `${base} ${isActive ? "bg-[#1f2a1d] border-[#52B788] text-[#52B788] shadow-[0_0_0_1px_rgba(82,183,136,0.15),0_6px_16px_rgba(0,0,0,0.2)]" : "bg-[#161B22] border-[#21262d] text-[#F0EDE4] hover:-translate-y-0.5 hover:border-[#52B788]"}`;

  return (
    <>
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-16 z-20 flex-col items-center py-4 gap-3 rounded-2xl bg-[#0D1117]/80 border border-[#21262d] backdrop-blur-sm animate-riseIn">
        <NavLink to="/" end className={linkClass} title="My Forest">
          {({ isActive }) => (
            <>
              <IconHome />
              {isActive ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#52B788] animate-pulse" /> : null}
            </>
          )}
        </NavLink>
        <NavLink to="/new" className={linkClass} title="Plant a new seed">
          {({ isActive }) => (
            <>
              <IconSeed />
              {isActive ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#52B788] animate-pulse" /> : null}
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className={linkClass} title="Profile">
          {({ isActive }) => (
            <>
              <IconProfile />
              {isActive ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#52B788] animate-pulse" /> : null}
            </>
          )}
        </NavLink>
      </aside>

      <nav className="md:hidden fixed left-4 right-4 bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-[#21262d] bg-[#0D1117]/90 px-3 py-3 backdrop-blur-sm animate-riseIn">
        <NavButton to="/" title="My Forest">
          <IconHome />
        </NavButton>
        <NavButton to="/new" title="Plant a new seed">
          <IconSeed />
        </NavButton>
        <NavButton to="/profile" title="Profile">
          <IconProfile />
        </NavButton>
      </nav>
    </>
  );
}
