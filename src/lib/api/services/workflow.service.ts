/**
 * WorkflowService for React
 * Ported from Angular WorkflowService
 */

import { Workflow } from '@/app/data/workflow'
import { BaseService } from '../base-service'

export class WorkflowService extends BaseService<Workflow> {
  private workflows: Workflow[] = []

  constructor() {
    super('workflows')
  }

  get allWorkflows(): Workflow[] {
    return this.workflows
  }

  async reload(): Promise<void> {
    const results = await this.listAll()
    this.workflows = results.results
  }

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const result = await super.create(data)
    await this.reload()
    return result
  }

  async update(id: number, data: Partial<Workflow>): Promise<Workflow> {
    const result = await super.update(id, data)
    await this.reload()
    return result
  }

  async delete(id: number): Promise<void> {
    await super.delete(id)
    await this.reload()
  }
}

