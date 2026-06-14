export default function Logo({ className = "" }) {
  return (
    <span
      className={`${className} animate-fadeIn`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        style={{
          width: 62,
          height: 62,
          objectFit: "contain",
          display: "block",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.08))",
          marginRight: -10,
        }}
      />
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 25,
          color: "#1a1a1a",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.055em",
        }}
      >
        ggdrasil
      </span>
    </span>
  );
}
