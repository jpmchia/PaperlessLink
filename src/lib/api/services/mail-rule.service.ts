/**
 * MailRuleService for React
 * Ported from Angular MailRuleService
 */

import { MailRule } from '@/app/data/mail-rule'
import { BaseService } from '../base-service'

export class MailRuleService extends BaseService<MailRule> {
  private mailRules: MailRule[] = []

  constructor() {
    super('mail_rules')
  }

  get allRules(): MailRule[] {
    return this.mailRules
  }

  async reload(): Promise<void> {
    const results = await this.listAll()
    this.mailRules = results.results
  }

  async create(data: Partial<MailRule>): Promise<MailRule> {
    const result = await super.create(data)
    await this.reload()
    return result
  }

  async update(id: number, data: Partial<MailRule>): Promise<MailRule> {
    const result = await super.update(id, data)
    await this.reload()
    return result
  }

  async delete(id: number): Promise<void> {
    await super.delete(id)
    await this.reload()
  }
}

