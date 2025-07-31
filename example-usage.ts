// @ts-nocheck
/**
 * Example usage of mtsl-primeng-table-state-helper
 * This file demonstrates how to use the PrimeNG table state helper
 * in an Angular component with lazy loading, filtering, and sorting.
 * 
 * NOTE: This is an example file only. The imports will show errors
 * since Angular dependencies are not installed in this library package.
 * This file is for documentation purposes and is excluded from compilation.
 */

import { Component, inject, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from 'primeng/table';
import { 
  PrimeNgTableStateHelper,
  createTextColumn,
  createNumericColumn,
  createBooleanColumn,
  createDateColumn,
  createDropdownColumn,
  mergeTableHeaders,
  createStatusSelectItems
} from 'mtsl-primeng-table-state-helper';

interface ProcessDataBankItem {
  id: number;
  serial: number;
  code: string;
  name: string;
  description: string;
  complexity: {
    id: number;
    name: string;
  };
  standardMinuteValue: number;
  isDataLocked: boolean;
  isSpecialProcess: boolean;
  createdAt: Date;
  status: 'active' | 'inactive' | 'pending';
}

@Component({
  selector: 'app-process-data-bank-table',
  template: `
    <div class="card">
      <p-toolbar>
        <div class="flex flex-wrap gap-2">
          <p-button 
            label="Create New"
            icon="pi pi-plus"
            size="small"
            (onClick)="openCreateDialog()">
          </p-button>
          <p-button 
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            (onClick)="refreshData()">
          </p-button>
          <p-button 
            label="Clear Filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            size="small"
            (onClick)="clearFilters()">
          </p-button>
        </div>
      </p-toolbar>

      <p-table 
        #dt
        [value]="tableState.data()"
        [lazy]="true"
        [paginator]="true"
        [rows]="15"
        [rowsPerPageOptions]="[15, 25, 50, 100]"
        [totalRecords]="tableState.totalRecords()"
        [loading]="tableState.isLoading()"
        [globalFilterFields]="['name', 'code', 'description']"
        dataKey="id"
        styleClass="p-datatable-gridlines"
        (onLazyLoad)="tableState.onLazyLoad($event)">
        
        <!-- Table Header -->
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="serial" style="width: 80px">
              Serial
              <p-sortIcon field="serial"></p-sortIcon>
            </th>
            <th pSortableColumn="code" style="width: 120px">
              Code
              <p-sortIcon field="code"></p-sortIcon>
            </th>
            <th pSortableColumn="name">
              Name
              <p-sortIcon field="name"></p-sortIcon>
            </th>
            <th pSortableColumn="complexity.name" style="width: 140px">
              Complexity
              <p-sortIcon field="complexity.name"></p-sortIcon>
            </th>
            <th pSortableColumn="standardMinuteValue" style="width: 120px">
              SMV
              <p-sortIcon field="standardMinuteValue"></p-sortIcon>
            </th>
            <th style="width: 100px">Special</th>
            <th style="width: 100px">Locked</th>
            <th pSortableColumn="status" style="width: 100px">
              Status
              <p-sortIcon field="status"></p-sortIcon>
            </th>
            <th style="width: 100px">Actions</th>
          </tr>
          
          <!-- Filter Row -->
          <tr>
            <th>
              <p-columnFilter 
                type="numeric" 
                field="serial" 
                placeholder="Filter"
                matchMode="equals">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="text" 
                field="code" 
                placeholder="Search code"
                matchMode="contains">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="text" 
                field="name" 
                placeholder="Search name"
                matchMode="contains">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="text" 
                field="complexity.name" 
                placeholder="Filter complexity"
                matchMode="contains">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="numeric" 
                field="standardMinuteValue" 
                placeholder="SMV"
                matchMode="greaterThanOrEqual">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="boolean" 
                field="isSpecialProcess">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                type="boolean" 
                field="isDataLocked">
              </p-columnFilter>
            </th>
            <th>
              <p-columnFilter 
                field="status" 
                matchMode="equals" 
                [showMenu]="false">
                <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                  <p-select 
                    [ngModel]="value" 
                    [options]="statusOptions"
                    placeholder="Any"
                    (ngModelChange)="filter($event)"
                    styleClass="p-column-filter">
                  </p-select>
                </ng-template>
              </p-columnFilter>
            </th>
            <th></th>
          </tr>
        </ng-template>
        
        <!-- Table Body -->
        <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
          <tr>
            <td>{{ item.serial }}</td>
            <td>
              <span class="font-mono text-sm">{{ item.code }}</span>
            </td>
            <td>
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm text-gray-500 mt-1">{{ item.description | slice:0:50 }}...</div>
            </td>
            <td>
              <p-tag 
                [value]="item.complexity.name"
                [severity]="getComplexitySeverity(item.complexity.name)">
              </p-tag>
            </td>
            <td class="text-right font-mono">
              {{ item.standardMinuteValue | number:'1.2-2' }}
            </td>
            <td class="text-center">
              <i class="pi" 
                 [ngClass]="item.isSpecialProcess ? 'pi-check text-green-500' : 'pi-times text-gray-400'">
              </i>
            </td>
            <td class="text-center">
              <i class="pi" 
                 [ngClass]="item.isDataLocked ? 'pi-lock text-red-500' : 'pi-unlock text-green-500'">
              </i>
            </td>
            <td>
              <p-tag 
                [value]="item.status" 
                [severity]="getStatusSeverity(item.status)">
              </p-tag>
            </td>
            <td>
              <div class="flex gap-1">
                <p-button 
                  icon="pi pi-eye"
                  size="small"
                  text="true"
                  (onClick)="viewItem(item)"
                  title="View Details">
                </p-button>
                <p-button 
                  icon="pi pi-pencil"
                  size="small"
                  text="true"
                  severity="secondary"
                  (onClick)="editItem(item)"
                  title="Edit"
                  [disabled]="item.isDataLocked">
                </p-button>
                <p-button 
                  icon="pi pi-trash"
                  size="small"
                  text="true"
                  severity="danger"
                  (onClick)="deleteItem(item)"
                  title="Delete"
                  [disabled]="item.isDataLocked">
                </p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        
        <!-- Empty State -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center py-8">
              <div class="text-gray-500">
                <i class="pi pi-info-circle text-4xl mb-3"></i>
                <div class="text-lg">No process data found</div>
                <div class="text-sm">Try adjusting your filters or create a new entry</div>
              </div>
            </td>
          </tr>
        </ng-template>
        
      </p-table>
    </div>
  `,
  standalone: true,
  imports: [
    // PrimeNG imports
    // Add your PrimeNG component imports here
  ]
})
export class ProcessDataBankTableComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly dataTableRef = viewChild.required<Table>('dt');

  // Table state helper instance
  readonly tableState = PrimeNgTableStateHelper.create<ProcessDataBankItem>({
    url: '/api/process-data-bank/query',
    httpClient: this.httpClient
  });

  // Status options for dropdown filter
  statusOptions = createStatusSelectItems({
    'active': 'Active',
    'inactive': 'Inactive', 
    'pending': 'Pending'
  });

  // Table configuration using utility functions
  readonly tableHeaders = mergeTableHeaders(
    createNumericColumn('serial', 'Serial Number', {
      defaultMatchMode: 'equals'
    }),
    createTextColumn('code', 'Process Code', {
      placeholder: 'Search by code...'
    }),
    createTextColumn('name', 'Process Name', {
      placeholder: 'Search by name...'
    }),
    createTextColumn('complexity.name', 'Complexity Level'),
    createNumericColumn('standardMinuteValue', 'Standard Minute Value', {
      defaultMatchMode: 'greaterThanOrEqual'
    }),
    createBooleanColumn('isSpecialProcess', 'Special Process'),
    createBooleanColumn('isDataLocked', 'Data Locked'),
    createDropdownColumn('status', 'Status', this.statusOptions)
  );

  ngOnInit() {
    // Configure table state
    this.tableState
      .setUniqueKey('id')
      .patchQueryParams({ 
        includeDeleted: false,
        // Add any default query parameters
      });
  }

  async refreshData() {
    await this.tableState.refreshData();
  }

  clearFilters() {
    this.dataTableRef().clear();
  }

  openCreateDialog() {
    // Implement create dialog logic
    console.log('Opening create dialog...');
  }

  viewItem(item: ProcessDataBankItem) {
    // Implement view logic
    console.log('Viewing item:', item);
  }

  editItem(item: ProcessDataBankItem) {
    // Implement edit logic
    console.log('Editing item:', item);
  }

  deleteItem(item: ProcessDataBankItem) {
    // Implement delete logic with confirmation
    console.log('Deleting item:', item);
  }

  getComplexitySeverity(complexity: string): string {
    switch (complexity.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  }
}

// Example of how to extend for specific department filtering
export class DepartmentProcessDataBankTableComponent extends ProcessDataBankTableComponent {
  
  async loadProcessesByDepartment(departmentId: number) {
    this.tableState
      .setRouteParam(`department/${departmentId}`)
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }

  async filterByComplexity(complexityId: number) {
    this.tableState
      .patchQueryParams({ complexityId })
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }
}

// Example of simple table without advanced filtering
@Component({
  selector: 'app-simple-table',
  template: `
    <p-table 
      [value]="simpleTableState.data()"
      [lazy]="true"
      [paginator]="true"
      [rows]="10"
      [totalRecords]="simpleTableState.totalRecords()"
      [loading]="simpleTableState.isLoading()"
      (onLazyLoad)="simpleTableState.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">Name</th>
          <th pSortableColumn="email">Email</th>
          <th>Actions</th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <p-button icon="pi pi-pencil" size="small" text="true"></p-button>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class SimpleTableComponent {
  private readonly httpClient = inject(HttpClient);

  readonly simpleTableState = PrimeNgTableStateHelper.create<any>({
    url: '/api/users/simple',
    httpClient: this.httpClient
  });
}
