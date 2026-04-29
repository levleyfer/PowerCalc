import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/useI18n.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  deleteCalculation,
  subscribeToCalculations,
} from "../../services/historyService";

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

// Small history panel for a specific calculator type.
// Shows saved calculations, allows loading them,
// and lets the user delete saved items.
export function HistoryPanel({ type, onLoad }) {
  const { t, language } = useI18n();
  const { user, isConfigured } = useAuth();

  // Saved calculations for this calculator type
  const [items, setItems] = useState([]);

  // ID of the item currently being deleted
  const [busyId, setBusyId] = useState("");

  // Live subscription to Firebase history by type
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return undefined;
    }

    return subscribeToCalculations({
      userId: user.uid,
      type,
      onData: setItems,
      onError: () => setItems([]),
    });
  }, [user?.uid, type]);

  // Delete one saved calculation
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
    <section className="card historyCard">
      {/* Header */}
      <div className="historyHead">
        <h2 className="sectionTitle">{t("historyTitle")}</h2>
        <span className="small">{type?.toUpperCase?.() || "—"}</span>
      </div>

      {/* Access / empty states */}
      {!isConfigured ? (
        <div className="small">{t("historyNeedsFirebase")}</div>
      ) : !user ? (
        <div className="small">{t("historyNeedsLogin")}</div>
      ) : items.length === 0 ? (
        <div className="small">{t("historyEmpty")}</div>
      ) : (
        <div className="historyList">
          {/* Saved history items */}
          {items.map((item) => (
            <div key={item.id} className="historyItem">
              <div className="historyItemTop">
                <strong>{item.title || t("historyTitle")}</strong>

                <span className="small">
                  {formatDate(item.createdAt, language)}
                </span>
              </div>

              <div className="small">{item.summary || "—"}</div>

              {/* Load / delete actions */}
              <div className="historyActions">
                {onLoad && (
                  <button
                    className="btn btnGhost"
                    type="button"
                    onClick={() => onLoad(item)}
                  >
                    {t("loadToForm")}
                  </button>
                )}

                <button
                  className="btn btnDanger"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item.id)}
                >
                  {busyId === item.id ? t("deleting") : t("deleteSaved")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
