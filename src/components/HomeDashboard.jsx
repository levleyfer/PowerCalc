import { useI18n } from "../i18n/useI18n.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

import { useHomeDashboard } from "./dashboard/useHomeDashboard";
import { HomeHero } from "./dashboard/HomeHero";
import { HomeSummary } from "./dashboard/HomeSummary";
import { HomeInsights } from "./dashboard/HomeInsights";
import { RoomOverview } from "./dashboard/RoomOverview";
import { HomeDetails } from "./dashboard/HomeDetails";
import { DashboardTips } from "./dashboard/DashboardTips";

// Main home dashboard page.
// Receives shared App.jsx state and converts it into
// totals, room overview, insights, smart tips, and save snapshot actions.
export function HomeDashboard({
  rooms = [],
  acSettings,
  electricityPrice,
  season,
  boilerResult,
  boilerState,
  selectedRoomId,
  onOpenTab,
}) {
  const { language } = useI18n();
  const { user, isConfigured } = useAuth();

  // Main dashboard logic hook
  const dashboard = useHomeDashboard({
    rooms,
    acSettings,
    electricityPrice,
    season,
    boilerResult,
    boilerState,
    selectedRoomId,
    user,
    isConfigured,
    language,
  });

  return (
    <div className="dashboardPage homeTheme">
      {/* Top hero section with efficiency score and save snapshot button */}
      <HomeHero
        language={language}
        efficiencyScore={dashboard.efficiencyScore}
        saveState={dashboard.saveState}
        canSave={Boolean(user?.uid && isConfigured)}
        onSave={dashboard.handleSaveHomeSnapshot}
      />

      {/* Main monthly total and module breakdown */}
      <HomeSummary
        summary={dashboard.summary}
        rooms={rooms}
        enabledAcRooms={dashboard.enabledAcRooms}
        totalServices={dashboard.totalServices}
        language={language}
      />

      {/* Current vs optimized costs and best action */}
      <HomeInsights
        summary={dashboard.summary}
        optimizedEstimate={dashboard.optimizedEstimate}
        possibleSaving={dashboard.possibleSaving}
        mainIssue={dashboard.mainIssue}
        bestAction={dashboard.bestAction}
        language={language}
        onOpenTab={onOpenTab}
      />

      <div className="dashboardGrid dashboardGridWide">
        {/* Per-room AC / lighting cost overview */}
        <RoomOverview
          summary={dashboard.summary}
          language={language}
          onOpenTab={onOpenTab}
        />

        <aside className="sideColumn">
          {/* Shared home calculation details */}
          <HomeDetails
            summary={dashboard.summary}
            acSettings={acSettings}
            electricityPrice={electricityPrice}
            seasonLabel={dashboard.seasonLabel}
            priceUnit={dashboard.priceUnit}
            powerUnit={dashboard.powerUnit}
            language={language}
          />

          {/* Smart dashboard tips */}
          <DashboardTips
            tips={dashboard.smartTips}
            language={language}
            onOpenTab={onOpenTab}
          />
        </aside>
      </div>
    </div>
  );
}
