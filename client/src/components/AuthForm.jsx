import { Link } from "react-router-dom";
import Logo from "./Logo";
import styles from "./AuthForm.module.css";

export default function AuthForm({
  title, subtitle, fields,
  submitLabel, onSubmit,
  footerText, footerLink, footerLinkText,
  error, loading,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {};
    fields.forEach(f => { formData[f.name] = e.target[f.name].value; });
    onSubmit(formData);
  };

  return (
    <div className={styles.wrapper}>
      {/* Twinkling stars background */}
      <div className={styles.starField}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className={styles.star} style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
          }} />
        ))}
      </div>

      <div className={styles.card}>
        <Logo size={28} light />
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {fields.map((field) => (
            <div className={styles.field} key={field.name}>
              <label className={styles.label}>{field.label}</label>
              <input
                className={styles.input}
                type={field.type || "text"}
                name={field.name}
                placeholder={field.placeholder}
                required
              />
            </div>
          ))}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? "Please wait…" : submitLabel}
          </button>
        </form>

        <div className={styles.divider} />
        <p className={styles.footer}>
          {footerText}{" "}
          <Link to={footerLink} className={styles.footerLink}>{footerLinkText}</Link>
        </p>
      </div>
    </div>
  );
}