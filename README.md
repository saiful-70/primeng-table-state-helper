# PrimeNG Table State Helper

A TypeScript utility library for advanced PrimeNG table state management in Angular applications, featuring lazy loading, filtering, sorting, and pagination with NgRx Signals integration.

## Features

- � **Lazy Loading**: Efficient data loading with pagination
- 🔍 **Advanced Filtering**: Support for string, numeric, boolean, date, dropdown, and multiselect filters
- 🔄 **Sorting**: Multi-column sorting capabilities
- 📊 **State Management**: Built with NgRx Signals for reactive state management
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 🎨 **PrimeNG Integration**: Seamless integration with PrimeNG Table component
- 📦 **Tree-shakeable**: Import only what you need
- � **Configurable**: Flexible configuration options for various use cases

## Installation

```bash
npm install mtsl-primeng-table-state-helper
```

## Peer Dependencies

```bash
npm install @angular/common @angular/core @ngrx/signals primeng rxjs
```

Optional (for response validation):
```bash
npm install zod
```

## Basic Usage

### 1. Setting Up the Table State Helper

```typescript
import { Component, inject, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from 'primeng/table';
import { PrimeNgTableStateHelper } from 'mtsl-primeng-table-state-helper';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-user-table',
  template: `
    <p-table 
      #dt
      [value]="tableState.data()"
      [lazy]="true"
      [paginator]="true"
      [rows]="15"
      [totalRecords]="tableState.totalRecords()"
      [loading]="tableState.isLoading()"
      (onLazyLoad)="tableState.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">
            Name
            <p-sortIcon field="name"></p-sortIcon>
          </th>
          <th pSortableColumn="email">
            Email
            <p-sortIcon field="email"></p-sortIcon>
          </th>
          <th>Active</th>
        </tr>
        <tr>
          <th>
            <p-columnFilter 
              type="text" 
              field="name" 
              placeholder="Search by name">
            </p-columnFilter>
          </th>
          <th>
            <p-columnFilter 
              type="text" 
              field="email" 
              placeholder="Search by email">
            </p-columnFilter>
          </th>
          <th>
            <p-columnFilter 
              type="boolean" 
              field="active">
            </p-columnFilter>
          </th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <i class="pi" 
               [ngClass]="user.active ? 'pi-check text-green-500' : 'pi-times text-red-500'">
            </i>
          </td>
        </tr>
      </ng-template>
      
    </p-table>
  `
})
export class UserTableComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly dataTableRef = viewChild.required<Table>('dt');

  readonly tableState = PrimeNgTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });

  ngOnInit() {
    // Optional: Configure unique key and query parameters
    this.tableState
      .setUniqueKey('id')
      .patchQueryParams({ includeDeleted: false });
  }
### 2. Using Table Configuration Utilities

```typescript
import { 
  createTextColumn, 
  createNumericColumn, 
  createBooleanColumn,
  createDateColumn,
  createDropdownColumn,
  mergeTableHeaders,
  createStatusSelectItems
} from 'mtsl-primeng-table-state-helper';

@Component({
  // ... component configuration
})
export class AdvancedTableComponent {
  readonly tableHeaders = mergeTableHeaders(
    createTextColumn('name', 'Full Name', {
      hasSort: true,
      placeholder: 'Search names...'
    }),
    createTextColumn('email', 'Email Address', {
      defaultMatchMode: 'contains'
    }),
    createNumericColumn('age', 'Age', {
      defaultMatchMode: 'greaterThanOrEqual'
    }),
    createBooleanColumn('active', 'Status'),
    createDateColumn('createdAt', 'Created Date'),
    createDropdownColumn('role', 'Role', createStatusSelectItems({
      'admin': 'Administrator',
      'user': 'Regular User',
      'moderator': 'Moderator'
    }))
  );
}
```

### 3. Advanced Configuration

```typescript
@Component({
  // ... component configuration
})
export class AdvancedUserTableComponent {
  private readonly httpClient = inject(HttpClient);
  
  readonly tableState = PrimeNgTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient,
    // Optional: Pass loading spinner context token
    skipLoadingSpinnerContext: SkipLoadingSpinner
  });

  async ngOnInit() {
    // Set up the table with advanced configuration
    this.tableState
      .setUniqueKey('userId')
      .setQueryParams({ 
        includeDeleted: false,
        tenantId: this.currentTenant.id 
      });

    // Load initial data
    await this.tableState.refreshData();
  }

  // Method to change API endpoint dynamically
  async switchToInactiveUsers() {
    this.tableState
      .setUrl('/api/users/inactive/query')
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }

  // Method to add route parameters
  async loadUsersByDepartment(departmentId: number) {
    this.tableState
      .setRouteParam(departmentId.toString())
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }

  // Method to update query parameters
  async filterByTenant(tenantId: number) {
    this.tableState
      .patchQueryParams({ tenantId })
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }
}
```

## API Response Format

The table state helper expects your API to return data in the following format:

```typescript
interface ApiResponse<T> {
  data: T[];           // Array of table row data
  last_page: number;   // Total number of pages
  last_row: number;    // Total number of records
}
```

## API Request Format

The helper sends POST requests with the following structure:

```typescript
interface DynamicQueryDto {
  size: number;                    // Page size
  page: number;                    // Current page (1-based)
  filter: DynamicQueryFilterDto[]; // Array of filters
  sort: DynamicQuerySortDto[];     // Array of sort criteria
}

interface DynamicQueryFilterDto {
  field: string;        // Field name to filter
  value: string;        // Filter value (always string)
  type: FilterTypeMapped; // Filter operation type
}

interface DynamicQuerySortDto {
  field: string;        // Field name to sort
  dir: 'asc' | 'desc';  // Sort direction
}
```

## Filter Types

The library supports the following filter mappings:

| PrimeNG Filter Type | Backend Filter Type | Description |
|-------------------|-------------------|-------------|
| `startsWith` | `starts` | Field starts with value |
| `notStartsWith` | `!starts` | Field does not start with value |
| `endsWith` | `ends` | Field ends with value |
| `notEndsWith` | `!ends` | Field does not end with value |
| `contains` | `like` | Field contains value |
| `notContains` | `!like` | Field does not contain value |
| `equals` | `=` | Field equals value |
| `notEquals` | `!=` | Field does not equal value |
| `greaterThan` | `>` | Field is greater than value |
| `lessThan` | `<` | Field is less than value |
| `greaterThanOrEqual` | `>=` | Field is greater than or equal to value |
| `lessThanOrEqual` | `<=` | Field is less than or equal to value |

## Utility Functions

### Column Creation Functions

- `createTextColumn(field, label, options)` - Creates text column with string filtering
- `createNumericColumn(field, label, options)` - Creates numeric column with number filtering  
- `createBooleanColumn(field, label, options)` - Creates boolean column with true/false filtering
- `createDateColumn(field, label, options)` - Creates date column with date filtering
- `createDropdownColumn(field, label, options, dropdownOptions)` - Creates dropdown filtered column
- `createMultiselectColumn(field, label, options, selectOptions)` - Creates multiselect filtered column
- `createSimpleColumn(field, label, options)` - Creates basic column without filtering

### Helper Functions

- `createPrimengStringMatchModes()` - Returns SelectItem array for string filter modes
- `createPrimengNumberMatchModes()` - Returns SelectItem array for numeric filter modes
- `createBooleanSelectItems()` - Creates boolean dropdown options
- `createStatusSelectItems()` - Creates status dropdown from object mapping
- `mergeTableHeaders()` - Combines multiple table header configurations

## Class Methods

### PrimeNgTableStateHelper Methods

- `static create<T>(options)` - Creates new instance
- `setUniqueKey(key)` - Sets unique identifier field name
- `setUrl(url)` - Sets API endpoint URL and resets state
- `setRouteParam(param)` - Appends route parameter to URL
- `patchQueryParams(params)` - Merges additional query parameters
- `removeQueryParam(key)` - Removes specific query parameter
- `setQueryParams(params)` - Replaces all query parameters
- `refreshData()` - Reloads data with current state
- `clearTableData(table)` - Clears table data and resets state
- `onLazyLoad(event)` - Handles PrimeNG lazy load events

### Readonly Signals

- `data` - Current table data array
- `isLoading` - Loading state boolean
- `totalRecords` - Total number of records
- `uniqueKey` - Current unique key field name

## Error Handling

The library includes built-in error handling:

```typescript
try {
  await this.tableState.refreshData();
} catch (error) {
  // Handle API errors
  console.error('Failed to load table data:', error);
  this.toastService.showError('Failed to load data');
}
```

## TypeScript Support

Full TypeScript support with generic typing:

```typescript
interface CustomUser {
  id: string;
  firstName: string;
  lastName: string;
  department: {
    id: number;
    name: string;
  };
}

const tableState = PrimeNgTableStateHelper.create<CustomUser>({
  url: '/api/users',
  httpClient: this.httpClient
});

// tableState.data() is typed as Signal<CustomUser[]>
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Support

For issues and questions, please use the GitHub issues page.

This package uses automated versioning and publishing through GitHub Actions. Contributors don't need to manually update versions or publish to NPM.

#### Commit Message Format

Use conventional commit messages to trigger automatic version bumps:

```bash
# For bug fixes (patch version: 1.0.0 → 1.0.1)
git commit -m "fix: resolve checkbox state issue"

# For new features (minor version: 1.0.0 → 1.1.0)  
git commit -m "feat: add new utility function"

# For breaking changes (major version: 1.0.0 → 2.0.0)
git commit -m "major: change API interface"
# OR
git commit -m "feat: new feature

BREAKING CHANGE: API has changed"

# Other commits (no version bump)
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

#### Development Workflow

1. **Make your changes**
2. **Commit with proper message format**
3. **Push to main branch**
4. **GitHub Actions automatically:**
   - Runs tests and type checking
   - Bumps version based on commit message
   - Publishes to NPM
   - Creates git tags

```bash
# Example workflow
git add .
git commit -m "feat: add new tri-state utility"
git push origin main
# 🎉 Package automatically published!
```

#### Pull Request Workflow

For larger changes, use pull requests:

```bash
# Create feature branch
git checkout -b feature/new-functionality

# Make changes and commit
git commit -m "feat: add advanced tri-state features"

# Push and create PR
git push origin feature/new-functionality
# Create PR on GitHub → Merge → Automatic publish!
```

## Browser Support

- Modern browsers supporting ES2020+
- Angular 19+
- PrimeNG 19+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License. See LICENSE file for details.

## Links

- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Angular Reactive Forms](https://angular.io/guide/reactive-forms)
