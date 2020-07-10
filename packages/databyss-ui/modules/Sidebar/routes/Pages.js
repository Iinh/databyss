import React from 'react'
import { PagesLoader } from '@databyss-org/ui/components/Loaders'
import SidebarList from '../../../components/Sidebar/SidebarList'

const Pages = () => (
  <PagesLoader>
    {pages => {
      const _menuItems = Object.values(pages)
        .filter(p => !p.archive)
        .map(p => ({
          text: p.name,
          type: 'pages',
          id: p._id,
        }))
      // alphabetize list
      _menuItems.sort(
        (a, b) => (a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1)
      )

      return <SidebarList menuItems={_menuItems} />
    }}
  </PagesLoader>
)

export default Pages
