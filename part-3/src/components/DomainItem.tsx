import { HStack, Button, Text, Flex, Spacer, useBreakpointValue } from "@chakra-ui/react";

interface DomainItemProps {
    domain: string;
    isAvailable: boolean;
    handleDeleteDomain: (domain: string) => void;
    handleEditDomain: (domain: string) => void; 
    isBeingEdited: boolean;
}

export const DomainItem: React.FC<DomainItemProps> = (props) => {
    const screenType = useBreakpointValue({ base: "small", md: "medium", lg: "large" });

    const getButtonStyle = (type: any) => { // refactored this component using chatgpt to create a function that generates the button styles
        switch(type) {
            case "small":
                return {
                    fontSize: "12px",
                    height: "24px",
                    px: "1"
                };
            case "medium":
                return {
                    fontSize: "14px",
                    height: "28px",
                    px: "2"
                };
            default:
                return {};
        }
    };

    const buttonStyle = getButtonStyle(screenType);

    return (
        <Flex justify="space-between" align="center" w="100%" p={2} flexWrap="wrap">
            <Text flexShrink={0} isTruncated maxWidth="70%">
                {props.domain}
            </Text>
            <Spacer />
            <Text flexShrink={0} ml={2}
                color={props.isAvailable ? "green.500" : "red.500"}>
                ({props.isAvailable ? "Available" : "Unavailable"})
            </Text>
            <HStack spacing={2} ml={4}> {/* Added marginLeft here */}
                <Button colorScheme="yellow" onClick={() => props.handleEditDomain(props.domain)} {...buttonStyle}>
                    Edit
                </Button>
                <Button colorScheme="red" onClick={() => props.handleDeleteDomain(props.domain)} {...buttonStyle}>
                    Delete
                </Button>
            </HStack>
        </Flex>
    );
}
