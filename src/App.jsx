import { useEffect, useMemo, useState } from "react";
import { Calculator } from "./components/Calculator";
import { LightingCalculator } from "./components/LightingCalculator";
import { BoilerCalculator } from "./components/BoilerCalculator";
import { HomeDashboard } from "./components/HomeDashboard.jsx";
import { HistoryPage } from "./components/history/HistoryPage.jsx";
import { I18nProvider, useI18n } from "./i18n/useI18n.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { AuthModal } from "./components/auth/AuthModal.jsx";
import { defaultHomeRooms } from "./utils/homeRooms.js";
import {
  calculateBoilerResult,
  defaultBoilerState,
} from "./components/boiler/useBoilerCalculator.js";

// Root application component.
// Owns all shared state and wraps the app
// with language + authentication providers.
function AppContent() {
  // -----------------------------
  // UI state
  // -----------------------------
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [season, setSeason] = useState("summer");

  // Saved light/dark mode from browser storage
  const [uiTheme, setUiTheme] = useState(
    () => localStorage.getItem("powercalc-theme") || "light",
  );

  // -----------------------------
  // Shared home state
  // -----------------------------
  const [rooms, setRooms] = useState(defaultHomeRooms);

  const [selectedRoomId, setSelectedRoomId] = useState(defaultHomeRooms[0].id);

  // -----------------------------
  // Shared calculator settings
  // -----------------------------
  const [electricityPrice, setElectricityPrice] = useState(0.55);

  const [acSettings, setAcSettings] = useState({
    months: 3,
    outdoorTemp: 32,
  });

  // Boiler state is stored globally so dashboard updates live
  const [boilerState, setBoilerState] = useState(defaultBoilerState);

  const boilerResult = useMemo(
    () => calculateBoilerResult(boilerState, electricityPrice),
    [boilerState, electricityPrice],
  );

  // -----------------------------
  // App behavior state
  // -----------------------------
  const [authOpen, setAuthOpen] = useState(false);
  const [loadRequest, setLoadRequest] = useState(null);

  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 760px)").matches,
  );

  // Keep mobile state updated on resize
  useEffect(() => {
    const handler = () =>
      setIsMobile(window.matchMedia("(max-width: 760px)").matches);

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, []);

  // Save theme in localStorage
  useEffect(() => {
    localStorage.setItem("powercalc-theme", uiTheme);
  }, [uiTheme]);

  // Load a saved history item into the correct page
  const handleHistoryLoad = (item) => {
    if (!item?.type) return;

    // Home snapshot restores shared global state
    if (item.type === "home") {
      const inputs = item.inputs || {};

      if (Array.isArray(inputs.rooms) && inputs.rooms.length) {
        setRooms(inputs.rooms);

        setSelectedRoomId(inputs.selectedRoomId || inputs.rooms[0].id);
      }

      if (inputs.acSettings) {
        setAcSettings((prev) => ({
          ...prev,
          ...inputs.acSettings,
        }));
      }

      if (Number.isFinite(Number(inputs.electricityPrice))) {
        setElectricityPrice(Number(inputs.electricityPrice));
      }

      if (inputs.season) {
        setSeason(inputs.season);
      }

      if (inputs.boilerState) {
        setBoilerState((prev) => ({
          ...prev,
          ...inputs.boilerState,
        }));
      }

      setLoadRequest({
        id: item.id,
        type: item.type,
        item,
        ts: Date.now(),
      });

      setActiveTab("dashboard");
      return;
    }

    // Regular calculator history load
    setLoadRequest({
      id: item.id,
      type: item.type,
      item,
      ts: Date.now(),
    });

    setActiveTab(item.type);
  };

  return (
    <I18nProvider language={language}>
      <AuthProvider>
        <AppShell
          season={season}
          setSeason={setSeason}
          uiTheme={uiTheme}
          setUiTheme={setUiTheme}
          language={language}
          setLanguage={setLanguage}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          authOpen={authOpen}
          setAuthOpen={setAuthOpen}
          loadRequest={loadRequest}
          onHistoryLoad={handleHistoryLoad}
          rooms={rooms}
          setRooms={setRooms}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          acSettings={acSettings}
          setAcSettings={setAcSettings}
          electricityPrice={electricityPrice}
          setElectricityPrice={setElectricityPrice}
          boilerState={boilerState}
          setBoilerState={setBoilerState}
          boilerResult={boilerResult}
        />
      </AuthProvider>
    </I18nProvider>
  );
}

// Main visual shell of the application.
// Contains header, navigation,
// page switching, and auth modal.
function AppShell({
  season,
  setSeason,
  uiTheme,
  setUiTheme,
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  isMobile,
  authOpen,
  setAuthOpen,
  loadRequest,
  onHistoryLoad,
  rooms,
  setRooms,
  selectedRoomId,
  setSelectedRoomId,
  acSettings,
  setAcSettings,
  electricityPrice,
  setElectricityPrice,
  boilerState,
  setBoilerState,
  boilerResult,
}) {
  const { t, direction } = useI18n();
  const { user } = useAuth();

  // Sync html direction/lang for RTL support
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return (
    <div
      className={`app ui-${uiTheme} ${isMobile ? "mobile" : ""}`}
      dir={direction}
    >
      <div className="shell">
        {/* Header */}
        <header className="shellHeader">
          {/* Brand button returns to dashboard */}
          <button
            className="brand brandButton"
            type="button"
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="logo logoMain">
              <img
                src="/icons/logo.png"
                alt="PowerCalc logo"
                className="logoImg"
              />
            </span>

            <span className="brandText">PowerCalc</span>
          </button>

          {/* Main navigation */}
          <nav className="navigation-tabs" aria-label="Main navigation">
            <button
              className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              {language === "he" ? "דשבורד" : "Home"}
            </button>

            <button
              className={`tab-btn ${activeTab === "ac" ? "active" : ""}`}
              onClick={() => setActiveTab("ac")}
            >
              {t("tabAc")}
            </button>

            <button
              className={`tab-btn ${activeTab === "lighting" ? "active" : ""}`}
              onClick={() => setActiveTab("lighting")}
            >
              {t("tabLighting")}
            </button>

            <button
              className={`tab-btn ${activeTab === "boiler" ? "active" : ""}`}
              onClick={() => setActiveTab("boiler")}
            >
              {t("tabBoiler")}
            </button>

            <button
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              {t("tabHistory")}
            </button>
          </nav>

          {/* Header actions */}
          <div className="headerActions">
            {/* Theme switch */}
            <div className="headerSegment" role="group">
              <button
                className={`themeMini ${uiTheme === "dark" ? "active" : ""}`}
                type="button"
                onClick={() => setUiTheme("dark")}
              >
                {language === "he" ? "כהה" : "Dark"}
              </button>

              <button
                className={`themeMini ${uiTheme === "light" ? "active" : ""}`}
                type="button"
                onClick={() => setUiTheme("light")}
              >
                {language === "he" ? "בהיר" : "Light"}
              </button>
            </div>

            {/* Language switch */}
            <div className="headerSegment" role="group">
              <button
                className={`langMini ${language === "en" ? "active" : ""}`}
                type="button"
                onClick={() => setLanguage("en")}
              >
                EN
              </button>

              <button
                className={`langMini ${language === "he" ? "active" : ""}`}
                type="button"
                onClick={() => setLanguage("he")}
              >
                HE
              </button>
            </div>

            {/* Account modal button */}
            <button
              className={`accountButton ${user ? "signedIn" : ""}`}
              type="button"
              onClick={() => setAuthOpen(true)}
              aria-label={t("account")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </button>
          </div>
        </header>

        {/* Active page */}
        <main className="pageBody">
          {activeTab === "dashboard" && (
            <HomeDashboard
              rooms={rooms}
              acSettings={acSettings}
              electricityPrice={electricityPrice}
              season={season}
              boilerResult={boilerResult}
              boilerState={boilerState}
              selectedRoomId={selectedRoomId}
              onOpenTab={setActiveTab}
            />
          )}

          {activeTab === "ac" && (
            <Calculator
              season={season}
              onSeasonChange={setSeason}
              loadRequest={loadRequest?.type === "ac" ? loadRequest : null}
              rooms={rooms}
              setRooms={setRooms}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
              acSettings={acSettings}
              setAcSettings={setAcSettings}
              electricityPrice={electricityPrice}
              setElectricityPrice={setElectricityPrice}
            />
          )}

          {activeTab === "lighting" && (
            <LightingCalculator
              loadRequest={
                loadRequest?.type === "lighting" ? loadRequest : null
              }
              rooms={rooms}
              setRooms={setRooms}
              electricityPrice={electricityPrice}
              setElectricityPrice={setElectricityPrice}
            />
          )}

          {activeTab === "boiler" && (
            <BoilerCalculator
              loadRequest={loadRequest?.type === "boiler" ? loadRequest : null}
              boilerState={boilerState}
              setBoilerState={setBoilerState}
              onResultChange={() => {}}
              electricityPrice={electricityPrice}
              setElectricityPrice={setElectricityPrice}
            />
          )}

          {activeTab === "history" && (
            <HistoryPage onLoadItem={onHistoryLoad} />
          )}
        </main>
      </div>

      {/* Login / register modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default AppContent;
