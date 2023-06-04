/**
 * creates a markdown representation for the file. In case of an image, it will
 * render an image tag. For all other type of files, it will render a link.
 *
 * @param filename name of the file
 * @param link link to the file
 * @returns markdown for either a link or an image
 */
export function toMarkdown(filename: string, link: string): string {
  let isImage = false
  if (
    filename.endsWith('.png') ||
    filename.endsWith('.jpeg') ||
    filename.endsWith('.jpg') ||
    filename.endsWith('.svg')
  ) {
    isImage = true
  }

  return `${isImage ? '!' : ''}[\`${filename}\`](${link})`
}
