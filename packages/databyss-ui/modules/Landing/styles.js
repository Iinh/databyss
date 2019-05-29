import { theme as defaultTheme } from '../../shared-styles'

export default (theme = defaultTheme) => ({
  sourcesToc: {
    fontFamily: theme.bodyFont,
  },
  landing: {
    position: 'fixed',
    height: 'calc(100% - 100px)',
    display: 'flex',
    flexDirection: 'column',
  },
})
