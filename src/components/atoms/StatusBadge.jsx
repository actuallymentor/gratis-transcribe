import styled from 'styled-components'

const Badge = styled.span`
    align-items: center;
    background: ${ ( { $tone } ) => $tone === `ready` ? `#dff5ec` : $tone === `warn` ? `#fff3cd` : $tone === `error` ? `#fbe0e0` : `#e8f2f5` };
    border: 1px solid ${ ( { $tone } ) => $tone === `ready` ? `#7bc5a0` : $tone === `warn` ? `#dfba4d` : $tone === `error` ? `#e59090` : `#a9c8d0` };
    border-radius: 999px;
    color: #1f2933;
    display: inline-flex;
    font-size: 0.9rem;
    font-weight: 800;
    gap: 0.35rem;
    min-height: 2rem;
    padding: 0.25rem 0.7rem;

    svg {
        flex: 0 0 auto;
        height: 1rem;
        width: 1rem;
    }
`

/**
 * Compact state badge.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function StatusBadge( { children, tone = `neutral` } ) {

    return <Badge $tone={ tone }>{ children }</Badge>

}
