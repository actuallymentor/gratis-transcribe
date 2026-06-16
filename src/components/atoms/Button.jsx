import styled from 'styled-components'

const StyledButton = styled.button`
    align-items: center;
    appearance: none;
    background: ${ ( { $variant } ) => $variant === `primary` ? `#1f2933` : `#ffffff` };
    border: 1px solid ${ ( { $variant } ) => $variant === `primary` ? `#1f2933` : `#cbd5df` };
    border-radius: 0.5rem;
    color: ${ ( { $variant } ) => $variant === `primary` ? `#ffffff` : `#1f2933` };
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 700;
    gap: 0.5rem;
    justify-content: center;
    min-height: 3rem;
    padding: 0.65rem 1rem;
    text-decoration: none;
    transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;

    &:hover {
        background: ${ ( { $variant } ) => $variant === `primary` ? `#334155` : `#f3f7f9` };
    }

    &:active {
        transform: translateY(1px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    svg {
        flex: 0 0 auto;
        height: 1.1rem;
        width: 1.1rem;
    }
`

/**
 * Accessible command button.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function Button( { children, icon: Icon, variant = `secondary`, ...props } ) {

    return <StyledButton $variant={ variant } { ...props }>
        { Icon ? <Icon aria-hidden="true" /> : null }
        <span>{ children }</span>
    </StyledButton>

}
