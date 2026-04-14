import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import VersionBadge from './VersionBadge.vue'
import EarlyVersionBanner from './EarlyVersionBanner.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(VersionBadge),
      'home-features-before': () => h(EarlyVersionBanner),
    })
  },
}
