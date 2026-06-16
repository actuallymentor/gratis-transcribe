import { Route, Routes as RouterRoutes } from 'react-router'
import { HomePage } from '../components/pages/HomePage.jsx'
import { SettingsPage } from '../components/pages/SettingsPage.jsx'

/**
 * Application route table.
 * @returns {JSX.Element}
 */
export function Routes() {

    return <RouterRoutes>
        <Route path="/" element={ <HomePage /> } />
        <Route path="/settings" element={ <SettingsPage /> } />
    </RouterRoutes>

}
