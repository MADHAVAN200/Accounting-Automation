import React, { useState, useEffect } from "react";
import {
  Sliders,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ToggleLeft,
  ToggleRight,
  Shield,
  Zap,
  RefreshCw,
  Search,
  X,
  Clock
} from "lucide-react";
import { PostingRule, ConfidencePolicy, RuleSimulationResult } from "../../types";
import {
  fetchPostingRules,
  createPostingRule,
  deletePostingRule,
  togglePostingRule,
  simulatePostingRules,
  fetchConfidencePolicies,
  updateConfidencePolicies
} from "../../lib/api";
import { Checkbox } from "../ui/Checkbox";
import { CustomSelect } from "../ui/CustomSelect";

export const RulesBuilderView: React.FC = () => {
  const [rules, setRules] = useState<PostingRule[]>([]);
  const [policies, setPolicies] = useState<ConfidencePolicy | null>(null);
  const [simulation, setSimulation] = useState<RuleSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // New Rule Form State
  const [newRule, setNewRule] = useState<{
    name: string;
    conditionField: "description" | "vendor" | "amount" | "payment_method";
    conditionOperator: "contains" | "equals" | "starts_with" | "greater_than" | "less_than";
    conditionValue: string;
    minAmount: number;
    maxAmount: number;
    targetCategory: string;
    targetGlAccount: string;
    autoApprove: boolean;
    priority: number;
  }>({
    name: "",
    conditionField: "description",
    conditionOperator: "contains",
    conditionValue: "",
    minAmount: 0,
    maxAmount: 100000,
    targetCategory: "Software & Subscriptions",
    targetGlAccount: "6200",
    autoApprove: true,
    priority: 10
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, pData] = await Promise.all([
        fetchPostingRules(),
        fetchConfidencePolicies()
      ]);
      setRules(rList);
      setPolicies(pData);
    } catch (e) {
      console.error("Failed to load rules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRule = async (id: string, current: boolean) => {
    try {
      await togglePostingRule(id, !current);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !current } : r))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this auto-posting rule?")) return;
    try {
      await deletePostingRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.conditionValue) return;
    try {
      await createPostingRule(newRule);
      setIsCreateModalOpen(false);
      setNewRule({
        name: "",
        conditionField: "description",
        conditionOperator: "contains",
        conditionValue: "",
        minAmount: 0,
        maxAmount: 100000,
        targetCategory: "Software & Subscriptions",
        targetGlAccount: "6200",
        autoApprove: true,
        priority: 10
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const sim = await simulatePostingRules(90);
      setSimulation(sim);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policies) return;
    try {
      await updateConfidencePolicies(policies);
      setIsPolicyModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#14151b] border border-[#262833] p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Deterministic Auto-Posting Engine</h2>
            <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-medium">
              Enterprise Rule Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Define programmatic logic to complement AI confidence scoring, enforce segregation of duties, and auto-route recurring vendors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1e2029] hover:bg-[#282a36] text-zinc-200 text-xs font-medium rounded-lg border border-[#323644] transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            Confidence Policies
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Simulating Past 90 Days..." : "Simulate Rules (90 Days)"}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Rule
          </button>
        </div>
      </div>

      {/* Active Policies Quick Summary */}
      {policies && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#14151b] border border-[#262833] p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400">Auto-Post Confidence</span>
              <div className="text-sm font-bold text-white font-mono">≥ {(policies.autoPostThreshold * 100).toFixed(0)}% AI Confidence</div>
            </div>
          </div>
          <div className="bg-[#14151b] border border-[#262833] p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400">Controller Review Queue</span>
              <div className="text-sm font-bold text-white font-mono">{(policies.reviewThreshold * 100).toFixed(0)}% - {((policies.autoPostThreshold * 100) - 1).toFixed(0)}%</div>
            </div>
          </div>
          <div className="bg-[#14151b] border border-[#262833] p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400">Maker-Checker Dual Sign-off</span>
              <div className="text-sm font-bold text-white font-mono">
                {policies.isDualApprovalEnabled ? `Required for ≥ ₹${policies.dualApprovalThreshold.toLocaleString("en-IN")}` : "Disabled"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results Drawer/Banner */}
      {simulation && (
        <div className="bg-[#14151b] border border-emerald-800/40 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">90-Day Historical Simulation Report</h3>
            </div>
            <button
              onClick={() => setSimulation(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#0d0e12] p-3 rounded-lg border border-[#262833]">
              <span className="text-zinc-500">Transactions Evaluated</span>
              <div className="text-base font-bold text-white mt-0.5">{simulation.totalTransactions}</div>
            </div>
            <div className="bg-[#0d0e12] p-3 rounded-lg border border-[#262833]">
              <span className="text-zinc-500">Deterministic Rule Matches</span>
              <div className="text-base font-bold text-blue-400 mt-0.5">{simulation.rulesMatchedCount}</div>
            </div>
            <div className="bg-[#0d0e12] p-3 rounded-lg border border-[#262833]">
              <span className="text-zinc-500">Projected Auto-Approved</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{simulation.projectedAutoApproved} ({simulation.automationRate}%)</div>
            </div>
            <div className="bg-[#0d0e12] p-3 rounded-lg border border-[#262833]">
              <span className="text-zinc-500">Routed to Review Queue</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">{simulation.projectedReviewQueue}</div>
            </div>
          </div>

          {/* Sample Matches Preview */}
          {simulation.sampleMatches && simulation.sampleMatches.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Sample Simulated Postings:</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {simulation.sampleMatches.map((m) => (
                  <div key={m.transactionId} className="p-2.5 bg-[#0d0e12] rounded-lg border border-[#262833] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{m.description}</span>
                        <span className="text-[10px] text-zinc-500">{m.date}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Rule: <span className="text-blue-300 font-medium">{m.ruleName}</span> → Routed to <span className="text-emerald-300">{m.newCategory}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-zinc-200">₹{m.amount.toLocaleString("en-IN")}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        m.action === "AUTO_APPROVE"
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                          : "bg-amber-950/60 text-amber-300 border border-amber-800"
                      }`}>
                        {m.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#262833] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Configured Rules ({rules.length})</h3>
          <span className="text-xs text-zinc-400">Evaluated in sequential priority order</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#0d0e12] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#262833] text-[11px]">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Condition Logic</th>
                <th className="py-3 px-4">Amount Bounds</th>
                <th className="py-3 px-4">Target GL & Category</th>
                <th className="py-3 px-4">Auto-Post?</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2029]">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#181a22] transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-500">#{rule.priority}</td>
                  <td className="py-3 px-4 font-medium text-white">{rule.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] bg-[#0d0e12] px-2 py-1 rounded border border-[#262833] text-blue-300">
                      {rule.conditionField} {rule.conditionOperator} "{rule.conditionValue}"
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">
                    ₹{rule.minAmount.toLocaleString("en-IN")} - {rule.maxAmount >= 999999999 ? "∞" : `₹${rule.maxAmount.toLocaleString("en-IN")}`}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{rule.targetCategory}</div>
                    <div className="text-[11px] font-mono text-zinc-500">GL {rule.targetGlAccount}</div>
                  </td>
                  <td className="py-3 px-4">
                    {rule.autoApprove ? (
                      <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Approve
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Route to Review
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        className={`p-1.5 rounded transition-colors ${
                          rule.isActive ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-600 hover:text-zinc-400"
                        }`}
                        title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                      >
                        {rule.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RULE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#14151b] border border-[#262833] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262833]">
              <h3 className="text-base font-bold text-white">Create Deterministic Auto-Posting Rule</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub Dev Tooling"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Field to Inspect</label>
                  <CustomSelect
                    id="rule-condition-field"
                    value={newRule.conditionField}
                    onChange={(val) => setNewRule({ ...newRule, conditionField: val as any })}
                    options={[
                      { value: "description", label: "Transaction Description" },
                      { value: "vendor", label: "Vendor Name" },
                      { value: "payment_method", label: "Payment Method" },
                    ]}
                    ariaLabel="Field to Inspect"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Operator</label>
                  <CustomSelect
                    id="rule-condition-operator"
                    value={newRule.conditionOperator}
                    onChange={(val) => setNewRule({ ...newRule, conditionOperator: val as any })}
                    options={[
                      { value: "contains", label: "Contains (Case-insensitive)" },
                      { value: "equals", label: "Exact Match" },
                      { value: "starts_with", label: "Starts With" },
                    ]}
                    ariaLabel="Operator"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Condition Match Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub or AWS"
                  value={newRule.conditionValue}
                  onChange={(e) => setNewRule({ ...newRule, conditionValue: e.target.value })}
                  className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Min Amount (INR)</label>
                  <input
                    type="number"
                    value={newRule.minAmount}
                    onChange={(e) => setNewRule({ ...newRule, minAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Max Amount (INR)</label>
                  <input
                    type="number"
                    value={newRule.maxAmount}
                    onChange={(e) => setNewRule({ ...newRule, maxAmount: parseFloat(e.target.value) || 999999999 })}
                    className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Target Category</label>
                  <CustomSelect
                    id="rule-target-category"
                    value={newRule.targetCategory}
                    onChange={(cat) => {
                      const glMap: Record<string, string> = {
                        "Cloud Infrastructure": "6100",
                        "Software & Subscriptions": "6200",
                        "Marketing & Advertising": "6300",
                        "Payroll & Contractors": "7100",
                        "Travel & Transportation": "7200",
                        "Office & Utilities": "7300",
                        "SaaS Subscription Revenue": "4000"
                      };
                      setNewRule({ ...newRule, targetCategory: cat, targetGlAccount: glMap[cat] || "6200" });
                    }}
                    options={[
                      { value: "Cloud Infrastructure", label: "Cloud Infrastructure (GL 6100)", badge: "GL 6100" },
                      { value: "Software & Subscriptions", label: "Software & Subscriptions (GL 6200)", badge: "GL 6200" },
                      { value: "Marketing & Advertising", label: "Marketing & Advertising (GL 6300)", badge: "GL 6300" },
                      { value: "Payroll & Contractors", label: "Payroll & Contractors (GL 7100)", badge: "GL 7100" },
                      { value: "Travel & Transportation", label: "Travel & Transportation (GL 7200)", badge: "GL 7200" },
                      { value: "Office & Utilities", label: "Office & Utilities (GL 7300)", badge: "GL 7300" },
                      { value: "SaaS Subscription Revenue", label: "SaaS Subscription Revenue (GL 4000)", badge: "GL 4000" },
                    ]}
                    ariaLabel="Target Category"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Execution Action</label>
                  <CustomSelect
                    id="rule-execution-action"
                    value={newRule.autoApprove ? "true" : "false"}
                    onChange={(val) => setNewRule({ ...newRule, autoApprove: val === "true" })}
                    options={[
                      { value: "true", label: "Direct Auto-Approve & Post" },
                      { value: "false", label: "Route to Review Queue" },
                    ]}
                    ariaLabel="Execution Action"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#262833] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#1e2029] hover:bg-[#282a36] text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLICY SETTINGS MODAL */}
      {isPolicyModalOpen && policies && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#14151b] border border-[#262833] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262833]">
              <h3 className="text-base font-bold text-white">Confidence & Approval Policies</h3>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicies} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Auto-Posting Confidence Threshold: <span className="font-mono text-emerald-400 font-bold">{(policies.autoPostThreshold * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={policies.autoPostThreshold}
                  onChange={(e) => setPolicies({ ...policies, autoPostThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 mt-1">Transactions with AI confidence above this will bypass human queue and auto-post.</p>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Minimum Review Threshold: <span className="font-mono text-amber-400 font-bold">{(policies.reviewThreshold * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.50"
                  max="0.90"
                  step="0.01"
                  value={policies.reviewThreshold}
                  onChange={(e) => setPolicies({ ...policies, reviewThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 mt-1">Transactions between this and the auto-post threshold go to the Controller Review queue.</p>
              </div>

              <div className="pt-3 border-t border-[#262833] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200 font-medium">Dual Approval (Maker-Checker)</span>
                  <Checkbox
                    id="checkbox-dual-approval"
                    checked={policies.isDualApprovalEnabled}
                    onChange={(checked) => setPolicies({ ...policies, isDualApprovalEnabled: checked })}
                    ariaLabel="Toggle Dual Approval (Maker-Checker)"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Dual Approval Threshold (INR)</label>
                  <input
                    type="number"
                    value={policies.dualApprovalThreshold}
                    onChange={(e) => setPolicies({ ...policies, dualApprovalThreshold: parseFloat(e.target.value) || 100000 })}
                    className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white outline-none"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Transactions or invoices at or above this amount strictly require dual sign-off (Analyst + Controller).</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#262833] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 bg-[#1e2029] hover:bg-[#282a36] text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm"
                >
                  Save Policies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
