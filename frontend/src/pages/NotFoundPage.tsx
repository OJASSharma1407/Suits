import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
      >
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
        404
      </h1>
      <h2 className="text-xl font-medium mb-3" style={{ color: "var(--text-primary)" }}>
        Page Not Found
      </h2>
      <p className="text-sm max-w-md mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        The page you are looking for doesn't exist or has been moved. Check the URL or return to your dashboard.
      </p>
      <Link to="/dashboard" className="btn-primary px-3 py-1.5 rounded-lg hover:transition-all duration-200 ease-in-out cursor-pointer">
        <Home size={16} /> Return Home
      </Link>
    </div>
  );
}
