import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"

export const CaptionImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) =>
          (element.matches("img")
            ? element
            : element.querySelector("img")
          )?.getAttribute("src"),
      },
      alt: {
        default: null,
        parseHTML: (element) =>
          (element.matches("img")
            ? element
            : element.querySelector("img")
          )?.getAttribute("alt"),
      },
      title: {
        default: null,
        parseHTML: (element) =>
          (element.matches("img")
            ? element
            : element.querySelector("img")
          )?.getAttribute("title"),
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.closest("figure")?.querySelector("figcaption")?.textContent ||
          "",
        rendered: false,
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => (element.querySelector("img") ? null : false),
      },
      { tag: "img[src]" },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    const children = [["img", HTMLAttributes]]
    if (node.attrs.caption)
      children.push(["figcaption", {}, node.attrs.caption])
    return ["figure", { class: "post-image" }, ...children]
  },
})

export function documentExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer" },
      },
    }),
    CaptionImage.configure({ allowBase64: false }),
    Youtube.configure({ nocookie: true, controls: true }),
  ]
}
