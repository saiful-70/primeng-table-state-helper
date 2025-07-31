import { HttpClient, HttpContext } from "@angular/common/http";
import { Signal, signal } from "@angular/core";
import { patchState, signalState } from "@ngrx/signals";
import { FilterMetadata, SelectItem } from "primeng/api";
import { Table, TableLazyLoadEvent } from "primeng/table";
import { firstValueFrom } from "rxjs";
import { z } from "zod";

/**
 * String filter types for PrimeNG table filtering
 */
export type StringFilterType =
  | "startsWith"
  | "notStartsWith"
  | "endsWith"
  | "notEndsWith"
  | "contains"
  | "notContains";

/**
 * Numeric filter types for PrimeNG table filtering
 */
export type NumericFilterType =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

/**
 * Boolean filter types for PrimeNG table filtering
 */
export type BooleanFilterType = Extract<NumericFilterType, "equals" | "notEquals">;

/**
 * Combined filter types
 */
export type FilterType = StringFilterType | NumericFilterType;

/**
 * Creates PrimeNG SelectItem array for numeric filter match modes
 * @param styleClass - CSS class for styling the options
 * @param disabled - Whether the options should be disabled
 * @returns Array of SelectItem for numeric filters
 */
export function createPrimengNumberMatchModes(
  styleClass: string = "p-text-capitalize",
  disabled: boolean = false
): SelectItem<NumericFilterType>[] {
  return [
    {
      label: "Equals",
      value: "equals",
      title: "Equals",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Not Equals",
      value: "notEquals",
      title: "Not Equals",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Greater Than",
      value: "greaterThan",
      title: "Greater Than",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Greater Than Or Equals",
      value: "greaterThanOrEqual",
      title: "Greater Than Or Equals",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Less Than",
      value: "lessThan",
      title: "Less Than",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Less Than Or Equals",
      value: "lessThanOrEqual",
      title: "Less Than Or Equals",
      styleClass: styleClass,
      disabled: disabled
    }
  ];
}

/**
 * Creates PrimeNG SelectItem array for string filter match modes
 * @param styleClass - CSS class for styling the options
 * @param disabled - Whether the options should be disabled
 * @returns Array of SelectItem for string filters
 */
export function createPrimengStringMatchModes(
  styleClass: string = "p-text-capitalize",
  disabled: boolean = false
): SelectItem<StringFilterType>[] {
  return [
    {
      label: "Contains",
      value: "contains",
      title: "Contains",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Not Contains",
      value: "notContains",
      title: "Not Contains",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Starts With",
      value: "startsWith",
      title: "Starts With",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Not Starts With",
      value: "notStartsWith",
      title: "Not Starts With",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Ends With",
      value: "endsWith",
      title: "Ends With",
      styleClass: styleClass,
      disabled: disabled
    },
    {
      label: "Not Ends With",
      value: "notEndsWith",
      title: "Not Ends With",
      styleClass: styleClass,
      disabled: disabled
    }
  ];
}

/**
 * Filter type mappings for backend API
 */
export type FilterTypeMapped =
  | "starts"
  | "!starts"
  | "ends"
  | "!ends"
  | "like"
  | "!like"
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<=";

/**
 * PrimeNG table header configuration interface
 */
export interface PrimeNgTableHeader {
  identifier: {
    label?: string;
    field: string;
    hasSort?: boolean;
    isBoolean?: boolean;
    styleClass?: Record<string, string>;
  };
  filter?: {
    type: "text" | "numeric" | "boolean" | "date" | "dropdown" | "multiselect";
    placeholder?: string;
    matchModeOptions?: SelectItem[];
    defaultMatchMode: FilterType;
    ariaLabel?: string;
    colspan?: number;
    styleClass?: Record<string, string>;
  };
}

/**
 * Zod schema for dynamic query response validation
 */
export const dynamicQueryResponseZodSchema = z.object({
  data: z.any().array(),
  last_page: z.number(),
  last_row: z.number()
});

/**
 * Dynamic query DTO interface
 */
export interface DynamicQueryDto {
  size: number;
  page: number;
  filter: DynamicQueryFilterDto[];
  sort: DynamicQuerySortDto[];
}

/**
 * Filter DTO for dynamic queries
 */
export interface DynamicQueryFilterDto {
  field: string;
  value: string;
  type: FilterTypeMapped;
}

/**
 * Sort DTO for dynamic queries
 */
export interface DynamicQuerySortDto {
  field: string;
  dir: "asc" | "desc";
}

/**
 * Paged data response interface
 */
export interface PagedDataResponse<T> {
  data: T[];
  last_page: number;
  last_row: number;
}

/**
 * Internal table state interface
 */
interface PrimeNgTableState<T> {
  data: Array<T>;
  isLoading: boolean;
  size: number;
  page: number;
  totalRecords: number;
  filter: DynamicQueryFilterDto[];
  sort: DynamicQuerySortDto[];
}

/**
 * Query parameters type for additional HTTP request parameters
 */
type PrimeNgTableStateHelperQueryParam = Record<string, string | number | boolean>;

/**
 * Initial state factory function
 */
function initialState<T>(): PrimeNgTableState<T> {
  return {
    data: [],
    isLoading: false,
    totalRecords: 0,
    size: 15,
    page: 1,
    filter: [],
    sort: []
  };
}

/**
 * Options for creating PrimeNgTableStateHelper
 */
type PrimeNgTableStateOpts = {
  url: string;
  httpClient: HttpClient;
  skipLoadingSpinnerContext?: any;
};

/**
 * PrimeNG Table State Helper class for managing table state with lazy loading
 */
export class PrimeNgTableStateHelper<T> {
  private readonly state = signalState<PrimeNgTableState<T>>(initialState<T>());
  private urlWithOutRouteParam: string;
  private skipLoadingSpinnerContext?: any;
  readonly #uniqueKey = signal("id");
  readonly uniqueKey = this.#uniqueKey.asReadonly();
  #queryParams: PrimeNgTableStateHelperQueryParam = {};

  // Public readonly signals
  readonly totalRecords: Signal<number> = this.state.totalRecords;
  readonly isLoading: Signal<boolean> = this.state.isLoading;
  readonly data: Signal<Array<T>> = this.state.data;

  private constructor(
    private url: string,
    private readonly httpClient: HttpClient,
    skipLoadingSpinnerContext?: any
  ) {
    this.urlWithOutRouteParam = url;
    this.skipLoadingSpinnerContext = skipLoadingSpinnerContext;
  }

  /**
   * Creates a new instance of PrimeNgTableStateHelper
   * @param options - Configuration options
   * @returns New instance of PrimeNgTableStateHelper
   */
  public static create<T>(options: PrimeNgTableStateOpts): PrimeNgTableStateHelper<T> {
    return new PrimeNgTableStateHelper<T>(
      options.url,
      options.httpClient,
      options.skipLoadingSpinnerContext
    );
  }

  /**
   * Sets the unique key field for table rows
   * @param newUniqueKey - The field name to use as unique identifier
   * @returns This instance for method chaining
   */
  public setUniqueKey(newUniqueKey: string): this {
    this.#uniqueKey.set(newUniqueKey);
    return this;
  }

  /**
   * Sets a new URL and resets the table state
   * @param newUrl - The new API endpoint URL
   * @returns This instance for method chaining
   */
  public setUrl(newUrl: string): this {
    this.url = newUrl;
    this.urlWithOutRouteParam = newUrl;
    patchState(this.state, initialState<T>());
    return this;
  }

  /**
   * Sets route parameters for the URL
   * @param newRouteParam - Route parameter to append to the base URL
   * @returns This instance for method chaining
   */
  public setRouteParam(newRouteParam: string): this {
    const baseUrl = this.urlWithOutRouteParam.endsWith("/")
      ? this.urlWithOutRouteParam.slice(0, -1)
      : this.urlWithOutRouteParam;

    const routeParam = newRouteParam.startsWith("/") 
      ? newRouteParam.slice(1) 
      : newRouteParam;

    this.url = `${baseUrl}/${routeParam}`;
    return this;
  }

  /**
   * Patches existing query parameters
   * @param value - Query parameters to merge with existing ones
   * @returns This instance for method chaining
   */
  public patchQueryParams(value: PrimeNgTableStateHelperQueryParam): this {
    this.#queryParams = Object.assign(this.#queryParams, value);
    return this;
  }

  /**
   * Removes a specific query parameter
   * @param key - The key of the query parameter to remove
   * @returns This instance for method chaining
   */
  public removeQueryParam(key: string): this {
    delete this.#queryParams[key];
    return this;
  }

  /**
   * Sets new query parameters, replacing existing ones
   * @param newQueryParams - New query parameters
   * @returns This instance for method chaining
   */
  public setQueryParams(newQueryParams: PrimeNgTableStateHelperQueryParam): this {
    this.#queryParams = newQueryParams;
    return this;
  }

  /**
   * Fetches data from the API with the given DTO
   * @param dto - Dynamic query DTO with pagination, filtering, and sorting
   */
  private async fetchData(dto: DynamicQueryDto): Promise<void> {
    if (this.state.isLoading()) {
      return;
    }

    patchState(this.state, {
      isLoading: true,
      page: dto.page > 0 ? dto.page : 1,
      size: dto.size > 0 ? dto.size : 15,
      filter: dto.filter,
      sort: dto.sort
    });

    try {
      const httpContext = new HttpContext();
      if (this.skipLoadingSpinnerContext) {
        httpContext.set(this.skipLoadingSpinnerContext, true);
      }

      const loadedData = await firstValueFrom(
        this.httpClient.post<PagedDataResponse<T>>(
          this.url,
          this.dtoBuilder(),
          {
            params: { ...this.#queryParams },
            context: httpContext
          }
        )
      );

      const parsedData = await dynamicQueryResponseZodSchema.parseAsync(loadedData);
      
      patchState(this.state, {
        data: parsedData.data,
        totalRecords: parsedData.last_row
      });
    } catch (error) {
      patchState(this.state, { data: [] });
      throw error;
    } finally {
      patchState(this.state, { isLoading: false });
    }
  }

  /**
   * Refreshes the table data with current state
   */
  async refreshData(): Promise<void> {
    if (this.state.isLoading()) {
      return;
    }

    await this.fetchData(this.dtoBuilder());
  }

  /**
   * Clears the table data and resets state
   * @param dt - PrimeNG Table reference
   */
  clearTableData(dt: Table): void {
    if (this.state.isLoading()) {
      return;
    }

    dt.clear();
    patchState(this.state, initialState<T>());
  }

  /**
   * Handles PrimeNG table lazy load events
   * @param event - Table lazy load event from PrimeNG
   */
  async onLazyLoad(event: TableLazyLoadEvent): Promise<void> {
    const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;

    const sorters: DynamicQuerySortDto[] = [];

    if (event.sortField && !Array.isArray(event.sortField)) {
      sorters.push({
        field: event.sortField,
        dir: event.sortOrder === 1 ? "asc" : "desc"
      });
    }

    const dto: DynamicQueryDto = {
      page: page + 1,
      size: event.rows ?? 15,
      filter: event.filters ? this.filterMapper(event.filters) : [],
      sort: sorters
    };

    await this.fetchData(dto);
  }

  /**
   * Builds the DTO from current state
   * @returns Dynamic query DTO
   */
  private dtoBuilder(): DynamicQueryDto {
    return {
      page: this.state.page(),
      size: this.state.size(),
      filter: this.state.filter(),
      sort: this.state.sort()
    };
  }

  /**
   * Maps PrimeNG filter metadata to dynamic query filters
   * @param dto - PrimeNG filter metadata
   * @returns Array of dynamic query filter DTOs
   */
  private filterMapper(
    dto: Record<string, FilterMetadata | FilterMetadata[] | undefined>
  ): DynamicQueryFilterDto[] {
    const filters: DynamicQueryFilterDto[] = [];

    for (const [key, payload] of Object.entries(dto)) {
      if (payload) {
        if (Array.isArray(payload)) {
          payload.forEach((x) => {
            if (x.value && x.matchMode) {
              const mapped = this.evaluateInput(x.matchMode);
              if (mapped) {
                filters.push({
                  field: key,
                  value: x.value.toString(),
                  type: mapped
                });
              }
            }
          });
        } else {
          if (payload.value && payload.matchMode) {
            const mapped = this.evaluateInput(payload.matchMode);
            if (mapped) {
              filters.push({
                field: key,
                value: payload.value.toString(),
                type: mapped
              });
            }
          }
        }
      }
    }
    return filters;
  }

  /**
   * Maps PrimeNG filter types to backend filter types
   * @param input - PrimeNG filter type string
   * @returns Mapped filter type or null if invalid
   */
  private evaluateInput(input: string): FilterTypeMapped | null {
    const validInputs: Record<FilterType, FilterTypeMapped> = {
      startsWith: "starts",
      notStartsWith: "!starts",
      endsWith: "ends",
      notEndsWith: "!ends",
      contains: "like",
      notContains: "!like",
      equals: "=",
      notEquals: "!=",
      greaterThan: ">",
      lessThan: "<",
      greaterThanOrEqual: ">=",
      lessThanOrEqual: "<="
    };

    return input in validInputs ? validInputs[input as FilterType] : null;
  }
}
