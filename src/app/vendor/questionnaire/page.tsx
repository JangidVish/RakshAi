import { QuestionnaireForm } from "@/components/questionnaire-form";

export const dynamic = "force-dynamic";

export default function VendorQuestionnairePage() {
  // The vendor layout enforces auth + the NDA gate before this renders.
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Security questionnaire</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Complete all four sections. Your answers save automatically as you go.
        </p>
      </header>
      <QuestionnaireForm />
    </div>
  );
}
