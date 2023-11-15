import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  useClipboard,
  Flex,
} from "@chakra-ui/react";

import { DomainInput } from "./DomainInput";
import { SortAndFilterOptions } from "./SortAndFilterOptions";
import { Actions } from "./Actions";
import { checkDomainAvailability } from "./domainUtils"; 
import { DomainList } from "./DomainList";  

interface ChallengeProps {
  /**
   * The maximum number of domains the user is allowed to have
   * in their cart. Invalid domains count toward this limit as well.
   *
   * Assumed maxDomains = numDomainsRequired, spec didn't mention maxDomains but its in index.tsx.
   */
  numDomainsRequired: number;
}

export function Challenge(props: ChallengeProps) {
  const { numDomainsRequired } = props;
  const [domains, setDomains] = useState<string[]>([]);
  const [availableDomains, setAvailableDomains] = useState<boolean[]>([]);
  const [inputDomain, setInputDomain] = useState<string>("");
  const [copyValue, setCopyValue] = useState<string>("");
  const { hasCopied, onCopy } = useClipboard(copyValue);
  const [editedDomainIndex, setEditedDomainIndex] = useState<number | null>(
    null
  ); // New state to track which domain is being edited
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>("none");
  const [showUnavailable, setShowUnavailable] = useState<boolean>(true); // To show/hide unavailable domains

  /**
   * Validates if a given domain string is of a correct format.
   *
   * @callback
   * @param {string} domain - The domain string to validate.
   * @returns {boolean} True if the domain is valid, false otherwise.
   */
  const validateDomain = useCallback((domain: string): boolean => {
    const regex = /^(?!http(s)?:\/\/)[a-z0-9\-]+\.((com)|(xyz)|(app))$/i;
    return regex.test(domain);
  }, []);

  /**
   * Deletes a given domain from the domains and availableDomains lists.
   *
   * @callback
   * @param {string} domain - The domain string to delete.
   */
  const handleDeleteDomain = useCallback<(domain: string) => void>(
    (domain: string) => {
      const index = domains.indexOf(domain);
      if (index > -1) {
        setDomains((prev) => prev.filter((_, idx) => idx !== index));
        setAvailableDomains((prev) => prev.filter((_, idx) => idx !== index));

        // Check if the deleted domain is the one being edited
        if (editedDomainIndex === index) {
          setInputDomain(""); // Clear the input box
          setEditedDomainIndex(null); // Exit the edit status
        }
      }
    },
    [domains, editedDomainIndex]
  );

  /**
   * Clears all domains from the domains and availableDomains lists.
   *
   * @callback
   */
  const handleClearCart = useCallback<() => void>(() => {
    setDomains([]);
    setAvailableDomains([]);
  }, []);

  /**
   * Removes all unavailable domains from the domains and availableDomains lists.
   *
   * @callback
   */
  const handleRemoveUnavailable = useCallback<() => void>(() => {
    const newDomains: string[] = [];
    const newAvailability: boolean[] = [];

    domains.forEach((domain, index) => {
      if (availableDomains[index]) {
        newDomains.push(domain);
        newAvailability.push(true);
      }
    });

    setDomains(newDomains);
    setAvailableDomains(newAvailability);
  }, [domains, availableDomains]);

  /**
   * Adds a new domain to the domains and availableDomains lists after performing validations and checks.
   *
   * @callback
   */
  const handleAddDomain = useCallback<() => Promise<void>>(async () => {//used chat-gpt to generate this function
    setIsLoading(true); // Show loading state when checking domain availability
    if (domains.includes(inputDomain.toLowerCase())) {
      setErrorMessage("Domain already added to the cart.");
      setIsLoading(false);
      return;
    }

    if (!validateDomain(inputDomain)) {
      if (inputDomain.includes("http://") || inputDomain.includes("https://")) {
        setErrorMessage("Domain should not start with http:// or https://");
      } else if (
        !inputDomain.endsWith(".com") &&
        !inputDomain.endsWith(".xyz") &&
        !inputDomain.endsWith(".app")
      ) {
        setErrorMessage("Domain should end with .com, .xyz, or .app");
      } else {
        setErrorMessage("Invalid domain format");
      }
      setIsLoading(false); // turn off loading state
      return;
    }

    setErrorMessage(null); // Reset error message if domain is valid
    const domain = inputDomain.toLowerCase();
    const available = await checkDomainAvailability(domain);
    setDomains((prev) => [...prev, domain]);
    setAvailableDomains((prev) => [...prev, available]);
    setInputDomain("");
    setIsLoading(false);
  }, [domains, inputDomain, validateDomain]);

  /**
   * Initiates the editing process for a given domain.
   *
   * @callback
   * @param {string} domain - The domain string to edit.
   */
  const handleEditDomain = useCallback<(domain: string) => void>(
    (domain: string) => {
      const index = domains.indexOf(domain);
      // Check if the domain exists in the list
      if (index > -1) {
        setInputDomain(domains[index]);
        setEditedDomainIndex(index);
      }
    },
    [domains]
  );

  /**
   * Exits the domain editing mode and resets the input field.
   *
   * @callback
   */
  const handleExitEdit = useCallback<() => void>(() => {
    setInputDomain(""); // Clear the current input
    setEditedDomainIndex(null); // Set the edit mode off
  }, []);

  /**
   * Updates a domain in the domains list after performing validations.
   *
   * @callback
   */
  const handleUpdateDomain = useCallback<() => Promise<void>>(async () => {
    // Proceed only if a domain is being edited and the new domain name is valid
    if (editedDomainIndex !== null && validateDomain(inputDomain)) {
      const domain = inputDomain.toLowerCase();
      const available = await checkDomainAvailability(domain);

      // Ensure the domain isn't a duplicate, or it's the same as the one being edited
      if (!domains.includes(domain) || domains[editedDomainIndex] === domain) {
        const updatedDomains = [...domains];
        const updatedAvailableDomains = [...availableDomains];

        // Replace the old domain with the new one and update its availability status
        updatedDomains[editedDomainIndex] = domain;
        updatedDomains[editedDomainIndex] = domain;
        updatedAvailableDomains[editedDomainIndex] = available;

        setDomains(updatedDomains);
        setAvailableDomains(updatedAvailableDomains);
        setInputDomain("");
        setEditedDomainIndex(null);
      }
    }
  }, [
    editedDomainIndex,
    validateDomain,
    inputDomain,
    domains,
    availableDomains,
  ]);

  /**
   * Copies the list of domains to clipboard.
   *
   * @callback
   */
  const handleCopyToClipboard = useCallback<() => void>(() => {
    const domainsToCopy = domains.join(", ");
    setCopyValue(domainsToCopy);
    onCopy();
  }, [domains, onCopy]);

  /**
   * Prioritizes domains based on their extensions and length.
   *
   * @callback
   * @param {string[]} domainList - List of domains to prioritize.
   * @returns {string[]} - The prioritized list of domains.
   */
  const prioritizeDomains = useCallback<(domainList: string[]) => string[]>((domainList: string[]) => {
    return domainList.sort((a, b) => {
      const endingsPriority: { [key: string]: number } = {
        ".com": 3,
        ".app": 2,
        ".xyz": 1,
      };

      // Get the ending for each domain
      const aEnding = a.substring(a.lastIndexOf("."));
      const bEnding = b.substring(b.lastIndexOf("."));

      // Compare endings first
      if (endingsPriority[aEnding] > endingsPriority[bEnding]) return -1;
      if (endingsPriority[aEnding] < endingsPriority[bEnding]) return 1;

      // If same ending, compare lengths
      return a.length - b.length;
    });
  }, []);

  /**
   * Trim the list to keep only the top-priority domains up to the required number
   *
   * @callback
   */
  const handleKeepBest = useCallback(() => {
    // Combine domains and availableDomains into an array of objects
    const combinedDomains = domains.map((domain, index) => ({
      domain,
      available: availableDomains[index],
    }));
  
    // Sort the combined array by domain priority
    const prioritizedCombined = combinedDomains.sort((a, b) => {
      const aEnding = a.domain.substring(a.domain.lastIndexOf("."));
      const bEnding = b.domain.substring(b.domain.lastIndexOf("."));
      const endingsPriority: { [key: string]: number } = {
        ".com": 3,
        ".app": 2,
        ".xyz": 1,
      };
  
      // Compare endings first
      if (endingsPriority[aEnding] > endingsPriority[bEnding]) return -1;
      if (endingsPriority[aEnding] < endingsPriority[bEnding]) return 1;
  
      // If same ending, compare lengths
      return a.domain.length - b.domain.length;
    });
  
    // Trim the prioritized list to keep only up to numDomainsRequired
    const trimmedCombined = prioritizedCombined.slice(0, numDomainsRequired);
  
    // Extract separate arrays for domains and their availability
    const newDomains = trimmedCombined.map(item => item.domain);
    const newAvailableDomains = trimmedCombined.map(item => item.available);
  
    setDomains(newDomains);
    setAvailableDomains(newAvailableDomains);
  }, [domains, availableDomains, numDomainsRequired]);

  /**
   * Sorts the domains list based on the given sortOrder.
   *
   * @memoized
   * @returns {string[]} - The sorted list of domains.
   */
  const sortedDomains: string[] = useMemo(() => {
    const sortByName = (domainList: string[]): string[] => 
        [...domainList].sort((a, b) => a.localeCompare(b));

    const sortByPriority = (domainList: string[]): string[] => 
        prioritizeDomains([...domainList]);

    switch (sortOrder) {
        case "name":
            return sortByName(domains);
        case "priority":
            return sortByPriority(domains);
        default:
            return [...domains];
    }
}, [domains, sortOrder, prioritizeDomains]);

  const sortedAvailableDomains: boolean[] = useMemo(() => {
    if (sortOrder === "name") {
      const sortedIndices = domains
        .map((_, idx) => idx)
        .sort((a, b) => domains[a].localeCompare(domains[b]));
      return sortedIndices.map((index) => availableDomains[index]);
    } else if (sortOrder === "priority") {
      // If prioritizeDomains affects the order of domains but doesn't return indices,
      // then you need to align availableDomains with the sortedDomains order.
      return sortedDomains.map(
        (domain) => availableDomains[domains.indexOf(domain)]
      );
    }
    return availableDomains;
  }, [availableDomains, domains, sortOrder, sortedDomains]);

  // /**
  //  * Filters and returns the domains to be displayed based on their availability.
  //  *
  //  * @memoized
  //  * @returns {string[]} - The filtered list of domains to display.
  //  */
  // const displayedDomains = useMemo(() => {
  //   if (!showUnavailable) {
  //     return sortedDomains.filter((domain, index) => availableDomains[index]);
  //   }
  //   return sortedDomains;
  // }, [showUnavailable, sortedDomains, availableDomains]);
  //styling for the Box was generated with chat-gpt
  return (
    <VStack spacing={5} w="full" maxW="container.xl" mx="auto" height="100vh">
      <Heading as="h1" size="xl">
        Domain Shopping Site
      </Heading>
      <Box 
        width={{ base: "95%", sm: "85%", md: "75%", lg: "550px" }}
        boxShadow="md"
        p="4"
        borderRadius="lg"
        bg="white"
      >
        <VStack spacing={6}>
          <DomainInput
            inputDomain={inputDomain}
            setInputDomain={setInputDomain}
            errorMessage={errorMessage}
            isLoading={isLoading}
            handleAddDomain={handleAddDomain}
            handleUpdateDomain={handleUpdateDomain}
            handleExitEdit={handleExitEdit}
            editedDomainIndex={editedDomainIndex}
          />
          <SortAndFilterOptions
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            showUnavailable={showUnavailable}
            setShowUnavailable={setShowUnavailable}
          />

          <Box p={4} boxShadow="base" borderRadius="md">
            <DomainList
              sortedDomains={sortedDomains}
              sortedAvailableDomains={sortedAvailableDomains}
              handleEditDomain={handleEditDomain}
              handleDeleteDomain={handleDeleteDomain}
              editedDomainIndex={editedDomainIndex}
            />
          </Box>
          {domains.length > numDomainsRequired && (
            <Text color="red.500">
              You have added too many domains! Please remove some.
            </Text>
          )}

          <Text>{`${domains.length} out of ${numDomainsRequired} domains added to cart`}</Text>
        </VStack>
      </Box>
      <Actions
        handleClearCart={handleClearCart}
        handleRemoveUnavailable={handleRemoveUnavailable}
        handleCopyToClipboard={handleCopyToClipboard}
        handleKeepBest={handleKeepBest}
        numDomainsRequired={numDomainsRequired}
        domains={domains}
      />
    </VStack>
  );
}
