import React from 'react'
import ThemeProvider from '@databyss-org/ui/theming/ThemeProvider'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Header from './header'
import Login from './body/Login'

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Router>
          <Header />
          <div>
            <div style={{ height: '90vh' }}>
              <Route exact path="/:id?" component={Login} />
            </div>
          </div>
        </Router>
      </div>
    </ThemeProvider>
  )
}

export default App
