import styled from 'styled-components'

const Track = styled.div`
    background: #d9e3ea;
    border-radius: 999px;
    height: 0.7rem;
    overflow: hidden;
    width: 100%;
`

const Fill = styled.div`
    background: #2f7f8f;
    height: 100%;
    transition: width 180ms ease;
    width: ${ ( { $percent } ) => `${ Math.max( 0, Math.min( 100, $percent ) ) }%` };
`

/**
 * Shows bounded task progress.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function ProgressBar( { percent = 0 } ) {

    return <Track aria-label={ `${ Math.round( percent ) }% complete` }>
        <Fill $percent={ percent } />
    </Track>

}
