import { AlertTriangle, CheckCircle2, Database, Download, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import { Button } from '../atoms/Button.jsx'
import { ProgressBar } from '../atoms/ProgressBar.jsx'
import { StatusBadge } from '../atoms/StatusBadge.jsx'

const Panel = styled.section`
    border: 1px solid #cbd5df;
    border-radius: 0.5rem;
    display: grid;
    gap: 1rem;
    padding: 1rem;
`

const Header = styled.div`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
`

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`

const Support = styled.div`
    display: grid;
    gap: 0.75rem;
`

const SupportList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
`

/**
 * Model readiness controls.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function ModelStatusPanel( { backend, error, is_ready, profile, progress, status, support, on_download, on_clear } ) {

    const badge_label = is_ready ? `Offline ready` : status === `downloading` || status === `warming` ? `Downloading model` : `Model not downloaded`
    const support_ready = support?.supported
    const support_label = support ? support_ready ? `Runtime supported` : `Runtime blocked` : `Checking runtime`
    const support_backend_label = support?.preferred_backend === `webgpu` ? `WebGPU preferred` : `WASM fallback`
    const missing_support_details = support?.missing_required_checks?.map( ( { detail } ) => detail ) || []

    return <Panel aria-label="Model status">
        <Header>
            <div>
                <h2>Speech model</h2>
                <p>{ profile.label }{ backend ? ` on ${ backend.toUpperCase() }` : `` }</p>
            </div>
            <StatusBadge tone={ is_ready ? `ready` : `warn` }>{ badge_label }</StatusBadge>
        </Header>

        { status === `downloading` || status === `warming` ? <ProgressBar percent={ progress } /> : null }
        { error ? <p role="alert">{ error }</p> : null }

        <Support aria-label="Runtime support">
            <Header>
                <h3>Runtime support</h3>
                <StatusBadge tone={ support_ready ? `ready` : support ? `error` : `warn` }>
                    { support_ready ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" /> }
                    { support_label }
                </StatusBadge>
            </Header>

            { support ? <>
                <SupportList>
                    <StatusBadge tone={ support_ready ? `ready` : `warn` }>{ support_backend_label }</StatusBadge>
                    { support.checks.map( check => <StatusBadge key={ check.id } tone={ check.tone }>
                        { check.ok ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" /> }
                        { check.label }
                    </StatusBadge> ) }
                </SupportList>
                { missing_support_details.length ? <p role="alert">{ missing_support_details.join( ` ` ) }</p> : null }
            </> : null }
        </Support>

        <Actions>
            <Button icon={ Download } onClick={ on_download } disabled={ status === `downloading` || status === `warming` }>Download speech model</Button>
            <Button icon={ Trash2 } onClick={ on_clear }>Clear model cache</Button>
            <StatusBadge><Database /> { Math.round( profile.estimated_bytes / 1_024 / 1_024 ) } MB estimate</StatusBadge>
        </Actions>
    </Panel>

}
