import { useState, useEffect, useCallback } from "react";
import { Mail, Github, Linkedin, MapPin, CheckCircle, XCircle } from "lucide-react";
import contactData from "../data/contact.json";
import { useReveal } from "../hooks/use-reveal";
import { Button } from "./ui/button";

const ICON_MAP: Record<string, React.ElementType> = { Mail, Github, Linkedin, MapPin };

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
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-300 ${
      isSuccess ? "bg-green-950/90 border-green-500/40 text-green-300" : "bg-red-950/90 border-red-500/40 text-red-300"
    }`}>
      {isSuccess
        ? <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
        : <XCircle size={18} className="text-red-400 flex-shrink-0" />}
      <span className="text-sm font-medium">
        {isSuccess
          ? "Email client opened! Click Send to deliver your message."
          : "Please fill in all fields before sending."}
      </span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 motion-safe:transition-opacity text-xs">✕</button>
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

  return (
    <section id="contact" ref={ref} className="min-h-screen flex items-center py-20 relative overflow-hidden">
      <Toast status={status} onClose={() => setStatus("idle")} />

      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-white/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/3 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className={`text-center mb-16 relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-8xl font-bold text-white/8 uppercase tracking-widest select-none whitespace-nowrap">
            CONTACT
          </span>
          <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-foreground">GET IN </span>
            <span className="text-white">TOUCH</span>
          </h2>
          <div className="w-20 h-1 bg-white mx-auto mt-4 rounded-full" />
        </div>

        {/* Intro */}
        <div className={`mb-12 text-center max-w-2xl mx-auto transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h3 className="text-2xl font-bold tracking-tight mb-3">{contactData.intro.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{contactData.intro.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-stretch">

          {/* Left: contact info */}
          <div className={`lg:col-span-2 flex flex-col justify-between gap-3 ${isVisible ? "animate-in slide-in-from-left fade-in duration-700 fill-mode-backwards" : "opacity-0"}`}
            style={{ animationDelay: "200ms" }}>
            {contactData.contacts.map((contact, index) => {
              const Icon = ICON_MAP[contact.icon];
              const isLink = !!contact.href;
              const Wrapper = isLink ? "a" : "div";
              const wrapperProps = isLink
                ? { href: contact.href, target: contact.id !== "email" ? "_blank" : undefined, rel: contact.id !== "email" ? "noopener noreferrer" : undefined }
                : {};
              return (
                <Wrapper key={contact.id} {...wrapperProps}
                  className={`flex items-center gap-4 p-4 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/50 backdrop-blur-sm motion-safe:transition-all motion-safe:duration-300 ${isLink ? "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] hover:bg-[#111111]/80 cursor-pointer group" : ""}`}
                  style={{ animationDelay: isVisible ? `${300 + index * 80}ms` : "0ms" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 motion-safe:transition-colors">
                    {Icon && <Icon size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{contact.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{contact.value}</p>
                  </div>
                </Wrapper>
              );
            })}
          </div>

          {/* Right: contact form */}
          <div className={`lg:col-span-3 ${isVisible ? "animate-in slide-in-from-right fade-in duration-700 fill-mode-backwards" : "opacity-0"}`}
            style={{ animationDelay: "400ms" }}>
            <div className="relative rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/60 backdrop-blur-sm overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-5 bg-white rounded-full inline-block" />
                  Send Me a Message
                </h3>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" type="text" placeholder="Name" value={form.name} onChange={handleChange} required
                      className="w-full p-3 bg-[#111111]/80 border border-[#262626] rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white motion-safe:transition-colors text-sm" />
                    <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required
                      className="w-full p-3 bg-[#111111]/80 border border-[#262626] rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white motion-safe:transition-colors text-sm" />
                  </div>
                  <input name="subject" type="text" placeholder="Subject" value={form.subject} onChange={handleChange} required
                    className="w-full p-3 bg-[#111111]/80 border border-[#262626] rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white motion-safe:transition-colors text-sm" />
                  <textarea name="message" placeholder="Message" rows={6} value={form.message} onChange={handleChange} required
                    className="w-full p-3 bg-[#111111]/80 border border-[#262626] rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white motion-safe:transition-colors resize-none text-sm" />
                  <Button type="submit"
                    className="w-full py-3 bg-white text-[#0a0a0a] font-bold rounded-lg hover:bg-[#e5e5e5] motion-safe:transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
