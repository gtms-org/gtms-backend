export enum BulkOperationTypes {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum BulkCreateOperationResult {
  created = 'Created',
  validationError = 'ValidationError',
  notFound = 'NotFound',
  error = 'InternalServerError',
}

export enum BulkUpdateOperationResult {
  updated = 'Updated',
  validationError = 'ValidationError',
  error = 'InternalServerError',
  notFound = 'NotFound',
}

export enum BulkDeleteOperationResult {
  deleted = 'Deleted',
  error = 'InternalServerError',
  notFound = 'NotFound',
}

export type BulkOperationResults =
  | BulkCreateOperationResult
  | BulkUpdateOperationResult
  | BulkDeleteOperationResult

export interface IGenericCreateOperation {
  op: BulkOperationTypes.create
  value: any
}

export interface IGenericCreateOperationResult {
  status: BulkCreateOperationResult
  value?: any
}

export interface IGenericUpdateOperation {
  op: BulkOperationTypes.update
  path: string
  value: any
}

export interface IGenericUpdateOperationResult {
  status: BulkUpdateOperationResult
  path: string
  value?: any
}

export interface IGenericDeleteOperation {
  op: BulkOperationTypes.delete
  path: string
}

export interface IGenericDeleteOperationResult {
  status: BulkDeleteOperationResult
  path: string
}

export interface IOperationResult {
  path?: string
  status: BulkOperationResults
  errors?: any
  value?: any
}
