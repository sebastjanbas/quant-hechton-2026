"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, User, Moon, Pencil, TrendingDown, LucideIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { updateFinancialSettings } from "@/lib/actions/setup";

export interface SettingsItem {
  fieldName: string;
  data: string;
}

interface SettingsSection {
  icon: LucideIcon;
  title: string;
  description: string;
  action: boolean;
  items: SettingsItem[];
}

interface EditState {
  sectionTitle: string;
  item: SettingsItem;
}

interface FinancialSettings {
  currency: string;
  inflationRateAssumption: string | number;
  incomeDropScenario: string | number;
}

function buildSections(user: { name: string; email: string }): SettingsSection[] {
  return [
    {
      icon: User,
      title: "Profile",
      description: "Name, email, and account details",
      action: true,
      items: [
        { fieldName: "Display Name", data: user.name },
        { fieldName: "Email Address", data: user.email },
        { fieldName: "Profile Picture", data: "Not set" },
        { fieldName: "Time Zone", data: "Not set" },
      ],
    },
    {
      icon: Shield,
      title: "Security",
      description: "Password, two-factor authentication, and sessions",
      action: false,
      items: [
        { fieldName: "Password", data: "••••••••" },
        { fieldName: "Two-Factor Auth", data: "Disabled" },
        { fieldName: "Active Sessions", data: "1 session" },
        { fieldName: "Audit Log", data: "View log" },
      ],
    },
    {
      icon: Moon,
      title: "Appearance",
      description: "Theme, font size, and chart preferences",
      action: false,
      items: [
        { fieldName: "Color Theme", data: "Dark" },
        { fieldName: "Chart Style", data: "Line" },
        { fieldName: "Density", data: "Comfortable" },
        { fieldName: "Number Format", data: "1,234.56" },
      ],
    },
  ];
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];

function FinancialSettingsCard({ initial }: { initial: FinancialSettings }) {
  const [currency, setCurrency] = useState(String(initial.currency));
  const [inflationRate, setInflationRate] = useState(String(initial.inflationRateAssumption));
  const [incomeDropScenario, setIncomeDropScenario] = useState(String(initial.incomeDropScenario));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateFinancialSettings({
      currency,
      inflationRateAssumption: parseFloat(inflationRate) || 3,
      incomeDropScenario: parseFloat(incomeDropScenario) || 100,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error ?? "Failed to save.");
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-zinc-800">
            <TrendingDown className="size-4 text-zinc-400" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-white">Financial Assumptions</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Currency, inflation rate, and crash scenario settings</p>
          </div>
        </div>
      </CardHeader>
      <Separator className="bg-zinc-800" />
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Base Currency</Label>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border-zinc-700">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Annual Inflation Assumption (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={inflationRate}
            onChange={(e) => setInflationRate(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Income Drop Scenario (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={incomeDropScenario}
            onChange={(e) => setIncomeDropScenario(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <p className="text-[10px] text-zinc-600">Worst-case income loss used in survival calculator. 100 = full job loss.</p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-zinc-700 hover:bg-zinc-600 text-white"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettingsSections({
  user,
  financialSettings,
}: {
  user: { name: string; email: string };
  financialSettings: FinancialSettings | null;
}) {
  const [sections, setSections] = useState<SettingsSection[]>(buildSections(user));
  const [editing, setEditing] = useState<EditState | null>(null);
  const [draftValue, setDraftValue] = useState("");

  function openDialog(sectionTitle: string, item: SettingsItem) {
    setEditing({ sectionTitle, item });
    setDraftValue(item.data);
  }

  function handleSave() {
    if (!editing) return;
    setSections((prev) =>
      prev.map((section) =>
        section.title !== editing.sectionTitle
          ? section
          : {
              ...section,
              items: section.items.map((it) =>
                it.fieldName === editing.item.fieldName
                  ? { ...it, data: draftValue }
                  : it
              ),
            }
      )
    );
    setEditing(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Financial settings card — DB-backed */}
        {financialSettings && <FinancialSettingsCard initial={financialSettings} />}

        {sections.map(({ icon: Icon, title, description, action, items }) => (
          <Card key={title} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-zinc-800">
                  <Icon className="size-4 text-zinc-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">{title}</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                </div>
              </div>
            </CardHeader>
            <Separator className="bg-zinc-800" />
            <CardContent className="pt-3 space-y-0">
              {action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-3"
                  onClick={() => {
                    authClient.signOut();
                    redirect("/");
                  }}
                >
                  Sign out
                </Button>
              )}
              {items.map((item, i) => (
                <div key={item.fieldName}>
                  <div className="flex items-center justify-between py-2 group">
                    <span className="text-xs text-zinc-400">{item.fieldName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-500">{item.data}</span>
                      <button
                        onClick={() => openDialog(title, item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300"
                        aria-label={`Edit ${item.fieldName}`}
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  </div>
                  {i < items.length - 1 && <Separator className="bg-zinc-800/50" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editing?.item.fieldName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="field-value" className="text-xs text-zinc-400">
              {editing?.sectionTitle} &rsaquo; {editing?.item.fieldName}
            </Label>
            <Input
              id="field-value"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="bg-zinc-800 border-zinc-700 text-white text-sm focus-visible:ring-zinc-600"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-zinc-700 hover:bg-zinc-600 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
