
export default function FormField({
  label,
  name,
  value,
  onChange,
  error,
  as: Control = 'input',
  children,
  ...rest
}) {
  const errorId = `${name}-error`
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <Control
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        {children}
      </Control>
      {error && (
        <p id={errorId} className="field-error">
          {[].concat(error).join(' ')}
        </p>
      )}
    </div>
  )
}
