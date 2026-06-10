import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execFileAsync = promisify(execFile);

export type ListType = 'domain' | 'ip';

@Injectable()
export class WhitelistService {
  private get FILES(): Record<ListType, string> {
    return {
      domain: process.env.DOMAIN_FILE ?? '/data/allow_domains.txt',
      ip:     process.env.IP_FILE     ?? '/data/allow_ips.txt',
    };
  }

  private readList(type: ListType): string[] {
    try {
      return fs
        .readFileSync(this.FILES[type], 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private writeList(type: ListType, entries: string[]): void {
    fs.writeFileSync(this.FILES[type], entries.join('\n') + '\n', 'utf8');
  }

  getList(type: ListType): string[] {
    return this.readList(type);
  }

  addEntry(type: ListType, entry: string): string[] {
    const clean = entry.trim().toLowerCase();
    if (!clean) throw new BadRequestException('Empty entry');
    const list = this.readList(type);
    if (list.includes(clean)) throw new ConflictException('Already exists');
    list.push(clean);
    this.writeList(type, list);
    return list;
  }

  deleteEntry(type: ListType, entry: string): string[] {
    const clean = entry.trim().toLowerCase();
    const list = this.readList(type).filter((e) => e !== clean);
    this.writeList(type, list);
    return list;
  }

  async reloadSquid(): Promise<void> {
    const cmd = process.env.RELOAD_CMD ?? 'sudo';
    const script = process.env.RELOAD_SCRIPT ?? '/usr/local/bin/squid-reload.sh';
    await execFileAsync(cmd, [script], { timeout: 10_000 });
    // await execFileAsync('sudo', ['/usr/local/bin/squid-reload.sh'], { timeout: 10_000 });
  }
}
