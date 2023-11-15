// DomainInput.tsx

import { Input, Spinner, Text, HStack, Button } from "@chakra-ui/react";

interface DomainInputProps {
    inputDomain: string;
    setInputDomain: (domain: string) => void;
    errorMessage: string | null;
    isLoading: boolean;
    handleAddDomain: () => void;
    handleUpdateDomain: () => void;
    handleExitEdit: () => void;
    editedDomainIndex: number | null;
}
/**
 * A component that provides an input field for domains and controls to add or update the domain.
 * 
 * @param {DomainInputProps} props - The properties of the component.
 * @returns {JSX.Element} The rendered DomainInput component.
 */
export const DomainInput: React.FC<DomainInputProps> = ({ ...props }) => {
    return (
        <>
            <Input
                value={props.inputDomain}
                onChange={(e) => props.setInputDomain(e.target.value)}
                placeholder="Enter domain name"
                onKeyPress={(e) => e.key === "Enter" && props.handleAddDomain()}
                borderColor={props.errorMessage ? "red.500" : "gray.200"}
                mb={2}
                isInvalid={!!props.errorMessage}
            />
            {props.isLoading && <Spinner />}
            {props.errorMessage && <Text color="red.500">{props.errorMessage}</Text>}
            <HStack spacing={4}>
                <Button colorScheme={props.editedDomainIndex !== null ? "blue" : "green"} onClick={props.editedDomainIndex !== null ? props.handleUpdateDomain : props.handleAddDomain}>
                    {props.editedDomainIndex !== null ? "Update" : "Add"}
                </Button>
                {props.editedDomainIndex !== null && <Button onClick={props.handleExitEdit}>Cancel</Button>}
            </HStack>
        </>
    );
}
