import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../i18n/useI18n.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  deleteCalculation,
  subscribeToCalculations,
} from "../../services/historyService";
import { formatCurrency, round2 } from "../../utils/format";

// Converts Firebase Timestamp / Date into readable localized text.
function formatDate(value, language) {
  const date = value?.toDate?.() || (value instanceof Date ? value : null);

  if (!date) return "—";

  try {
    return new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

// Converts season key into UI text.
function getSeasonText(season, language) {
  if (language === "he") {
    return season === "winter" ? "חורף" : "קיץ";
  }

  return season === "winter" ? "Winter" : "Summer";
}

// Builds clean title for each saved calculation.
function getHistoryTitle(item, language) {
  const type = item?.type;
  const inputs = item?.inputs || {};

  if (type === "home") {
    return language === "he" ? "תמונת מצב ביתית" : "Home Snapshot";
  }

  if (type === "lighting") {
    const count = inputs.rooms?.length || 0;

    return language === "he"
      ? `${count} חדרים · מחשבון תאורה`
      : `${count} rooms · Lighting Calculator`;
  }

  if (type === "boiler") {
    const liters = inputs.tankLiters || inputs.capacity || 100;

    return language === "he"
      ? `דוד חשמל · ${liters} ליטר`
      : `Electric Boiler · ${liters}L`;
  }

  if (type === "ac") {
    const roomName =
      inputs.roomName || (language === "he" ? "כל החדרים" : "All rooms");

    const season = getSeasonText(inputs.season || "summer", language);

    return language === "he"
      ? `מחשבון מזגן · ${roomName} · ${season}`
      : `AC Calculator · ${roomName} · ${season}`;
  }

  return language === "he" ? "חישוב שמור" : "Saved calculation";
}

// Builds small summary text under each item.
function getHistorySummary(item, language) {
  const type = item?.type;
  const outputs = item?.outputs || {};

  if (type === "home") {
    const total = outputs.totalMonthly ?? 0;
    const saving = outputs.possibleSaving ?? 0;

    return language === "he"
      ? `סה״כ: ${formatCurrency(total, language)} · חיסכון אפשרי: ${formatCurrency(
          saving,
          language,
        )}`
      : `Total: ${formatCurrency(total, language)} · Possible saving: ${formatCurrency(
          saving,
          language,
        )}`;
  }

  if (type === "lighting" || type === "boiler") {
    const daily = outputs.dailyCost ?? 0;
    const yearly = outputs.yearlyCost ?? 0;

    return language === "he"
      ? `יומי: ${formatCurrency(daily, language)} · שנתי: ${formatCurrency(
          yearly,
          language,
        )}`
      : `Daily: ${formatCurrency(daily, language)} · Yearly: ${formatCurrency(
          yearly,
          language,
        )}`;
  }

  if (type === "ac") {
    const daily = outputs.dailyCost ?? 0;
    const kw = outputs.estimatedKW ?? 0;

    return language === "he"
      ? `עלות יומית משוערת: ${formatCurrency(
          daily,
          language,
        )} · kW משוער: ${round2(kw)} kW`
      : `Estimated daily cost: ${formatCurrency(
          daily,
          language,
        )} · Estimated kW: ${round2(kw)} kW`;
  }

  return "—";
}

// Badge label by calculation type.
function typeLabel(type, language) {
  if (language !== "he") {
    return type?.toUpperCase?.() || "—";
  }

  if (type === "home") return "בית";
  if (type === "ac") return "מזגן";
  if (type === "lighting") return "תאורה";
  if (type === "boiler") return "דוד";

  return "—";
}

// Filter button labels.
function filterLabel(key, language, t) {
  if (key === "all") return t("historyFilterAll");
  if (key === "home") return language === "he" ? "בית" : "Home";
  if (key === "ac") return t("tabAc");
  if (key === "lighting") return t("tabLighting");
  if (key === "boiler") return t("tabBoiler");

  return key;
}

// History page.
// Lets users search, filter, load,
// and delete saved calculations.
export function HistoryPage({ onLoadItem }) {
  const { t, language } = useI18n();
  const { user, isConfigured } = useAuth();

  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Live subscription to user history
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return undefined;
    }

    return subscribeToCalculations({
      userId: user.uid,
      onData: setItems,
      onError: () => setItems([]),
    });
  }, [user?.uid]);

  // Apply search + type filter
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        getHistoryTitle(item, language),
        getHistorySummary(item, language),
        item.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [items, filter, query, language]);

  // Delete one saved item
  const handleDelete = async (id) => {
    if (!user?.uid || !id) return;

    setBusyId(id);

    try {
      await deleteCalculation({
        userId: user.uid,
        calculationId: id,
      });
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="card historyPageCard">
      {/* Header */}
      <div className="historyHead">
        <div>
          <h1 className="title historyPageTitle">{t("historyPageTitle")}</h1>

          <div className="small">{t("historyPageSubtitle")}</div>
        </div>

        <div className="historyStats small">
          {t("historyTotalItems")}: <b>{filteredItems.length}</b>
        </div>
      </div>

      {/* Access state */}
      {!isConfigured ? (
        <div className="small">{t("historyNeedsFirebase")}</div>
      ) : !user ? (
        <div className="small">{t("historyNeedsLogin")}</div>
      ) : (
        <>
          {/* Search + filters */}
          <div className="historyToolbar">
            <input
              className="input historySearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("historySearchPlaceholder")}
            />

            <div className="historyFilters">
              {["all", "home", "ac", "lighting", "boiler"].map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`chip ${filter === key ? "active" : ""}`}
                  onClick={() => setFilter(key)}
                >
                  {filterLabel(key, language, t)}
                </button>
              ))}
            </div>
          </div>

          {/* Empty states */}
          {filteredItems.length === 0 ? (
            <div className="small">
              {items.length === 0
                ? t("historyEmptyGlobal")
                : t("historyNoMatches")}
            </div>
          ) : (
            <div className="historyList historyPageList">
              {/* Saved calculations */}
              {filteredItems.map((item) => (
                <article key={item.id} className="historyItem historyPageItem">
                  <div className="historyItemTop historyPageItemTop">
                    <div>
                      <strong>{getHistoryTitle(item, language)}</strong>

                      <div className="small historyTypeBadge">
                        {typeLabel(item.type, language)}
                      </div>
                    </div>

                    <span className="small historyDate">
                      {formatDate(item.createdAt, language)}
                    </span>
                  </div>

                  <div className="small historySummary">
                    {getHistorySummary(item, language)}
                  </div>

                  {/* Actions */}
                  <div className="historyActions">
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => onLoadItem?.(item)}
                    >
                      {t("loadToCalculator")}
                    </button>

                    <button
                      className="btn btnDanger"
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {busyId === item.id ? t("deleting") : t("deleteSaved")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
