export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Optimistically generates a unique slug and creates the document.
 * If a duplicate key error is encountered on the slug field, it retries with an appended counter.
 *
 * @param {string} baseName The raw string to generate the base slug from
 * @param {Function} createFn A function that takes the generated `slug` and attempts to save the document, returning the result
 * @param {number} maxRetries Maximum number of retries before giving up
 * @returns {Promise<any>} The result of createFn
 */
export async function createWithUniqueSlug(
  baseName,
  createFn,
  maxRetries = 10
) {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 1;

  while (counter <= maxRetries) {
    try {
      return await createFn(slug);
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        throw err; // Re-throw if it's not a slug duplicate key error
      }
    }
  }

  throw new Error('Failed to generate unique slug after maximum retries');
}
