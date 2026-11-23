
export function parseApiError(err) {
  const data = err.response?.data
  if (data && typeof data === 'object' && !data.detail) {
    const { non_field_errors: nonField, ...fields } = data
    return { fields, general: nonField ? [].concat(nonField).join(' ') : '' }
  }
  return { fields: {}, general: data?.detail || 'Could not save. Please try again.' }
}
