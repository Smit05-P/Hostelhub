"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";

const emptyForm = {
  fullName: "",
  businessName: "",
  businessEmail: "",
  phoneNumber: "",
  numberOfProperties: "1",
  message: "",
  companyWebsite: "",
};

const fields = [
  {
    name: "fullName",
    label: "Full Name",
    type: "text",
    autoComplete: "name",
    placeholder: "Your name",
  },
  {
    name: "businessName",
    label: "Business / Hostel Name",
    type: "text",
    autoComplete: "organization",
    placeholder: "Your business or hostel",
  },
  {
    name: "businessEmail",
    label: "Business Email",
    type: "email",
    autoComplete: "email",
    placeholder: "you@business.com",
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    autoComplete: "tel",
    placeholder: "+91 98765 43210",
  },
];

export default function BetaAccessRequest() {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setResult(null);

    try {
      const response = await fetch("/api/beta-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numberOfProperties: Number(form.numberOfProperties),
        }),
      });
      const payload = await response.json();

      if (
        response.status !== 201 ||
        payload.success !== true ||
        typeof payload.requestId !== "string"
      ) {
        setFieldErrors(payload.fieldErrors || {});
        setResult({
          type: "error",
          message:
            payload.error ||
            "We couldn't save your request. Please try again shortly.",
        });
        return;
      }

      setForm(emptyForm);
      setResult({
        type: "success",
        message:
          "Your request has been saved. This is a request only, not a confirmed demo booking.",
      });
    } catch {
      setResult({
        type: "error",
        message:
          "We couldn't reach the server, so your request was not submitted. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="beta"
      className="scroll-mt-24 bg-[#20352a] px-5 py-20 text-white sm:px-8 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8cbb7]">
            Beta access
          </p>
          <h2 className="mt-5 font-jakarta text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            See if HostelHub fits your property.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
            HostelHub is in beta. Share a few details to request access or a
            guided demo. Your request is stored separately from account
            registration.
          </p>
          <div className="mt-8 space-y-4 text-sm text-white/75">
            <p className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-[#b8cbb7]"
                aria-hidden="true"
              />
              No account is created by this form.
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-[#b8cbb7]"
                aria-hidden="true"
              />
              Submitting saves a request; it does not schedule an appointment.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.75rem] bg-white p-5 text-[#25372d] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.6)] sm:p-8 lg:p-10"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field) => {
              const error = fieldErrors[field.name]?.[0];
              return (
                <div className="flex flex-col gap-2" key={field.name}>
                  <label
                    className="text-sm font-semibold text-[#34453a]"
                    htmlFor={field.name}
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={updateField}
                    required
                    maxLength={field.name === "businessEmail" ? 254 : 160}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${field.name}-error` : undefined}
                    className="form-input"
                  />
                  {error && (
                    <p id={`${field.name}-error`} className="text-xs text-red-700">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-semibold text-[#34453a]"
                htmlFor="numberOfProperties"
              >
                Number of Properties
              </label>
              <input
                id="numberOfProperties"
                name="numberOfProperties"
                type="number"
                min="1"
                max="10000"
                step="1"
                inputMode="numeric"
                value={form.numberOfProperties}
                onChange={updateField}
                required
                aria-invalid={Boolean(fieldErrors.numberOfProperties?.[0])}
                aria-describedby={
                  fieldErrors.numberOfProperties?.[0]
                    ? "numberOfProperties-error"
                    : undefined
                }
                className="form-input"
              />
              {fieldErrors.numberOfProperties?.[0] && (
                <p id="numberOfProperties-error" className="text-xs text-red-700">
                  {fieldErrors.numberOfProperties[0]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                className="text-sm font-semibold text-[#34453a]"
                htmlFor="message"
              >
                Message <span className="font-normal text-[#8b948c]">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                maxLength={2000}
                placeholder="Tell us what you’d like to explore, such as a guided demo or beta access."
                value={form.message}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.message?.[0])}
                aria-describedby={fieldErrors.message?.[0] ? "message-error" : undefined}
                className="form-input resize-y"
              />
              {fieldErrors.message?.[0] && (
                <p id="message-error" className="text-xs text-red-700">
                  {fieldErrors.message[0]}
                </p>
              )}
            </div>
          </div>

          <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="companyWebsite">Leave this field empty</label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.companyWebsite}
              onChange={updateField}
            />
          </div>

          {result && (
            <p
              className={`mt-5 rounded-xl px-4 py-3 text-sm leading-6 ${
                result.type === "success"
                  ? "bg-[#edf4eb] text-[#395b40]"
                  : "bg-red-50 text-red-800"
              }`}
              role="status"
              aria-live="polite"
            >
              {result.message}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="button button-dark w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  Saving request…
                </>
              ) : (
                <>
                  Request beta access <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
            <p className="inline-flex items-center gap-2 text-xs leading-5 text-[#879188]">
              <LockKeyhole size={14} aria-hidden="true" />
              Kept separate from account registration.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
