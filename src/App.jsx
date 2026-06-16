import { Toaster } from 'react-hot-toast'
import styled from 'styled-components'
import { InstallPill } from './components/molecules/InstallPill.jsx'
import { Button } from './components/atoms/Button.jsx'
import { Routes } from './routes/Routes.jsx'
import { use_service_worker_update } from './hooks/use_service_worker_update.js'

const UpdateBanner = styled.div`
    align-items: center;
    background: #1f2933;
    color: #ffffff;
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding: 0.75rem 1rem;
`

/**
 * Root application component.
 * @returns {JSX.Element}
 */
export function App() {

    const { need_refresh, update_service_worker } = use_service_worker_update()

    return <>
        { need_refresh ? <UpdateBanner>
            <span>Update ready</span>
            <Button onClick={ () => update_service_worker( true ) }>Reload</Button>
        </UpdateBanner> : null }
        <Routes />
        <InstallPill />
        <Toaster position="bottom-center" />
    </>

}
