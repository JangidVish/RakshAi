// Config-driven security questionnaire. The UI renders from this and the API
// validates against it, so questions can be added/reordered in one place.

export type FieldType = "text" | "textarea" | "select" | "checkbox";

export type Field = {
  id: string; // unique across ALL sections; used as the answer key
  label: string;
  type: FieldType;
  options?: string[]; // for select
  required?: boolean;
};

export type Section = {
  id: string;
  title: string;
  fields: Field[];
};

export const QUESTIONNAIRE: Section[] = [
  {
    id: "company",
    title: "Company Info",
    fields: [
      { id: "legal_name", label: "Legal company name", type: "text", required: true },
      { id: "headquarters", label: "Headquarters location", type: "text", required: true },
      { id: "employee_count", label: "Number of employees", type: "select", options: ["1-50", "51-200", "201-1000", "1000+"], required: true },
      { id: "primary_contact", label: "Primary security contact email", type: "text", required: true },
    ],
  },
  {
    id: "security",
    title: "Security Posture",
    fields: [
      { id: "mfa_enforced", label: "Is MFA enforced for all employees?", type: "select", options: ["Yes", "No", "Partial"], required: true },
      { id: "encryption_at_rest", label: "Is data encrypted at rest?", type: "select", options: ["Yes", "No"], required: true },
      { id: "incident_response", label: "Do you have an incident response plan?", type: "select", options: ["Yes", "No"], required: true },
      { id: "pentest_frequency", label: "How often do you run penetration tests?", type: "select", options: ["Never", "Annually", "Quarterly", "Continuously"], required: false },
      { id: "security_notes", label: "Additional security details", type: "textarea", required: false },
    ],
  },
  {
    id: "ai",
    title: "AI Tools Used",
    fields: [
      { id: "uses_ai", label: "Does your product use AI/ML?", type: "select", options: ["Yes", "No"], required: true },
      { id: "ai_vendors", label: "Which AI providers do you use? (e.g. OpenAI, Anthropic)", type: "text", required: false },
      { id: "customer_data_in_ai", label: "Is customer data sent to AI models?", type: "select", options: ["Yes", "No", "Anonymized only"], required: true },
      { id: "ai_governance", label: "Describe your AI governance / data-handling policy", type: "textarea", required: false },
    ],
  },
  {
    id: "compliance",
    title: "Compliance",
    fields: [
      { id: "certifications", label: "Certifications held", type: "select", options: ["None", "SOC 2", "ISO 27001", "SOC 2 + ISO 27001"], required: true },
      { id: "gdpr", label: "Are you GDPR compliant?", type: "select", options: ["Yes", "No", "N/A"], required: true },
      { id: "data_residency", label: "Where is customer data stored?", type: "text", required: true },
      { id: "confirm_accurate", label: "I confirm this information is accurate", type: "checkbox", required: true },
    ],
  },
];

/** All field ids marked required, across every section. */
export function requiredFieldIds(): string[] {
  return QUESTIONNAIRE.flatMap((s) =>
    s.fields.filter((f) => f.required).map((f) => f.id)
  );
}

/** All valid field ids (used to reject unknown keys). */
export function allFieldIds(): Set<string> {
  return new Set(QUESTIONNAIRE.flatMap((s) => s.fields.map((f) => f.id)));
}

/**
 * Return the list of required fields that are missing/blank in `answers`.
 * A checkbox counts as answered only when truthy.
 */
export function missingRequired(answers: Record<string, unknown>): string[] {
  const required = QUESTIONNAIRE.flatMap((s) =>
    s.fields.filter((f) => f.required).map((f) => f)
  );
  return required
    .filter((f) => {
      const v = answers[f.id];
      if (f.type === "checkbox") return v !== true;
      return v === undefined || v === null || String(v).trim() === "";
    })
    .map((f) => f.id);
}
