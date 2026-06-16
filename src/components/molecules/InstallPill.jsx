import { Download } from 'lucide-react'
import styled from 'styled-components'
import { Button } from '../atoms/Button.jsx'
import { use_install_prompt } from '../../hooks/use_install_prompt.js'

const Pill = styled.div`
    bottom: 1rem;
    left: 1rem;
    position: fixed;
    z-index: 20;
`

/**
 * Floating PWA install action.
 * @returns {JSX.Element|null}
 */
export function InstallPill() {

    const { can_install, is_standalone, prompt_install } = use_install_prompt()

    if( is_standalone || !can_install ) return null

    return <Pill>
        <Button icon={ Download } variant="primary" onClick={ prompt_install }>Install App</Button>
    </Pill>

}
