import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Database, RefreshCw, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { Button } from '../atoms/Button.jsx'
import { StatusBadge } from '../atoms/StatusBadge.jsx'
import { MODEL_PROFILES, SETTING_KEYS } from '../../modules/shared/constants.js'
import { clear_content_storage, get_setting, save_setting } from '../../modules/storage/app_db.js'
import { force_app_update } from '../../modules/pwa/force_app_update.js'
import { use_model_store } from '../../stores/model_store.js'

const Layout = styled.main`
    display: grid;
    gap: 1.25rem;
    margin: 0 auto;
    max-width: 48rem;
    padding: 1rem;
    width: 100%;
`

const Section = styled.section`
    border: 1px solid #cbd5df;
    border-radius: 0.5rem;
    display: grid;
    gap: 1rem;
    padding: 1rem;
`

const Segments = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`

const ToggleRow = styled.label`
    align-items: center;
    display: flex;
    gap: 0.75rem;
`

/**
 * Model, storage, and privacy settings.
 * @returns {JSX.Element}
 */
export function SettingsPage() {

    const model = use_model_store()
    const [ delete_audio, set_delete_audio ] = useState( true )

    useEffect( () => {
        model.initialize()
        get_setting( SETTING_KEYS.delete_audio_after_transcription, true ).then( set_delete_audio )
    }, [] )

    const select_profile = profile_id => model.select_profile( profile_id ).catch( error => toast.error( error.message ) )

    const toggle_delete_audio = async event => {
        const value = event.target.checked
        set_delete_audio( value )
        await save_setting( SETTING_KEYS.delete_audio_after_transcription, value )
    }

    const clear_content = async () => {
        await clear_content_storage()
        toast.success( `Stored audio and transcripts cleared` )
    }

    const update_app = async () => {
        const toast_id = toast.loading( `Updating app` )

        try {
            await force_app_update()
        } catch ( error ) {
            toast.error( error.message, { id: toast_id } )
        }
    }

    return <Layout>
        <Button as={ Link } to="/" icon={ ArrowLeft }>Back</Button>

        <section>
            <h1>Settings</h1>
            <p>Audio stays on this device.</p>
        </section>

        <Section>
            <h2>Speech model</h2>
            <Segments>
                { Object.values( MODEL_PROFILES ).map( profile => <Button
                    key={ profile.id }
                    variant={ model.profile.id === profile.id ? `primary` : `secondary` }
                    onClick={ () => select_profile( profile.id ) }
                >
                    { profile.label }
                </Button> ) }
            </Segments>
            <StatusBadge tone={ model.readiness?.ready ? `ready` : `warn` }>
                { model.readiness?.ready ? `Offline ready` : `Model not downloaded` }
            </StatusBadge>
        </Section>

        <Section>
            <h2>Privacy</h2>
            <ToggleRow>
                <input checked={ delete_audio } onChange={ toggle_delete_audio } type="checkbox" />
                <span>Delete source audio after transcription</span>
            </ToggleRow>
        </Section>

        <Section>
            <h2>App</h2>
            <Button icon={ RefreshCw } onClick={ update_app }>Update app</Button>
        </Section>

        <Section>
            <h2>Storage</h2>
            <Button icon={ Database } onClick={ model.clear_models }>Clear model cache</Button>
            <Button icon={ Trash2 } onClick={ clear_content }>Clear audio and transcripts</Button>
        </Section>
    </Layout>

}
