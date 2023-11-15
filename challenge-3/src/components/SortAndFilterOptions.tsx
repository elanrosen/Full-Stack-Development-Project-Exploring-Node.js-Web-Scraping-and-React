import { Select, Flex, useBreakpointValue } from "@chakra-ui/react";

interface SortAndFilterOptionsProps {
  sortOrder: string;
  setSortOrder: (order: string) => void;
  showUnavailable: boolean;
  setShowUnavailable: (show: boolean) => void;
}

/**
 * A component that provides options to sort and filter domains.
 * One option is alphabetical the other is based of priority outlined in spec for keepBest()
 * @param {SortAndFilterOptionsProps} props - The properties of the component.
 * @returns {JSX.Element} The rendered SortAndFilterOptions component.
 */
export const SortAndFilterOptions: React.FC<SortAndFilterOptionsProps> = ({
  ...props
}) => {
  const flexDirection = useBreakpointValue({ base: "column", sm: "row" });

  return (
    <Flex alignItems="center">
      {" "}
      {/* Use Flex container to align items */}
      <Select
        onChange={(e) => props.setSortOrder(e.target.value)}
        value={props.sortOrder}
        maxWidth="200px" // Limit the width of the dropdown
      >
        <option value="none">Oldest</option>
        <option value="name">Domain Name (A-Z)</option>
        <option value="priority">Priority</option>
      </Select>
    </Flex>
  );
};

{/* 

no longer including the availlible filter option

<Checkbox
isChecked={props.showUnavailable}
onChange={(e) => props.setShowUnavailable(e.target.checked)}
ml={2} // Add margin to the left for spacing
>
Show Unavailable
</Checkbox> */}