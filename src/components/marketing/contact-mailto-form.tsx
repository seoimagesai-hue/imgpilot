"use client";

import {useState} from "react";

export function ContactMailtoForm({
  supportEmail,
  labels,
}: {
  supportEmail: string | null;
  labels: {
    name: string;
    email: string;
    subject: string;
    message: string;
    submit: string;
    unavailable: string;
    required: string;
  };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!supportEmail) {
      setError(labels.unavailable);
      return;
    }
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(labels.required);
      return;
    }
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      "",
      message.trim(),
    ].join("\n");
    const href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  const disabled = !supportEmail;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          <span>{labels.name}</span>
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>{labels.email}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>{labels.subject}</span>
        <input
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={disabled}
          className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>{labels.message}</span>
        <textarea
          name="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {disabled ? (
        <p className="text-sm text-[var(--muted-foreground)]">{labels.unavailable}</p>
      ) : null}
      <button type="submit" className="btn-primary min-h-11 px-6 text-sm" disabled={disabled}>
        {labels.submit}
      </button>
    </form>
  );
}
