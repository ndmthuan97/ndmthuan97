import { useState, useEffect, useCallback } from "react";
import { Mail, Phone, Github, Linkedin, MapPin, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import contactData from "../data/contact.json";
import { useReveal } from "../hooks/use-reveal";

const ICON_MAP: Record<string, React.ElementType> = { Mail, Phone, Github, Linkedin, MapPin };

type Status = "idle" | "success" | "error";

function Toast({ status, onClose }: { status: Status; onClose: () => void }) {
  useEffect(() => {
    if (status !== "idle") {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  if (status === "idle") return null;

  const isSuccess = status === "success";
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-card backdrop-blur-sm bg-background animate-in slide-in-from-bottom-4 fade-in duration-300">
      {isSuccess
        ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
        : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
      <span className="text-sm font-medium text-foreground">
        {isSuccess
          ? "Email client opened! Click Send to deliver your message."
          : "Please fill in all fields before sending."}
      </span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground motion-safe:transition-colors text-xs cursor-pointer">✕</button>
    </div>
  );
}

export function ContactSection() {
  const { isVisible, ref } = useReveal(0.05);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, subject, message } = form;
    if (!name || !email || !subject || !message) {
      setStatus("error");
      return;
    }
    const emailTo = contactData.contacts.find(c => c.id === "email")?.value ?? "";
    const body = encodeURIComponent(`Hi, I'm ${name}.\n\n${message}\n\nReply to: ${email}`);
    window.open(`mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${body}`, "_blank");
    setStatus("success");
    setForm({ name: "", email: "", subject: "", message: "" });
  }, [form]);

  const inputClass =
    "w-full px-3.5 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground text-sm ring-line focus:ring-strong focus:outline-none motion-safe:transition-shadow";

  return (
    <section id="contact" ref={ref} className="py-24 md:py-32 px-6 md:px-10 lg:px-20 relative">
      <Toast status={status} onClose={() => setStatus("idle")} />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`relative mb-14 text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span aria-hidden="true" className="section-watermark absolute -top-10 left-1/2 -translate-x-1/2 text-7xl md:text-8xl">
            CONTACT
          </span>
          <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
            Contact
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-stretch">
          {/* Left: contact info */}
          <div className={`lg:col-span-2 flex flex-col gap-3 ${isVisible ? "animate-in slide-in-from-left fade-in duration-700 fill-mode-backwards" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}>
            {contactData.contacts.map((contact) => {
              const Icon = ICON_MAP[contact.icon];
              const isLink = !!contact.href;
              const Wrapper = isLink ? "a" : "div";
              const wrapperProps = isLink
                ? { href: contact.href as string, target: contact.id !== "email" ? "_blank" : undefined, rel: contact.id !== "email" ? "noopener noreferrer" : undefined }
                : {};
              return (
                <Wrapper key={contact.id} {...wrapperProps}
                  className={`group flex items-center gap-4 p-4 rounded-xl surface ${isLink ? "surface-hover cursor-pointer" : ""}`}
                >
                  <div className="w-10 h-10 rounded-lg brand-soft flex items-center justify-center flex-shrink-0">
                    {Icon && <Icon size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mono-label text-muted-foreground text-[11px] mb-0.5">{contact.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{contact.value}</p>
                  </div>
                  {isLink && (
                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-safe:transition-all flex-shrink-0" />
                  )}
                </Wrapper>
              );
            })}
          </div>

          {/* Right: contact form */}
          <div className={`lg:col-span-3 ${isVisible ? "animate-in slide-in-from-right fade-in duration-700 fill-mode-backwards" : "opacity-0"}`}
            style={{ animationDelay: "350ms" }}>
            <div className="surface p-6 md:p-8 h-full">
              <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2.5">
                <span className="w-1 h-5 bg-brand rounded-full inline-block" />
                Send me a message
              </h3>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="name" type="text" placeholder="Name" aria-label="Your name" value={form.name} onChange={handleChange} required className={inputClass} />
                  <input name="email" type="email" placeholder="Email" aria-label="Your email" value={form.email} onChange={handleChange} required className={inputClass} />
                </div>
                <input name="subject" type="text" placeholder="Subject" aria-label="Subject" value={form.subject} onChange={handleChange} required className={inputClass} />
                <textarea name="message" placeholder="Message" aria-label="Message" rows={6} value={form.message} onChange={handleChange} required className={`${inputClass} resize-none`} />
                <button type="submit"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 motion-safe:transition-all cursor-pointer">
                  Send message
                  <ArrowUpRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
