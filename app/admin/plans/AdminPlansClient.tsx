'use client';

import { useState } from 'react';
import {
  Layers,
  FileCode,
  IndianRupee,
  Percent,
  Plus,
  Check,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Tag,
  HelpCircle,
  X,
} from 'lucide-react';
import { updatePlanConfig, createPlanConfig, togglePlanActive } from '../actions';
import type { PlanConfigRecord } from '@/lib/plans';

interface AdminPlansClientProps {
  initialPlans: PlanConfigRecord[];
}

export default function AdminPlansClient({ initialPlans }: AdminPlansClientProps) {
  const [plans, setPlans] = useState<PlanConfigRecord[]>(initialPlans);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Plan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanBadge, setNewPlanBadge] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPriceMonth, setNewPriceMonth] = useState('149');
  const [newPriceYear, setNewPriceYear] = useState('1499');
  const [newDiscount, setNewDiscount] = useState('16');
  const [newDiscountLabel, setNewDiscountLabel] = useState('Save 16%');
  const [newMaxProjects, setNewMaxProjects] = useState('');
  const [newFeatures, setNewFeatures] = useState('Unlimited projects\nMulti-environment support\nPriority email support');
  const [isCreating, setIsCreating] = useState(false);

  const handleFieldChange = (id: string, field: keyof PlanConfigRecord, value: any) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePlan = async (plan: PlanConfigRecord) => {
    setSavingId(plan.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updatePlanConfig(plan.id, {
        name: plan.name,
        badge: plan.badge,
        description: plan.description,
        price_month_rupees: Number(plan.price_month_rupees) || 0,
        price_year_rupees: Number(plan.price_year_rupees) || 0,
        discount_percent: Number(plan.discount_percent) || 0,
        discount_label: plan.discount_label || '',
        max_projects: plan.max_projects === null || plan.max_projects === undefined || (plan.max_projects as any) === '' ? null : Number(plan.max_projects),
        max_env_files: plan.max_env_files === null || plan.max_env_files === undefined || (plan.max_env_files as any) === '' ? null : Number(plan.max_env_files),
        features: plan.features,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
      });

      setSuccessMsg(`Plan "${plan.name}" updated successfully! Changes are live across pricing and checkout.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to update plan.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (plan: PlanConfigRecord) => {
    try {
      const nextState = !plan.is_active;
      await togglePlanActive(plan.id, nextState);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: nextState } : p))
      );
      setSuccessMsg(`Plan "${plan.name}" ${nextState ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to toggle plan status.');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanId || !newPlanName) {
      setErrorMsg('Plan ID and Name are required.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const featureList = newFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      await createPlanConfig({
        id: newPlanId,
        name: newPlanName,
        badge: newPlanBadge,
        description: newPlanDesc,
        price_month_rupees: Number(newPriceMonth) || 0,
        price_year_rupees: Number(newPriceYear) || 0,
        discount_percent: Number(newDiscount) || 0,
        discount_label: newDiscountLabel,
        max_projects: newMaxProjects ? Number(newMaxProjects) : null,
        max_env_files: null,
        features: featureList,
        is_featured: false,
      });

      const newPlan: PlanConfigRecord = {
        id: newPlanId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        name: newPlanName,
        badge: newPlanBadge,
        description: newPlanDesc,
        price_month_rupees: Number(newPriceMonth) || 0,
        price_year_rupees: Number(newPriceYear) || 0,
        discount_percent: Number(newDiscount) || 0,
        discount_label: newDiscountLabel,
        max_projects: newMaxProjects ? Number(newMaxProjects) : null,
        max_env_files: null,
        features: featureList,
        is_active: true,
        is_featured: false,
        sort_order: 10,
      };

      setPlans((prev) => [...prev, newPlan]);
      setIsModalOpen(false);
      setSuccessMsg(`New plan "${newPlanName}" created and published!`);

      // Reset form
      setNewPlanId('');
      setNewPlanName('');
      setNewPlanBadge('');
      setNewPlanDesc('');
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to create plan.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans & Pricing Management</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mt-1">
            Configure live Cashfree pricing, annual discounts, limits, and publish new plan tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Plan</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isPro = p.id === 'pro';
          const isFree = p.id === 'free';
          const isSaving = savingId === p.id;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-2xl bg-white border ${
                p.is_featured
                  ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                  : 'border-[#DCE9E3] shadow-sm'
              } flex flex-col justify-between space-y-5 transition-all`}
            >
              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleFieldChange(p.id, 'name', e.target.value)}
                      className="font-bold text-lg text-[#172B2A] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-32"
                    />
                    <span className="font-mono text-[10px] text-slate-400">({p.id})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      title={p.is_active ? 'Deactivate plan' : 'Activate plan'}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      type="text"
                      placeholder="Badge"
                      value={p.badge}
                      onChange={(e) => handleFieldChange(p.id, 'badge', e.target.value)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/60 outline-none w-20 text-center"
                    />
                  </div>
                </div>

                {/* Description */}
                <textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) => handleFieldChange(p.id, 'description', e.target.value)}
                  className="w-full text-xs text-[#647570] bg-[#F4FAF7] p-2 rounded-xl border border-[#DCE9E3] outline-none focus:border-blue-500 resize-none"
                  placeholder="Plan description..."
                />

                {/* Pricing Fields */}
                <div className="p-3.5 rounded-xl bg-[#F4FAF7] border border-[#DCE9E3] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cashfree Pricing & Discounts
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#172B2A] mb-1">
                        Monthly (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          disabled={isFree}
                          value={p.price_month_rupees}
                          onChange={(e) => handleFieldChange(p.id, 'price_month_rupees', Number(e.target.value))}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 disabled:opacity-60 text-[#172B2A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#172B2A] mb-1">
                        Yearly (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          disabled={isFree}
                          value={p.price_year_rupees}
                          onChange={(e) => handleFieldChange(p.id, 'price_year_rupees', Number(e.target.value))}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 disabled:opacity-60 text-[#172B2A]"
                        />
                      </div>
                    </div>
                  </div>

                  {!isFree && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-[#172B2A] mb-1">
                          Discount (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={p.discount_percent}
                            onChange={(e) => handleFieldChange(p.id, 'discount_percent', Number(e.target.value))}
                            className="w-full pl-2.5 pr-6 py-1.5 text-xs font-bold rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#172B2A] mb-1">
                          Discount Tag
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Save 16%"
                          value={p.discount_label || ''}
                          onChange={(e) => handleFieldChange(p.id, 'discount_label', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      Max Projects
                    </label>
                    <input
                      type="text"
                      placeholder="Unlimited"
                      value={p.max_projects === null || p.max_projects === undefined ? '' : p.max_projects}
                      onChange={(e) => handleFieldChange(p.id, 'max_projects', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      Max .env / Project
                    </label>
                    <input
                      type="text"
                      placeholder="Unlimited"
                      value={p.max_env_files === null || p.max_env_files === undefined ? '' : p.max_env_files}
                      onChange={(e) => handleFieldChange(p.id, 'max_env_files', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                    />
                  </div>
                </div>

                {/* Features (Multi-line) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Features (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={p.features.join('\n')}
                    onChange={(e) => handleFieldChange(p.id, 'features', e.target.value.split('\n'))}
                    className="w-full text-xs text-[#172B2A] bg-[#F4FAF7] p-2.5 rounded-xl border border-[#DCE9E3] outline-none focus:border-blue-500 resize-none font-mono"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#DCE9E3] flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {p.is_active ? 'Live on Store' : 'Inactive'}
                </span>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSavePlan(p)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white border border-[#DCE9E3] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCE9E3] mb-5">
              <h3 className="font-bold text-base text-[#172B2A]">
                Create New Plan Tier
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Plan ID (slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. team, startup"
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Team Studio"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best Value, Teams"
                    value={newPlanBadge}
                    onChange={(e) => setNewPlanBadge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Max Projects
                  </label>
                  <input
                    type="number"
                    placeholder="Leave blank for Unlimited"
                    value={newMaxProjects}
                    onChange={(e) => setNewMaxProjects(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172B2A] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="For collaborative teams scaling side projects."
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Monthly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPriceMonth}
                    onChange={(e) => setNewPriceMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Yearly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPriceYear}
                    onChange={(e) => setNewPriceYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#172B2A] mb-1">
                    Discount Tag
                  </label>
                  <input
                    type="text"
                    value={newDiscountLabel}
                    onChange={(e) => setNewDiscountLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 text-[#172B2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172B2A] mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#DCE9E3] bg-white outline-none focus:border-blue-500 resize-none text-[#172B2A]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE9E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#647570] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Creating Plan...' : 'Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

