import { useState } from "react";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { SettingsProvider } from "@/contexts/SettingsContext";
import SettingsPanel from "@/components/SettingsPanel";

function AppInner() {
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  return (
    <>
      {!activeProfile
        ? <LoginPage onLogin={(profileId) => setActiveProfile(profileId)} />
        : <DashboardPage profileId={activeProfile} onLogout={() => setActiveProfile(null)} />
      }
      <SettingsPanel profileId={activeProfile ?? undefined} />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
