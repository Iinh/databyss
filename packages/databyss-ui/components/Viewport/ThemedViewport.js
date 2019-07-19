import React from 'react'
import { theme as defaultTheme, ThemeProvider } from '../../theming'
import Viewport from './Viewport'

export default ({ theme = defaultTheme, children, ...others }) => (
  <ThemeProvider theme={theme}>
    <Viewport {...others}>{children}</Viewport>
  </ThemeProvider>
)
