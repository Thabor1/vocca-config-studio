import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  HelpCircle,
  ListChecks,
  MapPin,
  Phone,
  Save,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ============================================================
   Types
   ============================================================ */

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

type MotifFilter = "all" | "todo" | "transfer" | "noLabel" | "irm";

/* ============================================================
   Mock data
   ============================================================ */

const CONFIG_DATA = {
  organizationName: "Groupe ENOSIS",
  siteName: "Centre d’imagerie du Centre de l’Arthrose",
  siteAddress: "6 Rue Georges Nègrevergne – 33700 Mérignac",
  sitePhone: "05 56 12 16 93",
  siteOpeningHours:
    "Du lundi au vendredi : 7h45 – 20h00 · Samedi : 8h00 – 16h00",
  webhookUrl: "{{webhookUrl}}",
  calendlyUrl: "{{calendlyUrl}}",
  examsDetected: [
    "Échographie",
    "Infiltration",
    "IRM",
    "PLA",
    "PRP",
    "Radiofréquence",
    "Radiographie",
    "Scanner",
  ],
};

const RAW_MOTIFS: Omit<ExamMotif, "id">[] = [
  {
    examType: "EOS",
    importedLabel: "EOS",
    patientLabel: "Radiographie du rachis complet",
    status: "open",
    patientInstructions:
      "Pour les enfants de moins de 6 ans, merci de vous orienter vers un autre site ENOSIS adapté. Si vous êtes enceinte ou susceptible de l’être, merci de le signaler avant l’examen.",
    correctionInstructions: "",
    price: "20€",
    minAge: 6,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "EOS",
    importedLabel: "EOS MERCREDI",
    patientLabel: "Radiographie du rachis complet",
    status: "open",
    patientInstructions:
      "Pour les enfants de moins de 6 ans, merci de vous orienter vers un autre site ENOSIS adapté. Si vous êtes enceinte ou susceptible de l’être, merci de le signaler avant l’examen.",
    correctionInstructions: "",
    price: "20€",
    minAge: 6,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER CERVICAL ET DES MEMBRES INFERIEURS",
    patientLabel: "",
    status: "transfer",
    patientInstructions:
      "Merci de ne pas porter de bijoux au cou le jour de l’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DE L AORTE ABDO ET DES MI",
    patientLabel: "",
    status: "transfer",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DE L AORTE ABDOMINALE",
    patientLabel: "Échodoppler aortique",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES ARTERES CERVICALES",
    patientLabel: "Échodoppler des troncs supra-aortiques",
    status: "open",
    patientInstructions:
      "Merci de ne pas porter de bijoux au cou le jour de l’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES ARTERES DES MEMBRE INFERIEURS",
    patientLabel: "Échodoppler artériel des membres inférieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES ARTERES DES MEMBRES SUPERIEURS",
    patientLabel: "Échodoppler artériel des membres supérieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES ARTERES DES MEMBRES SUPERIEURS",
    patientLabel: "Échodoppler artériel des membres supérieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 16,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES BOURSES",
    patientLabel: "Échodoppler testiculaire",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES VEINES DES MEMBRES INFERIEURS",
    patientLabel: "Échodoppler veineux des membres inférieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 16,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES VEINES DES MEMBRES INFERIEURS",
    patientLabel: "Échodoppler veineux des membres inférieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES VEINES DES MEMBRES SUPERIEURS",
    patientLabel: "Échodoppler veineux des membres supérieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 16,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER DES VEINES DES MEMBRES SUPERIEURS",
    patientLabel: "Échodoppler veineux des membres supérieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER ENFANT DE L'OEIL ET DE L'ORBITE",
    patientLabel: "",
    status: "transfer",
    patientInstructions:
      "Un seul accompagnant est accepté pendant l’examen. Le rendez-vous doit être pris au nom du patient, et non au nom d’un parent. Si le rendez-vous est pris sous un autre nom, il pourra être annulé.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 2,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER ENFANT DES ARTERES DES MEMBRES INFERIEURS",
    patientLabel: "Échodoppler artériel des membres inférieurs",
    status: "open",
    patientInstructions:
      "Un seul accompagnant est accepté pendant l’examen. Le rendez-vous doit être pris au nom du patient, et non au nom d’un parent. Si le rendez-vous est pris sous un autre nom, il pourra être annulé.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 16,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER ENFANT TRANSCUTANE RENAL",
    patientLabel: "Échodoppler rénal",
    status: "open",
    patientInstructions:
      "Merci de respecter le jeûne avant l’examen : 4 heures pour les enfants de moins de 4 mois, et 6 heures pour les enfants de plus de 4 mois. Si le jeûne n’est pas respecté, le rendez-vous pourra être reporté. Un seul accompagnant est accepté pendant l’examen. Le rendez-vous doit être pris au nom du patient.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 16,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER PELVIEN",
    patientLabel: "",
    status: "transfer",
    patientInstructions:
      "Merci de venir la vessie pleine. Pour cela, buvez environ trois grands verres d’eau une heure avant l’examen et évitez d’aller aux toilettes avant le rendez-vous.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER TRANSCUTANE RENAL",
    patientLabel: "Échodoppler rénal",
    status: "open",
    patientInstructions:
      "Merci de venir à jeun pendant les 6 heures précédant l’examen : ne mangez pas, ne buvez pas et ne fumez pas.",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER TRANSFONTANELLAIRE VAISSEAUX INTRACRANIEN",
    patientLabel: "",
    status: "transfer",
    patientInstructions:
      "Un seul accompagnant est autorisé pendant l’examen. Afin que l’examen se déroule dans de bonnes conditions, les autres enfants ne sont pas acceptés en salle d’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: 1,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "DOPPLER VEINEUX M INF POUR THROMBOSE",
    patientLabel: "Échodoppler veineux des membres inférieurs",
    status: "open",
    patientInstructions: "",
    correctionInstructions: "",
    price: "40€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHO TENDON D'ACHILLE",
    patientLabel: "Échographie articulaire",
    status: "open",
    patientInstructions:
      "Pour les enfants de moins de 6 ans, l’examen n’est pas réalisé au Centre de l’Arthrose. Merci de vous orienter vers un autre site ENOSIS adapté.",
    correctionInstructions: "",
    price: "30€",
    minAge: 6,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE MAMMAIRE",
    patientLabel: "Échographie mammaire",
    status: "open",
    patientInstructions:
      "Pour les garçons, l’examen est possible à partir de 16 ans. Pour les filles, il est possible à partir de 9 ans.",
    correctionInstructions: "",
    price: "",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE MAMMAIRE",
    patientLabel: "Échographie mammaire",
    status: "open",
    patientInstructions:
      "Cet examen concerne les femmes adultes, les filles à partir de 10 ans et les garçons à partir de 16 ans. Pour les hommes, merci de contacter le centre avant de prendre rendez-vous.",
    correctionInstructions: "",
    price: "30€",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE 1ER TRIMESTRE GROSSESSE GEMELLAIRE",
    patientLabel: "Échographie obstétricale",
    status: "open",
    patientInstructions:
      "Merci d’apporter votre dossier de grossesse. Venez la vessie pleine : buvez environ trois grands verres d’eau une heure avant l’examen et évitez d’aller aux toilettes avant le rendez-vous. Un seul accompagnant est autorisé, et les enfants ne sont pas acceptés en salle d’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE 2EME TRIMESTRE GROSSESSE GEMELLAIRE",
    patientLabel: "Échographie obstétricale",
    status: "open",
    patientInstructions:
      "Merci d’apporter votre dossier de grossesse. Un seul accompagnant est autorisé, et les enfants ne sont pas acceptés en salle d’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE 3EME TRIMESTRE GROSSESSE GEMELLAIRE",
    patientLabel: "Échographie obstétricale",
    status: "open",
    patientInstructions:
      "Merci d’apporter votre dossier de grossesse. Un seul accompagnant est autorisé, et les enfants ne sont pas acceptés en salle d’examen.",
    correctionInstructions: "",
    price: "40€",
    minAge: null,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
  {
    examType: "Echographie",
    importedLabel: "ECHOGRAPHIE ABDOMINALE",
    patientLabel: "Échographie abdominale",
    status: "open",
    patientInstructions:
      "Merci de venir à jeun pendant les 6 heures précédant l’examen : ne mangez pas, ne buvez pas et ne fumez pas.",
    correctionInstructions: "",
    price: "30€",
    minAge: 16,
    maxAge: null,
    requiresTriage: false,
    triageConfigured: true,
  },
];

const INITIAL_MOTIFS: ExamMotif[] = RAW_MOTIFS.map((m, i) => {
  const triageMatch = /(IRM|SCANNER|TDM)/i.test(
    `${m.examType} ${m.importedLabel}`,
  );
  return { ...m, id: `m${i + 1}`, requiresTriage: triageMatch };
});

const INITIAL_TRIAGE: TriageQuestion[] = [
  {
    id: "t-irm-1",
    category: "IRM",
    title: "Présence d’un dispositif médical implanté ou d’un objet métallique",
    patientWording:
      "Avez-vous un pacemaker, un implant, un éclat métallique ou tout autre objet métallique dans le corps ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-irm-2",
    category: "IRM",
    title: "Allergie ou réaction à un produit de contraste",
    patientWording:
      "Avez-vous déjà eu une allergie ou une réaction à un produit de contraste ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-irm-3",
    category: "IRM",
    title: "Grossesse ou suspicion de grossesse",
    patientWording: "Êtes-vous enceinte ou susceptible de l’être ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-sca-1",
    category: "Scanner",
    title: "Examen avec ou sans injection",
    patientWording:
      "Votre ordonnance précise-t-elle un scanner avec injection, sans injection, ou les deux sont-ils possibles ?",
    enabled: true,
    processStatus: "modify",
    customInstruction:
      "Si l’ordonnance précise « avec et sans injection », proposer le créneau scanner injecté.",
  },
  {
    id: "t-sca-2",
    category: "Scanner",
    title: "Antécédent d’allergie lors d’une injection",
    patientWording:
      "Avez-vous déjà eu une réaction allergique après une injection de produit de contraste ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-sca-3",
    category: "Scanner",
    title: "Diabète ou insuffisance rénale connue",
    patientWording:
      "Êtes-vous diabétique ou avez-vous une insuffisance rénale connue ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-sca-4",
    category: "Scanner",
    title: "Bilan sanguin récent avec créatinine",
    patientWording:
      "Si vous avez plus de 60 ans, disposez-vous d’un bilan sanguin récent avec créatinine ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
  {
    id: "t-sca-5",
    category: "Scanner",
    title: "Grossesse ou suspicion de grossesse",
    patientWording: "Êtes-vous enceinte ou susceptible de l’être ?",
    enabled: true,
    processStatus: "yes",
    customInstruction: "",
  },
];

const PRACTITIONER_NAMES = [
  "ADAM LE MANH Carole",
  "BERTIN DOERMANN Aline",
  "BISE Sylvain",
  "BRUN Muriel",
  "CASTINEL Carole",
  "DALLAUDIERE Benjamin",
  "DANNOOUX Isabelle",
  "DELPECH Philippe",
  "FERRON Stéphane",
  "HOCQUELET Arnaud",
  "HUOT Pascal",
  "LATOURTE Sophie",
  "MARTIN Manuel",
  "MEYER Philippe",
  "PEREZ Jean-Thomas",
  "REICH Stéphanie",
  "VALAT Anne",
  "WAKIM Nicolas",
];

const INITIAL_PRACTITIONERS: Practitioner[] = PRACTITIONER_NAMES.map(
  (name, i) => ({
    id: `p${i + 1}`,
    name,
    status: "open" as const,
    sector:
      i === 4 || i === 11
        ? ("secteur_2" as const)
        : i === 16
          ? ("a_definir" as const)
          : ("secteur_1" as const),
    minAge: null,
    maxAge: null,
    instructions: "",
  }),
);

/* ============================================================
   Helpers
   ============================================================ */

const STATUS_META: Record<
  MotifStatus,
  { label: string; className: string; dot: string }
> = {
  open: {
    label: "Ouvert",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Fermé",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  transfer: {
    label: "À transférer",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  task: {
    label: "Création de tâche",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

const SECTOR_LABEL: Record<Practitioner["sector"], string> = {
  secteur_1: "Secteur 1",
  secteur_2: "Secteur 2",
  non_conventionne: "Non conventionné",
  a_definir: "À définir",
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* ============================================================
   Main component
   ============================================================ */

export default function VoccaEnosisConfigDemo() {
  const [step, setStep] = useState<Step>("onboarding");
  const [motifs, setMotifs] = useState<ExamMotif[]>(INITIAL_MOTIFS);
  const [triage, setTriage] = useState<TriageQuestion[]>(INITIAL_TRIAGE);
  const [practitioners, setPractitioners] = useState<Practitioner[]>(
    INITIAL_PRACTITIONERS,
  );
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [finalComment, setFinalComment] = useState("");
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-save every 30s
  useEffect(() => {
    const i = setInterval(() => setLastSaved(new Date()), 30000);
    return () => clearInterval(i);
  }, []);

  function manualSave() {
    setLastSaved(new Date());
    toast.success("Configuration sauvegardée");
  }

  // Global progress
  const progress = useMemo(() => {
    const motifReady = motifs.filter(
      (m) => m.patientLabel.trim() && m.status,
    ).length;
    const triageReady = triage.filter((q) =>
      !q.enabled
        ? true
        : q.processStatus !== "" &&
          (q.processStatus !== "modify" || q.customInstruction.trim() !== ""),
    ).length;
    const practReady = practitioners.filter(
      (p) => p.status && p.sector !== "a_definir",
    ).length;
    const total = motifs.length + triage.length + practitioners.length;
    const done = motifReady + triageReady + practReady;
    return Math.round((done / total) * 100);
  }, [motifs, triage, practitioners]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header
        progress={progress}
        lastSaved={lastSaved}
        onSave={manualSave}
        step={step}
      />

      {!submitted && (
        <Stepper step={step} onJump={(s) => setStep(s)} />
      )}

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {submitted ? (
          <SuccessScreen />
        ) : step === "onboarding" ? (
          <Onboarding onNext={() => setStep("motifs")} />
        ) : step === "motifs" ? (
          <MotifsScreen
            motifs={motifs}
            setMotifs={setMotifs}
            onNext={() => setStep("triage")}
          />
        ) : step === "triage" ? (
          <TriageScreen
            triage={triage}
            setTriage={setTriage}
            onNext={() => setStep("practitioners")}
          />
        ) : step === "practitioners" ? (
          <PractitionersScreen
            practitioners={practitioners}
            setPractitioners={setPractitioners}
            onNext={() => setStep("final")}
          />
        ) : (
          <FinalScreen
            motifs={motifs}
            triage={triage}
            practitioners={practitioners}
            comment={finalComment}
            setComment={setFinalComment}
            confirmed={finalConfirmed}
            setConfirmed={setFinalConfirmed}
            submitting={submitting}
            onSubmit={() => {
              setSubmitting(true);
              setTimeout(() => {
                setSubmitting(false);
                setSubmitted(true);
              }, 1400);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   Header / Stepper
   ============================================================ */

function VoccaLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
        <span className="text-base font-bold tracking-tight">V</span>
        <div className="absolute inset-0 rounded-xl bg-white/10 blur-sm" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Vocca</div>
        <div className="text-[11px] text-muted-foreground">
          Configuration assistant vocal
        </div>
      </div>
    </div>
  );
}

function Header({
  progress,
  lastSaved,
  onSave,
}: {
  progress: number;
  lastSaved: Date;
  onSave: () => void;
  step: Step;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <VoccaLogo />
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="hidden md:block">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {CONFIG_DATA.organizationName}
            </div>
            <div className="text-sm font-semibold">{CONFIG_DATA.siteName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden min-w-[180px] flex-col items-end sm:flex">
            <div className="flex w-full items-center gap-2">
              <span className="text-xs text-muted-foreground">Progression</span>
              <span className="ml-auto text-xs font-semibold tabular-nums">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="mt-1 h-1.5 w-44" />
          </div>
          <div className="hidden text-right text-[11px] text-muted-foreground sm:block">
            Dernière sauvegarde
            <div className="font-medium text-foreground">
              {formatTime(lastSaved)}
            </div>
          </div>
          <Button size="sm" onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" /> Sauvegarder
          </Button>
        </div>
      </div>
    </header>
  );
}

const STEPS: { key: Step; label: string; icon: typeof Sparkles }[] = [
  { key: "onboarding", label: "Bienvenue", icon: Sparkles },
  { key: "motifs", label: "Motifs", icon: ListChecks },
  { key: "triage", label: "Triage", icon: HelpCircle },
  { key: "practitioners", label: "Praticiens", icon: Users },
  { key: "final", label: "Récapitulatif", icon: ClipboardList },
];

function Stepper({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  const idx = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="border-b border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === idx;
          const done = i < idx;
          return (
            <button
              key={s.key}
              onClick={() => onJump(s.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : done
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                  active
                    ? "bg-white/20"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Onboarding
   ============================================================ */

function Onboarding({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <Badge className="mb-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
            <Sparkles className="mr-1 h-3 w-3" /> Configuration préremplie par Vocca
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Votre configuration Vocca est prête
          </h1>
          <p className="mt-4 text-base text-white/85 sm:text-lg">
            Nous avons prérempli les motifs du Centre d’imagerie du Centre de
            l’Arthrose à partir des informations disponibles dans votre EDL. Il
            ne vous reste qu’à relire, ajuster les exceptions et valider.
          </p>
          <Button
            size="lg"
            onClick={onNext}
            className="mt-6 gap-2 bg-white text-indigo-700 hover:bg-white/90"
          >
            Voir la configuration préremplie <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold">Site identifié</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {CONFIG_DATA.organizationName}
            </div>
            <div className="text-base font-semibold">
              {CONFIG_DATA.siteName}
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {CONFIG_DATA.siteAddress}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" /> {CONFIG_DATA.sitePhone}
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              {CONFIG_DATA.siteOpeningHours}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold">
              Examens détectés sur le site
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONFIG_DATA.examsDetected.map((e) => (
              <span
                key={e}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {e}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Importés depuis votre EDL Enovacom et votre logiciel de prise de
            rendez-vous.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <EduCard
          icon={ListChecks}
          title="Motifs préremplis"
          text="Les libellés patients, les statuts et les instructions ont été repris puis nettoyés depuis votre EDL."
        />
        <EduCard
          icon={CheckCircle2}
          title="Validation rapide"
          text="Corrigez directement dans la liste uniquement les motifs incomplets ou à transférer."
        />
        <EduCard
          icon={HelpCircle}
          title="Triage IRM / Scanner"
          text="Vocca peut poser automatiquement les questions utiles pour les examens IRM et Scanner."
        />
      </div>

      <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-5 text-sm text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Cette démonstration est personnalisée pour le Centre de l’Arthrose.
            Les informations pourront être ajustées avant la mise en production.
          </p>
        </div>
      </div>
    </div>
  );
}

function EduCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-indigo-900/[0.02]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ============================================================
   Motifs
   ============================================================ */

function MotifsScreen({
  motifs,
  setMotifs,
  onNext,
}: {
  motifs: ExamMotif[];
  setMotifs: React.Dispatch<React.SetStateAction<ExamMotif[]>>;
  onNext: () => void;
}) {
  const [filter, setFilter] = useState<MotifFilter>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const updateMotif = (id: string, patch: Partial<ExamMotif>) =>
    setMotifs((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const counts = useMemo(() => {
    const total = motifs.length;
    const open = motifs.filter((m) => m.status === "open").length;
    const transfer = motifs.filter((m) => m.status === "transfer").length;
    const noLabel = motifs.filter((m) => !m.patientLabel.trim()).length;
    const priced = motifs.filter((m) => (m.price ?? "").trim()).length;
    const withLabel = total - noLabel;
    return { total, open, transfer, noLabel, priced, withLabel };
  }, [motifs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return motifs.filter((m) => {
      if (q) {
        const blob =
          `${m.examType} ${m.importedLabel} ${m.patientLabel}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      switch (filter) {
        case "all":
          return true;
        case "todo":
          return !m.patientLabel.trim() || m.status === "transfer";
        case "transfer":
          return m.status === "transfer";
        case "noLabel":
          return !m.patientLabel.trim();
        case "irm":
          return /(IRM|SCANNER|TDM)/i.test(`${m.examType} ${m.importedLabel}`);
      }
    });
  }, [motifs, filter, search]);

  const openMotif = motifs.find((m) => m.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Motifs préremplis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vocca a déjà nettoyé et reformulé les consignes. Vérifiez uniquement
          ce qui sort de la règle générale.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Total motifs" value={counts.total} tone="indigo" />
        <Kpi label="Ouverts" value={counts.open} tone="emerald" />
        <Kpi label="À transférer" value={counts.transfer} tone="orange" />
        <Kpi label="Sans nom patient" value={counts.noLabel} tone="amber" />
        <Kpi label="Prix renseignés" value={counts.priced} tone="violet" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-semibold">
              {counts.withLabel} / {counts.total}
            </span>{" "}
            <span className="text-muted-foreground">
              motifs disposent déjà d’un nom patient
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Préremplissage automatique depuis l’EDL
          </div>
        </div>
        <Progress
          value={(counts.withLabel / counts.total) * 100}
          className="mt-3 h-2"
        />
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 text-sm text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Les motifs ci-dessous ont été préremplis depuis votre EDL. Les
          consignes ont été reformulées pour être communiquées clairement au
          patient à l’oral.
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un motif…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tous"
            count={counts.total}
          />
          <FilterChip
            active={filter === "todo"}
            onClick={() => setFilter("todo")}
            label="À valider"
            count={counts.noLabel + counts.transfer}
          />
          <FilterChip
            active={filter === "transfer"}
            onClick={() => setFilter("transfer")}
            label="À transférer"
            count={counts.transfer}
          />
          <FilterChip
            active={filter === "noLabel"}
            onClick={() => setFilter("noLabel")}
            label="Sans nom patient"
            count={counts.noLabel}
          />
          <FilterChip
            active={filter === "irm"}
            onClick={() => setFilter("irm")}
            label="IRM / Scanner"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Type</Th>
                <Th>Libellé importé</Th>
                <Th>Nom côté patient</Th>
                <Th>Statut</Th>
                <Th className="w-20">Âge min</Th>
                <Th className="w-20">Âge max</Th>
                <Th className="w-24">Prix</Th>
                <Th className="w-20 text-center">Triage</Th>
                <Th>Instructions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const missing = !m.patientLabel.trim();
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-t border-border/60 align-top transition-colors",
                      missing
                        ? "bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10"
                        : "hover:bg-muted/40",
                    )}
                  >
                    <Td className="whitespace-nowrap text-xs text-muted-foreground">
                      {m.examType}
                    </Td>
                    <Td className="max-w-[200px]">
                      <div className="truncate font-medium" title={m.importedLabel}>
                        {m.importedLabel}
                      </div>
                    </Td>
                    <Td>
                      {missing && (
                        <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Nom patient manquant
                        </div>
                      )}
                      <Input
                        value={m.patientLabel}
                        onChange={(e) =>
                          updateMotif(m.id, { patientLabel: e.target.value })
                        }
                        placeholder="Nom à dire au patient"
                        className={cn(
                          "h-8 min-w-[180px]",
                          missing && "border-amber-300 bg-white",
                        )}
                      />
                    </Td>
                    <Td>
                      <Select
                        value={m.status}
                        onValueChange={(v) =>
                          updateMotif(m.id, { status: v as MotifStatus })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[140px] border",
                            STATUS_META[m.status].className,
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ouvert</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                          <SelectItem value="transfer">À transférer</SelectItem>
                          <SelectItem value="task">Création de tâche</SelectItem>
                        </SelectContent>
                      </Select>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        value={m.minAge ?? ""}
                        onChange={(e) =>
                          updateMotif(m.id, {
                            minAge: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="h-8 w-16"
                      />
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        value={m.maxAge ?? ""}
                        onChange={(e) =>
                          updateMotif(m.id, {
                            maxAge: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="h-8 w-16"
                      />
                    </Td>
                    <Td>
                      <Input
                        value={m.price ?? ""}
                        onChange={(e) =>
                          updateMotif(m.id, { price: e.target.value })
                        }
                        placeholder="—"
                        className="h-8 w-20"
                      />
                    </Td>
                    <Td className="text-center">
                      <Switch
                        checked={m.requiresTriage}
                        onCheckedChange={(v) =>
                          updateMotif(m.id, { requiresTriage: v })
                        }
                      />
                    </Td>
                    <Td className="max-w-[260px]">
                      <button
                        onClick={() => setOpenId(m.id)}
                        className="block w-full rounded-md p-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={m.patientInstructions}
                      >
                        {m.patientInstructions ? (
                          <span className="line-clamp-2">
                            {m.patientInstructions}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/70">
                            Aucune instruction
                          </span>
                        )}
                      </button>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-sm text-muted-foreground">
                    Aucun motif ne correspond à ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} className="gap-2">
          Valider et passer aux questions de triage
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <MotifDrawer
        motif={openMotif}
        onClose={() => setOpenId(null)}
        onChange={(patch) => openMotif && updateMotif(openMotif.id, patch)}
      />
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-3 py-2.5 text-left font-medium", className)}>
      {children}
    </th>
  );
}
function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2.5", className)}>{children}</td>;
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px]",
            active ? "bg-white/20" : "bg-muted text-foreground/70",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "emerald" | "orange" | "amber" | "violet";
}) {
  const tones: Record<typeof tone, string> = {
    indigo:
      "from-indigo-500/10 to-indigo-500/0 text-indigo-700 dark:text-indigo-300",
    emerald:
      "from-emerald-500/10 to-emerald-500/0 text-emerald-700 dark:text-emerald-300",
    orange:
      "from-orange-500/10 to-orange-500/0 text-orange-700 dark:text-orange-300",
    amber:
      "from-amber-500/10 to-amber-500/0 text-amber-700 dark:text-amber-300",
    violet:
      "from-violet-500/10 to-violet-500/0 text-violet-700 dark:text-violet-300",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-100",
          tones[tone],
        )}
      />
      <div className="relative">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function MotifDrawer({
  motif,
  onClose,
  onChange,
}: {
  motif: ExamMotif | null;
  onClose: () => void;
  onChange: (p: Partial<ExamMotif>) => void;
}) {
  return (
    <Sheet open={!!motif} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {motif && (
          <>
            <SheetHeader>
              <SheetTitle>{motif.patientLabel || motif.importedLabel}</SheetTitle>
              <SheetDescription>
                Détail du motif — éditez les champs pour ajuster la
                configuration.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <Field label="Libellé importé">
                <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {motif.importedLabel}
                </div>
              </Field>
              <Field label="Nom côté patient">
                <Input
                  value={motif.patientLabel}
                  onChange={(e) => onChange({ patientLabel: e.target.value })}
                />
              </Field>
              <Field label="Statut">
                <Select
                  value={motif.status}
                  onValueChange={(v) => onChange({ status: v as MotifStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                    <SelectItem value="transfer">À transférer</SelectItem>
                    <SelectItem value="task">Création de tâche</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Instructions patient (oral)">
                <Textarea
                  value={motif.patientInstructions}
                  rows={5}
                  onChange={(e) =>
                    onChange({ patientInstructions: e.target.value })
                  }
                />
              </Field>
              <Field label="Instructions internes / correction">
                <Textarea
                  value={motif.correctionInstructions}
                  rows={3}
                  onChange={(e) =>
                    onChange({ correctionInstructions: e.target.value })
                  }
                  placeholder="Notes pour l’équipe Vocca…"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Âge minimum">
                  <Input
                    type="number"
                    value={motif.minAge ?? ""}
                    onChange={(e) =>
                      onChange({
                        minAge: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label="Âge maximum">
                  <Input
                    type="number"
                    value={motif.maxAge ?? ""}
                    onChange={(e) =>
                      onChange({
                        maxAge: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label="Prix">
                  <Input
                    value={motif.price ?? ""}
                    onChange={(e) => onChange({ price: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Triage requis">
                <div className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2">
                  <Switch
                    checked={motif.requiresTriage}
                    onCheckedChange={(v) => onChange({ requiresTriage: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Active les questions de triage IRM / Scanner pour ce motif.
                  </span>
                </div>
              </Field>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ============================================================
   Triage
   ============================================================ */

function TriageScreen({
  triage,
  setTriage,
  onNext,
}: {
  triage: TriageQuestion[];
  setTriage: React.Dispatch<React.SetStateAction<TriageQuestion[]>>;
  onNext: () => void;
}) {
  const update = (id: string, patch: Partial<TriageQuestion>) =>
    setTriage((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );

  const irm = triage.filter((q) => q.category === "IRM");
  const sca = triage.filter((q) => q.category === "Scanner");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Questions de triage IRM &amp; Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ces questions seront posées uniquement lorsque le motif nécessite un
          triage, notamment pour les examens IRM et Scanner.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-4 text-sm text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Vocca détectera automatiquement les motifs IRM et Scanner nécessitant
          un triage. Vous pouvez ajuster les questions ci-dessous.
        </p>
      </div>

      <TriageSection title="IRM" questions={irm} onUpdate={update} />
      <TriageSection title="Scanner" questions={sca} onUpdate={update} />

      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} className="gap-2">
          Valider les questions de triage <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TriageSection({
  title,
  questions,
  onUpdate,
}: {
  title: string;
  questions: TriageQuestion[];
  onUpdate: (id: string, patch: Partial<TriageQuestion>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-indigo-500 to-violet-600">
          {title}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {questions.length} questions
        </span>
      </div>
      <div className="grid gap-3">
        {questions.map((q) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{q.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  « {q.patientWording} »
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={q.enabled}
                  onCheckedChange={(v) => onUpdate(q.id, { enabled: v })}
                />
                Activer
              </label>
            </div>
            {q.enabled && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Conforme à votre process ?">
                  <Select
                    value={q.processStatus || undefined}
                    onValueChange={(v) =>
                      onUpdate(q.id, {
                        processStatus: v as TriageQuestion["processStatus"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Oui, conforme</SelectItem>
                      <SelectItem value="no">Non, à désactiver</SelectItem>
                      <SelectItem value="modify">À modifier</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phrase à modifier ou instruction spécifique">
                  <Textarea
                    value={q.customInstruction}
                    rows={2}
                    onChange={(e) =>
                      onUpdate(q.id, { customInstruction: e.target.value })
                    }
                    placeholder="Optionnel"
                  />
                </Field>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Practitioners
   ============================================================ */

function PractitionersScreen({
  practitioners,
  setPractitioners,
  onNext,
}: {
  practitioners: Practitioner[];
  setPractitioners: React.Dispatch<React.SetStateAction<Practitioner[]>>;
  onNext: () => void;
}) {
  const [showUnconv, setShowUnconv] = useState(false);
  const update = (id: string, patch: Partial<Practitioner>) =>
    setPractitioners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const list = showUnconv
    ? practitioners.filter(
        (p) => p.sector === "non_conventionne" || p.sector === "a_definir",
      )
    : practitioners;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Praticiens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérifiez les praticiens associés au site et leur conventionnement.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPractitioners((p) => p.map((x) => ({ ...x, status: "open" })))
          }
        >
          Tout marquer ouvert
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPractitioners((p) =>
              p.map((x) => ({ ...x, sector: "secteur_1" })),
            )
          }
        >
          Appliquer Secteur 1 à tous
        </Button>
        <Button
          variant={showUnconv ? "default" : "outline"}
          size="sm"
          onClick={() => setShowUnconv((s) => !s)}
        >
          Afficher sans conventionnement
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Nom</Th>
                <Th>Statut</Th>
                <Th>Conventionnement</Th>
                <Th className="w-20">Âge min</Th>
                <Th className="w-20">Âge max</Th>
                <Th>Instructions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const warn = p.sector === "a_definir";
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-t border-border/60",
                      warn && "bg-amber-50/40 dark:bg-amber-950/10",
                    )}
                  >
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">
                          {p.name
                            .split(" ")
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")}
                        </div>
                        {p.name}
                      </div>
                    </Td>
                    <Td>
                      <Select
                        value={p.status}
                        onValueChange={(v) =>
                          update(p.id, {
                            status: v as Practitioner["status"],
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[130px] border",
                            STATUS_META[p.status as MotifStatus].className,
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ouvert</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                          <SelectItem value="transfer">À transférer</SelectItem>
                        </SelectContent>
                      </Select>
                    </Td>
                    <Td>
                      <Select
                        value={p.sector}
                        onValueChange={(v) =>
                          update(p.id, {
                            sector: v as Practitioner["sector"],
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-[170px]",
                            warn &&
                              "border-amber-300 bg-amber-50 text-amber-800",
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="secteur_1">Secteur 1</SelectItem>
                          <SelectItem value="secteur_2">Secteur 2</SelectItem>
                          <SelectItem value="non_conventionne">
                            Non conventionné
                          </SelectItem>
                          <SelectItem value="a_definir">À définir</SelectItem>
                        </SelectContent>
                      </Select>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        value={p.minAge ?? ""}
                        onChange={(e) =>
                          update(p.id, {
                            minAge: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="h-8 w-16"
                      />
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        value={p.maxAge ?? ""}
                        onChange={(e) =>
                          update(p.id, {
                            maxAge: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="h-8 w-16"
                      />
                    </Td>
                    <Td>
                      <Input
                        value={p.instructions}
                        onChange={(e) =>
                          update(p.id, { instructions: e.target.value })
                        }
                        placeholder="Optionnel"
                        className="h-8"
                      />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} className="gap-2">
          Passer au récapitulatif <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Final
   ============================================================ */

function FinalScreen({
  motifs,
  triage,
  practitioners,
  comment,
  setComment,
  confirmed,
  setConfirmed,
  submitting,
  onSubmit,
}: {
  motifs: ExamMotif[];
  triage: TriageQuestion[];
  practitioners: Practitioner[];
  comment: string;
  setComment: (s: string) => void;
  confirmed: boolean;
  setConfirmed: (b: boolean) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const motifStats = {
    total: motifs.length,
    ready: motifs.filter((m) => m.patientLabel.trim()).length,
    open: motifs.filter((m) => m.status === "open").length,
    transfer: motifs.filter((m) => m.status === "transfer").length,
    noLabel: motifs.filter((m) => !m.patientLabel.trim()).length,
    priced: motifs.filter((m) => (m.price ?? "").trim()).length,
  };

  const triageStats = {
    irm: triage.filter((q) => q.category === "IRM" && q.enabled).length,
    scanner: triage.filter((q) => q.category === "Scanner" && q.enabled).length,
    modify: triage.filter((q) => q.enabled && q.processStatus === "modify")
      .length,
    incomplete: triage.filter(
      (q) =>
        q.enabled &&
        (q.processStatus === "" ||
          (q.processStatus === "modify" && !q.customInstruction.trim())),
    ).length,
  };

  const pracStats = {
    configured: practitioners.filter(
      (p) => p.status && p.sector !== "a_definir",
    ).length,
    open: practitioners.filter((p) => p.status === "open").length,
    unconv: practitioners.filter(
      (p) => p.sector === "non_conventionne" || p.sector === "a_definir",
    ).length,
    ageRestricted: practitioners.filter(
      (p) => p.minAge != null || p.maxAge != null,
    ).length,
  };

  const blocking: string[] = [];
  if (motifStats.noLabel)
    blocking.push(`${motifStats.noLabel} motif(s) sans nom patient`);
  if (triageStats.incomplete)
    blocking.push(
      `${triageStats.incomplete} question(s) de triage incomplète(s)`,
    );
  const unconvCount = practitioners.filter(
    (p) => p.sector === "a_definir",
  ).length;
  if (unconvCount)
    blocking.push(`${unconvCount} praticien(s) sans conventionnement`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuration prête à être envoyée
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Relisez les éléments clés avant transmission à l’équipe Vocca.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Motifs" icon={ListChecks}>
          <Stat label="Total motifs" value={motifStats.total} />
          <Stat label="Motifs prêts" value={motifStats.ready} />
          <Stat label="Motifs ouverts" value={motifStats.open} />
          <Stat label="Motifs à transférer" value={motifStats.transfer} />
          <Stat
            label="Motifs sans nom patient"
            value={motifStats.noLabel}
            warn={motifStats.noLabel > 0}
          />
          <Stat label="Motifs avec prix renseigné" value={motifStats.priced} />
        </SummaryCard>
        <SummaryCard title="Questions de triage" icon={HelpCircle}>
          <Stat label="Questions IRM activées" value={triageStats.irm} />
          <Stat label="Questions Scanner activées" value={triageStats.scanner} />
          <Stat label="Questions à modifier" value={triageStats.modify} />
          <Stat
            label="Questions incomplètes"
            value={triageStats.incomplete}
            warn={triageStats.incomplete > 0}
          />
        </SummaryCard>
        <SummaryCard title="Praticiens" icon={UserCheck}>
          <Stat label="Praticiens configurés" value={pracStats.configured} />
          <Stat label="Praticiens ouverts" value={pracStats.open} />
          <Stat
            label="Sans conventionnement"
            value={pracStats.unconv}
            warn={pracStats.unconv > 0}
          />
          <Stat label="Avec restriction d’âge" value={pracStats.ageRestricted} />
        </SummaryCard>
      </div>

      {blocking.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Points à vérifier avant envoi
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                {blocking.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Field label="Commentaires ou remarques supplémentaires">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Précisions à transmettre à l’équipe Vocca…"
          />
        </Field>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
            className="mt-0.5"
          />
          <span>
            Je confirme que les informations renseignées peuvent être utilisées
            pour configurer Vocca.
          </span>
        </label>
        <div className="mt-4 flex justify-end">
          <Button
            size="lg"
            disabled={!confirmed || submitting}
            onClick={onSubmit}
            className="gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Envoyer la configuration à Vocca
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-1.5 text-sm",
        warn ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30" : "",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/* ============================================================
   Success
   ============================================================ */

function SuccessScreen() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-12 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Configuration envoyée avec succès
        </h1>
        <p className="mt-3 text-muted-foreground">
          Votre configuration a bien été transmise à l’équipe Vocca. Nous allons
          vérifier les éléments et revenir vers vous pour la mise en production.
        </p>
      </div>

      <Card className="text-left">
        <h3 className="text-sm font-semibold">Prochaines étapes</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {[
            "Analyse de votre configuration par l’équipe Vocca",
            "Vérification des règles spécifiques",
            "Préparation de la mise en production",
          ].map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Button
        size="lg"
        asChild
        className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90"
      >
        <a href={CONFIG_DATA.calendlyUrl} target="_blank" rel="noreferrer">
          <Calendar className="h-4 w-4" />
          Réserver un créneau de mise en route
        </a>
      </Button>

      <div className="text-xs text-muted-foreground">
        <FileText className="mr-1 inline h-3 w-3" />
        Une copie de votre configuration sera également envoyée par email.
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { X, SECTOR_LABEL };
