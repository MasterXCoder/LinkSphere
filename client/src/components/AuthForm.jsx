import styles from "./AuthForm.module.css";

export default function AuthForm({ title, subtitle, fields, submitLabel, onSubmit, footerText, footerLink, footerLinkText }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {};
    fields.forEach(f => {
      formData[f.name] = e.target[f.name].value;
    });
    onSubmit(formData);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brandMark}>◈</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
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
          <button type="submit" className={styles.submitBtn}>{submitLabel}</button>
        </form>
        <p className={styles.footer}>
          {footerText}{" "}
          <a href={footerLink} className={styles.footerLink}>{footerLinkText}</a>
        </p>
      </div>
    </div>
  );
}