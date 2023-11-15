// import { useState, useMemo, useCallback } from "react";
// import { Box, Input, Button, VStack, Text, HStack, useClipboard, Spinner, Tooltip, Select, Checkbox, Spacer, Flex } from "@chakra-ui/react";
// import { List } from 'immutable';
// import dynamic from 'next/dynamic';

// import { isDomainAvailable } from "../lib/resources";


// async function checkDomainAvailability(domain: string): Promise<boolean> {
//   const response = await fetch(`/api/isDomainAvailable?domain=${domain}`);
//   const data = await response.json();
//   return data.available;
// }


// export interface ChallengeProps {
//   /**
//    * The maximum number of domains the user is allowed to have
//    * in their cart. Invalid domains count toward this limit as well.
//    */
//   numDomainsRequired: number;
// }

// export function Challenge(props: ChallengeProps) {
//   const { numDomainsRequired } = props;
//   const [domains, setDomains] = useState<string[]>([]);
//   const [availableDomains, setAvailableDomains] = useState<boolean[]>([]);
//   const [inputDomain, setInputDomain] = useState("");
//   const [copyValue, setCopyValue] = useState("");
//   const { hasCopied, onCopy } = useClipboard(copyValue);
//   const [editedDomainIndex, setEditedDomainIndex] = useState<number | null>(null); // New state to track which domain is being edited
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [sortOrder, setSortOrder] = useState('none'); // none, name, priority
//   const [showUnavailable, setShowUnavailable] = useState(true); // To show/hide unavailable domains

//   const validateDomain = useCallback((domain: string) => {
//     const regex = /^(?!http(s)?:\/\/)[a-z0-9\-]+\.((com)|(xyz)|(app))$/i;
//     return regex.test(domain);
//   }, []);

//   const handleDeleteDomain = useCallback((index: number) => {
//     setDomains(prev => prev.filter((_, idx) => idx !== index));
//     setAvailableDomains(prev => prev.filter((_, idx) => idx !== index));
//   }, []);

//   const handleClearCart = useCallback(() => {
//     setDomains([]);
//     setAvailableDomains([]);
//   }, []);

//   const handleRemoveUnavailable = useCallback(() => {
//     const newDomains: string[] = [];
//     const newAvailability: boolean[] = [];

//     domains.forEach((domain, index) => {
//       if (availableDomains[index]) {
//         newDomains.push(domain);
//         newAvailability.push(true);
//       }
//     });

//     setDomains(newDomains);
//     setAvailableDomains(newAvailability);
//   }, [domains, availableDomains]);

//   const handleAddDomain = useCallback(async () => {
//     setIsLoading(true);  // Show loading state when checking domain availability
//     if (domains.includes(inputDomain.toLowerCase())) {
//       setErrorMessage("Domain already added to the cart.");
//       setIsLoading(false);
//       return;
//     }

//     if (!validateDomain(inputDomain)) {
//       if (inputDomain.includes("http://") || inputDomain.includes("https://")) {
//         setErrorMessage("Domain should not start with http:// or https://");
//       } else if (!inputDomain.endsWith(".com") && !inputDomain.endsWith(".xyz") && !inputDomain.endsWith(".app")) {
//         setErrorMessage("Domain should end with .com, .xyz, or .app");
//       } else {
//         setErrorMessage("Invalid domain format");
//       }
//       setIsLoading(false);
//       return;
//     }

//     setErrorMessage(null);  // Reset error message if domain is valid
//     const domain = inputDomain.toLowerCase();
//     const available = await checkDomainAvailability(domain);
//     setDomains(prev => [...prev, domain]);
//     setAvailableDomains(prev => [...prev, available]);
//     setInputDomain("");
//     setIsLoading(false);
//   }, [inputDomain]);

//   const handleEditDomain = useCallback((index: number) => {
//     setInputDomain(domains[index]);
//     setEditedDomainIndex(index);
//   }, [domains]);

//   const handleExitEdit = useCallback(() => {
//     setInputDomain("");          // Clear the current input
//     setEditedDomainIndex(null); // Set the edit mode off
//   }, []);

//   const handleUpdateDomain = useCallback(async () => {
//     if (editedDomainIndex !== null && validateDomain(inputDomain)) {
//       const domain = inputDomain.toLowerCase();
//       const available = await checkDomainAvailability(domain);

//       // Check if domain is not duplicate
//       if (!domains.includes(domain) || domains[editedDomainIndex] === domain) {
//         const updatedDomains = [...domains];
//         const updatedAvailableDomains = [...availableDomains];

//         updatedDomains[editedDomainIndex] = domain;
//         updatedAvailableDomains[editedDomainIndex] = available;

//         setDomains(updatedDomains);
//         setAvailableDomains(updatedAvailableDomains);
//         setInputDomain("");
//         setEditedDomainIndex(null);
//       }
//     }
//   }, [inputDomain, domains, editedDomainIndex, validateDomain]);

//   const handleCopyToClipboard = useCallback(() => {
//     const domainsToCopy = domains.join(", ");
//     setCopyValue(domainsToCopy);
//     onCopy();
//   }, [domains, onCopy]);


//   const prioritizeDomains = useCallback((domainList: string[]) => {
//     return domainList.sort((a, b) => {
//       const endingsPriority: { [key: string]: number } = {
//         ".com": 3,
//         ".app": 2,
//         ".xyz": 1
//       };

//       // Get the ending for each domain
//       const aEnding = a.substring(a.lastIndexOf('.'));
//       const bEnding = b.substring(b.lastIndexOf('.'));

//       // Compare endings first
//       if (endingsPriority[aEnding] > endingsPriority[bEnding]) return -1;
//       if (endingsPriority[aEnding] < endingsPriority[bEnding]) return 1;

//       // If same ending, compare lengths
//       return a.length - b.length;
//     });
//   }, []);

//   const handleKeepBest = useCallback(() => {
//     const prioritized = prioritizeDomains(domains);
//     setDomains(prioritized.slice(0, numDomainsRequired));
//   }, [domains, prioritizeDomains, numDomainsRequired]);

//   const sortedDomains = useMemo(() => {
//     let sorted = [...domains];
//     if (sortOrder === 'name') {
//       sorted.sort();
//     } else if (sortOrder === 'priority') {
//       sorted = prioritizeDomains(sorted);
//     }
//     return sorted;
//   }, [domains, prioritizeDomains, sortOrder]);

//   const displayedDomains = useMemo(() => {
//     if (!showUnavailable) {
//       return sortedDomains.filter((domain, index) => availableDomains[index]);
//     }
//     return sortedDomains;
//   }, [showUnavailable, sortedDomains, availableDomains]);

//   return (
//     <>
//       <VStack spacing={6}>
//         <Input
//           value={inputDomain}
//           onChange={(e) => setInputDomain(e.target.value)}
//           placeholder="Enter domain name"
//           onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
//           borderColor={errorMessage ? "red.500" : "gray.200"}
//           mb={2}
//           isInvalid={!!errorMessage}
//         />
//         {isLoading && <Spinner />}
//         {errorMessage && <Text color="red.500">{errorMessage}</Text>}
//         <HStack spacing={4}>
//           <Button colorScheme={editedDomainIndex !== null ? "blue" : "green"} onClick={editedDomainIndex !== null ? handleUpdateDomain : handleAddDomain}>
//             {editedDomainIndex !== null ? "Update" : "Add"}
//           </Button>
//           {editedDomainIndex !== null && <Button onClick={handleExitEdit}>Cancel</Button>}
//         </HStack>
//         <Checkbox isChecked={showUnavailable} onChange={(e) => setShowUnavailable(e.target.checked)}>
//           Show Unavailable Domains
//         </Checkbox>
//         <Box p={4} boxShadow="base" borderRadius="md">
//           <Select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder} mb={4}>
//             <option value="none">Sort by ...</option>
//             <option value="name">Domain Name (A-Z)</option>
//             <option value="priority">Priority</option>
//           </Select>
//           {displayedDomains.map((domain) => {
//             const originalIndex = domains.indexOf(domain); // Get the original index from the domains state

//             return (
//               <Flex
//                 key={domain}
//                 justify="space-between"
//                 align="center"
//                 backgroundColor={editedDomainIndex === originalIndex ? "gray.200" : "transparent"}
//                 p={2}
//                 borderRadius="md"
//                 my={2}
//               >
//                 <Text flex="2">{domain} ({availableDomains[originalIndex] ? "Available" : "Unavailable"})</Text>
//                 <Spacer />
//                 <Button colorScheme="yellow" flex="1" onClick={() => handleEditDomain(originalIndex)}>Edit</Button>
//                 <Button colorScheme="red" flex="1" ml={2} onClick={() => handleDeleteDomain(originalIndex)}>Delete</Button>
//               </Flex>
//             );
//           })}
//         </Box>

//         <Text>{`${domains.length} out of ${numDomainsRequired} domains added`}</Text>
//         {domains.length > numDomainsRequired && <Text color="red.500">You have added too many domains! Please remove some.</Text>}

//         <HStack spacing={4}>
//           <Tooltip label="Clear all domains from the cart">
//             <Button colorScheme="red" onClick={handleClearCart}>Clear Cart</Button>
//           </Tooltip>
//           <Tooltip label="Remove all unavailable domains">
//             <Button colorScheme="orange" onClick={handleRemoveUnavailable}>Remove Unavailable</Button>
//           </Tooltip>
//           <Tooltip label="Copy all domains to clipboard">
//             <Button colorScheme="blue" onClick={handleCopyToClipboard}>Copy to Clipboard</Button>
//           </Tooltip>
//           <Tooltip label="Keep the best domains based on priority">
//             <Button colorScheme="green" onClick={handleKeepBest}>Keep Best</Button>
//           </Tooltip>
//           <Button colorScheme="teal" isDisabled={domains.length !== numDomainsRequired}>Purchase</Button>
//         </HStack>
//       </VStack>
//     </>
//   );
// }
