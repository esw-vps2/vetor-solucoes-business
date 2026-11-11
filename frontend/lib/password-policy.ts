export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_HTML_PATTERN =
  '(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,128}';
export const PASSWORD_REQUIREMENT_LABEL =
  'A senha deve ter pelo menos 6 caracteres, com letras, números e 1 caractere especial.';

export const newPasswordInputProps = {
  maxLength: PASSWORD_MAX_LENGTH,
  minLength: PASSWORD_MIN_LENGTH,
  pattern: PASSWORD_HTML_PATTERN,
  title: PASSWORD_REQUIREMENT_LABEL,
} as const;
