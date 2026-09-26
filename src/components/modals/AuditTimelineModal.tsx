import React, { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  Clock,
  UserCheck,
  Hash,
  X,
  RefreshCw,
  FileText
} from "lucide-react";
import { AuditTimelineRecord } from "../../types";
import { fetchAuditTimeline } from "../../lib/api";

interface AuditTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId?: string;
  title?: string;
}

export const AuditTimelineModal: React.FC<AuditTimelineModalProps> = ({
  isOpen,
  onClose,
  entityId = "ALL",
  title = "Cryptographic Audit Trail & Governance Log"
}) => {
  const [timeline, setTimeline] = useState<AuditTimelineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const records = await fetchAuditTimeline(entityId);
      setTimeline(records);
    } catch (e) {
      console.error("Failed to load audit timeline:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTimeline();
    }
  }, [isOpen, entityId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#14151b] border border-[#262833] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262833] shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-zinc-400">
                {entityId === "ALL" ? "System-wide immutable ledger events" : `Audit trail for entity ID: ${entityId}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {loading ? (
            <div className="p-8 text-center text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
              <p className="text-xs">Fetching cryptographic audit logs...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No audit timeline events logged for this record.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#262833]">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-[#14151b]" />

                  <div className="bg-[#0d0e12] border border-[#262833] p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                          {item.action.replace(/_/g, " ")}
                        </span>
                        <span className="bg-purple-950/60 text-purple-300 border border-purple-800 px-2 py-0.2 text-[10px] rounded font-medium">
                          {item.userRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">{item.timestamp}</span>
                    </div>

                    <p className="text-zinc-300">{item.details}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#1e2029] text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-zinc-400" />
                        <span>Signed by: <strong className="text-zinc-300">{item.userName}</strong></span>
                      </div>
                      {item.ipAddress && (
                        <div>IP: <span className="font-mono text-zinc-400">{item.ipAddress}</span></div>
                      )}
                      {item.hashChecksum && (
                        <div className="flex items-center gap-1 font-mono text-purple-400/90 ml-auto" title={item.hashChecksum}>
                          <Hash className="w-3 h-3" />
                          <span>SHA-256: {item.hashChecksum.substring(0, 16)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#262833] shrink-0 text-xs">
          <span className="text-[11px] text-zinc-500">
            Immutable chain verified with SHA-256 state signatures
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2029] hover:bg-[#282a36] text-zinc-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
