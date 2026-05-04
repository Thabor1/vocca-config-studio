import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardList,
  Zap,
  MessageSquare,
  Users,
  Save,
  Check,
  X,
  AlertTriangle,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Building2,
  Filter,
  CheckCircle2,
  Circle,
  Wand2,
  Send,
  CalendarCheck,
  Loader2,
  Lightbulb,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Stethoscope,
} from "lucide-react";

// ───────────────────────────── Types ─────────────────────────────
type MotifStatus = "open" | "closed" | "transfer" | "task";

type ExamMotif = {
  id: string;
  examType: string;
  importedLabel: string;
  patientLabel: string;
  status: MotifStatus;
  patientInstructions: string;
  correctionInstructions: string;
  minAge?: number | null;
  maxAge?: number | null;
  price?: string;
  requiresTriage: boolean;
  triageConfigured: boolean;
  flags: string[];
};

type TriageQuestion = {
  id: string;
  category: "IRM" | "Scanner";
  title: string;
  patientWording: string;
  enabled: boolean;
  processStatus: "yes" | "no" | "modify" | "";
  customInstruction: string;
};

type Practitioner = {
  id: string;
  name: string;
  status: "open" | "closed" | "transfer";
  sector: "secteur_1" | "secteur_2" | "non_conventionne" | "a_definir";
  minAge?: number | null;
  maxAge?: number | null;
  instructions: string;
};

type Step = "onboarding" | "motifs" | "triage" | "practitioners" | "final";

// ───────────────────────────── Site identity ─────────────────────────────
const SITE = {
  organizationName: "Groupe ENOSIS",
  siteName: "Centre d'imagerie du Centre de l'Arthrose",
  siteAddress: "6 Rue Georges Nègrevergne – 33700 Mérignac",
  sitePhone: "05 56 12 16 93",
  siteOpeningHours: "Du lundi au vendredi : 7h45 – 20h00 · Samedi : 8h00 – 16h00",
  exams: ["Échographie", "Infiltration", "IRM", "PLA", "PRP", "Radiofréquence", "Radiographie", "Scanner"],
  calendlyUrl: "{{calendlyUrl}}",
};

// ───────────────────────────── Mock Data ─────────────────────────────
type RawMotif = {
  examType: string;
  importedLabel: string;
  patientLabel?: string;
  status?: MotifStatus;
  patientInstructions?: string;
  minAge?: number | null;
  maxAge?: number | null;
  price?: string;
  requiresTriage?: boolean;
  flags?: string[];
};

const RAW_MOTIFS: RawMotif[] = [
  // IRM (triage by default)
  { examType: "IRM", importedLabel: "IRM GENOU", patientLabel: "IRM du genou", price: "330€", flags: ["IRM"] },
  { examType: "IRM", importedLabel: "IRM ÉPAULE", patientLabel: "IRM de l'épaule", price: "330€", flags: ["IRM"] },
  { examType: "IRM", importedLabel: "IRM HANCHE", patientLabel: "", price: "330€", flags: ["IRM", "Nom patient manquant"] },
  { examType: "IRM", importedLabel: "IRM CHEVILLE", patientLabel: "IRM de la cheville", price: "330€", flags: ["IRM"] },
  { examType: "IRM", importedLabel: "IRM RACHIS LOMBAIRE", patientLabel: "", price: "330€", flags: ["IRM", "Nom patient manquant"] },
  { examType: "IRM", importedLabel: "IRM RACHIS CERVICAL", patientLabel: "IRM du rachis cervical", price: "330€", flags: ["IRM"] },
  { examType: "IRM", importedLabel: "IRM POIGNET", patientLabel: "IRM du poignet", flags: ["IRM"] },
  { examType: "IRM", importedLabel: "IRM PIED", patientLabel: "" , flags: ["IRM", "Nom patient manquant"] },

  // Scanner (triage by default)
  { examType: "Scanner", importedLabel: "SCANNER GENOU", patientLabel: "Scanner du genou", price: "À partir de 80€", flags: ["SCANNER"] },
  { examType: "Scanner", importedLabel: "SCANNER ÉPAULE", patientLabel: "Scanner de l'épaule", price: "À partir de 80€", flags: ["SCANNER"] },
  { examType: "Scanner", importedLabel: "SCANNER RACHIS LOMBAIRE", patientLabel: "Scanner du rachis lombaire", flags: ["SCANNER"] },
  { examType: "Scanner", importedLabel: "SCANNER BASSIN", patientLabel: "", flags: ["SCANNER", "Nom patient manquant"] },
  { examType: "Scanner", importedLabel: "ARTHRO-SCANNER ÉPAULE", patientLabel: "Arthro-scanner de l'épaule", patientInstructions: "Examen avec injection intra-articulaire. Merci d'apporter votre ordonnance et un bilan sanguin récent avec créatinine.", price: "Selon indication", flags: ["SCANNER", "INJECTION"] },
  { examType: "Scanner", importedLabel: "ARTHRO-SCANNER GENOU", patientLabel: "Arthro-scanner du genou", patientInstructions: "Examen avec injection intra-articulaire.", price: "Selon indication", flags: ["SCANNER", "INJECTION"] },
  { examType: "Scanner", importedLabel: "ARTHRO-SCANNER HANCHE", patientLabel: "", flags: ["SCANNER", "INJECTION", "Nom patient manquant"] },

  // Radiographie
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE GENOU", patientLabel: "Radiographie du genou", price: "40€" },
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE ÉPAULE", patientLabel: "Radiographie de l'épaule", price: "40€" },
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE BASSIN", patientLabel: "Radiographie du bassin", price: "40€" },
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE RACHIS", patientLabel: "Radiographie du rachis", price: "40€" },
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE PIED", patientLabel: "Radiographie du pied" },
  { examType: "Radiographie", importedLabel: "RADIOGRAPHIE MAIN", patientLabel: "" , flags: ["Nom patient manquant"] },
  { examType: "Radiographie", importedLabel: "EOS", patientLabel: "Radiographie EOS du rachis complet", minAge: 6, price: "60€", flags: ["Âge minimum"] },

  // Échographie
  { examType: "Échographie", importedLabel: "ÉCHOGRAPHIE MUSCULO-SQUELETTIQUE", patientLabel: "Échographie musculo-squelettique", price: "60€" },
  { examType: "Échographie", importedLabel: "ÉCHOGRAPHIE ÉPAULE", patientLabel: "Échographie de l'épaule", price: "60€" },
  { examType: "Échographie", importedLabel: "ÉCHOGRAPHIE GENOU", patientLabel: "Échographie du genou", price: "60€" },
  { examType: "Échographie", importedLabel: "ÉCHOGRAPHIE CHEVILLE", patientLabel: "" , flags: ["Nom patient manquant"] },
  { examType: "Échographie", importedLabel: "ÉCHOGRAPHIE TENDON D'ACHILLE", patientLabel: "Échographie du tendon d'Achille", price: "60€" },

  // Infiltration (often transfer / task)
  { examType: "Infiltration", importedLabel: "INFILTRATION SOUS ÉCHOGRAPHIE", patientLabel: "Infiltration sous échographie", status: "transfer", patientInstructions: "Merci d'apporter votre ordonnance et vos anciens examens. Un complément d'honoraires peut vous être demandé.", flags: ["À transférer"] },
  { examType: "Infiltration", importedLabel: "INFILTRATION ÉPAULE", patientLabel: "Infiltration de l'épaule", status: "transfer", price: "À partir de 80€", flags: ["À transférer"] },
  { examType: "Infiltration", importedLabel: "INFILTRATION GENOU", patientLabel: "Infiltration du genou", status: "transfer", price: "À partir de 80€", flags: ["À transférer"] },
  { examType: "Infiltration", importedLabel: "INFILTRATION HANCHE", patientLabel: "", status: "transfer", flags: ["À transférer", "Nom patient manquant"] },
  { examType: "Infiltration", importedLabel: "INFILTRATION RACHIDIENNE", patientLabel: "Infiltration rachidienne", status: "task", patientInstructions: "Acte technique. Le secrétariat vous rappellera pour confirmer le créneau et les consignes.", flags: ["Création de tâche"] },

  // PRP
  { examType: "PRP", importedLabel: "PRP GENOU", patientLabel: "PRP du genou", status: "task", patientInstructions: "Merci d'apporter votre ordonnance. Un complément d'honoraires sera demandé.", price: "À partir de 250€", flags: ["Création de tâche"] },
  { examType: "PRP", importedLabel: "PRP TENDON", patientLabel: "PRP tendineux", status: "task", price: "À partir de 250€", flags: ["Création de tâche"] },

  // PLA
  { examType: "PLA", importedLabel: "PLA ÉPAULE", patientLabel: "PLA de l'épaule", status: "task", flags: ["Création de tâche"] },
  { examType: "PLA", importedLabel: "PLA HANCHE", patientLabel: "", status: "task", flags: ["Création de tâche", "Nom patient manquant"] },

  // Radiofréquence
  { examType: "Radiofréquence", importedLabel: "RADIOFRÉQUENCE RACHIDIENNE", patientLabel: "Radiofréquence rachidienne", status: "transfer", patientInstructions: "Acte spécialisé. Transfert vers le secrétariat pour validation du dossier.", flags: ["À transférer"] },
  { examType: "Radiofréquence", importedLabel: "RADIOFRÉQUENCE GENOU", patientLabel: "Radiofréquence du genou", status: "transfer", flags: ["À transférer"] },

  // Bilans / consultations
  { examType: "Radiographie", importedLabel: "BILAN ARTHROSE", patientLabel: "Bilan arthrose", patientInstructions: "Merci d'apporter vos anciens examens et comptes rendus." },
  { examType: "Radiographie", importedLabel: "BILAN PROTHÈSE", patientLabel: "" , flags: ["Nom patient manquant"] },
];

function isTriageExam(examType: string, importedLabel: string): boolean {
  const u = (examType + " " + importedLabel).toUpperCase();
  return u.includes("IRM") || u.includes("SCANNER") || u.includes("TDM");
}

function buildMotifs(): ExamMotif[] {
  return RAW_MOTIFS.map((m, i) => {
    const requiresTriage = m.requiresTriage ?? isTriageExam(m.examType, m.importedLabel);
    return {
      id: `m-${i}`,
      examType: m.examType,
      importedLabel: m.importedLabel,
      patientLabel: m.patientLabel ?? "",
      status: m.status ?? "open",
      patientInstructions: m.patientInstructions ?? "",
      correctionInstructions: "",
      minAge: m.minAge ?? null,
      maxAge: m.maxAge ?? null,
      price: m.price ?? "",
      requiresTriage,
      triageConfigured: !requiresTriage,
      flags: m.flags ? [...m.flags] : [],
    };
  });
}

const TRIAGE_SEED: TriageQuestion[] = [
  { id: "t-irm-1", category: "IRM", title: "Présence d'un dispositif médical implanté ou d'un objet métallique", patientWording: "Avez-vous un pacemaker, un implant, un éclat métallique ou tout autre objet métallique dans le corps ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-irm-2", category: "IRM", title: "Allergie à l'iode ou au produit de contraste", patientWording: "Avez-vous déjà eu une allergie ou une réaction à un produit de contraste ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-irm-3", category: "IRM", title: "Grossesse ou suspicion de grossesse", patientWording: "Êtes-vous enceinte ou susceptible de l'être ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-sca-1", category: "Scanner", title: "Choix entre examen avec ou sans injection", patientWording: "Votre ordonnance précise-t-elle un scanner avec injection, sans injection, ou les deux sont-ils possibles ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-sca-2", category: "Scanner", title: "Antécédent d'allergie ou de réaction lors d'une injection de produit de contraste", patientWording: "Avez-vous déjà eu une réaction allergique après une injection de produit de contraste ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-sca-3", category: "Scanner", title: "Diabète ou insuffisance rénale connue", patientWording: "Êtes-vous diabétique ou avez-vous une insuffisance rénale connue ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-sca-4", category: "Scanner", title: "Bilan sanguin récent avec créatinine pour les patients de plus de 60 ans", patientWording: "Si vous avez plus de 60 ans, disposez-vous d'un bilan sanguin récent avec créatinine ?", enabled: true, processStatus: "", customInstruction: "" },
  { id: "t-sca-5", category: "Scanner", title: "Grossesse ou suspicion de grossesse", patientWording: "Êtes-vous enceinte ou susceptible de l'être ?", enabled: true, processStatus: "", customInstruction: "" },
];

const PRACTITIONER_NAMES = [
  "DALLAUDIERE Benjamin", "HOCQUELET Arnaud", "LINTINGRE Pierre-François",
  "PESQUER Lionel", "POUSSANG Nicolas", "SANS Hugo",
  "SILVESTRE Alain", "BISE Sylvain", "MEYER Philippe",
  "PEREZ Jean-Thomas", "MARABAUT Pierre", "REICH Stéphanie",
];

function buildPractitioners(): Practitioner[] {
  return PRACTITIONER_NAMES.map((name, i) => ({
    id: `p-${i}`,
    name,
    status: i % 11 === 0 ? "transfer" : "open",
    sector: i % 5 === 0 ? "a_definir" : i % 3 === 0 ? "secteur_2" : "secteur_1",
    minAge: i % 9 === 0 ? 16 : null,
    maxAge: null,
    instructions: "",
  }));
}

const INSTRUCTION_CHIPS: Array<{ label: string; template: string }> = [
  { label: "Ordonnance obligatoire", template: "Merci d'apporter votre ordonnance le jour de l'examen." },
  { label: "Apporter les anciens examens", template: "Merci d'apporter vos anciens examens et comptes rendus." },
  { label: "Bilan sanguin créatinine", template: "Un bilan sanguin récent avec créatinine peut être nécessaire." },
  { label: "Complément d'honoraires possible", template: "Un complément d'honoraires peut vous être demandé." },
  { label: "Ne pas porter de bijoux", template: "Merci de ne pas porter de bijoux le jour de l'examen." },
  { label: "Grossesse à signaler", template: "Merci de signaler toute grossesse ou suspicion de grossesse." },
];

// ───────────────────────────── Helpers ─────────────────────────────
function suggestPatientLabel(imported: string): string {
  const u = imported.toUpperCase();
  if (u.includes("ARTHRO-SCANNER")) return "Arthro-scanner";
  if (u.includes("IRM")) return "IRM";
  if (u.includes("SCANNER")) return "Scanner";
  if (u.includes("RADIO") || u.includes("EOS")) return "Radiographie";
  if (u.includes("INFILTRATION")) return "Infiltration";
  if (u.includes("PRP")) return "PRP";
  if (u.includes("PLA")) return "PLA";
  if (u.includes("RADIOFRÉQUENCE")) return "Radiofréquence";
  if (u.includes("ÉCHO") || u.includes("ECHO")) return "Échographie";
  return imported.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(s: MotifStatus | "open" | "closed" | "transfer") {
  switch (s) {
    case "open": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "closed": return "bg-rose-50 text-rose-700 border-rose-200";
    case "transfer": return "bg-orange-50 text-orange-700 border-orange-200";
    case "task": return "bg-amber-50 text-amber-800 border-amber-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
function getStatusLabel(s: MotifStatus) {
  return { open: "Ouvert", closed: "Fermé", transfer: "À transférer", task: "Création de tâche" }[s];
}
function getSectorLabel(s: Practitioner["sector"]) {
  return { secteur_1: "Secteur 1", secteur_2: "Secteur 2", non_conventionne: "Non conventionné", a_definir: "À définir" }[s];
}

function getMotifCompletion(m: ExamMotif): boolean {
  if (!m.patientLabel.trim()) return false;
  if (!m.status) return false;
  if (m.status === "open" && m.requiresTriage && !m.triageConfigured) return false;
  return true;
}
function isPriority(m: ExamMotif) {
  return !m.patientLabel.trim() || (m.status === "open" && m.requiresTriage && !m.triageConfigured);
}
function getTriageCompletion(q: TriageQuestion): boolean {
  if (!q.enabled) return true;
  if (!q.processStatus) return false;
  if (q.processStatus === "modify" && !q.customInstruction.trim()) return false;
  return true;
}
function getPractitionerCompletion(p: Practitioner): boolean {
  return !!p.status && p.sector !== "a_definir";
}

// ───────────────────────────── Component ─────────────────────────────
export default function VoccaImagingConfigApp() {
  const [currentStep, setCurrentStep] = useState<Step>("onboarding");
  const [motifs, setMotifs] = useState<ExamMotif[]>(() => buildMotifs());
  const [triage, setTriage] = useState<TriageQuestion[]>(TRIAGE_SEED);
  const [practitioners, setPractitioners] = useState<Practitioner[]>(() => buildPractitioners());
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [toast, setToast] = useState<string | null>(null);

  // motifs UI state
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("priority");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [bulkInstructionOpen, setBulkInstructionOpen] = useState(false);
  const [bulkInstructionText, setBulkInstructionText] = useState("");

  // practitioners UI
  const [pSearch, setPSearch] = useState("");
  const [pFilter, setPFilter] = useState("all");
  const [expandedP, setExpandedP] = useState<Set<string>>(new Set());

  // final
  const [finalComments, setFinalComments] = useState("");
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const manualSave = useCallback(() => {
    setLastSaved(new Date());
    showToast("Progression enregistrée");
  }, [showToast]);

  useEffect(() => {
    const id = setInterval(() => setLastSaved(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  function getGlobalProgress(): number {
    const totalM = motifs.length;
    const doneM = motifs.filter(getMotifCompletion).length;
    const doneT = triage.filter(getTriageCompletion).length;
    const totalT = triage.length;
    const doneP = practitioners.filter(getPractitionerCompletion).length;
    const totalP = practitioners.length;
    const total = totalM + totalT + totalP;
    if (!total) return 0;
    return Math.round(((doneM + doneT + doneP) / total) * 100);
  }

  // ───── Filters ─────
  const filteredMotifs = useMemo(() => {
    let list = motifs;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.importedLabel.toLowerCase().includes(s) ||
          m.patientLabel.toLowerCase().includes(s) ||
          m.patientInstructions.toLowerCase().includes(s) ||
          m.examType.toLowerCase().includes(s)
      );
    }
    switch (activeFilter) {
      case "priority": list = list.filter(isPriority); break;
      case "incomplete": list = list.filter((m) => !getMotifCompletion(m)); break;
      case "no_label": list = list.filter((m) => !m.patientLabel.trim()); break;
      case "no_price": list = list.filter((m) => !m.price?.trim()); break;
      case "transfer": list = list.filter((m) => m.status === "transfer"); break;
      case "closed": list = list.filter((m) => m.status === "closed"); break;
      case "task": list = list.filter((m) => m.status === "task"); break;
      case "irm": list = list.filter((m) => m.examType === "IRM"); break;
      case "scanner": list = list.filter((m) => m.examType === "Scanner"); break;
      case "echo": list = list.filter((m) => m.examType.toLowerCase().includes("écho")); break;
      case "infiltration": list = list.filter((m) => m.examType === "Infiltration" || m.examType === "PRP" || m.examType === "PLA"); break;
      case "instructions": list = list.filter((m) => !!m.patientInstructions.trim()); break;
      case "triage_needed": list = list.filter((m) => m.requiresTriage); break;
      default: break;
    }
    return list;
  }, [motifs, search, activeFilter]);

  function updateMotif(id: string, patch: Partial<ExamMotif>) {
    setMotifs((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function toggleSelected(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectAllVisible() {
    setSelected(new Set(filteredMotifs.map((m) => m.id)));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function applyBulkAction(action: string, value?: string | number) {
    setMotifs((prev) =>
      prev.map((m) => {
        if (!selected.has(m.id)) return m;
        switch (action) {
          case "status_open": return { ...m, status: "open" };
          case "status_closed": return { ...m, status: "closed" };
          case "status_transfer": return { ...m, status: "transfer" };
          case "status_task": return { ...m, status: "task" };
          case "triage_on": return { ...m, requiresTriage: true };
          case "triage_off": return { ...m, requiresTriage: false, triageConfigured: true };
          case "instruction": return { ...m, patientInstructions: m.patientInstructions ? m.patientInstructions + "\n" + (value as string) : (value as string) };
          case "min_age": return { ...m, minAge: value as number };
          case "max_age": return { ...m, maxAge: value as number };
          case "price": return { ...m, price: value as string };
          default: return m;
        }
      })
    );
    showToast(`Action appliquée à ${selected.size} motif(s)`);
    clearSelection();
  }

  function aiHelper(kind: string) {
    setMotifs((prev) =>
      prev.map((m) => {
        const u = m.importedLabel.toUpperCase();
        switch (kind) {
          case "suggest_labels":
            if (!m.patientLabel.trim()) return { ...m, patientLabel: suggestPatientLabel(m.importedLabel) };
            return m;
          case "injection":
            if ((u.includes("INJECTION") || u.includes("CONTRASTE") || u.includes("ARTHRO")) && !m.flags.includes("INJECTION")) return { ...m, flags: [...m.flags, "INJECTION"] };
            return m;
          case "triage":
            if (isTriageExam(m.examType, m.importedLabel)) {
              return { ...m, requiresTriage: true };
            }
            return { ...m, requiresTriage: false, triageConfigured: true };
          default: return m;
        }
      })
    );
    if (kind === "duplicates") {
      const counts = new Map<string, number>();
      motifs.forEach((m) => counts.set(m.importedLabel, (counts.get(m.importedLabel) ?? 0) + 1));
      const dups = Array.from(counts.values()).filter((v) => v > 1).length;
      showToast(`${dups} libellé(s) en doublon détecté(s)`);
      return;
    }
    showToast("Assistant Vocca appliqué");
  }

  // ───── Blocking issues ─────
  const blockingIssues = useMemo(() => {
    const issues: Array<{ kind: string; label: string; count: number }> = [];
    const noLabel = motifs.filter((m) => !m.patientLabel.trim()).length;
    if (noLabel) issues.push({ kind: "no_label", label: "Motifs sans nom patient", count: noLabel });
    const noStatus = motifs.filter((m) => !m.status).length;
    if (noStatus) issues.push({ kind: "no_status", label: "Motifs avec statut manquant", count: noStatus });
    const triageNeeded = motifs.filter((m) => m.status === "open" && m.requiresTriage && !m.triageConfigured).length;
    if (triageNeeded) issues.push({ kind: "triage_needed", label: "Motifs IRM / Scanner avec triage requis mais non configuré", count: triageNeeded });
    const triageNoStatus = triage.filter((q) => q.enabled && !q.processStatus).length;
    if (triageNoStatus) issues.push({ kind: "triage_status", label: "Questions de triage activées sans statut de conformité", count: triageNoStatus });
    const triageMod = triage.filter((q) => q.enabled && q.processStatus === "modify" && !q.customInstruction.trim()).length;
    if (triageMod) issues.push({ kind: "triage_mod", label: "Questions de triage « À modifier » sans instruction", count: triageMod });
    const noSector = practitioners.filter((p) => p.sector === "a_definir").length;
    if (noSector) issues.push({ kind: "no_sector", label: "Praticiens sans conventionnement", count: noSector });
    return issues;
  }, [motifs, triage, practitioners]);

  const drawerMotif = drawerId ? motifs.find((m) => m.id === drawerId) ?? null : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 text-slate-900">
      <Header
        progress={getGlobalProgress()}
        lastSaved={lastSaved}
        onSave={manualSave}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-8">
        {currentStep === "onboarding" && <OnboardingScreen onStart={() => setCurrentStep("motifs")} />}

        {currentStep === "motifs" && (
          <MotifsScreen
            motifs={motifs}
            filtered={filteredMotifs}
            search={search}
            setSearch={setSearch}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selected={selected}
            toggleSelected={toggleSelected}
            selectAllVisible={selectAllVisible}
            clearSelection={clearSelection}
            updateMotif={updateMotif}
            openDrawer={(id) => setDrawerId(id)}
            applyBulkAction={applyBulkAction}
            bulkInstructionOpen={bulkInstructionOpen}
            setBulkInstructionOpen={setBulkInstructionOpen}
            bulkInstructionText={bulkInstructionText}
            setBulkInstructionText={setBulkInstructionText}
            aiHelper={aiHelper}
            onBack={() => setCurrentStep("onboarding")}
            onNext={() => setCurrentStep("triage")}
          />
        )}

        {currentStep === "triage" && (
          <TriageScreen
            triage={triage}
            setTriage={setTriage}
            onBack={() => setCurrentStep("motifs")}
            onNext={() => setCurrentStep("practitioners")}
          />
        )}

        {currentStep === "practitioners" && (
          <PractitionersScreen
            practitioners={practitioners}
            setPractitioners={setPractitioners}
            search={pSearch}
            setSearch={setPSearch}
            filter={pFilter}
            setFilter={setPFilter}
            expanded={expandedP}
            setExpanded={setExpandedP}
            onBack={() => setCurrentStep("triage")}
            onNext={() => setCurrentStep("final")}
            showToast={showToast}
          />
        )}

        {currentStep === "final" && (
          <FinalScreen
            motifs={motifs}
            triage={triage}
            practitioners={practitioners}
            blockingIssues={blockingIssues}
            comments={finalComments}
            setComments={setFinalComments}
            confirmed={finalConfirmed}
            setConfirmed={setFinalConfirmed}
            submitting={submitting}
            submitted={submitted}
            onSubmit={() => {
              setSubmitting(true);
              setTimeout(() => {
                setSubmitting(false);
                setSubmitted(true);
              }, 1400);
            }}
            onBack={() => setCurrentStep("practitioners")}
          />
        )}
      </main>

      {drawerMotif && (
        <MotifDrawer
          motif={drawerMotif}
          onClose={() => setDrawerId(null)}
          onUpdate={(patch) => updateMotif(drawerMotif.id, patch)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-slate-900 text-white text-sm px-5 py-2.5 shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Sub-components ─────────────────────────────

function VoccaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-3">
      <div className={`${dim} rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white grid place-items-center font-bold shadow-md shadow-violet-500/20`}>
        <span className={text}>V</span>
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-slate-900 text-base">Vocca</div>
        <div className="text-[11px] text-slate-500">Configuration assistant vocal</div>
      </div>
    </div>
  );
}

function Header({ progress, lastSaved, onSave }: { progress: number; lastSaved: Date; onSave: () => void }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-slate-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <VoccaLogo size="sm" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 min-w-0">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{SITE.organizationName}</div>
              <div className="text-[11px] text-slate-500 truncate">{SITE.siteName}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-40 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600 tabular-nums">{progress}%</span>
          </div>
          <span className="hidden md:inline text-xs text-slate-400">
            Enregistré à {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={onSave} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </header>
  );
}

function OnboardingScreen({ onStart }: { onStart: () => void }) {
  const cards = [
    { icon: ClipboardList, emoji: "📋", title: "Motifs d'examen", text: "Vérifiez les motifs importés depuis votre logiciel de prise de rendez-vous : libellé patient, statut, transfert éventuel, prix, consignes et exceptions." },
    { icon: Zap, emoji: "⚡️", title: "Traitement par exception", text: "Vocca a déjà identifié les motifs IRM et Scanner nécessitant un triage. Vous n'avez pas besoin de tout reprendre ligne par ligne." },
    { icon: MessageSquare, emoji: "💬", title: "Questions de triage", text: "Pour les IRM et scanners, choisissez les questions que Vocca doit poser avant d'orienter la prise de rendez-vous." },
    { icon: Users, emoji: "👥", title: "Praticiens", text: "Vérifiez les praticiens actifs, leur conventionnement, leurs restrictions d'âge éventuelles et leurs consignes spécifiques." },
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <VoccaLogo size="lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          Votre configuration ENOSIS
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          Cette configuration a été pré-remplie pour <span className="font-semibold text-slate-800">{SITE.siteName} — {SITE.organizationName}</span>. Vérifiez les éléments importés et adaptez Vocca à vos règles internes.
        </p>
      </div>

      {/* Site identity card */}
      <div className="rounded-2xl bg-white border border-slate-200/70 p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white shadow-md shadow-violet-500/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">{SITE.organizationName}</div>
            <div className="font-semibold text-slate-900 text-lg leading-tight">{SITE.siteName}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-700">{SITE.siteAddress}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-700">{SITE.sitePhone}</span>
          </div>
          <div className="flex items-start gap-2.5 sm:col-span-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-700">{SITE.siteOpeningHours}</span>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2.5">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Examens détectés sur le site</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SITE.exams.map((e) => (
              <span key={e} className="inline-flex items-center text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1">
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 grid place-items-center">
                <c.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 mb-1">{c.title} <span className="text-base ml-1">{c.emoji}</span></div>
                <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 mb-8 flex gap-4">
        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-900 mb-1">Conseil pratique</div>
          <p className="text-sm text-amber-800">
            Pas besoin de tout réécrire. Concentrez-vous sur les exceptions : motifs fermés, examens à transférer, infiltrations, consignes particulières et règles propres à certains praticiens.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-500/20"
        >
          Commencer la configuration
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string | number; accent?: "emerald" | "amber" | "rose" | "indigo" }) {
  const accentCls =
    accent === "emerald" ? "text-emerald-700"
    : accent === "amber" ? "text-amber-700"
    : accent === "rose" ? "text-rose-700"
    : accent === "indigo" ? "text-indigo-700"
    : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${accentCls}`}>{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{count}</span>
      )}
    </button>
  );
}

function MotifsScreen(props: {
  motifs: ExamMotif[];
  filtered: ExamMotif[];
  search: string; setSearch: (s: string) => void;
  activeFilter: string; setActiveFilter: (s: string) => void;
  selected: Set<string>;
  toggleSelected: (id: string) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  updateMotif: (id: string, patch: Partial<ExamMotif>) => void;
  openDrawer: (id: string) => void;
  applyBulkAction: (action: string, value?: string | number) => void;
  bulkInstructionOpen: boolean; setBulkInstructionOpen: (b: boolean) => void;
  bulkInstructionText: string; setBulkInstructionText: (s: string) => void;
  aiHelper: (kind: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { motifs, filtered, search, setSearch, activeFilter, setActiveFilter, selected,
    toggleSelected, selectAllVisible, clearSelection, updateMotif, openDrawer,
    applyBulkAction, bulkInstructionOpen, setBulkInstructionOpen, bulkInstructionText, setBulkInstructionText,
    aiHelper, onBack, onNext } = props;

  const total = motifs.length;
  const configured = motifs.filter(getMotifCompletion).length;
  const incomplete = motifs.filter((m) => !getMotifCompletion(m)).length;
  const priority = motifs.filter(isPriority).length;
  const open = motifs.filter((m) => m.status === "open").length;
  const transfers = motifs.filter((m) => m.status === "transfer").length;
  const closed = motifs.filter((m) => m.status === "closed").length;
  const triageCount = motifs.filter((m) => m.requiresTriage).length;
  const withPrice = motifs.filter((m) => !!m.price?.trim()).length;

  const filters: Array<{ key: string; label: string; count?: number }> = [
    { key: "all", label: "Tous", count: total },
    { key: "priority", label: "À traiter en priorité", count: priority },
    { key: "incomplete", label: "Incomplets", count: incomplete },
    { key: "no_label", label: "Sans nom patient" },
    { key: "no_price", label: "Sans prix" },
    { key: "transfer", label: "À transférer" },
    { key: "closed", label: "Fermés" },
    { key: "task", label: "Création de tâche" },
    { key: "irm", label: "IRM" },
    { key: "scanner", label: "Scanner" },
    { key: "echo", label: "Échographie" },
    { key: "infiltration", label: "Infiltration / PRP / PLA" },
    { key: "instructions", label: "Avec instructions" },
    { key: "triage_needed", label: "Nécessite triage" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Retour
          </button>
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            Motifs importés pour ce site
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Vocca a pré-identifié les motifs IRM et Scanner nécessitant un triage. Vérifiez uniquement ce qui sort de la règle générale.
          </p>
        </div>
      </div>

      {/* Progress + KPIs */}
      <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">{configured} / {total} motifs configurés</span>
            <div className="w-48 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${total ? (configured / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <KpiTile label="Total" value={total} />
          <KpiTile label="Priorité" value={priority} accent="amber" />
          <KpiTile label="Incomplets" value={incomplete} accent="rose" />
          <KpiTile label="Ouverts" value={open} accent="emerald" />
          <KpiTile label="Transférés" value={transfers} />
          <KpiTile label="Fermés" value={closed} />
          <KpiTile label="Avec triage" value={triageCount} />
          <KpiTile label="Configurés" value={configured} accent="emerald" />
        </div>
      </div>

      {priority > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-indigo-900">Nous avons identifié {priority} motifs à traiter en priorité.</span>{" "}
            <span className="text-indigo-800">Les autres motifs semblent standards.</span>
          </div>
          <button onClick={() => setActiveFilter("priority")} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap">
            Afficher la priorité →
          </button>
        </div>
      )}

      {/* AI helpers */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 mr-2"><Wand2 className="w-3.5 h-3.5" /> Assistant Vocca :</span>
        {[
          { k: "suggest_labels", l: "Suggérer les libellés patients manquants" },
          { k: "duplicates", l: "Détecter les doublons" },
          { k: "injection", l: "Identifier les motifs avec injection" },
          { k: "triage", l: "Réappliquer le triage recommandé" },
        ].map((b) => (
          <button key={b.k} onClick={() => aiHelper(b.k)}
            className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
            <Sparkles className="w-3 h-3" /> {b.l}
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un motif, un libellé importé ou une instruction…"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {filters.map((f) => (
            <FilterChip key={f.key} active={activeFilter === f.key} onClick={() => setActiveFilter(f.key)} count={f.count}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-30 rounded-2xl bg-slate-900 text-white p-3 shadow-lg flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold mr-2">{selected.size} motifs sélectionnés</span>
          <BulkBtn onClick={() => applyBulkAction("status_open")}>Marquer ouvert</BulkBtn>
          <BulkBtn onClick={() => applyBulkAction("status_closed")}>Marquer fermé</BulkBtn>
          <BulkBtn onClick={() => applyBulkAction("status_transfer")}>Transférer</BulkBtn>
          <BulkBtn onClick={() => applyBulkAction("status_task")}>Créer tâche</BulkBtn>
          <BulkBtn onClick={() => applyBulkAction("triage_on")}>Activer triage</BulkBtn>
          <BulkBtn onClick={() => applyBulkAction("triage_off")}>Désactiver triage</BulkBtn>
          <BulkBtn onClick={() => setBulkInstructionOpen(!bulkInstructionOpen)}>+ Instruction</BulkBtn>
          <BulkBtn onClick={() => {
            const v = prompt("Prix à appliquer (ex : 40€) ?");
            if (v) applyBulkAction("price", v);
          }}>Prix</BulkBtn>
          <BulkBtn onClick={() => {
            const v = prompt("Âge minimum à appliquer ?");
            if (v) applyBulkAction("min_age", parseInt(v, 10));
          }}>Âge min</BulkBtn>
          <BulkBtn onClick={() => {
            const v = prompt("Âge maximum à appliquer ?");
            if (v) applyBulkAction("max_age", parseInt(v, 10));
          }}>Âge max</BulkBtn>
          <button onClick={clearSelection} className="ml-auto text-xs text-slate-300 hover:text-white">Tout désélectionner</button>
        </div>
      )}
      {bulkInstructionOpen && selected.size > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-3 flex gap-2 items-center">
          <input
            value={bulkInstructionText}
            onChange={(e) => setBulkInstructionText(e.target.value)}
            placeholder="Instruction à appliquer aux motifs sélectionnés…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            onClick={() => {
              if (bulkInstructionText.trim()) {
                applyBulkAction("instruction", bulkInstructionText);
                setBulkInstructionText("");
                setBulkInstructionOpen(false);
              }
            }}
            className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && filtered.every((m) => selected.has(m.id))}
                    onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-3 text-left">Type d'examen</th>
                <th className="px-3 py-3 text-left">Libellé importé</th>
                <th className="px-3 py-3 text-left">Nom côté patient</th>
                <th className="px-3 py-3 text-left">Statut</th>
                <th className="px-3 py-3 text-left">Âge min</th>
                <th className="px-3 py-3 text-left">Âge max</th>
                <th className="px-3 py-3 text-left">Prix</th>
                <th className="px-3 py-3 text-left">Triage</th>
                <th className="px-3 py-3 text-left">Alertes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                    <div className="font-semibold text-slate-700">Aucun motif à afficher</div>
                    <p className="text-xs mt-1">Les autres motifs semblent standards.</p>
                  </td>
                </tr>
              )}
              {filtered.map((m) => {
                const complete = getMotifCompletion(m);
                const missingLabel = !m.patientLabel.trim();
                return (
                  <tr
                    key={m.id}
                    onClick={() => openDrawer(m.id)}
                    className={`hover:bg-slate-50/60 cursor-pointer ${selected.has(m.id) ? "bg-indigo-50/40" : ""}`}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggleSelected(m.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 rounded-md px-2 py-0.5">{m.examType}</span>
                      {complete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline-block ml-1.5" />}
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <div className="text-xs font-medium text-slate-700 truncate" title={m.importedLabel}>{m.importedLabel}</div>
                    </td>
                    <td className="px-3 py-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <input
                          value={m.patientLabel}
                          onChange={(e) => updateMotif(m.id, { patientLabel: e.target.value })}
                          placeholder={missingLabel ? "Nom patient manquant" : ""}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                            missingLabel ? "border-rose-200 bg-rose-50/40 placeholder-rose-400" : "border-slate-200"
                          }`}
                        />
                        <button
                          onClick={() => updateMotif(m.id, { patientLabel: suggestPatientLabel(m.importedLabel) })}
                          title="Suggérer un libellé simple"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={m.status}
                        onChange={(e) => updateMotif(m.id, { status: e.target.value as MotifStatus })}
                        className={`rounded-lg border text-xs font-medium px-2 py-1.5 focus:outline-none ${getStatusColor(m.status)}`}
                      >
                        <option value="open">Ouvert</option>
                        <option value="closed">Fermé</option>
                        <option value="transfer">À transférer</option>
                        <option value="task">Création de tâche</option>
                      </select>
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input type="number" min={0}
                        value={m.minAge ?? ""}
                        onChange={(e) => updateMotif(m.id, { minAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input type="number" min={0}
                        value={m.maxAge ?? ""}
                        onChange={(e) => updateMotif(m.id, { maxAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={m.price ?? ""}
                        onChange={(e) => updateMotif(m.id, { price: e.target.value })}
                        placeholder="Ex : 40€"
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateMotif(m.id, { requiresTriage: !m.requiresTriage, triageConfigured: m.requiresTriage ? true : false })}
                        className={`relative w-9 h-5 rounded-full transition ${m.requiresTriage ? "bg-indigo-600" : "bg-slate-200"}`}
                        title="Nécessite triage"
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition ${m.requiresTriage ? "translate-x-4" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {m.flags.length === 0 && <span className="text-[11px] text-slate-400">—</span>}
                        {m.flags.slice(0, 3).map((f) => (
                          <span key={f} className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-medium">
                            <AlertTriangle className="w-2.5 h-2.5" />{f}
                          </span>
                        ))}
                        {m.flags.length > 3 && <span className="text-[10px] text-slate-500">+{m.flags.length - 3}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Cliquez sur une ligne pour voir les détails. {withPrice} motif(s) avec prix renseigné.
        </p>
        <div className="flex gap-2">
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Retour
          </button>
          <button onClick={onNext} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 text-sm font-semibold shadow">
            Valider et passer aux questions de triage
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5">
      {children}
    </button>
  );
}

function MotifDrawer({ motif, onClose, onUpdate }: { motif: ExamMotif; onClose: () => void; onUpdate: (p: Partial<ExamMotif>) => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Motif d'examen</div>
            <div className="font-semibold text-slate-900">{motif.importedLabel}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-6">
          <Field label="Libellé importé">
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{motif.importedLabel}</div>
          </Field>

          <Field label="Nom côté patient">
            <div className="flex gap-2">
              <input value={motif.patientLabel} onChange={(e) => onUpdate({ patientLabel: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              <button onClick={() => onUpdate({ patientLabel: suggestPatientLabel(motif.importedLabel) })}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 text-indigo-700 px-3 py-2 text-xs font-medium hover:bg-indigo-100">
                <Sparkles className="w-3.5 h-3.5" /> Suggérer
              </button>
            </div>
          </Field>

          <Field label="Statut">
            <select value={motif.status}
              onChange={(e) => onUpdate({ status: e.target.value as MotifStatus })}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${getStatusColor(motif.status)}`}>
              <option value="open">Ouvert · Vocca peut gérer la prise de rendez-vous</option>
              <option value="closed">Fermé · Vocca ne propose pas ce rendez-vous</option>
              <option value="transfer">À transférer · Vocca transfère l'appel au secrétariat</option>
              <option value="task">Création de tâche · Vocca collecte les infos et crée une tâche</option>
            </select>
          </Field>

          <Field label="Prix">
            <input value={motif.price ?? ""} onChange={(e) => onUpdate({ price: e.target.value })}
              placeholder="Ex : 40€, À partir de 60€, Selon indication…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>

          <Field label="Instructions patient">
            <textarea
              value={motif.patientInstructions}
              onChange={(e) => onUpdate({ patientInstructions: e.target.value })}
              rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Les consignes patient seront formulées clairement pendant l'appel."
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {INSTRUCTION_CHIPS.map((c) => (
                <button key={c.label}
                  onClick={() => {
                    const cur = motif.patientInstructions;
                    onUpdate({ patientInstructions: cur ? cur + " " + c.template : c.template });
                  }}
                  className="text-[11px] rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 px-2.5 py-1 font-medium">
                  + {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Instructions internes / corrections">
            <textarea value={motif.correctionInstructions}
              onChange={(e) => onUpdate({ correctionInstructions: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Âge minimum">
              <input type="number" min={0} value={motif.minAge ?? ""}
                onChange={(e) => onUpdate({ minAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </Field>
            <Field label="Âge maximum">
              <input type="number" min={0} value={motif.maxAge ?? ""}
                onChange={(e) => onUpdate({ maxAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </Field>
          </div>

          {motif.requiresTriage && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5" />
              Ce motif nécessite des questions de triage. Configurez-les à l'étape Questions de triage.
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 text-sm font-semibold shadow"
          >
            <Check className="w-4 h-4" /> Fermer
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TriageScreen({ triage, setTriage, onBack, onNext }: {
  triage: TriageQuestion[]; setTriage: React.Dispatch<React.SetStateAction<TriageQuestion[]>>;
  onBack: () => void; onNext: () => void;
}) {
  const irm = triage.filter((q) => q.category === "IRM");
  const sca = triage.filter((q) => q.category === "Scanner");
  const irmDone = irm.filter(getTriageCompletion).length;
  const scaDone = sca.filter(getTriageCompletion).length;

  function update(id: string, patch: Partial<TriageQuestion>) {
    setTriage((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
          <ChevronLeft className="w-3.5 h-3.5" /> Retour
        </button>
        <h2 className="text-2xl font-semibold text-slate-900">Questions de triage IRM &amp; Scanner</h2>
        <p className="text-sm text-slate-600 mt-1">Choisissez les questions que Vocca doit poser au patient avant d'orienter la prise de rendez-vous.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900">IRM</h3>
            <span className="text-xs font-medium text-slate-500">{irmDone} / {irm.length} configurées</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${irm.length ? (irmDone / irm.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900">Scanner</h3>
            <span className="text-xs font-medium text-slate-500">{scaDone} / {sca.length} configurées</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-violet-500" style={{ width: `${sca.length ? (scaDone / sca.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {(["IRM", "Scanner"] as const).map((cat) => (
        <div key={cat} className="space-y-3">
          <h3 className="font-semibold text-slate-900 text-lg">{cat}</h3>
          {triage.filter((q) => q.category === cat).map((q) => {
            const done = getTriageCompletion(q);
            const badge = !q.enabled ? { l: "Désactivée", c: "bg-slate-100 text-slate-600 border-slate-200" }
              : q.processStatus === "modify" ? { l: "À modifier", c: "bg-amber-50 text-amber-700 border-amber-200" }
              : { l: "Activée", c: "bg-emerald-50 text-emerald-700 border-emerald-200" };
            return (
              <div key={q.id} className={`rounded-2xl bg-white border p-5 shadow-sm ${done && q.enabled ? "border-emerald-200" : "border-slate-200/70"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${badge.c}`}>{badge.l}</span>
                      {done && q.enabled && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="font-semibold text-slate-900">{q.title}</div>
                    <p className="text-sm text-slate-600 italic mt-1">"{q.patientWording}"</p>
                  </div>
                  <button
                    onClick={() => update(q.id, { enabled: !q.enabled })}
                    className={`relative w-11 h-6 rounded-full transition shrink-0 ${q.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${q.enabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>

                {q.enabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Conforme à votre process ?">
                      <select value={q.processStatus}
                        onChange={(e) => update(q.id, { processStatus: e.target.value as TriageQuestion["processStatus"] })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option value="">— Sélectionner —</option>
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                        <option value="modify">À modifier</option>
                      </select>
                    </Field>
                    <Field label="Phrase à modifier ou instruction spécifique">
                      <textarea
                        rows={2}
                        value={q.customInstruction}
                        onChange={(e) => update(q.id, { customInstruction: e.target.value })}
                        placeholder={q.processStatus === "modify" ? "Précisez la formulation attendue…" : "Optionnel"}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Retour</button>
        <button onClick={onNext} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 text-sm font-semibold shadow">
          Valider les questions de triage <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PractitionersScreen({
  practitioners, setPractitioners, search, setSearch, filter, setFilter, expanded, setExpanded, onBack, onNext, showToast,
}: {
  practitioners: Practitioner[];
  setPractitioners: React.Dispatch<React.SetStateAction<Practitioner[]>>;
  search: string; setSearch: (s: string) => void;
  filter: string; setFilter: (s: string) => void;
  expanded: Set<string>; setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  onBack: () => void; onNext: () => void;
  showToast: (s: string) => void;
}) {
  const total = practitioners.length;
  const configured = practitioners.filter(getPractitionerCompletion).length;

  function update(id: string, patch: Partial<Practitioner>) {
    setPractitioners((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const list = practitioners.filter((p) => {
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "incomplete" && getPractitionerCompletion(p)) return false;
    if (filter === "no_sector" && p.sector !== "a_definir") return false;
    return true;
  });

  function bulk(action: string) {
    setPractitioners((prev) => prev.map((p) => {
      switch (action) {
        case "all_open": return { ...p, status: "open" };
        case "all_s1": return { ...p, sector: "secteur_1" };
        default: return p;
      }
    }));
    showToast("Action appliquée");
  }

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
          <ChevronLeft className="w-3.5 h-3.5" /> Retour
        </button>
        <h2 className="text-2xl font-semibold text-slate-900">Praticiens du Centre de l'Arthrose</h2>
        <p className="text-sm text-slate-600 mt-1">Vérifiez les praticiens actifs, leur conventionnement et leurs consignes spécifiques.</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-slate-700">{configured} / {total} configurés</div>
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[120px] max-w-xs">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${total ? (configured / total) * 100 : 0}%` }} />
        </div>
        <button onClick={() => bulk("all_open")} className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Tout marquer Ouvert</button>
        <button onClick={() => bulk("all_s1")} className="text-xs font-medium rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Appliquer Secteur 1 à tous</button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un praticien…"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Tous</FilterChip>
          <FilterChip active={filter === "incomplete"} onClick={() => setFilter("incomplete")}>Incomplets</FilterChip>
          <FilterChip active={filter === "no_sector"} onClick={() => setFilter("no_sector")}>Sans conventionnement</FilterChip>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {list.map((p) => {
          const complete = getPractitionerCompletion(p);
          const isOpen = expanded.has(p.id);
          return (
            <div key={p.id}>
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <button onClick={() => toggleExpand(p.id)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{p.name}</div>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${getStatusColor(p.status)}`}>
                  {p.status === "open" ? "Ouvert" : p.status === "closed" ? "Fermé" : "À transférer"}
                </span>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${p.sector === "a_definir" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {getSectorLabel(p.sector)}
                </span>
                {(p.minAge != null || p.maxAge != null) && (
                  <span className="text-[11px] text-slate-500">{p.minAge ?? "—"} → {p.maxAge ?? "—"} ans</span>
                )}
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {complete ? "Configuré" : "À compléter"}
                </span>
              </div>
              {isOpen && (
                <div className="bg-slate-50/40 px-12 py-4 grid md:grid-cols-2 gap-4">
                  <Field label="Statut">
                    <select value={p.status} onChange={(e) => update(p.id, { status: e.target.value as Practitioner["status"] })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="open">Ouvert</option>
                      <option value="closed">Fermé</option>
                      <option value="transfer">À transférer</option>
                    </select>
                  </Field>
                  <Field label="Conventionnement">
                    <select value={p.sector} onChange={(e) => update(p.id, { sector: e.target.value as Practitioner["sector"] })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="secteur_1">Secteur 1</option>
                      <option value="secteur_2">Secteur 2</option>
                      <option value="non_conventionne">Non conventionné</option>
                      <option value="a_definir">À définir</option>
                    </select>
                  </Field>
                  <Field label="Âge min">
                    <input type="number" min={0} value={p.minAge ?? ""}
                      onChange={(e) => update(p.id, { minAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white" />
                  </Field>
                  <Field label="Âge max">
                    <input type="number" min={0} value={p.maxAge ?? ""}
                      onChange={(e) => update(p.id, { maxAge: e.target.value ? parseInt(e.target.value, 10) : null })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Instructions">
                      <textarea rows={2} value={p.instructions} onChange={(e) => update(p.id, { instructions: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white" />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Retour</button>
        <button onClick={onNext} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 text-sm font-semibold shadow">
          Passer au récapitulatif <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FinalScreen({
  motifs, triage, practitioners, blockingIssues, comments, setComments,
  confirmed, setConfirmed, submitting, submitted, onSubmit, onBack,
}: {
  motifs: ExamMotif[]; triage: TriageQuestion[]; practitioners: Practitioner[];
  blockingIssues: Array<{ kind: string; label: string; count: number }>;
  comments: string; setComments: (s: string) => void;
  confirmed: boolean; setConfirmed: (b: boolean) => void;
  submitting: boolean; submitted: boolean;
  onSubmit: () => void; onBack: () => void;
}) {
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 grid place-items-center text-white shadow-lg shadow-emerald-500/30 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-semibold text-slate-900">Configuration envoyée avec succès</h2>
        <p className="mt-3 text-slate-600">Votre configuration pour le {SITE.siteName} a bien été transmise à l'équipe Vocca. Nous allons vérifier les éléments et revenir vers vous pour la mise en production.</p>
        <div className="mt-8 rounded-2xl bg-white border border-slate-200/70 p-5 text-left shadow-sm">
          <div className="font-semibold text-slate-900 mb-3">Prochaines étapes</div>
          <ul className="space-y-2 text-sm text-slate-700">
            {["Analyse de votre configuration par l'équipe Vocca", "Vérification des règles spécifiques au Centre de l'Arthrose", "Préparation de la mise en production"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <a href={SITE.calendlyUrl} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 text-sm font-semibold shadow">
          <CalendarCheck className="w-4 h-4" /> Réserver un créneau de mise en route
        </a>
      </div>
    );
  }

  const motifStats = {
    total: motifs.length,
    configured: motifs.filter(getMotifCompletion).length,
    open: motifs.filter((m) => m.status === "open").length,
    closed: motifs.filter((m) => m.status === "closed").length,
    transfer: motifs.filter((m) => m.status === "transfer").length,
    task: motifs.filter((m) => m.status === "task").length,
    incomplete: motifs.filter((m) => !getMotifCompletion(m)).length,
    withPrice: motifs.filter((m) => !!m.price?.trim()).length,
  };
  const triageStats = {
    irmOn: triage.filter((q) => q.category === "IRM" && q.enabled).length,
    scaOn: triage.filter((q) => q.category === "Scanner" && q.enabled).length,
    toModify: triage.filter((q) => q.enabled && q.processStatus === "modify").length,
    incomplete: triage.filter((q) => !getTriageCompletion(q)).length,
  };
  const pStats = {
    configured: practitioners.filter(getPractitionerCompletion).length,
    open: practitioners.filter((p) => p.status === "open").length,
    transfer: practitioners.filter((p) => p.status === "transfer").length,
    noSector: practitioners.filter((p) => p.sector === "a_definir").length,
    age: practitioners.filter((p) => p.minAge != null || p.maxAge != null).length,
  };

  const canSubmit = blockingIssues.length === 0 && confirmed && !submitting;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
          <ChevronLeft className="w-3.5 h-3.5" /> Retour
        </button>
        <h2 className="text-2xl font-semibold text-slate-900">Configuration prête à être envoyée</h2>
        <p className="text-sm text-slate-600 mt-1">Relisez les éléments clés pour <span className="font-semibold">{SITE.siteName}</span> avant transmission à l'équipe Vocca.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <SummaryCard title="Motifs" icon={ClipboardList}>
          <SummaryRow label="Total motifs" value={motifStats.total} />
          <SummaryRow label="Motifs configurés" value={motifStats.configured} accent="emerald" />
          <SummaryRow label="Motifs ouverts" value={motifStats.open} />
          <SummaryRow label="Motifs fermés" value={motifStats.closed} />
          <SummaryRow label="Motifs transférés" value={motifStats.transfer} />
          <SummaryRow label="Motifs avec création de tâche" value={motifStats.task} />
          <SummaryRow label="Motifs incomplets" value={motifStats.incomplete} accent={motifStats.incomplete ? "rose" : undefined} />
          <SummaryRow label="Motifs avec prix renseigné" value={motifStats.withPrice} accent="indigo" />
        </SummaryCard>
        <SummaryCard title="Questions de triage" icon={MessageSquare}>
          <SummaryRow label="Questions IRM activées" value={triageStats.irmOn} />
          <SummaryRow label="Questions Scanner activées" value={triageStats.scaOn} />
          <SummaryRow label="Questions à modifier" value={triageStats.toModify} accent={triageStats.toModify ? "amber" : undefined} />
          <SummaryRow label="Questions incomplètes" value={triageStats.incomplete} accent={triageStats.incomplete ? "rose" : undefined} />
        </SummaryCard>
        <SummaryCard title="Praticiens" icon={Users}>
          <SummaryRow label="Praticiens configurés" value={pStats.configured} accent="emerald" />
          <SummaryRow label="Praticiens ouverts" value={pStats.open} />
          <SummaryRow label="Praticiens transférés" value={pStats.transfer} />
          <SummaryRow label="Praticiens sans conventionnement" value={pStats.noSector} accent={pStats.noSector ? "amber" : undefined} />
          <SummaryRow label="Praticiens avec restriction d'âge" value={pStats.age} />
        </SummaryCard>
      </div>

      {blockingIssues.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">Certains éléments nécessitent encore votre attention</div>
              <p className="text-sm text-amber-800 mt-0.5">Vous pouvez tout de même enregistrer votre progression, mais la validation finale sera disponible une fois ces points corrigés.</p>
            </div>
          </div>
          <ul className="space-y-1.5 ml-8">
            {blockingIssues.map((b) => (
              <li key={b.kind} className="text-sm text-amber-900 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                {b.label} <span className="font-semibold">({b.count})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm space-y-4">
        <Field label="Commentaires ou remarques supplémentaires">
          <textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </Field>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 rounded border-slate-300" />
          Je confirme que les informations renseignées sont exactes et peuvent être utilisées pour configurer Vocca.
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Retour</button>
          <button
            disabled={!canSubmit}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer la configuration à Vocca
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, children }: { title: string; icon: typeof ClipboardList; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-indigo-600">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string | number; accent?: "emerald" | "amber" | "rose" | "indigo" }) {
  const cls =
    accent === "emerald" ? "text-emerald-700"
    : accent === "amber" ? "text-amber-700"
    : accent === "rose" ? "text-rose-700"
    : accent === "indigo" ? "text-indigo-700"
    : "text-slate-900";
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

// silence unused helper warning
void getStatusLabel;
