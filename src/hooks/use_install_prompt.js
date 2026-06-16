import { useEffect, useMemo, useState } from 'react'

/**
 * Tracks the browser's PWA install prompt event.
 * @returns {{can_install: boolean, is_standalone: boolean, prompt_install: Function}}
 */
export function use_install_prompt() {

    const [ prompt_event, set_prompt_event ] = useState( null )
    const [ is_standalone, set_is_standalone ] = useState( false )

    useEffect( () => {
        const standalone_query = window.matchMedia( `(display-mode: standalone)` )
        const update_standalone = () => set_is_standalone( standalone_query.matches || window.navigator.standalone === true )
        const capture_prompt = event => {
            event.preventDefault()
            set_prompt_event( event )
        }

        update_standalone()
        window.addEventListener( `beforeinstallprompt`, capture_prompt )
        standalone_query.addEventListener?.( `change`, update_standalone )

        return () => {
            window.removeEventListener( `beforeinstallprompt`, capture_prompt )
            standalone_query.removeEventListener?.( `change`, update_standalone )
        }
    }, [] )

    return useMemo( () => ( {
        can_install: Boolean( prompt_event ),
        is_standalone,
        prompt_install: async () => {
            if( !prompt_event ) return

            await prompt_event.prompt()
            set_prompt_event( null )
        }
    } ), [ is_standalone, prompt_event ] )

}
