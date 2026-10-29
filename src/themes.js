import { ref } from 'vue'

const storageKey = 'cruise-control-ui.theme'
const styles = Object.fromEntries(Object.entries(
  import.meta.glob('/node_modules/bootswatch/dist/*/bootstrap.min.css', {
    query: '?url',
    import: 'default',
    eager: true
  })
).map(([path, url]) => [path.split('/').at(-2), url]))

export const themes = Object.keys(styles).sort().map(value => ({
  value,
  label: value[0].toUpperCase() + value.slice(1)
}))

function savedTheme () {
  try {
    const saved = localStorage.getItem(storageKey)
    if (Object.hasOwn(styles, saved)) return saved
  } catch {}
  return 'sandstone'
}

export const currentTheme = ref(savedTheme())

export function setTheme (name) {
  const theme = Object.hasOwn(styles, name) ? name : 'sandstone'
  let stylesheet = document.querySelector('link[data-bootswatch-theme]')
  if (!stylesheet) {
    stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.dataset.bootswatchTheme = ''
    document.head.appendChild(stylesheet)
  }
  stylesheet.href = styles[theme]
  currentTheme.value = theme
  try {
    localStorage.setItem(storageKey, theme)
  } catch {}
}
