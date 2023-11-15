import React from "react";
import {
  Box,
  VStack,
} from "@chakra-ui/react";
import { DomainItem } from "./DomainItem"; // Assuming DomainItem is in the same directory

interface DomainListProps {
  sortedDomains: string[];
  sortedAvailableDomains: boolean[];
  handleEditDomain: (domain: string) => void;
  handleDeleteDomain: (domain: string) => void;
  editedDomainIndex: number | null;
}

/**
 * Component to display a list of domains, each represented by a DomainItem.
 */
export const DomainList: React.FC<DomainListProps> = (props) => {
  return (
    <Box
      height="fit-content"
      maxHeight="calc(50px * 4 + .01 *100vh)" // Approximate height for 4 domains
      overflowY="auto"
      width="100%"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
    >
      <VStack spacing={2}>
        {props.sortedDomains.map((domain, idx) => (
          <DomainItem
            key={idx}
            domain={domain}
            isAvailable={props.sortedAvailableDomains[idx]}
            handleEditDomain={() => props.handleEditDomain(domain)}
            handleDeleteDomain={() => props.handleDeleteDomain(domain)}
            isBeingEdited={props.editedDomainIndex === idx}
          />
        ))}
      </VStack>
    </Box>
  );
};
