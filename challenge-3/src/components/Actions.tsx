// Actions.tsx

import { HStack, Button, Tooltip, VStack, useBreakpointValue } from "@chakra-ui/react";

interface ActionsProps {
    handleClearCart: () => void;
    handleRemoveUnavailable: () => void;
    handleCopyToClipboard: () => void;
    handleKeepBest: () => void;
    numDomainsRequired: number;
    domains: string[];
}
/**
 * A component that provides various actions like clearing the cart, removing unavailable domains, and copying domains to clipboard.
 *  Used chatgpt to generate the tooltips
 * @param {ActionsProps} props - The properties of the component.
 * @returns {JSX.Element} The rendered Actions component.
 */
export const Actions: React.FC<ActionsProps> = ({ ...props }) => {
    const buttonSpacing = useBreakpointValue({ base: "1", md: "4" });
    return (
        <VStack alignItems="center" spacing={4} width="100%">
            <HStack spacing={buttonSpacing} wrap="wrap" shouldWrapChildren justifyContent="center">
            <Tooltip label="Clear all domains from the cart"> 
                <Button colorScheme="red" onClick={props.handleClearCart}>Clear Cart</Button>
            </Tooltip>
            <Tooltip label="Remove all unavailable domains">
                <Button colorScheme="orange" onClick={props.handleRemoveUnavailable}>Remove Unavailable</Button>
            </Tooltip>
            <Tooltip label="Copy all domains to clipboard">
                <Button colorScheme="blue" onClick={props.handleCopyToClipboard}>Copy to Clipboard</Button>
            </Tooltip>
            <Tooltip label="Keep the best domains based on priority">
                <Button colorScheme="green" isDisabled={props.domains.length <= props.numDomainsRequired} onClick={props.handleKeepBest}>Keep Best</Button>
            </Tooltip>
            <Button colorScheme="teal" isDisabled={props.domains.length !== props.numDomainsRequired}>Purchase</Button>
        </HStack>
    </VStack>
    );
}
