/**
 * MailAccountService for React
 * Ported from Angular MailAccountService
 */

import { MailAccount } from '@/app/data/mail-account'
import { BaseService } from '../base-service'
import { apiClient } from '../client'

export class MailAccountService extends BaseService<MailAccount> {
  private mailAccounts: MailAccount[] = []

  constructor() {
    super('mail_accounts')
  }

  get allAccounts(): MailAccount[] {
    return this.mailAccounts
  }

  async reload(): Promise<void> {
    const results = await this.listAll()
    this.mailAccounts = results.results
  }

  async create(data: Partial<MailAccount>): Promise<MailAccount> {
    const result = await super.create(data)
    await this.reload()
    return result
  }

  async update(id: number, data: Partial<MailAccount>): Promise<MailAccount> {
    // Remove expiration from the object before updating
    const { expiration, ...updateData } = data as any
    const result = await super.update(id, updateData)
    await this.reload()
    return result
  }

  async delete(id: number): Promise<void> {
    await super.delete(id)
    await this.reload()
  }

  async test(account: MailAccount): Promise<any> {
    const accountData = { ...account }
    delete (accountData as any)['set_permissions']
    const response = await apiClient.post(this.getResourceUrl() + 'test/', accountData)
    return response.data
  }

  async processAccount(accountId: number): Promise<any> {
    const response = await apiClient.post(this.getResourceUrl(accountId, 'process'), {})
    return response.data
  }
}

