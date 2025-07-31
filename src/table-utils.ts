import { SelectItem } from "primeng/api";
import { 
  StringFilterType, 
  NumericFilterType, 
  createPrimengStringMatchModes, 
  createPrimengNumberMatchModes,
  PrimeNgTableHeader 
} from "./table-state-helper";

/**
 * Creates a complete table header configuration for text columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createTextColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    placeholder?: string;
    matchModeOptions?: SelectItem<StringFilterType>[];
    defaultMatchMode?: StringFilterType;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      styleClass: options.styleClass
    },
    filter: {
      type: "text",
      placeholder: options.placeholder ?? `Search by ${label.toLowerCase()}`,
      matchModeOptions: options.matchModeOptions ?? createPrimengStringMatchModes(),
      defaultMatchMode: options.defaultMatchMode ?? "contains",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a complete table header configuration for numeric columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createNumericColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    placeholder?: string;
    matchModeOptions?: SelectItem<NumericFilterType>[];
    defaultMatchMode?: NumericFilterType;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      styleClass: options.styleClass
    },
    filter: {
      type: "numeric",
      placeholder: options.placeholder ?? `Filter by ${label.toLowerCase()}`,
      matchModeOptions: options.matchModeOptions ?? createPrimengNumberMatchModes(),
      defaultMatchMode: options.defaultMatchMode ?? "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a complete table header configuration for boolean columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createBooleanColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      isBoolean: true,
      styleClass: options.styleClass
    },
    filter: {
      type: "boolean",
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a complete table header configuration for date columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createDateColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    placeholder?: string;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      styleClass: options.styleClass
    },
    filter: {
      type: "date",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a complete table header configuration for dropdown columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param dropdownOptions - Options for the dropdown filter
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createDropdownColumn(
  field: string,
  label: string,
  dropdownOptions: SelectItem[],
  options: {
    hasSort?: boolean;
    placeholder?: string;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      styleClass: options.styleClass
    },
    filter: {
      type: "dropdown",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      matchModeOptions: dropdownOptions,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a complete table header configuration for multiselect columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param multiselectOptions - Options for the multiselect filter
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createMultiselectColumn(
  field: string,
  label: string,
  multiselectOptions: SelectItem[],
  options: {
    hasSort?: boolean;
    placeholder?: string;
    styleClass?: Record<string, string>;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? true,
      styleClass: options.styleClass
    },
    filter: {
      type: "multiselect",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      matchModeOptions: multiselectOptions,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass
    }
  };
}

/**
 * Creates a simple table header configuration without filtering
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Simple PrimeNgTableHeader configuration
 */
export function createSimpleColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    styleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass
    }
  };
}

/**
 * Utility function to merge multiple table header configurations
 * @param headers - Array of table header configurations
 * @returns Array of merged headers
 */
export function mergeTableHeaders(...headers: PrimeNgTableHeader[]): PrimeNgTableHeader[] {
  return headers;
}

/**
 * Utility function to create boolean SelectItem options
 * @param trueLabel - Label for true value
 * @param falseLabel - Label for false value
 * @returns Array of SelectItem for boolean values
 */
export function createBooleanSelectItems(
  trueLabel: string = "Yes",
  falseLabel: string = "No"
): SelectItem[] {
  return [
    { label: trueLabel, value: true },
    { label: falseLabel, value: false }
  ];
}

/**
 * Utility function to create status SelectItem options
 * @param statusOptions - Object mapping status values to labels
 * @returns Array of SelectItem for status values
 */
export function createStatusSelectItems(
  statusOptions: Record<string | number, string>
): SelectItem[] {
  return Object.entries(statusOptions).map(([value, label]) => ({
    label,
    value: isNaN(Number(value)) ? value : Number(value)
  }));
}
