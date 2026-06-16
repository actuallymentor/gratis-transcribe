import { Clipboard, RotateCcw, Share2, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { Button } from '../atoms/Button.jsx'

const Panel = styled.section`
    border: 1px solid #cbd5df;
    border-radius: 0.5rem;
    display: grid;
    gap: 1rem;
    padding: 1rem;
`

const TranscriptText = styled.div`
    background: #ffffff;
    border: 1px solid #d7e1e8;
    border-radius: 0.5rem;
    line-height: 1.6;
    max-height: 45dvh;
    overflow: auto;
    padding: 1rem;
    white-space: pre-wrap;
`

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
`

/**
 * Displays transcript output and actions.
 * @param {Object} props
 * @returns {JSX.Element|null}
 */
export function TranscriptPanel( { transcript, can_retry = false, on_clear, on_retry } ) {

    if( !transcript ) return null

    const copy_text = async () => {
        await navigator.clipboard.writeText( transcript.text )
        toast.success( `Copied` )
    }

    const share_text = async () => {
        if( navigator.share ) {
            await navigator.share( { text: transcript.text, title: `Transcript` } )
            return
        }

        await copy_text()
    }

    return <Panel aria-label="Transcript">
        <h2>Transcript</h2>
        <TranscriptText>{ transcript.text || `No speech detected.` }</TranscriptText>
        <Actions>
            <Button icon={ Clipboard } onClick={ copy_text }>Copy</Button>
            <Button icon={ Share2 } onClick={ share_text }>Share text</Button>
            { can_retry ? <Button icon={ RotateCcw } onClick={ on_retry }>Retry</Button> : null }
            <Button icon={ Trash2 } onClick={ on_clear }>Clear</Button>
        </Actions>
    </Panel>

}
