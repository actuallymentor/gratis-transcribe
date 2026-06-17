import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Settings } from 'lucide-react'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { Button } from '../atoms/Button.jsx'
import { StatusBadge } from '../atoms/StatusBadge.jsx'
import { FilePicker } from '../molecules/FilePicker.jsx'
import { ModelStatusPanel } from '../molecules/ModelStatusPanel.jsx'
import { ProcessingPanel } from '../molecules/ProcessingPanel.jsx'
import { TranscriptPanel } from '../molecules/TranscriptPanel.jsx'
import { SHARE_ERROR_MESSAGES } from '../../modules/shared/constants.js'
import { use_model_store } from '../../stores/model_store.js'
import { use_transcript_store } from '../../stores/transcript_store.js'

const Layout = styled.main`
    display: grid;
    gap: 1.25rem;
    margin: 0 auto;
    max-width: 58rem;
    padding: 1rem;
    width: 100%;
`

const Header = styled.header`
    align-items: start;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    padding-top: 1rem;
`

const Intro = styled.section`
    display: grid;
    gap: 1rem;
`

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`

/**
 * Main install, share, and transcription page.
 * @returns {JSX.Element}
 */
export function HomePage() {

    const navigate = useNavigate()
    const [ search_params ] = useSearchParams()
    const share_id = search_params.get( `share_id` )
    const share_error = search_params.get( `share_error` )

    const model = use_model_store()
    const transcript = use_transcript_store()

    useEffect( () => {
        model.initialize()
    }, [] )

    useEffect( () => {
        if( share_id ) transcript.load_share( share_id )
        if( share_error ) transcript.set_error( SHARE_ERROR_MESSAGES[ share_error ] || `The shared file could not be opened.` )
    }, [ share_id, share_error ] )

    useEffect( () => {
        const receive_message = event => {
            if( event.data?.type === `share-received` ) navigate( `/?share_id=${ encodeURIComponent( event.data.share_id ) }` )
        }

        navigator.serviceWorker?.addEventListener( `message`, receive_message )

        return () => navigator.serviceWorker?.removeEventListener( `message`, receive_message )
    }, [ navigate ] )

    const choose_file = async file => {
        try {
            const share = await transcript.save_manual_file( file )
            navigate( `/?share_id=${ encodeURIComponent( share.share_id ) }` )
        } catch ( error ) {
            toast.error( error.message )
        }
    }

    const download_model = () => model.download_model().catch( error => toast.error( error.message ) )
    const process_share = () => transcript.process_current_share().catch( error => toast.error( error.message ) )

    return <Layout>
        <Header>
            <div>
                <h1>Transcribe Gratis</h1>
                <p>Install this app to transcribe shared audio messages locally on your phone.</p>
            </div>
            <Button as={ Link } to="/settings" icon={ Settings }>Settings</Button>
        </Header>

        <Intro>
            <StatusBadge tone={ model.readiness?.ready ? `ready` : `warn` }>
                { model.readiness?.ready ? `Offline ready` : `Model not downloaded` }
            </StatusBadge>
            <p>Audio stays on this device.</p>
            <Actions>
                <FilePicker disabled={ transcript.is_processing } on_file={ choose_file } />
                <Button onClick={ download_model } disabled={ model.setup_status === `downloading` || model.setup_status === `warming` }>Download speech model</Button>
            </Actions>
        </Intro>

        <ModelStatusPanel
            backend={ model.backend }
            error={ model.error }
            is_ready={ Boolean( model.readiness?.ready ) }
            profile={ model.profile }
            progress={ model.setup_progress }
            status={ model.setup_status }
            support={ model.support }
            on_clear={ model.clear_models }
            on_download={ download_model }
        />

        <ProcessingPanel
            error={ transcript.error }
            is_processing={ transcript.is_processing }
            progress={ transcript.progress }
            share={ transcript.share }
            on_cancel={ transcript.cancel_processing }
            on_start={ process_share }
        />

        <TranscriptPanel
            can_retry={ Boolean( transcript.share?.file ) }
            transcript={ transcript.transcript }
            on_clear={ transcript.clear_current_share }
            on_retry={ process_share }
        />
    </Layout>

}
